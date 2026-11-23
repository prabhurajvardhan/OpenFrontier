import "server-only";
import { createPublicKey, type KeyObject } from "node:crypto";
import { decodeProtectedHeader, jwtVerify, type JWTPayload } from "jose";

const FIREBASE_CERTS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
const MAX_TOKEN_LENGTH = 16_384;
const CLOCK_TOLERANCE_SECONDS = 5;

type FirebaseClaims = JWTPayload & {
  auth_time?: unknown;
  email?: unknown;
  role?: unknown;
};
type CertificateCache = { expiresAt: number; keys: Map<string, KeyObject> };
let certificateCache: CertificateCache | null = null;

function firebaseProjectId(): string | null {
  const value = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  return value || null;
}

async function getFirebaseSigningKey(keyId: string): Promise<KeyObject> {
  if (certificateCache && certificateCache.expiresAt > Date.now()) {
    const cachedKey = certificateCache.keys.get(keyId);
    if (cachedKey) return cachedKey;
  }

  const response = await fetch(FIREBASE_CERTS_URL, { cache: "no-store" });
  if (!response.ok) throw new Error("firebase_signing_keys_unavailable");
  const certificates = (await response.json()) as Record<string, unknown>;
  const keys = new Map<string, KeyObject>();
  for (const [id, certificate] of Object.entries(certificates)) {
    if (typeof certificate !== "string" || !certificate.includes("BEGIN CERTIFICATE")) continue;
    try {
      keys.set(id, createPublicKey(certificate));
    } catch {
      // Ignore malformed entries; a missing requested key is rejected below.
    }
  }
  const cacheControl = response.headers.get("cache-control") ?? "";
  const maxAge = Number(cacheControl.match(/(?:^|,)\s*max-age=(\d+)/i)?.[1] ?? 300);
  certificateCache = { keys, expiresAt: Date.now() + Math.max(0, maxAge) * 1000 };
  const signingKey = keys.get(keyId);
  if (!signingKey) throw new Error("firebase_signing_key_unknown");
  return signingKey;
}

export type VerifiedFirebaseIdentity = {
  uid: string;
  email: string | null;
};

/** Verify all Firebase JWT claims against a specific project and its already-resolved signing key. */
export async function verifyFirebaseIdTokenWithKey(token: string, projectId: string, key: KeyObject): Promise<VerifiedFirebaseIdentity | null> {
  if (!projectId || token.length === 0 || token.length > MAX_TOKEN_LENGTH) return null;
  try {
    const header = decodeProtectedHeader(token);
    if (header.alg !== "RS256" || typeof header.kid !== "string" || !header.kid) return null;
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["RS256"],
      audience: projectId,
      issuer: `https://securetoken.google.com/${projectId}`,
      clockTolerance: CLOCK_TOLERANCE_SECONDS,
    });
    const claims = payload as FirebaseClaims;
    const now = Math.floor(Date.now() / 1000);
    if (
      typeof claims.sub !== "string" || claims.sub.length === 0 ||
      typeof claims.iat !== "number" || claims.iat < 0 || claims.iat > now + CLOCK_TOLERANCE_SECONDS ||
      typeof claims.exp !== "number" || claims.exp <= now - CLOCK_TOLERANCE_SECONDS ||
      typeof claims.auth_time !== "number" || claims.auth_time < 0 || claims.auth_time > now + CLOCK_TOLERANCE_SECONDS ||
      claims.role !== "authenticated"
    ) return null;
    return { uid: claims.sub, email: typeof claims.email === "string" ? claims.email : null };
  } catch {
    return null;
  }
}

/** Verify a Firebase client ID token against the configured project's rotating Google signing certificate. */
export async function verifyFirebaseIdToken(token: string): Promise<VerifiedFirebaseIdentity | null> {
  const projectId = firebaseProjectId();
  if (!projectId || token.length === 0 || token.length > MAX_TOKEN_LENGTH) return null;
  let header;
  try {
    header = decodeProtectedHeader(token);
  } catch {
    return null;
  }
  if (header.alg !== "RS256" || typeof header.kid !== "string" || !header.kid) return null;
  let key: KeyObject;
  try {
    key = await getFirebaseSigningKey(header.kid);
  } catch (error) {
    if (error instanceof Error && error.message === "firebase_signing_key_unknown") return null;
    throw error;
  }
  return verifyFirebaseIdTokenWithKey(token, projectId, key);
}

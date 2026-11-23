import "server-only";
import { verifyFirebaseIdToken } from "./firebase-id-token";

type AuthSessionResult =
  | { status: 200; body: { authenticated: false } }
  | { status: 200; body: { authenticated: true; user: { id: string; email: string | null } } }
  | { status: 503; body: { error: "auth_not_configured" | "auth_unavailable" } };

export async function resolveFirebaseSession(request: Request): Promise<AuthSessionResult> {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim()) {
    return { status: 503, body: { error: "auth_not_configured" } };
  }
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token) return { status: 200, body: { authenticated: false } };
  try {
    const identity = await verifyFirebaseIdToken(token);
    if (!identity) return { status: 200, body: { authenticated: false } };
    return { status: 200, body: { authenticated: true, user: { id: identity.uid, email: identity.email } } };
  } catch {
    return { status: 503, body: { error: "auth_unavailable" } };
  }
}

export type RequestIdentityResult =
  | { identity: { uid: string; email: string | null }; error: null }
  | { identity: null; error: "unauthenticated" | "auth_not_configured" | "auth_unavailable" };

export async function resolveRequestIdentity(request: Request): Promise<RequestIdentityResult> {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim()) {
    return { identity: null, error: "auth_not_configured" };
  }
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token) return { identity: null, error: "unauthenticated" };
  try {
    const identity = await verifyFirebaseIdToken(token);
    return identity ? { identity, error: null } : { identity: null, error: "unauthenticated" };
  } catch {
    return { identity: null, error: "auth_unavailable" };
  }
}

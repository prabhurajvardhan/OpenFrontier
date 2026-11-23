import assert from "node:assert/strict";
import { generateKeyPairSync, type KeyObject } from "node:crypto";
import test from "node:test";
import { SignJWT } from "jose";
import { verifyFirebaseIdTokenWithKey } from "../lib/server/firebase-id-token";

const projectId = "nanoware-unit-test-project";
const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const otherPair = generateKeyPairSync("rsa", { modulusLength: 2048 });

async function makeToken(options: {
  audience?: string;
  issuer?: string;
  uid?: string;
  role?: string;
  issuedAt?: number;
  expiresAt?: number;
  authTime?: number;
  key?: KeyObject;
} = {}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const builder = new SignJWT({
    auth_time: options.authTime ?? now - 30,
    role: options.role ?? "authenticated",
    email: "member@example.test",
  })
    .setProtectedHeader({ alg: "RS256", kid: "unit-test-kid" })
    .setIssuer(options.issuer ?? `https://securetoken.google.com/${projectId}`)
    .setAudience(options.audience ?? projectId)
    .setSubject(options.uid ?? "firebase-test-uid")
    .setIssuedAt(options.issuedAt ?? now - 30)
    .setExpirationTime(options.expiresAt ?? now + 3600);
  return builder.sign(options.key ?? privateKey);
}

test("accepts only a cryptographically signed current token with Firebase project claims and authenticated role", async () => {
  const token = await makeToken();
  assert.deepEqual(await verifyFirebaseIdTokenWithKey(token, projectId, publicKey), {
    uid: "firebase-test-uid",
    email: "member@example.test",
  });
});

test("rejects expired tokens", async () => {
  const now = Math.floor(Date.now() / 1000);
  const token = await makeToken({ issuedAt: now - 7200, authTime: now - 7200, expiresAt: now - 60 });
  assert.equal(await verifyFirebaseIdTokenWithKey(token, projectId, publicKey), null);
});

test("rejects a token minted for another Firebase project", async () => {
  const token = await makeToken({ audience: "unrelated-project", issuer: "https://securetoken.google.com/unrelated-project" });
  assert.equal(await verifyFirebaseIdTokenWithKey(token, projectId, publicKey), null);
});

test("rejects a missing authenticated role claim and future auth time", async () => {
  const missingRole = await makeToken({ role: "anonymous" });
  assert.equal(await verifyFirebaseIdTokenWithKey(missingRole, projectId, publicKey), null);
  const futureAuth = await makeToken({ authTime: Math.floor(Date.now() / 1000) + 60 });
  assert.equal(await verifyFirebaseIdTokenWithKey(futureAuth, projectId, publicKey), null);
});

test("rejects a valid-looking JWT with an untrusted signing key", async () => {
  const token = await makeToken({ key: otherPair.privateKey });
  assert.equal(await verifyFirebaseIdTokenWithKey(token, projectId, publicKey), null);
});

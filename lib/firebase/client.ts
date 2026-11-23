"use client";
import { getApps, initializeApp, type FirebaseApp } from "@firebase/app";
import { browserLocalPersistence, getAuth, setPersistence, type Auth } from "@firebase/auth";

let firebaseApp: FirebaseApp | undefined;
let firebaseAuth: Auth | undefined;
let persistenceTask: Promise<void> | undefined;

export function hasFirebaseBrowserConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  );
}

export function getFirebaseApp(): FirebaseApp {
  if (!hasFirebaseBrowserConfig()) {
    throw new Error("Firebase authentication is not configured.");
  }
  if (!firebaseApp) {
    const existing = getApps().find((app) => app.name === "[DEFAULT]");
    if (existing && existing.options.projectId !== process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      throw new Error("Firebase is already initialized for a different project.");
    }
    firebaseApp = existing ?? initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
      ...(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? { messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID } : {}),
      ...(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? { storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET } : {}),
    });
  }
  return firebaseApp;
}

export function getFirebaseAuth(): Auth {
  if (!firebaseAuth) firebaseAuth = getAuth(firebaseApp ?? getFirebaseApp());
  return firebaseAuth;
}

export function ensureFirebaseLocalPersistence(auth: Auth = getFirebaseAuth()): Promise<void> {
  persistenceTask ??= setPersistence(auth, browserLocalPersistence);
  return persistenceTask;
}

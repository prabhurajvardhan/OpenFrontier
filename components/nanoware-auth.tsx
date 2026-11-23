"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { GoogleAuthProvider, getIdTokenResult, getRedirectResult, onIdTokenChanged, signInWithPopup, signInWithRedirect, signOut, type User } from "@firebase/auth";
import { ensureFirebaseLocalPersistence, getFirebaseAuth, hasFirebaseBrowserConfig } from "@/lib/firebase/client";
import { AppShell, Icon } from "./app-shell";

type Notice = { kind: "info" | "pending" | "success" | "error"; message: string };
const ROLE_REQUIRED = "Your Nanoware Account needs the authenticated access claim before it can use Open Frontier. Contact the Nanoware administrator.";

function errorCode(error: unknown): string {
  return error && typeof error === "object" && "code" in error && typeof error.code === "string" ? error.code : "";
}

export function NanowareAuth() {
  const firebaseConfigured = hasFirebaseBrowserConfig();
  const [user, setUser] = useState<User | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(firebaseConfigured);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(() => firebaseConfigured ? null : { kind: "error", message: "Nanoware Account sign-in is not configured. Set the Firebase Web App values and Firebase Project ID." });
  const actionPending = useRef(false);

  useEffect(() => {
    if (!hasFirebaseBrowserConfig()) return;
    const auth = getFirebaseAuth();
    let active = true;
    let unsubscribe = () => {};
    void ensureFirebaseLocalPersistence(auth).then(() => {
      if (!active) return;
      unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
        if (!active) return;
        setUser(currentUser);
        setChecking(false);
        if (!currentUser) {
          setAuthorized(false);
          return;
        }
        try {
          const tokenResult = await getIdTokenResult(currentUser);
          if (!active) return;
          const hasRole = tokenResult.claims.role === "authenticated";
          setAuthorized(hasRole);
          if (!hasRole) setNotice({ kind: "error", message: ROLE_REQUIRED });
          else if (!actionPending.current) setNotice({ kind: "success", message: "Your Nanoware Account session is restored." });
        } catch {
          if (active) setNotice({ kind: "error", message: "Your Nanoware session could not be checked. Please try again." });
        }
      });
      const redirectPending = sessionStorage.getItem("nanoware-auth-redirect") === "pending";
      void getRedirectResult(auth).then(async (result) => {
        if (!active || !redirectPending) return;
        sessionStorage.removeItem("nanoware-auth-redirect");
        if (!result) {
          setNotice({ kind: "info", message: "Sign-in was cancelled. You can continue whenever you’re ready." });
          return;
        }
        const tokenResult = await getIdTokenResult(result.user, true);
        if (tokenResult.claims.role !== "authenticated") {
          await signOut(auth);
          setNotice({ kind: "error", message: ROLE_REQUIRED });
        } else {
          setAuthorized(true);
          setNotice({ kind: "success", message: "You’re signed in with your Nanoware Account." });
        }
      }).catch((error: unknown) => {
        if (!active || !redirectPending) return;
        sessionStorage.removeItem("nanoware-auth-redirect");
        const code = errorCode(error);
        setNotice(code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request"
          ? { kind: "info", message: "Sign-in was cancelled. You can continue whenever you’re ready." }
          : { kind: "error", message: "Nanoware Account sign-in could not be completed. Check your connection and Firebase provider configuration." });
      });
    }).catch(() => {
      if (active) {
        setChecking(false);
        setNotice({ kind: "error", message: "Firebase authentication is unavailable. Check the Web App configuration and try again." });
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  async function continueWithNanoware() {
    if (actionPending.current || !hasFirebaseBrowserConfig()) {
      if (!hasFirebaseBrowserConfig()) setNotice({ kind: "error", message: "Nanoware Account sign-in is not configured. Set the Firebase Web App values and Firebase Project ID." });
      return;
    }
    actionPending.current = true;
    setBusy(true);
    setNotice({ kind: "pending", message: "Connecting securely to your Nanoware Account…" });
    try {
      const auth = getFirebaseAuth();
      await ensureFirebaseLocalPersistence(auth);
      if (window.matchMedia("(max-width: 760px)").matches) {
        sessionStorage.setItem("nanoware-auth-redirect", "pending");
        await signInWithRedirect(auth, new GoogleAuthProvider());
        return;
      }
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const tokenResult = await getIdTokenResult(result.user, true);
      if (tokenResult.claims.role !== "authenticated") {
        await signOut(auth);
        setNotice({ kind: "error", message: ROLE_REQUIRED });
        return;
      }
      setAuthorized(true);
      setNotice({ kind: "success", message: "You’re signed in with your Nanoware Account." });
    } catch (error) {
      const code = errorCode(error);
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        setNotice({ kind: "info", message: "Sign-in was cancelled. You can continue whenever you’re ready." });
      } else {
        setNotice({ kind: "error", message: "Nanoware Account sign-in could not be completed. Check your connection and Firebase provider configuration." });
      }
    } finally {
      actionPending.current = false;
      setBusy(false);
    }
  }

  async function logout() {
    if (actionPending.current) return;
    actionPending.current = true;
    setBusy(true);
    try {
      await signOut(getFirebaseAuth());
      setUser(null);
      setAuthorized(false);
      setNotice({ kind: "success", message: "You’re signed out of your Nanoware Account." });
    } catch {
      setNotice({ kind: "error", message: "Sign-out could not be completed. Please try again." });
    } finally {
      actionPending.current = false;
      setBusy(false);
    }
  }

  return <AppShell title="Account access"><div className="app-content auth-content">
    <div className="auth-intro"><div className="eyebrow">By Nanoware AI · Intelligence for everyone</div><h1>Continue your journey.</h1><p>Use your existing Nanoware Account to access Open Frontier. One account works across Nanoware products.</p></div>
    <div className="auth-card">
      <div className="auth-tab-panel" aria-live="polite">
        <div className="auth-divider"><span>Nanoware Account</span></div>
        {!user ? <button className="button button-secondary auth-submit" type="button" onClick={() => void continueWithNanoware()} disabled={busy || checking} aria-busy={busy}>
          <span className="google-g" aria-hidden="true">G</span>{checking ? "Checking your session…" : busy ? "Connecting to Nanoware…" : "Continue with Nanoware Account"}
        </button> : <div className="nanoware-account-state">
          <p className="field-label">{authorized ? "Signed in with Nanoware Account" : "Nanoware identity found"}</p>
          {user.email && <p className="auth-account-email">{user.email}</p>}
          {authorized && <Link className="button button-primary auth-submit" href="/chat">Continue to Open Frontier <Icon name="arrow" size={14} /></Link>}
          <button className="button button-secondary auth-submit" type="button" onClick={() => void logout()} disabled={busy} aria-busy={busy}>{busy ? "Signing out…" : "Sign out"}</button>
        </div>}
        {notice && <div className={`form-status ${notice.kind}`} role={notice.kind === "error" ? "alert" : "status"}><Icon name="info" size={15} />{notice.message}</div>}
      </div>
      <div className="guest-note"><div className="card-icon"><Icon name="shield" size={17} /></div><div><strong>One Nanoware Account. Access all Nanoware products.</strong><p>Your existing Nanoware Google sign-in is used. Open Frontier does not create a separate identity.</p><Link className="rail-link" href="/chat">Explore the preview <Icon name="arrow" size={12} /></Link></div></div>
      <p className="auth-terms">Your Firebase identity is verified before access. Supabase remains the Open Frontier database.</p>
    </div>
  </div></AppShell>;
}

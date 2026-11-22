"use client";

import Link from "next/link";
import { type FormEvent, type KeyboardEvent, useLayoutEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient, hasSupabaseBrowserConfig } from "@/lib/supabase/client";
import { startGoogleOAuth } from "@/lib/supabase/google-oauth";
import { AppShell, Icon } from "./app-shell";

type AuthMode = "sign-in" | "sign-up";
type AuthNotice = { kind: "info" | "pending" | "success" | "error"; message: string };

function callbackNotice(error: string | null): AuthNotice | null {
  if (error === "auth_not_configured") return { kind: "error", message: "Google sign-in is not configured yet. Set the Supabase project URL and public anon key." };
  if (error === "oauth_callback_failed") return { kind: "error", message: "Google sign-in could not be completed. You can try again or check the Supabase Google provider configuration." };
  return null;
}

export function AuthPreview({ initialError = null }: { initialError?: string | null }) {
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [notice, setNotice] = useState<AuthNotice | null>(() => callbackNotice(initialError));
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const loginPending = useRef(false);
  const signInTab = useRef<HTMLButtonElement>(null);
  const signUpTab = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<AuthMode | null>(null);
  const isSignUp = mode === "sign-up";

  useLayoutEffect(() => {
    const nextMode = pendingFocus.current;
    if (!nextMode) return;
    (nextMode === "sign-up" ? signUpTab : signInTab).current?.focus();
    pendingFocus.current = null;
  }, [mode]);

  function activateTab(nextMode: AuthMode, moveFocus = false) {
    pendingFocus.current = moveFocus ? nextMode : null;
    setMode(nextMode);
    setNotice(null);
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    let nextMode: AuthMode | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") nextMode = isSignUp ? "sign-in" : "sign-up";
    if (event.key === "Home") nextMode = "sign-in";
    if (event.key === "End") nextMode = "sign-up";
    if (!nextMode) return;
    event.preventDefault();
    activateTab(nextMode, true);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(isSignUp
      ? { kind: "pending", message: `Preview state: verification is pending for ${email}. Email/password account creation is not connected.` }
      : { kind: "info", message: `Email/password sign-in is not connected. Use Google sign-in or continue to the preview.` });
  }

  async function signInWithGoogle() {
    if (loginPending.current) return;
    if (!hasSupabaseBrowserConfig()) {
      setNotice(callbackNotice("auth_not_configured"));
      return;
    }
    loginPending.current = true;
    setBusy(true);
    setNotice(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await startGoogleOAuth((options) => supabase.auth.signInWithOAuth(options), window.location.origin);
      if (error) throw error;
      // The Supabase browser client redirects to Google. Keep the action locked while navigating.
    } catch {
      loginPending.current = false;
      setBusy(false);
      setNotice({ kind: "error", message: "Google sign-in could not be started. Check your connection and Supabase provider configuration." });
    }
  }

  return <AppShell title="Account access"><div className="app-content auth-content">
    <div className="auth-intro"><div className="eyebrow">Your ideas, in good company</div><h1>{isSignUp ? "Create your space." : "Continue your journey."}</h1><p>Open Frontier is free to use. Google sign-in connects through the configured Supabase project.</p></div>
    <div className="auth-card">
      <div className="auth-tabs" role="tablist" aria-label="Account access mode">
        <button ref={signInTab} id="sign-in-tab" type="button" role="tab" aria-controls="auth-panel" aria-selected={!isSignUp} tabIndex={!isSignUp ? 0 : -1} className={!isSignUp ? "selected" : ""} onClick={() => activateTab("sign-in")} onKeyDown={handleTabKeyDown}>Sign in</button>
        <button ref={signUpTab} id="sign-up-tab" type="button" role="tab" aria-controls="auth-panel" aria-selected={isSignUp} tabIndex={isSignUp ? 0 : -1} className={isSignUp ? "selected" : ""} onClick={() => activateTab("sign-up")} onKeyDown={handleTabKeyDown}>Create account</button>
      </div>
      <div className="auth-tab-panel" id="auth-panel" role="tabpanel" aria-labelledby={isSignUp ? "sign-up-tab" : "sign-in-tab"} tabIndex={0}>
        <form className="auth-form" onSubmit={submit}>
          {isSignUp && <label className="field-label">Your name<input className="text-field" autoComplete="name" placeholder="How should we call you?" required /></label>}
          <label className="field-label">Email address<input className="text-field" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label className="field-label">Password<input className="text-field" type="password" autoComplete={isSignUp ? "new-password" : "current-password"} placeholder={isSignUp ? "Create a password" : "Enter your password"} minLength={8} required /></label>
          {isSignUp && <p className="field-hint"><Icon name="info" size={13} />Email/password registration is not connected in this task.</p>}
          <button className="button button-primary auth-submit" type="submit">{isSignUp ? "Create account preview" : "Sign in preview"}<Icon name="arrow" size={14} /></button>
        </form>
        <div className="auth-divider"><span>or continue with</span></div>
        <button className="button button-secondary auth-submit" type="button" onClick={() => void signInWithGoogle()} disabled={busy} aria-busy={busy}><span className="google-g" aria-hidden="true">G</span>{busy ? "Connecting to Google…" : "Google"}</button>
        {notice && <div className={`form-status ${notice.kind}`} role={notice.kind === "error" ? "alert" : "status"}><Icon name="info" size={15} />{notice.message}</div>}
      </div>
      <div className="guest-note"><div className="card-icon"><Icon name="shield" size={17} /></div><div><strong>No payment required</strong><p>Open Frontier is free to use. Account access depends on configured identity providers.</p><Link className="rail-link" href="/chat">Continue to chat <Icon name="arrow" size={12} /></Link></div></div>
      <p className="auth-terms">Google authentication is handled by Supabase Auth; email/password account actions remain preview-only.</p>
    </div>
  </div></AppShell>;
}

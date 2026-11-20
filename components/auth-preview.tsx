"use client";

import Link from "next/link";
import { type FormEvent, type KeyboardEvent, useLayoutEffect, useRef, useState } from "react";
import { AppShell, Icon } from "./app-shell";

type AuthMode = "sign-in" | "sign-up";
type AuthNotice = { kind: "info" | "pending" | "success"; message: string };

export function AuthPreview() {
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [notice, setNotice] = useState<AuthNotice | null>(null);
  const [email, setEmail] = useState("");
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
    if (event.key === "ArrowRight") nextMode = isSignUp ? "sign-in" : "sign-up";
    if (event.key === "ArrowLeft") nextMode = isSignUp ? "sign-in" : "sign-up";
    if (event.key === "Home") nextMode = "sign-in";
    if (event.key === "End") nextMode = "sign-up";
    if (!nextMode) return;

    event.preventDefault();
    activateTab(nextMode, true);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(isSignUp
      ? { kind: "pending", message: `Preview state: verification is pending for ${email}. No account or email was created.` }
      : { kind: "info", message: `Preview only: sign-in is not connected. No request was sent for ${email}.` });
  }

  function simulateVerificationSuccess() {
    setNotice({
      kind: "success",
      message: `Simulated verification success for ${email}. This does not verify a real account or send an email.`,
    });
  }

  return <AppShell title="Account access"><div className="app-content auth-content">
    <div className="auth-intro"><div className="eyebrow">Your ideas, in good company</div><h1>{isSignUp ? "Create your space." : "Continue your journey."}</h1><p>Sign-in is shown here as a design preview. Identity services have not been connected.</p></div>
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
          {isSignUp && <p className="field-hint"><Icon name="info" size={13} />Verification can be previewed locally; no email or account will be created.</p>}
          <button className="button button-primary auth-submit" type="submit">{isSignUp ? "Preview sign-up state" : "Sign in to preview"}<Icon name="arrow" size={14} /></button>
        </form>
        <div className="auth-divider"><span>or continue with</span></div>
        <button className="button button-secondary auth-submit" type="button" onClick={() => setNotice({ kind: "info", message: "Google sign-in is not connected. No identity provider was contacted." })}><span className="google-g" aria-hidden="true">G</span>Google <span className="auth-unavailable">Preview only</span></button>
        {notice && <div className={`form-status ${notice.kind}`} role="status"><Icon name="info" size={15} />{notice.message}</div>}
        {notice?.kind === "pending" && <button className="button button-quiet simulate-verification" type="button" onClick={simulateVerificationSuccess}>Show simulated verification success</button>}
      </div>
      <div className="guest-note"><div className="card-icon"><Icon name="shield" size={17} /></div><div><strong>Just looking around?</strong><p>Open the local preview without creating a guest session or account.</p><Link className="rail-link" href="/chat">Continue to preview <Icon name="arrow" size={12} /></Link></div></div>
      <p className="auth-terms">By continuing, you would agree to the applicable privacy and account terms. No account data is collected in this prototype.</p>
    </div>
  </div></AppShell>;
}

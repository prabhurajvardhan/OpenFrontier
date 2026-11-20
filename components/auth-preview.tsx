"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AppShell, Icon } from "./app-shell";

export function AuthPreview() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [status, setStatus] = useState("");
  const [email, setEmail] = useState("");
  const isSignUp = mode === "sign-up";
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(isSignUp
      ? `Preview only: no account or verification email was created for ${email}.`
      : `Preview only: sign-in is not connected. No request was sent for ${email}.`);
  }
  return <AppShell title="Account access"><div className="app-content auth-content">
    <div className="auth-intro"><div className="eyebrow">Your ideas, in good company</div><h1>{isSignUp ? "Create your space." : "Continue your journey."}</h1><p>Sign-in is shown here as a design preview. Identity services have not been connected.</p></div>
    <div className="auth-card">
      <div className="auth-tabs" role="tablist" aria-label="Account access mode"><button type="button" role="tab" aria-selected={!isSignUp} className={!isSignUp ? "selected" : ""} onClick={() => { setMode("sign-in"); setStatus(""); }}>Sign in</button><button type="button" role="tab" aria-selected={isSignUp} className={isSignUp ? "selected" : ""} onClick={() => { setMode("sign-up"); setStatus(""); }}>Create account</button></div>
      <form className="auth-form" onSubmit={submit}>
        {isSignUp && <label className="field-label">Your name<input className="text-field" autoComplete="name" placeholder="How should we call you?" required /></label>}
        <label className="field-label">Email address<input className="text-field" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <label className="field-label">Password<input className="text-field" type="password" autoComplete={isSignUp ? "new-password" : "current-password"} placeholder={isSignUp ? "Create a password" : "Enter your password"} minLength={8} required /></label>
        {isSignUp && <p className="field-hint"><Icon name="info" size={13} />Email verification is not active in this preview.</p>}
        <button className="button button-primary auth-submit" type="submit">{isSignUp ? "Create preview account" : "Sign in to preview"}<Icon name="arrow" size={14} /></button>
      </form>
      <div className="auth-divider"><span>or continue with</span></div>
      <button className="button button-secondary auth-submit" type="button" onClick={() => setStatus("Google sign-in is not connected. No identity provider was contacted.")}><span className="google-g" aria-hidden="true">G</span>Google <span className="auth-unavailable">Preview only</span></button>
      {status && <div role="status" className="form-status"><Icon name="info" size={15} />{status}</div>}
      <div className="guest-note"><div className="card-icon"><Icon name="shield" size={17} /></div><div><strong>Just looking around?</strong><p>Open the local preview without creating a guest session or account.</p><Link className="rail-link" href="/chat">Continue to preview <Icon name="arrow" size={12} /></Link></div></div>
      <p className="auth-terms">By continuing, you would agree to the applicable privacy and account terms. No account data is collected in this prototype.</p>
    </div>
  </div></AppShell>;
}

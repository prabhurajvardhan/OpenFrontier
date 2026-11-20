"use client";

import { useState } from "react";
import { AppShell, Icon } from "@/components/app-shell";

function SettingToggle({ label, description, defaultChecked = false, onChange }: { label: string; description: string; defaultChecked?: boolean; onChange: () => void }) {
  const [checked, setChecked] = useState(defaultChecked);
  return <div className="setting-row"><div className="setting-copy"><strong>{label}</strong><p>{description}</p></div><button className={`toggle ${checked ? "on" : ""}`} type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => { setChecked((value) => !value); onChange(); }}><span /></button></div>;
}

export default function SettingsPage() {
  const [notice, setNotice] = useState("");
  const showNotice = () => setNotice("Preview only: this setting changed in the page UI but was not saved to an account.");
  return <AppShell title="Account & settings"><div className="app-content">
    <div className="page-title-row"><div><div className="eyebrow">Your space, your choices</div><h1>Account & settings</h1><p>Profile and privacy controls shown for preview only.</p></div><span className="pill pill-gold">Not signed in</span></div>
    <div className="settings-layout">
      <nav className="settings-nav" aria-label="Settings sections"><a href="#profile" className="active"><Icon name="person" size={15} />Profile</a><a href="#privacy"><Icon name="shield" size={15} />Privacy</a><a href="#usage"><Icon name="spark" size={15} />Usage</a></nav>
      <div className="settings-sections">
        <section className="settings-card" id="profile"><div className="settings-section-title"><div><h2>Profile</h2><p>Sample details for the preview account.</p></div><span className="pill">Example</span></div><div className="profile-card"><span className="avatar large">OF</span><div><strong>Preview account</strong><span>Not connected to an identity provider</span></div><button type="button" className="button button-secondary" onClick={showNotice}>Edit profile</button></div><div className="settings-field-grid"><label className="field-label">Display name<input className="text-field" value="Preview account" readOnly aria-label="Sample display name" /></label><label className="field-label">Email address<input className="text-field" value="Not signed in" readOnly aria-label="Sample email status" /></label></div></section>
        <section className="settings-card" id="privacy"><div className="settings-section-title"><div><h2>Privacy & preferences</h2><p>Local switches demonstrate the interface only.</p></div><Icon name="lock" size={17} /></div><SettingToggle label="Personalized model suggestions" description="Use recent preview activity to order model suggestions." onChange={showNotice} /><SettingToggle label="Conversation history" description="Save conversations to your account for later access." onChange={showNotice} /><SettingToggle label="Product updates" description="Receive occasional product and feature updates by email." onChange={showNotice} /></section>
        <section className="settings-card" id="usage"><div className="settings-section-title"><div><h2>Usage information</h2><p>What the preview can and cannot tell you.</p></div><Icon name="info" size={17} /></div><div className="usage-info-grid"><div><span>Current sample balance</span><strong>12,480 <small>tokens · example</small></strong></div><div><span>Conversation retention</span><strong>Not configured</strong></div><div><span>Model request history</span><strong>No requests made</strong></div></div><p className="usage-note">Real usage totals, data retention, export, and deletion controls require an approved backend policy and are not active in this prototype.</p></section>
        {notice && <div className="form-status" role="status"><Icon name="info" size={15} />{notice}</div>}
      </div>
    </div>
  </div></AppShell>;
}

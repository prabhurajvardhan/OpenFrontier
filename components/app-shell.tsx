"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Brand } from "./brand";

export function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };
  const shapes: Record<string, React.ReactNode> = {
    chat: <><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l-2 2v-7.5A7.5 7.5 0 1 1 20 11.5Z"/><path d="M8 11h8M8 14h5"/></>,
    wallet: <><rect x="3" y="5" width="18" height="15" rx="2.5"/><path d="M3 9h18M16 14h2"/><path d="M7 5V3h10"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1a1.7 1.7 0 0 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 0 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 0 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 0 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 0 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2V2a1.7 1.7 0 0 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 0 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 0 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/></>,
    spark: <><path d="m12 3 1.6 6.1L20 11l-6.4 1.9L12 19l-1.6-6.1L4 11l6.4-1.9L12 3Z"/><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z"/></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.5 9A7 7 0 0 1 17 6l3 3M4 15l3 3a7 7 0 0 0 11.5-3"/></>,
    send: <><path d="m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13"/></>,
    sparkle: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    check: <><path d="m5 12 4 4L19 6"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3"/></>,
    person: <><circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/></>,
    gift: <><rect x="3" y="9" width="18" height="12" rx="2"/><path d="M12 9v12M3 13h18M12 9s-5 0-5-3a2 2 0 0 1 4 0c0 2 1 3 1 3Zm0 0s5 0 5-3a2 2 0 0 0-4 0c0 2-1 3-1 3Z"/></>,
  };
  return <svg {...common}>{shapes[name] ?? shapes.spark}</svg>;
}

const links = [
  { href: "/chat", label: "Chat", icon: "chat" },
  { href: "/wallet", label: "Wallet & rewards", icon: "wallet" },
  { href: "/settings", label: "Account & settings", icon: "settings" },
];

export function PreviewBanner() {
  return <div className="preview-banner"><Icon name="info" size={13} /> Preview only · mock data · no model requests, token charges, or rewards</div>;
}

export function AppShell({ children, title = "Open Frontier" }: { children: React.ReactNode; title?: string }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <div className="app-shell">
      <aside className="app-sidebar" aria-label="Main navigation">
        <div className="sidebar-brand"><Link href="/chat"><Brand /></Link></div>
        <Link className="side-link" href="/chat" aria-label="Start a new conversation"><Icon name="plus" /> New conversation</Link>
        <div className="sidebar-label">Workspace</div>
        {links.map((link) => <Link key={link.href} className={`side-link ${pathname === link.href ? "active" : ""}`} href={link.href}><Icon name={link.icon} />{link.label}</Link>)}
        <div className="side-spacer" />
        <div className="sidebar-credit"><div className="sidebar-credit-top"><span>Sample balance</span><span>PREVIEW</span></div><strong>12,480 <small>tokens</small></strong><small>Illustrative data only. No value is held.</small></div>
        <div className="sidebar-user"><span className="avatar">OF</span><span className="sidebar-user-info"><strong>Preview account</strong><small>Not signed in</small></span><Link className="icon-button" href="/sign-in" aria-label="Open sign in"><Icon name="person" size={16} /></Link></div>
      </aside>
      <main className="app-main">
        <header className="app-topbar">
          <div className="topbar-left"><button className="icon-button mobile-menu" type="button" aria-label="Toggle navigation" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)}><Icon name={mobileMenuOpen ? "close" : "menu"} size={17} /></button><Link className="mobile-brand" href="/chat"><Brand /></Link><span className="topbar-caption">{title}</span></div>
          <div className="topbar-right"><span className="pill pill-gold pill-dot">Local preview</span><Link className="button button-secondary" href="/sign-in" style={{ minHeight: 34, padding: "0 13px", fontSize: 11 }}>Sign in</Link></div>
        </header>
        {mobileMenuOpen && <nav className="mobile-menu-panel" aria-label="Mobile navigation">{links.map((link) => <Link key={link.href} className={`side-link ${pathname === link.href ? "active" : ""}`} href={link.href} onClick={() => setMobileMenuOpen(false)}><Icon name={link.icon} />{link.label}</Link>)}<Link className="side-link" href="/sign-in" onClick={() => setMobileMenuOpen(false)}><Icon name="person" />Sign in</Link></nav>}
        <PreviewBanner />
        {children}
      </main>
      <nav className="mobile-bottom-nav" aria-label="Primary navigation">{links.map((link) => <Link key={link.href} className={pathname === link.href ? "active" : ""} href={link.href}><Icon name={link.icon} size={17} /><span>{link.label === "Account & settings" ? "Settings" : link.label.replace(" & rewards", "")}</span></Link>)}<Link className={pathname === "/sign-in" ? "active" : ""} href="/sign-in"><Icon name="person" size={17} /><span>Account</span></Link></nav>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell, Icon } from "@/components/app-shell";
import { mockApi } from "@/lib/api/mock-api";
import type { LedgerEntryView, RewardShowView, TokenBalanceView } from "@/lib/api/types";

const prettyType: Record<LedgerEntryView["type"], string> = {
  reward_credit: "Reward credit",
  debit: "Chat usage",
  release: "Reservation release",
  topup_credit: "Top-up",
  refund: "Refund",
  pending_reconciliation: "Under review",
};

type WalletState =
  | { status: "loading" }
  | { status: "loaded"; balance: TokenBalanceView; entries: LedgerEntryView[] }
  | { status: "error" };
type WalletFixture = "sample" | "empty" | "error";
type RewardFixture = RewardShowView["status"] | "error";
type RewardFeedback = { message: string; status: "info" | "pending" | "error" };

function getWalletPreview() {
  return Promise.all([mockApi.getTokenBalance(), mockApi.getTokenLedger()]);
}

export default function WalletPage() {
  const [walletState, setWalletState] = useState<WalletState>({ status: "loading" });
  const [walletFixture, setWalletFixture] = useState<WalletFixture>("sample");
  const [rewardFixture, setRewardFixture] = useState<RewardFixture>("unavailable");
  const [rewardFeedback, setRewardFeedback] = useState<RewardFeedback | null>(null);
  const [checkingReward, setCheckingReward] = useState(false);

  async function loadWallet(fixture: WalletFixture = "sample") {
    setWalletState({ status: "loading" });
    await new Promise<void>((resolve) => window.setTimeout(resolve, 220));
    if (fixture === "error") {
      setWalletState({ status: "error" });
      return;
    }
    try {
      const [balance, sampleEntries] = await getWalletPreview();
      setWalletState({ status: "loaded", balance, entries: fixture === "empty" ? [] : sampleEntries });
    } catch {
      setWalletState({ status: "error" });
    }
  }

  useEffect(() => {
    let active = true;
    void getWalletPreview()
      .then(([balance, entries]) => {
        if (active) setWalletState({ status: "loaded", balance, entries });
      })
      .catch(() => {
        if (active) setWalletState({ status: "error" });
      });
    return () => { active = false; };
  }, []);

  async function checkRewardStatus() {
    setCheckingReward(true);
    setRewardFeedback(null);
    try {
      if (rewardFixture === "error") throw new Error("Simulated local status error");
      const result = rewardFixture === "unavailable"
        ? await mockApi.createRewardShow()
        : { showId: "mock-preview-fixture", status: rewardFixture };
      const feedback: Record<typeof result.status, RewardFeedback> = {
        unavailable: {
          status: "info",
          message: "Rewarded ads are not connected. No ad was shown and no tokens were granted.",
        },
        pending_verification: {
          status: "pending",
          message: "This sample state represents pending verification only; no ad or reward was created.",
        },
        ready: {
          status: "info",
          message: "This is a preview-only ready state. No ad was shown and no tokens were granted.",
        },
        rejected: {
          status: "error",
          message: "The preview status was rejected. No ad was shown and no tokens were granted.",
        },
      };
      setRewardFeedback(feedback[result.status]);
    } catch {
      setRewardFeedback({
        status: "error",
        message: "The preview status could not be checked. No ad was shown and no tokens were granted.",
      });
    } finally {
      setCheckingReward(false);
    }
  }

  function retrySampleData() {
    setWalletFixture("sample");
    void loadWallet("sample");
  }

  const balance = walletState.status === "loaded" ? walletState.balance : null;
  const entries = walletState.status === "loaded" ? walletState.entries : [];

  return <AppShell title="Wallet & rewards"><div className="app-content">
    <div className="page-title-row"><div><div className="eyebrow">A clear view of access</div><h1>Wallet & rewards</h1><p>Every number below is example data for the interface preview.</p></div><span className="pill pill-gold">Sample data</span></div>
    <details className="preview-state-tools">
      <summary>Explore local wallet and reward states</summary>
      <div className="preview-state-controls">
        <label htmlFor="wallet-preview-state">Wallet data</label>
        <select id="wallet-preview-state" value={walletFixture} onChange={(event) => { const fixture = event.target.value as WalletFixture; setWalletFixture(fixture); void loadWallet(fixture); }}>
          <option value="sample">Example balance and activity</option>
          <option value="empty">Empty example activity</option>
          <option value="error">Simulated load failure</option>
        </select>
        <label htmlFor="reward-preview-state">Reward check</label>
        <select id="reward-preview-state" value={rewardFixture} onChange={(event) => { setRewardFixture(event.target.value as RewardFixture); setRewardFeedback(null); }}>
          <option value="unavailable">Unavailable (default)</option>
          <option value="pending_verification">Pending verification</option>
          <option value="ready">Ready preview</option>
          <option value="rejected">Rejected preview</option>
          <option value="error">Simulated check error</option>
        </select>
        <p>These controls switch local UI fixtures only; they make no backend request or reward claim.</p>
      </div>
    </details>
    <div className="wallet-grid">
      <section className="wallet-balance-card" aria-busy={walletState.status === "loading"}>
        <div className="wallet-card-top"><span className="card-icon"><Icon name="wallet" size={18} /></span><span className="pill">Preview only</span></div>
        <div className="wallet-balance-label">Example available balance</div>
        <div className="wallet-amount" aria-live="polite">{balance ? balance.availableTokens.toLocaleString() : walletState.status === "error" ? "Unavailable" : "—"}<span>tokens</span></div>
        <p>{balance?.asOf ?? (walletState.status === "loading" ? "Loading sample data…" : walletState.status === "error" ? "Sample balance could not be loaded." : "")}</p>
        <div className="wallet-card-bottom"><span>No live balance is connected</span><Icon name="info" size={14} /></div>
      </section>
      <section className="wallet-info-card"><div className="eyebrow">How usage would work</div><h2>Clear before you continue.</h2><p>A future server will reserve usage before a model request and settle only verified usage. This preview does not calculate or deduct any tokens.</p><Link className="rail-link" href="/chat">Return to chat <Icon name="arrow" size={12} /></Link></section>
    </div>
    {walletState.status === "error" && <div className="wallet-load-error" role="alert"><span>Example wallet data could not be loaded.</span><button className="button button-secondary" type="button" onClick={retrySampleData}>Retry sample data</button></div>}
    <section className="reward-card"><div className="reward-mark"><Icon name="gift" size={22} /></div><div className="reward-copy"><span className="eyebrow">Reward-supported access</span><h2>Rewards should be earned, not assumed.</h2><p>Reward access is a proposed product direction. A client-side button cannot grant tokens; a verified provider callback and server decision would be required.</p>{rewardFeedback && <div className={`form-status compact ${rewardFeedback.status}`} role={rewardFeedback.status === "error" ? "alert" : "status"}><Icon name="info" size={14} />{rewardFeedback.message}</div>}</div><button className="button button-secondary" type="button" onClick={() => void checkRewardStatus()} disabled={checkingReward}>{checkingReward ? "Checking preview…" : "Check preview status"} <Icon name="arrow" size={13} /></button></section>
    <section className="ledger-section"><div className="ledger-heading"><div><h2>Example activity</h2><p>Not linked to an account or ledger.</p></div><span className="pill">Illustrative</span></div>
      <div className="ledger-list" role="list" aria-label="Example token activity" aria-busy={walletState.status === "loading"}>
        {walletState.status === "loading" && <div className="ledger-empty" role="status">Loading sample activity…</div>}
        {walletState.status === "error" && <div className="ledger-empty" role="status">Example activity is unavailable. Retry sample data above.</div>}
        {walletState.status === "loaded" && entries.length === 0 && <div className="ledger-empty" role="status">No example activity to show.</div>}
        {walletState.status === "loaded" && entries.map((entry) => <div className="ledger-row" key={entry.id} role="listitem"><span className={`ledger-icon ${entry.type === "debit" ? "debit" : "credit"}`}><Icon name={entry.type === "debit" ? "spark" : entry.status === "pending" ? "clock" : "gift"} size={16} /></span><div className="ledger-description"><strong>{prettyType[entry.type]}</strong><span>{entry.sourceLabel} · {entry.createdAt}</span></div><div className="ledger-amount"><strong className={entry.amount < 0 ? "negative" : "positive"}>{entry.amount > 0 ? "+" : ""}{entry.amount.toLocaleString()}</strong><span className={`status-text ${entry.status}`}>{entry.status === "settled" ? "Example · settled" : entry.status === "pending" ? "Example · pending" : "Example · rejected"}</span></div></div>)}
      </div>
      <div className="ledger-footnote"><Icon name="shield" size={15} />A future balance will be server-authoritative. This screen cannot finalize grants, usage, refunds, or settlement.</div>
    </section>
  </div></AppShell>;
}

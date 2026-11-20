import Link from "next/link";
import { Brand, BrandMark } from "@/components/brand";
import { Icon } from "@/components/app-shell";

const features = [
  { icon: "spark", title: "Intelligence with room to think", body: "Explore a considered set of AI models for writing, learning, problem-solving, and the ideas in between." },
  { icon: "shield", title: "Clarity at every step", body: "Understand how access works and see usage information without hidden subscriptions or confusing token math." },
  { icon: "gift", title: "Access designed to stay open", body: "A proposed reward-supported model aims to help people access useful AI without a recurring subscription." },
];
const steps = [
  ["01", "Choose a model", "Find an intelligence style that suits what you want to do."],
  ["02", "Start a conversation", "Bring a question, an unfinished thought, or a task to explore."],
  ["03", "See usage clearly", "Review transparent usage and account states as they happen."],
  ["04", "Keep moving forward", "Build on good answers and return to what matters."],
];

export default function HomePage() {
  return <main className="landing">
    <header className="site-header"><Link href="/" aria-label="Open Frontier home"><Brand /></Link><nav className="site-nav" aria-label="Main navigation"><a href="#why-open-frontier">Why Open Frontier</a><a href="#how-it-works">How it works</a><a href="#access">Access</a></nav><Link className="button button-primary" href="/chat">Explore the preview <Icon name="arrow" size={14} /></Link></header>
    <section className="hero">
      <div className="hero-copy"><div className="eyebrow">By Nanoware AI · Intelligence for everyone</div><h1>More room<br />to <span>think.</span></h1><p>Open Frontier is being shaped as a calm, open home for frontier AI. Ask better questions, explore new ideas, and see how thoughtful access could work for everyone.</p><div className="hero-actions"><Link className="button button-primary" href="/chat">Explore the preview <Icon name="arrow" size={15} /></Link><Link className="button button-secondary" href="#how-it-works">How it works</Link></div><div className="hero-note"><span className="hero-note-mark"><Icon name="spark" size={14} /></span><span>A more open way to meet powerful intelligence.</span></div></div>
      <div className="hero-art" aria-label="Abstract illustration of connected intelligence"><div className="orbit-card"><div className="orbit-node n1"><Icon name="spark" size={19} /></div><div className="orbit-node n2"><Icon name="chat" size={19} /></div><div className="orbit-node n3"><Icon name="shield" size={19} /></div><div className="orbit-node n4"><Icon name="gift" size={19} /></div><div className="orbit-core"><BrandMark /></div><div className="orbit-caption"><strong>Open by design</strong><span>Built around clarity, access, and curiosity</span></div></div></div>
    </section>
    <section className="section" id="why-open-frontier"><div className="section-head"><div><div className="eyebrow">The idea behind it</div><h2>Powerful tools.<br />A more human pace.</h2></div><p>Open Frontier brings the intelligence of modern AI into a focused space. No noise for noise’s sake—just useful models and a clearer way to work with them.</p></div><div className="benefit-grid">{features.map((feature) => <article className="benefit-card" key={feature.title}><div className="card-icon"><Icon name={feature.icon} size={18} /></div><h3>{feature.title}</h3><p>{feature.body}</p></article>)}</div></section>
    <section className="how-section" id="how-it-works"><div className="how-inner"><div className="section-head"><div><div className="eyebrow">A simple path forward</div><h2>From first question<br />to fresh perspective.</h2></div><p>Designed to keep attention on the work—not the interface. The experience will grow as the product and its safeguards are reviewed.</p></div><div className="step-grid">{steps.map(([number, title, body]) => <article className="step-card" key={number}><span className="step-number">{number}</span><h3>{title}</h3><p>{body}</p></article>)}</div></div></section>
    <section className="section" id="access"><div className="access-strip"><div><div className="eyebrow">Access, without the fine print</div><h2>Open access is a product principle.</h2><p>Reward-supported access is a proposed direction, not a live feature. The prototype does not serve ads or grant tokens.</p></div><Link className="button button-gold" href="/chat">See the local preview <Icon name="arrow" size={14} /></Link></div></section>
    <footer className="site-footer"><div className="footer-inner"><Link href="/" aria-label="Open Frontier home"><Brand /></Link><span>By Nanoware AI</span><span>© 2026 Nanoware AI · Product preview</span></div></footer>
  </main>;
}

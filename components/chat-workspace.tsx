"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from "react";
import { AppShell, Icon } from "./app-shell";
import { mockApi } from "@/lib/api/mock-api";
import type { ConversationSummary } from "@/lib/api/types";

type Message = { id: string; role: "user" | "assistant"; content: string; time: string; demo?: boolean; pending?: boolean };
const starterPrompts = ["Explain a complex idea in plain language", "Help me shape a first draft", "Compare two approaches thoughtfully"];
const models = ["Frontier · balanced", "Frontier · quick", "Frontier · deep reasoning"];

function FormattedText({ content }: { content: string }) {
  const blocks = content.split(/```([\s\S]*?)```/g);
  return <div className="message-content">{blocks.map((part, index) => index % 2 === 1 ? <pre key={index}><code>{part.replace(/^\w+\n/, "")}</code></pre> : <span key={index}>{part.split("\n").map((line, lineIndex) => {
    if (line.startsWith("### ")) return <h3 key={lineIndex}>{line.slice(4)}</h3>;
    if (line.startsWith("- ")) return <p key={lineIndex} style={{ margin: "2px 0" }}>• {inlineFormat(line.slice(2))}</p>;
    return line ? <p key={lineIndex}>{inlineFormat(line)}</p> : <br key={lineIndex} />;
  })}</span>)}</div>;
}

function inlineFormat(text: string) {
  const chunks = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return chunks.map((chunk, index) => chunk.startsWith("**") ? <strong key={index}>{chunk.slice(2, -2)}</strong> : chunk.startsWith("`") ? <code key={index}>{chunk.slice(1, -1)}</code> : chunk);
}

export function ChatWorkspace() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConversation, setSelectedConversation] = useState("sample-1");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [model, setModel] = useState(models[0]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    void mockApi.listConversations().then(setConversations);
  }, []);

  const selectedTitle = useMemo(() => conversations.find((item) => item.id === selectedConversation)?.title ?? "New conversation", [conversations, selectedConversation]);

  function newConversation() {
    const id = `preview-${Date.now()}`;
    setConversations((items) => [{ id, title: "New conversation", updatedAt: "Just now" }, ...items]);
    setSelectedConversation(id);
    setMessages([]);
    setNotice("A new local preview conversation is ready. It will not be saved to an account.");
  }

  async function sendMessage(text = draft) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setNotice("");
    setDraft("");
    const userMessage: Message = { id: `user-${Date.now()}`, role: "user", content: trimmed, time: "Just now" };
    const assistantMessage: Message = { id: `assistant-${Date.now()}`, role: "assistant", content: "", time: "Preview", demo: true, pending: true };
    setMessages((items) => [...items, userMessage, assistantMessage]);
    setBusy(true);
    try {
      let result = "";
      for await (const event of mockApi.submitChat({ conversationId: selectedConversation, modelId: model, content: trimmed, idempotencyKey: `preview-${Date.now()}` })) {
        if (event.type === "text_delta") {
          result += event.text;
          const snapshot = result;
          setMessages((items) => items.map((item) => item.id === assistantMessage.id ? { ...item, content: snapshot } : item));
        }
      }
      setMessages((items) => items.map((item) => item.id === assistantMessage.id ? { ...item, pending: false } : item));
      setConversations((items) => items.map((item) => item.id === selectedConversation && item.title === "New conversation" ? { ...item, title: trimmed.slice(0, 35) } : item));
    } catch {
      setMessages((items) => items.map((item) => item.id === assistantMessage.id ? { ...item, content: "The preview could not load its sample response. No request was sent to a model provider.", pending: false } : item));
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }
  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }
  async function copyResponse(content: string) {
    try { await navigator.clipboard.writeText(content); setNotice("Preview response copied."); }
    catch { setNotice("Clipboard access is unavailable in this browser."); }
  }
  function selectConversation(id: string) {
    setSelectedConversation(id);
    setMessages([]);
    setNotice("This conversation is a sample preview. Stored conversation loading is not connected.");
  }

  return <AppShell title="Chat">
    <div className="app-content">
      <div className="chat-layout">
        <section className="chat-main" aria-label="Chat workspace">
          <div className="chat-header">
            <div><div className="eyebrow">A thoughtful space to explore</div><h1>{selectedTitle}</h1></div>
            <div className="model-select"><Icon name="spark" size={15} /><label htmlFor="model-select">Model</label><select id="model-select" value={model} onChange={(event) => setModel(event.target.value)} aria-label="Select preview model">{models.map((name) => <option key={name} value={name}>{name}</option>)}</select></div>
          </div>
          {messages.length === 0 ? <div className="chat-empty">
            <div className="chat-empty-mark"><Icon name="spark" size={27} /></div>
            <h2>What would you like to explore?</h2>
            <p>Choose a starting point or write your own prompt. This local preview uses a fixed sample response, not a live AI model.</p>
            <div className="prompt-chips">{starterPrompts.map((prompt) => <button key={prompt} type="button" className="prompt-chip" onClick={() => { setDraft(prompt); }}>{prompt}</button>)}</div>
          </div> : <div className="chat-thread" aria-live="polite">{messages.map((message) => message.role === "user" ? <div className="user-message" key={message.id}><div className="user-meta">You · {message.time}</div><div className="user-bubble">{message.content}</div></div> : <article className="message assistant" key={message.id}>
            <div className="message-avatar"><Icon name="spark" size={15} /></div><div className="message-body"><div className="message-meta"><strong>Open Frontier</strong><span>·</span><span>{message.pending ? "Simulating preview" : "Local preview"}</span><span className="pill pill-gold">Mock</span></div><FormattedText content={message.content || (message.pending ? "Preparing a sample response…" : "")} />
              {!message.pending && message.content && <div className="message-actions"><button className="icon-button" type="button" aria-label="Copy preview response" onClick={() => void copyResponse(message.content)}><Icon name="copy" size={14} /></button><button className="icon-button" type="button" aria-label="Regenerate sample response" onClick={() => { const lastUser = [...messages].reverse().find((item) => item.role === "user"); if (lastUser) void sendMessage(lastUser.content); }}><Icon name="refresh" size={14} /></button></div>}
            </div></article>)}</div>}
          {notice && <div role="status" className="chat-notice"><Icon name="info" size={14} />{notice}</div>}
          <div className="composer-wrap"><form className="composer" onSubmit={onSubmit}><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={onKeyDown} placeholder="Ask anything… (local preview only)" aria-label="Write a message" disabled={busy} /><div className="composer-tools"><div className="composer-tools-left"><span className="pill">No tokens charged</span><span className="composer-hint">Enter to send · Shift + Enter for a new line</span></div><div className="composer-tools-right"><button className="send-button" type="submit" aria-label="Run local preview" disabled={!draft.trim() || busy}><Icon name={busy ? "clock" : "send"} size={15} /></button></div></div></form><p className="chat-disclaimer">Responses are fixed sample content. Nothing is sent to a model or stored on a server.</p></div>
        </section>
        <aside className="chat-rail" aria-label="Chat context">
          <div className="rail-section"><div className="rail-heading">Usage snapshot <Icon name="info" size={14} /></div><div className="rail-card"><span className="pill pill-gold">Sample data</span><div className="balance-value">12,480 <span>tokens</span></div><p>Illustrative balance only. This preview does not connect to a wallet or deduct usage.</p><a className="rail-link" href="/wallet">View wallet <Icon name="arrow" size={12} /></a></div></div>
          <div className="rail-section"><div className="rail-heading">Conversation history <button className="icon-button" type="button" aria-label="New conversation" onClick={newConversation}><Icon name="plus" size={15} /></button></div><div className="history-list">{conversations.length === 0 ? <p className="history-empty">No sample conversations yet.</p> : conversations.map((item) => <button key={item.id} type="button" className={`history-row ${item.id === selectedConversation ? "selected" : ""}`} onClick={() => selectConversation(item.id)}><Icon name="clock" size={14} /><span>{item.title}</span></button>)}</div><button type="button" className="button button-secondary" style={{ width: "100%", minHeight: 36, marginTop: 9, fontSize: 10 }} onClick={newConversation}><Icon name="plus" size={14} /> New conversation</button></div>
          <div className="rail-section"><div className="rail-heading">This preview</div><div className="rail-card"><p>Model choices are illustrative. Real model availability and token costs will be supplied by a future backend contract.</p></div></div>
        </aside>
      </div>
    </div>
  </AppShell>;
}

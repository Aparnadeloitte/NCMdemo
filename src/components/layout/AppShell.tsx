"use client";

import { useEffect, useState, type ReactNode } from "react";
import { PortalHeader } from "@/components/layout/PortalHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { LoadingState, PageLoader } from "@/components/ui/Feedback";
import { useSessionGuard } from "@/lib/use-session";
import { getChatReply, quickQuestions } from "@/data/chat";

type ChatMessage = { from: "bot" | "user"; text: string; followUps?: string[] };

export function AppShell({ children }: { children: ReactNode }) {
  const { session, ready } = useSessionGuard();
  const [open, setOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [overMap, setOverMap] = useState(false);

  useEffect(() => {
    const states = new Map<Element, boolean>();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => states.set(entry.target, entry.isIntersecting));
      setOverMap([...states.values()].some(Boolean));
    }, { threshold: 0.2 });
    const tracked = new Set<Element>();
    function sync() {
      document.querySelectorAll(".kdash-map, .map-panel").forEach((el) => {
        if (!tracked.has(el)) {
          tracked.add(el);
          io.observe(el);
        }
      });
    }
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  if (!ready || !session) return <PageLoader label="Opening the portal…" />;

  function send(text: string) {
    const value = text.trim();
    if (!value) return;
    const { reply, followUps } = getChatReply(value);
    setMessages((current) => [
      ...current,
      { from: "user", text: value },
      { from: "bot", text: reply, followUps },
    ]);
    setDraft("");
  }

  return (
    <div className="portal">
      <PortalHeader onMenu={() => setOpen(true)} user={session} />
      <div className="portal-body">
        <Sidebar open={open} onClose={() => setOpen(false)} role={session.role} />
        <main className="portal-main">{children}</main>
      </div>
      <button
        className={`chat-fab${overMap ? " chat-fab-dim" : ""}`}
        type="button"
        aria-label="Open chat"
        aria-expanded={chatOpen}
        onClick={() => setChatOpen((current) => !current)}
      >
        <ChatIcon />
      </button>
      {chatOpen ? (
        <div className="chat-popup" role="dialog" aria-label="Chat" aria-modal="false">
          <header className="chat-popup-head">
            <strong>Support Chat</strong>
            <button type="button" aria-label="Close chat" onClick={() => setChatOpen(false)}>×</button>
          </header>
          <div className="chat-popup-body">
            <p>Hi {session.name?.split(" ")[0] ?? "there"}, how can we help you today?</p>
            {messages.map((message, index) => (
              <div key={index}>
                <p className={`chat-msg chat-msg-${message.from}`}>{message.text}</p>
                {message.from === "bot" && index === messages.length - 1 && message.followUps?.length ? (
                  <div className="chat-quick-questions">
                    {message.followUps.map((question) => (
                      <button key={question} type="button" className="chat-quick-btn" onClick={() => send(question)}>
                        {question}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {messages.length === 0 ? (
              <div className="chat-quick-questions">
                {quickQuestions.map((question) => (
                  <button key={question} type="button" className="chat-quick-btn" onClick={() => send(question)}>
                    {question}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <form className="chat-popup-input" onSubmit={(event) => { event.preventDefault(); send(draft); }}>
            <input
              type="text"
              placeholder="Type a message…"
              aria-label="Message"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <button type="submit" className="btn-primary small">Send</button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5h16v11H8l-4 4V5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="9" cy="10.5" r="1.1" fill="currentColor" />
      <circle cx="12" cy="10.5" r="1.1" fill="currentColor" />
      <circle cx="15" cy="10.5" r="1.1" fill="currentColor" />
    </svg>
  );
}

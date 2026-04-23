import { AnimatePresence, motion } from "framer-motion";
import { Camera, Plus, SendHorizontal, Sparkles, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { nanoid } from "nanoid";
import type { AppSettings, Capture, ChatMessage, ChatSession } from "@shared/types";

interface Props {
  seedCapture?: Capture;
  onConsumeCapture?: () => void;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function makeSession(): ChatSession {
  return {
    id: nanoid(10),
    title: "New conversation",
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export default function AIChat({ seedCapture, onConsumeCapture }: Props) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<Capture | null>(null);
  const [sending, setSending] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const active = useMemo(() => sessions.find((s) => s.id === activeId), [sessions, activeId]);

  useEffect(() => {
    (async () => {
      try {
        const [s, list] = await Promise.all([
          window.prepOS.settings.get(),
          window.prepOS.chat.listSessions(),
        ]);
        setSettings(s);
        const ordered = [...list].sort((a, b) => b.updatedAt - a.updatedAt);
        if (ordered.length === 0) {
          const fresh = makeSession();
          setSessions([fresh]);
          setActiveId(fresh.id);
        } else {
          setSessions(ordered);
          setActiveId(ordered[0].id);
        }
        const key = await window.prepOS.settings.getApiKey(s.aiProvider);
        setApiKeyMissing(!key);
      } catch (err) {
        console.error("[prepos] AIChat init failed", err);
        const fresh = makeSession();
        setSessions([fresh]);
        setActiveId(fresh.id);
      }
    })();
  }, []);

  useEffect(() => {
    if (seedCapture) {
      setAttachment(seedCapture);
      onConsumeCapture?.();
      textareaRef.current?.focus();
    }
  }, [seedCapture, onConsumeCapture]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [active?.messages.length, sending]);

  const persist = useCallback(async (session: ChatSession) => {
    await window.prepOS.chat.saveSession(session);
  }, []);

  const newSession = () => {
    const s = makeSession();
    setSessions((prev) => [s, ...prev]);
    setActiveId(s.id);
  };

  const deleteSession = async (id: string) => {
    await window.prepOS.chat.removeSession(id);
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (activeId === id) {
        setActiveId(next[0]?.id ?? null);
      }
      return next;
    });
  };

  const triggerCapture = async () => {
    const capture = await window.prepOS.captures.trigger();
    if (capture) setAttachment(capture);
  };

  const removeAttachment = () => setAttachment(null);

  const send = async () => {
    if (!active || sending) return;
    if (!input.trim() && !attachment) return;
    if (!settings) return;

    const key = await window.prepOS.settings.getApiKey(settings.aiProvider);
    if (!key) {
      setApiKeyMissing(true);
      return;
    }

    const userMsg: ChatMessage = {
      id: nanoid(8),
      role: "user",
      content: input.trim(),
      imagePath: attachment?.path,
      imageDataUrl: attachment?.dataUrl,
      createdAt: Date.now(),
    };

    const title =
      active.title === "New conversation" && input.trim()
        ? input.trim().slice(0, 40)
        : attachment && active.title === "New conversation"
          ? "Screen capture chat"
          : active.title;

    const pending: ChatSession = {
      ...active,
      title,
      messages: [...active.messages, userMsg],
      updatedAt: Date.now(),
    };

    setSessions((prev) => prev.map((s) => (s.id === pending.id ? pending : s)));
    setInput("");
    setAttachment(null);
    setSending(true);

    try {
      const response = await window.prepOS.ai.chat({
        sessionId: pending.id,
        provider: settings.aiProvider,
        model: settings.aiProvider === "openai" ? settings.openaiModel : settings.anthropicModel,
        messages: [
          {
            role: "system",
            content:
              "You are PrepOS Assistant, a helpful coding & interview prep buddy. " +
              "When analysing screenshots, give structured, correct, concise explanations. " +
              "For code use markdown code fences.",
          },
          ...pending.messages.map((m) => ({
            role: m.role,
            content: m.content,
            imageDataUrl: m.imageDataUrl,
          })),
        ],
      });

      const aiMsg: ChatMessage = {
        id: nanoid(8),
        role: "assistant",
        content: response.content || response.error || "(empty response)",
        createdAt: Date.now(),
        error: response.error,
      };
      const next: ChatSession = {
        ...pending,
        messages: [...pending.messages, aiMsg],
        updatedAt: Date.now(),
      };
      setSessions((prev) => prev.map((s) => (s.id === next.id ? next : s)));
      await persist(next);
    } catch (err) {
      const aiMsg: ChatMessage = {
        id: nanoid(8),
        role: "assistant",
        content: `Error: ${err instanceof Error ? err.message : String(err)}`,
        createdAt: Date.now(),
        error: String(err),
      };
      const next: ChatSession = {
        ...pending,
        messages: [...pending.messages, aiMsg],
        updatedAt: Date.now(),
      };
      setSessions((prev) => prev.map((s) => (s.id === next.id ? next : s)));
      await persist(next);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-neutral-950/80 text-white">
      <aside className="flex w-56 shrink-0 flex-col border-r border-white/10 bg-black/30">
        <div className="flex items-center justify-between px-3 py-3">
          <div className="flex items-center gap-2 text-[13px] font-medium">
            <Sparkles className="h-4 w-4 text-violet-300" />
            AI Chats
          </div>
          <button
            onClick={newSession}
            className="rounded-md p-1 hover:bg-white/10"
            title="New chat"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              className={
                "group mb-1 flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[12px] " +
                (activeId === s.id ? "bg-white/10" : "hover:bg-white/5")
              }
            >
              <span className="truncate">{s.title || "Untitled"}</span>
              <Trash2
                className="ml-2 hidden h-3 w-3 text-white/50 hover:text-red-300 group-hover:block"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSession(s.id);
                }}
              />
            </button>
          ))}
          {sessions.length === 0 && (
            <div className="px-3 py-4 text-[11px] text-white/50">No conversations yet</div>
          )}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        {apiKeyMissing && (
          <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-[12px] text-amber-200">
            Add an API key in Settings to start chatting. Current provider:{" "}
            <strong className="text-amber-100">{settings?.aiProvider}</strong>.
          </div>
        )}

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
          {active?.messages.length === 0 && !sending && (
            <div className="mx-auto flex max-w-md flex-col items-center pt-10 text-center text-sm text-white/60">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 text-2xl">
                ✨
              </div>
              <p className="mb-3 text-white/80">
                Ask anything. Paste code. Or capture your screen.
              </p>
              <button
                onClick={triggerCapture}
                className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[12px] hover:bg-white/10"
              >
                <Camera className="h-3.5 w-3.5" /> Capture region (⌘⇧A)
              </button>
            </div>
          )}
          <AnimatePresence>
            {active?.messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={"flex " + (m.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={
                    "max-w-[78%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed shadow-sm " +
                    (m.role === "user"
                      ? "bg-blue-600/90 text-white"
                      : "bg-white/8 text-white/92 border border-white/10")
                  }
                >
                  {m.imageDataUrl && (
                    <img
                      src={m.imageDataUrl}
                      alt="capture"
                      className="mb-2 max-h-60 rounded-lg object-contain"
                    />
                  )}
                  <div className="whitespace-pre-wrap">{m.content}</div>
                  <div className="mt-1 text-right text-[10px] text-white/40">
                    {formatTime(m.createdAt)}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {sending && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[12px] text-white/70">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-white/60" />
                Thinking…
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-white/10 bg-black/40 p-3">
          {attachment && (
            <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 p-2 pr-3">
              <img
                src={attachment.dataUrl}
                className="h-12 w-12 rounded object-cover"
                alt="attachment"
              />
              <div className="flex flex-col text-[11px]">
                <span className="text-white/90">Screen capture</span>
                <span className="text-white/50">
                  {attachment.width}×{attachment.height}
                </span>
              </div>
              <button
                onClick={removeAttachment}
                className="ml-1 rounded-full p-1 hover:bg-white/10"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <button
              onClick={triggerCapture}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10"
              title="Capture region (⌘⇧A)"
            >
              <Camera className="h-4 w-4" />
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="Message PrepOS Assistant…"
              className="max-h-32 min-h-[38px] flex-1 resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[13px] outline-none placeholder:text-white/40 focus:border-white/25"
            />
            <button
              onClick={send}
              disabled={sending || (!input.trim() && !attachment)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500 text-white hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-40"
              title="Send"
            >
              <SendHorizontal className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-white/40">
            <span>Enter to send · Shift+Enter for newline</span>
            <span>
              {settings?.aiProvider === "openai"
                ? `OpenAI · ${settings.openaiModel}`
                : settings?.aiProvider === "anthropic"
                  ? `Anthropic · ${settings.anthropicModel}`
                  : ""}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

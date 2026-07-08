/**
 * FleetChatWidget.jsx — New-Ausprey
 *
 * Floating "Fleet Chat Assistant" widget — renders as a pulsing blue bubble
 * anchored to the bottom-right. Clicking opens a slide-up chat panel with:
 *
 *   • Live fleet data fetched from getAllDevices + getDbAlerts on first message
 *   • Groq llama-3.3-70b streaming responses (token-by-token)
 *   • Markdown-lite rendering (bold, bullet lists, code spans)
 *   • Quick-reply suggestions on empty history
 *   • Typing / streaming indicator
 *   • Fleet data status badge (device count, refresh button)
 *   • Clear chat / stop generation controls
 *   • Graceful "no API key" fallback with setup instructions
 */
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import {
  MessageSquare,
  X,
  Send,
  Square,
  RefreshCw,
  Trash2,
  ChevronDown,
  Bot,
  User,
  Sparkles,
  Database,
} from "lucide-react";
import { cn } from "@/utils";
import { useFleetChat, QUICK_REPLIES } from "./useFleetChat";

// ─── Markdown-lite renderer ───────────────────────────────────────────────────
// Handles: **bold**, `code`, bullet lines (•/-/*), numbered lines, line breaks
function renderMarkdown(text) {
  const lines = text.split("\n");
  const elements = [];
  let key = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Bullet
    if (/^[•\-*] /.test(trimmed)) {
      elements.push(
        <li key={key++} className="ml-3 list-none flex gap-1.5 mb-0.5">
          <span className="text-primary mt-0.5 shrink-0">•</span>
          <span>{inlineFormat(trimmed.slice(2))}</span>
        </li>,
      );
      continue;
    }
    // Numbered list
    if (/^\d+\. /.test(trimmed)) {
      const num = trimmed.match(/^(\d+)\. /)[1];
      elements.push(
        <li key={key++} className="ml-3 list-none flex gap-1.5 mb-0.5">
          <span className="text-primary font-bold shrink-0">{num}.</span>
          <span>{inlineFormat(trimmed.slice(num.length + 2))}</span>
        </li>,
      );
      continue;
    }
    // Blank line
    if (!trimmed) {
      elements.push(<div key={key++} className="h-1.5" />);
      continue;
    }
    // Normal paragraph
    elements.push(
      <p key={key++} className="mb-0.5">
        {inlineFormat(trimmed)}
      </p>,
    );
  }
  return elements;
}

function inlineFormat(text) {
  // Split on **bold** and `code` markers
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return (
        <strong key={i} className="font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    if (part.startsWith("`") && part.endsWith("`"))
      return (
        <code
          key={i}
          className="px-1 py-0.5 bg-slate-100 rounded text-[11px] font-mono text-primary"
        >
          {part.slice(1, -1)}
        </code>
      );
    return part;
  });
}

// ─── Single message bubble ────────────────────────────────────────────────────
const ACTION_LABELS = {
  NAVIGATE: (a) => `↗ Navigating to ${a.to}`,
  TRACK_VEHICLE: (a) => `📍 Opening tracking for ${a.imei}`,
  OPEN_VEHICLE_DRAWER: (a) => `🚛 Opening vehicle details`,
  OPEN_REPORT: (a) => `📊 Opening ${a.report} report`,
  FILTER_FLEET_TABLE: (a) =>
    `🔍 Filtering table: ${a.filter ?? "all"}${a.search ? ` · "${a.search}"` : ""}`,
  OPEN_ALERTS: () => `🔔 Opening alerts`,
  OPEN_TRACK_PLAY: (a) => `▶ Opening track play`,
};

function MessageBubble({ role, content, action, streaming }) {
  const isUser = role === "user";
  return (
    <div
      className={cn(
        "flex gap-2 mb-3",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
          isUser ? "bg-primary text-white" : "bg-slate-100 text-slate-600",
        )}
      >
        {isUser ? <User size={13} /> : <Bot size={13} />}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[82%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed",
          isUser
            ? "bg-primary text-white rounded-tr-sm"
            : "bg-white border border-slate-100 text-slate-800 rounded-tl-sm shadow-sm",
        )}
      >
        {isUser ? (
          <p>{content}</p>
        ) : content ? (
          <>
            <div className="space-y-0.5">{renderMarkdown(content)}</div>
            {action?.type && (
              <div
                className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg
                              bg-primary/8 text-primary text-[11px] font-semibold"
              >
                <Sparkles size={11} />
                {ACTION_LABELS[action.type]?.(action) ?? action.type}
              </div>
            )}
          </>
        ) : (
          // Streaming dots when content is empty
          <div className="flex items-center gap-1 py-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )}
        {streaming && content && (
          <span className="inline-block w-0.5 h-3.5 bg-primary ml-0.5 animate-pulse align-middle" />
        )}
      </div>
    </div>
  );
}

// ─── Quick reply chip ─────────────────────────────────────────────────────────
function QuickReply({ text, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(text)}
      className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200
                 rounded-full text-slate-600 hover:border-primary hover:text-primary
                 hover:bg-primary/5 transition whitespace-nowrap"
    >
      {text}
    </button>
  );
}

// ─── Main widget ──────────────────────────────────────────────────────────────
export function FleetChatWidget() {
  const [open, setOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const {
    history,
    input,
    setInput,
    loading,
    error,
    snapLoading,
    sendMessage,
    stopRequest,
    clearHistory,
    refreshFleet,
    lastAction,
    deviceCount,
  } = useFleetChat();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [history, open]);

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const hasApiKey = !!import.meta.env.VITE_GROQ_API_KEY;
  const unreadCount = history.filter((m) => m.role === "assistant").length;

  return createPortal(
    <div className="fixed bottom-6 right-6 z-[9980] flex flex-col items-end gap-3 pointer-events-none">
      {/* ── Chat panel ── */}
      <div
        className={cn(
          "w-[380px] bg-slate-50 rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right",
          open
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 translate-y-4 pointer-events-none",
        )}
        style={{ maxHeight: "72vh", minHeight: open ? 480 : 0 }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3
                        bg-gradient-to-r from-primary to-blue-700 text-white shrink-0"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-bold leading-tight">
                Fleet Assistant
              </div>
              <div className="text-[11px] text-blue-200 leading-tight">
                {snapLoading
                  ? "Fetching fleet data…"
                  : deviceCount > 0
                    ? `${deviceCount} devices loaded`
                    : "Powered by Groq"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {history.length > 0 && (
              <>
                <button
                  onClick={refreshFleet}
                  disabled={snapLoading}
                  title="Refresh fleet data"
                  className="p-1.5 rounded-lg hover:bg-white/15 transition text-white/70 hover:text-white"
                >
                  <RefreshCw
                    size={13}
                    className={cn(snapLoading && "animate-spin")}
                  />
                </button>
                <button
                  onClick={clearHistory}
                  title="Clear chat"
                  className="p-1.5 rounded-lg hover:bg-white/15 transition text-white/70 hover:text-white"
                >
                  <Trash2 size={13} />
                </button>
              </>
            )}
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/15 transition text-white/70 hover:text-white ml-1"
            >
              <ChevronDown size={16} />
            </button>
          </div>
        </div>

        {/* No API key banner */}
        {!hasApiKey && history.length === 0 && (
          <div className="mx-3 mt-3 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
            <strong>API key not set.</strong> Add{" "}
            <code className="bg-amber-100 px-1 rounded">
              VITE_GROQ_API_KEY=…
            </code>{" "}
            to your <code className="bg-amber-100 px-1 rounded">.env</code> file
            and restart the dev server.
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 pt-3 pb-1 space-y-0.5">
          {/* Welcome message */}
          {history.length === 0 && (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Bot size={22} className="text-primary" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                Fleet Assistant
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-[240px] mx-auto">
                Ask me anything about your fleet. I have live data on all
                vehicles and recent alerts.
              </p>
            </div>
          )}

          {history.map((msg, i) => (
            <MessageBubble
              key={i}
              role={msg.role}
              content={msg.content}
              action={msg.action}
              streaming={
                loading && i === history.length - 1 && msg.role === "assistant"
              }
            />
          ))}

          {/* Error */}
          {error && (
            <div className="mx-1 px-3 py-2 rounded-xl bg-rose-50 border border-rose-100 text-xs text-rose-600">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick replies */}
        {history.length === 0 && (
          <div className="px-3 pt-2 pb-1 flex gap-2 overflow-x-auto">
            {QUICK_REPLIES.map((q) => (
              <QuickReply key={q} text={q} onClick={sendMessage} />
            ))}
          </div>
        )}

        {/* Fleet data badge */}
        {deviceCount > 0 && (
          <div className="flex items-center gap-1.5 px-4 py-1 text-[11px] text-slate-400 border-t border-slate-100 bg-white">
            <Database size={10} className="text-primary" />
            <span>Fleet context: {deviceCount} vehicles</span>
          </div>
        )}

        {/* Input */}
        <div className="flex items-end gap-2 px-3 py-3 bg-white border-t border-slate-100 shrink-0">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your fleet…"
            rows={1}
            className="flex-1 resize-none px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50
                       outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                       placeholder:text-slate-400 max-h-24 overflow-y-auto"
            style={{ lineHeight: "1.4" }}
          />
          {loading ? (
            <button
              type="button"
              onClick={stopRequest}
              className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center
                         hover:bg-rose-600 transition shrink-0 self-end"
            >
              <Square size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 self-end transition",
                input.trim() && !loading
                  ? "bg-primary text-white hover:bg-primary-hover"
                  : "bg-slate-100 text-slate-300 cursor-not-allowed",
              )}
            >
              {loading ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Floating bubble ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-200",
          "bg-gradient-to-br from-primary to-blue-700 text-white",
          "hover:scale-110 active:scale-95 pointer-events-auto",
          open && "rotate-0",
        )}
        title="Fleet Chat Assistant"
      >
        {open ? <X size={22} /> : <MessageSquare size={22} />}

        {/* Unread badge */}
        {!open && unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500
                           text-white text-[10px] font-bold flex items-center justify-center border-2 border-white"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    </div>,
    document.body,
  );
}

export default FleetChatWidget;

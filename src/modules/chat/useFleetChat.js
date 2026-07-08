/**
 * useFleetChat.js
 *
 * Manages the Fleet Chat Assistant state.
 * Uses NON-streaming mode so the LLM response can be parsed as JSON,
 * which allows the assistant to return both a text reply AND an action.
 *
 * Response shape expected from Groq:
 *   { "text": "reply to user", "action": { "type": "...", ... } | null }
 *
 * The action (if any) is dispatched to useChatActionStore for the
 * ActionExecutor component to handle.
 */
import { useCallback, useRef, useState } from "react";
import { useAccountStore } from "@/store";
import { useChatActionStore } from "@/store/useChatActionStore";
import apiService from "@/services/apiService";
import { buildFleetContext, buildMessages } from "./fleetContext";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";
const MAX_TOKENS = 600;

export const QUICK_REPLIES = [
  "How many vehicles are running?",
  "Show me idle vehicles on the map",
  "Take me to the alerts page",
  "Open track play for the first vehicle",
  "Show me the fleet summary",
  "Filter the table to stopped vehicles",
  "Are there any SOS alerts?",
  "Open the distance report",
];

/** Safely parse the LLM JSON response — handles text wrapped in markdown fences */
function parseLLMResponse(raw) {
  if (!raw) return { text: "", action: null };
  try {
    // Strip ```json ... ``` or ``` ... ``` if present
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    return {
      text: typeof parsed.text === "string" ? parsed.text : raw,
      action: parsed.action ?? null,
    };
  } catch {
    // LLM didn't follow JSON format — treat the whole response as text
    return { text: raw, action: null };
  }
}

export function useFleetChat() {
  const account = useAccountStore((s) => s.selectedAccount);
  const accid = account?.id ?? 1;
  const dispatchAction = useChatActionStore((s) => s.dispatch);

  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fleetSnap, setFleetSnap] = useState(null);
  const [snapLoading, setSnapLoading] = useState(false);
  const [lastAction, setLastAction] = useState(null); // display in widget

  const abortRef = useRef(null);

  // ── Fetch live fleet snapshot ──────────────────────────────────────────────
  const fetchSnap = useCallback(async () => {
    setSnapLoading(true);
    try {
      const [devices, alertsRes] = await Promise.all([
        apiService.getAllDevices(accid),
        apiService.getDbAlerts(accid),
      ]);
      const body = alertsRes?.data;
      const alerts =
        body?.resultCode === 1
          ? { summary: body.data?.summary ?? [], data: body.data?.data ?? [] }
          : { summary: [], data: [] };
      const snap = { devices: devices ?? [], alerts };
      setFleetSnap(snap);
      return snap;
    } catch {
      const snap = { devices: [], alerts: { summary: [], data: [] } };
      setFleetSnap(snap);
      return snap;
    } finally {
      setSnapLoading(false);
    }
  }, [accid]);

  const refreshFleet = fetchSnap;

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text) => {
      const userMsg = (text ?? input).trim();
      if (!userMsg || loading) return;

      setError("");
      setInput("");
      setLastAction(null);

      const newHistory = [...history, { role: "user", content: userMsg }];
      setHistory(newHistory);

      const apiKey = import.meta.env.VITE_GROQ_API_KEY ?? "";
      if (!apiKey) {
        setHistory((h) => [
          ...h,
          {
            role: "assistant",
            content: `⚠️ No Groq API key configured. Add **VITE_GROQ_API_KEY** to your \`.env\` file.\n\nOnce configured, I can answer questions, navigate to pages, open reports, filter vehicles, and more.`,
            action: null,
          },
        ]);
        return;
      }

      // Fetch fleet snapshot lazily
      let snap = fleetSnap;
      if (!snap) snap = await fetchSnap();

      const fleetCtx = buildFleetContext({
        devices: snap.devices,
        alerts: snap.alerts,
        account,
      });
      // Strip the `action` field before sending history — Groq only accepts { role, content }
      const cleanHistory = newHistory
        .slice(0, -1)
        .map(({ role, content }) => ({ role, content }));
      const messages = buildMessages(fleetCtx, cleanHistory, userMsg);

      setLoading(true);
      abortRef.current = new AbortController();

      try {
        const res = await fetch(GROQ_URL, {
          method: "POST",
          signal: abortRef.current.signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: MODEL,
            max_tokens: MAX_TOKENS,
            temperature: 0.3,
            stream: false, // JSON mode — no streaming so we can parse actions
            messages,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error?.message ?? `Groq error ${res.status}`);
        }

        const data = await res.json();
        const rawText = data?.choices?.[0]?.message?.content ?? "";
        const { text, action } = parseLLMResponse(rawText);

        // Append assistant message — store action separately (not sent to Groq)
        setHistory((h) => [...h, { role: "assistant", content: text, action }]);

        // Dispatch action if present
        if (action?.type) {
          setLastAction(action);
          dispatchAction(action);
        }
      } catch (e) {
        if (e.name === "AbortError") return;
        const errMsg = e?.message ?? "Failed to reach Groq API.";
        setError(errMsg);
        setHistory((h) => [
          ...h,
          {
            role: "assistant",
            content: `Sorry, I hit an error: ${errMsg}`,
            action: null,
          },
        ]);
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    },
    [
      input,
      history,
      loading,
      fleetSnap,
      account,
      accid,
      fetchSnap,
      dispatchAction,
    ],
  );

  const stopRequest = () => {
    abortRef.current?.abort();
  };
  const clearHistory = () => {
    setHistory([]);
    setError("");
    setFleetSnap(null);
    setLastAction(null);
  };

  return {
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
    deviceCount: fleetSnap?.devices?.length ?? 0,
  };
}

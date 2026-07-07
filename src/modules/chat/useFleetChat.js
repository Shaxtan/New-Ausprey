/**
 * useFleetChat.js
 *
 * Manages the Fleet Chat Assistant state:
 *  - Fetches live fleet snapshot (devices + alerts) on first use
 *  - Sends messages to Groq with the fleet context injected
 *  - Streams the response token-by-token
 *  - Maintains conversation history (last 20 turns)
 *  - Falls back gracefully if no API key is configured
 */
import { useCallback, useRef, useState } from "react";
import { useAccountStore } from "@/store";
import apiService from "@/services/apiService";
import { buildFleetContext, buildMessages } from "./fleetContext";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";
const MAX_TOKENS = 512;

// Quick-reply suggestions shown before the first user message
export const QUICK_REPLIES = [
  "How many vehicles are running right now?",
  "Show me idle vehicles",
  "Which vehicles have alerts?",
  "What is the fleet summary?",
  "Show me stopped vehicles",
  "Are there any SOS alerts?",
];

export function useFleetChat() {
  const account = useAccountStore((s) => s.selectedAccount);
  const accid = account?.id ?? 1;

  const [history, setHistory] = useState([]); // [{ role, content }]
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const [fleetSnap, setFleetSnap] = useState(null); // { devices, alerts }
  const [snapLoading, setSnapLoading] = useState(false);

  const abortRef = useRef(null);

  // ── Fetch live fleet snapshot ──────────────────────────────────────────────
  const refreshFleet = useCallback(async () => {
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
      setFleetSnap({ devices: devices ?? [], alerts });
    } catch {
      setFleetSnap({ devices: [], alerts: { summary: [], data: [] } });
    } finally {
      setSnapLoading(false);
    }
  }, [accid]);

  // ── Send a message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text) => {
      const userMsg = (text ?? input).trim();
      if (!userMsg || streaming) return;

      setError("");
      setInput("");

      // Append user message to history immediately
      const newHistory = [...history, { role: "user", content: userMsg }];
      setHistory(newHistory);

      const apiKey = import.meta.env.VITE_GROQ_API_KEY ?? "";
      if (!apiKey) {
        // Graceful fallback — no API key
        setHistory((h) => [
          ...h,
          {
            role: "assistant",
            content: `⚠️ No Groq API key configured. Add **VITE_GROQ_API_KEY** to your \`.env\` file to enable the Fleet Chat Assistant.\n\nOnce configured, I can answer questions about your fleet using live data from ${account?.label ?? "your account"}.`,
          },
        ]);
        return;
      }

      // Fetch fleet snapshot on first message or if stale
      let snap = fleetSnap;
      if (!snap) {
        setSnapLoading(true);
        try {
          const [devices, alertsRes] = await Promise.all([
            apiService.getAllDevices(accid),
            apiService.getDbAlerts(accid),
          ]);
          const body = alertsRes?.data;
          snap = {
            devices: devices ?? [],
            alerts:
              body?.resultCode === 1
                ? {
                    summary: body.data?.summary ?? [],
                    data: body.data?.data ?? [],
                  }
                : { summary: [], data: [] },
          };
          setFleetSnap(snap);
        } catch {
          snap = { devices: [], alerts: { summary: [], data: [] } };
        } finally {
          setSnapLoading(false);
        }
      }

      const fleetCtx = buildFleetContext({
        devices: snap.devices,
        alerts: snap.alerts,
        account,
      });

      const messages = buildMessages(
        fleetCtx,
        newHistory.slice(0, -1),
        userMsg,
      );

      // Stream from Groq
      setStreaming(true);
      // Add a placeholder assistant message we'll fill in token by token
      setHistory((h) => [...h, { role: "assistant", content: "" }]);

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
            temperature: 0.4,
            stream: true,
            messages,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error?.message ?? `Groq error ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let assistantText = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

          for (const line of lines) {
            const json = line.slice(6).trim();
            if (json === "[DONE]") break;
            try {
              const parsed = JSON.parse(json);
              const delta = parsed.choices?.[0]?.delta?.content ?? "";
              assistantText += delta;
              // Update the last history item in place
              setHistory((h) => {
                const next = [...h];
                next[next.length - 1] = {
                  role: "assistant",
                  content: assistantText,
                };
                return next;
              });
            } catch {
              /* skip malformed chunk */
            }
          }
        }
      } catch (e) {
        if (e.name === "AbortError") return;
        const errMsg = e?.message ?? "Failed to reach Groq API.";
        setError(errMsg);
        setHistory((h) => {
          const next = [...h];
          next[next.length - 1] = {
            role: "assistant",
            content: `Sorry, I hit an error: ${errMsg}`,
          };
          return next;
        });
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [input, history, streaming, fleetSnap, account, accid],
  );

  const stopStreaming = () => {
    abortRef.current?.abort();
  };

  const clearHistory = () => {
    setHistory([]);
    setError("");
    setFleetSnap(null); // force fresh fleet data on next message
  };

  return {
    history,
    input,
    setInput,
    streaming,
    error,
    snapLoading,
    sendMessage,
    stopStreaming,
    clearHistory,
    refreshFleet,
    hasFleetData: !!fleetSnap,
    deviceCount: fleetSnap?.devices?.length ?? 0,
  };
}

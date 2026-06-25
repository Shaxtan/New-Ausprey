/**
 * tripSummary.agent.js — Agent #11
 *
 * Turns a Working Hour Report record (sessions for one vehicle/day) into a
 * plain-English summary. Uses Groq (llama-3.3-70b) when a key is configured,
 * and falls back to a deterministic template summary otherwise — so the agent
 * always returns something useful even with no LLM access.
 *
 * Input:  a working-hour record { imei, vehNum, repDate, totalDistance,
 *           totalDuration, sessions: [{ startTime, endTime, distance,
 *           avgSpeed, status, startLocation, endLocation }] }
 * Output: { summary: string, source: 'llm' | 'fallback', stats }
 *
 * NOTE: calling Groq from the browser exposes the key. For production, proxy
 * this through your backend. This client-side version is fine for a demo /
 * portfolio build; the function shape stays identical when moved server-side.
 */

import { num, parseTs } from "./helpers";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

const fmtDur = (mins) => {
  const m = num(mins);
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
};

// ─── Deterministic fallback summary ───────────────────────────────────────────
function fallbackSummary(rec) {
  const sessions = rec.sessions ?? [];
  const nSessions = sessions.length;
  const dist = num(rec.totalDistance);
  const moving = sessions.filter((s) => num(s.distance) > 0);
  const longest = [...sessions].sort(
    (a, b) => num(b.distance) - num(a.distance),
  )[0];
  const avgSpeed = moving.length
    ? Math.round(
        moving.reduce((s, x) => s + num(x.avgSpeed), 0) / moving.length,
      )
    : 0;

  const parts = [
    `${rec.vehNum ?? rec.imei} covered ${dist} km across ${nSessions} session${nSessions === 1 ? "" : "s"} on ${(rec.repDate ?? "").split("T")[0] || "the selected day"}.`,
  ];
  if (longest && num(longest.distance) > 0) {
    parts.push(
      `The longest leg ran ${num(longest.distance)} km${longest.startLocation ? ` from ${longest.startLocation}` : ""}${longest.endLocation ? ` to ${longest.endLocation}` : ""}.`,
    );
  }
  if (avgSpeed) parts.push(`Average moving speed was about ${avgSpeed} km/h.`);
  const idle = sessions.filter((s) => num(s.distance) === 0).length;
  if (idle)
    parts.push(
      `${idle} session${idle === 1 ? " was" : "s were"} stationary (idling or parked).`,
    );

  return parts.join(" ");
}

// ─── Compact, token-cheap payload for the LLM ─────────────────────────────────
function toPrompt(rec) {
  const sessions = (rec.sessions ?? []).map((s, i) => ({
    n: i + 1,
    start: s.startTime,
    end: s.endTime,
    dist_km: num(s.distance),
    avg_kmh: num(s.avgSpeed),
    status: s.status,
    from: s.startLocation,
    to: s.endLocation,
  }));
  return {
    vehicle: rec.vehNum ?? rec.imei,
    date: (rec.repDate ?? "").split("T")[0],
    total_km: num(rec.totalDistance),
    total_duration: rec.totalDuration,
    sessions,
  };
}

export async function runTripSummaryAgent(record, opts = {}) {
  const stats = { sessions: record?.sessions?.length ?? 0 };
  if (!record)
    return { summary: "No trip data provided.", source: "fallback", stats };

  const apiKey = opts.apiKey ?? import.meta.env?.VITE_GROQ_API_KEY ?? "";

  // No key → deterministic summary
  if (!apiKey) {
    return { summary: fallbackSummary(record), source: "fallback", stats };
  }

  try {
    const payload = toPrompt(record);
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.3,
        max_tokens: 220,
        messages: [
          {
            role: "system",
            content:
              "You are a fleet operations assistant. Given one vehicle's trip sessions " +
              "for a day, write a concise 2-3 sentence plain-English summary for a fleet " +
              "manager. Mention total distance, notable trips, idle time, and anything " +
              "unusual. No bullet points, no preamble, just the summary.",
          },
          { role: "user", content: JSON.stringify(payload) },
        ],
      }),
    });

    if (!res.ok) throw new Error(`Groq ${res.status}`);
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("empty completion");

    return { summary: text, source: "llm", stats };
  } catch (e) {
    // Any failure → graceful fallback
    return {
      summary: fallbackSummary(record),
      source: "fallback",
      stats,
      error: String(e?.message ?? e),
    };
  }
}

export default runTripSummaryAgent;

/**
 * helpers.js — shared utilities for the Fleet Intelligence agents
 *
 * Framework-agnostic pure functions. These could be lifted into a Node
 * service consuming the Kafka stream without changes.
 */

// ─── Severity levels (shared vocabulary across all agents) ────────────────────
export const SEVERITY = {
  CRITICAL: "critical",
  WARNING: "warning",
  INFO: "info",
};

export const SEVERITY_RANK = { critical: 3, warning: 2, info: 1 };

/** A single finding emitted by an agent. */
export const makeFinding = ({
  agent,
  severity,
  code,
  title,
  detail,
  imei,
  vehnum,
  accId,
  value,
  expected,
  raw,
}) => ({
  id: `${agent}:${code}:${imei ?? "fleet"}:${value ?? ""}:${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  agent,
  severity,
  code,
  title,
  detail,
  imei: imei ?? null,
  vehnum: vehnum ?? null,
  accId: accId ?? null,
  value: value ?? null,
  expected: expected ?? null,
  raw: raw ?? null,
  ts: Date.now(),
});

// ─── Geo ──────────────────────────────────────────────────────────────────────
const R = 6371; // km
const toRad = (d) => (d * Math.PI) / 180;

/** Haversine distance in km between two [lat,lng] points. */
export function haversineKm(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export const isValidLat = (v) =>
  Number.isFinite(v) && v >= -90 && v <= 90 && v !== 0;
export const isValidLng = (v) =>
  Number.isFinite(v) && v >= -180 && v <= 180 && v !== 0;

// ─── Time ─────────────────────────────────────────────────────────────────────
/** Parse a backend timestamp leniently → epoch ms, or null if unparseable. */
export function parseTs(v) {
  if (v == null) return null;
  if (typeof v === "number") return v > 1e12 ? v : v * 1000; // sec vs ms
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? null : t;
}

const MS_DAY = 86_400_000;

/** Is this timestamp implausible (far future / far past)? Returns reason or null. */
export function timestampSanity(epochMs, nowMs = Date.now()) {
  if (epochMs == null) return "unparseable";
  // More than 1 day in the future = corrupt (covers the 2041 bug)
  if (epochMs > nowMs + MS_DAY) return "future";
  // Before 2000-01-01 = corrupt
  if (epochMs < 946_684_800_000) return "ancient";
  return null;
}

// ─── Number coercion ──────────────────────────────────────────────────────────
export const num = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/** Sort findings by severity (critical first), then most-recent. */
export function sortFindings(findings) {
  return [...findings].sort((a, b) => {
    const s =
      (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0);
    return s !== 0 ? s : b.ts - a.ts;
  });
}

/**
 * alertSeverity.js — Alert Dashboard
 *
 * Your backend's db-alerts / by-account APIs don't return a severity field
 * directly — only a `type` code (BAT, HAR, OVS, SOS, ...). This derives a
 * 4-tier severity from type, using the same relative-urgency ordering as
 * the Fleet Intelligence "Alert Priority" agent's TYPE_WEIGHT table, so the
 * two features stay conceptually consistent across the app.
 */

export const SEVERITY = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

const TYPE_SEVERITY = {
  SOS: SEVERITY.CRITICAL,
  OVS: SEVERITY.CRITICAL,
  HAR: SEVERITY.HIGH,
  HBR: SEVERITY.HIGH,
  TOW: SEVERITY.HIGH,
  BAT: SEVERITY.MEDIUM,
  GEO: SEVERITY.MEDIUM,
  IGN: SEVERITY.LOW,
  IDL: SEVERITY.LOW,
};

export function getSeverity(type) {
  return TYPE_SEVERITY[type] ?? SEVERITY.LOW;
}

export const SEVERITY_META = {
  critical: {
    label: "Critical",
    color: "#dc2626",
    bg: "#fee2e2",
    text: "#b91c1c",
  },
  high: { label: "High", color: "#f97316", bg: "#ffedd5", text: "#c2410c" },
  medium: { label: "Medium", color: "#f59e0b", bg: "#fef3c7", text: "#b45309" },
  low: { label: "Low", color: "#2563eb", bg: "#dbeafe", text: "#1d4ed8" },
};

export const SEVERITY_ORDER = [
  SEVERITY.CRITICAL,
  SEVERITY.HIGH,
  SEVERITY.MEDIUM,
  SEVERITY.LOW,
];

/**
 * classifyAlert(alert) — the single source of truth for severity + label.
 *
 * Why this exists: your backend uses the SAME type code "HAR" for both
 * Harsh Braking and Harsh Acceleration events — the only place they're
 * actually distinguished is the free-text `message` field, e.g.:
 *   "Driver used Harsh Braking on VEHICLE GJ01DT5351 near ..."
 *   "Driver used Harsh Acceleration on VEHICLE GJ01DT5351 near ..."
 * Relying on `type` alone (as ALERT_META does) mislabels every Harsh
 * Braking event as "Harsh Accel." — this reads the message text first.
 *
 * Harsh Braking is treated as CRITICAL (real collision risk from a sudden
 * stop); Harsh Acceleration as HIGH (wear/fuel concern, less immediate
 * danger). Every other type falls back to the type-based mapping above.
 *
 * ALWAYS use this (not getSeverity + typeLabel separately) anywhere you
 * show or count severity, so the KPI cards, charts, and table can never
 * disagree with each other.
 */
export function classifyAlert(alert, fallbackLabel) {
  const msg = (alert?.message || "").toLowerCase();
  const type = alert?.type;

  if (type === "HAR" || type === "HBR") {
    if (msg.includes("harsh braking") || msg.includes("hard braking")) {
      return { severity: SEVERITY.CRITICAL, label: "Harsh Braking" };
    }
    if (
      msg.includes("harsh acceleration") ||
      msg.includes("rapid acceleration") ||
      msg.includes("sudden acceleration")
    ) {
      return { severity: SEVERITY.HIGH, label: "Harsh Acceleration" };
    }
  }

  return { severity: getSeverity(type), label: fallbackLabel ?? type };
}

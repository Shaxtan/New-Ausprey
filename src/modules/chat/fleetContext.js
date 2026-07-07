/**
 * fleetContext.js — Fleet Chat Assistant
 *
 * Builds a compact, token-efficient system-prompt context block from live
 * fleet data. Designed to fit in ~800 tokens so the LLM has headroom for
 * a proper conversation history and response.
 *
 * Structure injected into every Groq request:
 *   FLEET SNAPSHOT (account, timestamp)
 *   SUMMARY: total / running / idle / stopped / inactive counts
 *   ALERTS:  top 8 most recent alerts (type, vehicle, time)
 *   VEHICLES: up to 30 vehicles with key fields
 */

const pad = (n) => String(n).padStart(2, "0");
const fmtTs = (s) => {
  if (!s) return "—";
  const d = new Date((s ?? "").replace?.(" ", "T") ?? s);
  if (isNaN(d)) return String(s).slice(0, 16);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * @param {object} params
 * @param {Array}  params.devices    — normalised device list from getAllDevices
 * @param {object} params.alerts     — { summary, data } from getDbAlerts
 * @param {object} params.account    — { id, label } from useAccountStore
 * @returns {string} system-prompt context block
 */
export function buildFleetContext({ devices = [], alerts = {}, account = {} }) {
  const now = new Date().toLocaleString();
  const accountName = account?.label ?? "Unknown";

  // Status counts
  const counts = devices.reduce((acc, d) => {
    const s = (d.status ?? "Inactive").toLowerCase();
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  const summary = [
    `Total: ${devices.length}`,
    `Running: ${counts.running ?? 0}`,
    `Idle: ${counts.idle ?? 0}`,
    `Stopped: ${counts.stopped ?? 0}`,
    `Inactive: ${counts.inactive ?? 0}`,
  ].join(" | ");

  // Recent alerts (top 8, sorted newest first)
  const alertList = (alerts.data ?? [])
    .slice()
    .sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn))
    .slice(0, 8)
    .map(
      (a) =>
        `  • ${a.type} | ${a.vehicleNumber ?? a.imei} | ${fmtTs(a.createdOn)}`,
    )
    .join("\n");

  // Vehicle table (up to 30, prioritise running/idle first)
  const sorted = [...devices].sort((a, b) => {
    const rank = { running: 0, idle: 1, stopped: 2, inactive: 3 };
    return (
      (rank[a.status?.toLowerCase()] ?? 4) -
      (rank[b.status?.toLowerCase()] ?? 4)
    );
  });

  const vehicleLines = sorted
    .slice(0, 30)
    .map((d) => {
      const fields = [
        d.name || d.id,
        d.status,
        `${d.speed ?? 0}km/h`,
        d.lastUpdate ? fmtTs(d.lastUpdate) : "—",
      ];
      if (d.accountName) fields.push(`[${d.accountName}]`);
      return "  • " + fields.join(" | ");
    })
    .join("\n");

  const more =
    devices.length > 30
      ? `\n  ... and ${devices.length - 30} more vehicles`
      : "";

  // Alert summary by type
  const alertSummary = (alerts.summary ?? [])
    .map((s) => `${s.type}:${s.count}`)
    .join(" ");

  return `=== FLEET CONTEXT (${accountName}) — ${now} ===
SUMMARY: ${summary}
ALERT TYPES: ${alertSummary || "none"}

RECENT ALERTS:
${alertList || "  (none)"}

VEHICLES:
${vehicleLines}${more}
=== END FLEET CONTEXT ===`;
}

/**
 * Builds the Groq messages array — system prompt + conversation history.
 * Keeps the last 10 turns (5 user + 5 assistant) to stay within token limits.
 *
 * @param {string}   fleetCtx  — output of buildFleetContext()
 * @param {Array}    history   — [{ role, content }, ...]
 * @param {string}   userMsg   — the new user message
 */
export function buildMessages(fleetCtx, history, userMsg) {
  const system = `You are Ausprey Fleet Assistant, an expert AI for a vehicle tracking and IoT fleet management platform.

You have access to live fleet data below. Use it to answer questions accurately.
Be concise, helpful, and professional. Use bullet points for lists.
When mentioning vehicles, use the vehicle number or name.
If you are unsure, say so — do not invent fleet data.

${fleetCtx}`;

  // Keep last 10 messages (5 pairs) to manage token usage
  const trimmed = history.slice(-10);

  return [
    { role: "system", content: system },
    ...trimmed,
    { role: "user", content: userMsg },
  ];
}

/**
 * fleetContext.js — Fleet Chat Assistant
 *
 * Builds a compact, token-efficient system-prompt context block from live
 * fleet data, plus the action schema that tells the LLM what it can do.
 */

const pad = (n) => String(n).padStart(2, "0");
const fmtTs = (s) => {
  if (!s) return "—";
  const d = new Date((s ?? "").replace?.(" ", "T") ?? s);
  if (isNaN(d)) return String(s).slice(0, 16);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function buildFleetContext({ devices = [], alerts = {}, account = {} }) {
  const now = new Date().toLocaleString();
  const accountName = account?.label ?? "Unknown";

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

  const alertList = (alerts.data ?? [])
    .slice()
    .sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn))
    .slice(0, 8)
    .map(
      (a) =>
        `  • ${a.type} | ${a.vehicleNumber ?? a.imei} | ${fmtTs(a.createdOn)}`,
    )
    .join("\n");

  const sorted = [...devices].sort((a, b) => {
    const rank = { running: 0, idle: 1, stopped: 2, inactive: 3 };
    return (
      (rank[a.status?.toLowerCase()] ?? 4) -
      (rank[b.status?.toLowerCase()] ?? 4)
    );
  });

  // Include IMEI in vehicle list so LLM can reference it in actions
  const vehicleLines = sorted
    .slice(0, 30)
    .map((d) => {
      const fields = [
        d.name || d.id,
        d.id, // IMEI
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

  const alertSummary = (alerts.summary ?? [])
    .map((s) => `${s.type}:${s.count}`)
    .join(" ");

  return `=== FLEET CONTEXT (${accountName}) — ${now} ===
SUMMARY: ${summary}
ALERT TYPES: ${alertSummary || "none"}

RECENT ALERTS:
${alertList || "  (none)"}

VEHICLES (name | imei | status | speed | last_update):
${vehicleLines}${more}
=== END FLEET CONTEXT ===`;
}

/**
 * System prompt that includes the action schema.
 * The LLM MUST return JSON: { "text": "...", "action": {...} | null }
 */
export function buildMessages(fleetCtx, history, userMsg) {
  const system = `You are Ausprey Fleet Assistant — an AI embedded in a vehicle tracking dashboard.
You have live fleet data and can BOTH answer questions AND trigger UI actions.

${fleetCtx}

## AVAILABLE ACTIONS
You can trigger exactly ONE action per reply (or null if no action is needed).

1. NAVIGATE — go to a page
   { "type": "NAVIGATE", "to": "/dashboard" | "/tracking" | "/map" | "/alerts" | "/reports" | "/fleet-intelligence" | "/analytics" | "/geofence" | "/vehicles" | "/settings" }

2. TRACK_VEHICLE — open live tracking for a specific vehicle
   { "type": "TRACK_VEHICLE", "imei": "<imei>", "accountId": <number> }

3. OPEN_VEHICLE_DRAWER — open the vehicle detail drawer on the dashboard
   { "type": "OPEN_VEHICLE_DRAWER", "imei": "<imei>" }

4. OPEN_REPORT — navigate to a specific report tab
   { "type": "OPEN_REPORT", "report": "distance" | "stoppage" | "overspeed" | "trackplay" | "hourly", "imei": "<imei_or_null>" }

5. FILTER_FLEET_TABLE — filter the live vehicle table on the dashboard
   { "type": "FILTER_FLEET_TABLE", "tab": "vts" | "unreachable", "filter": "all" | "running" | "idle" | "stopped" | "inactive", "search": "<text_or_null>" }

6. OPEN_ALERTS — go to the Alerts page
   { "type": "OPEN_ALERTS" }

7. OPEN_TRACK_PLAY — open Track Play report for a vehicle
   { "type": "OPEN_TRACK_PLAY", "imei": "<imei>" }

## RESPONSE FORMAT
You MUST respond with ONLY valid JSON. No markdown, no extra text outside the JSON.
{ "text": "your reply to the user", "action": { ... } | null }

## RULES
- Use vehicle names (not IMEIs) when talking to the user in "text"
- Use the IMEI from the fleet data in action fields
- If the user asks to "show", "open", "navigate", "take me to", "filter" — use an action
- If the user asks a question that can be answered from the fleet data — answer in "text" and set action to null
- Never invent vehicle data. Use only what is in the fleet context above.`;

  const trimmed = history.slice(-10);

  return [
    { role: "system", content: system },
    ...trimmed,
    { role: "user", content: userMsg },
  ];
}

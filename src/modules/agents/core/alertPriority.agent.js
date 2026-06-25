/**
 * alertPriority.agent.js — Agent #18
 *
 * Takes the raw alert list from /usage/alerts/db-alerts and turns the flat
 * stream into a *prioritised* list: each alert gets an urgency score, and
 * repeated alerts from the same vehicle within a short window are collapsed
 * into one "burst" so the operator isn't drowned in noise.
 *
 * Input:  { summary: [{type,count}], data: [alert...] }  (db-alerts shape)
 * Output: { ranked: [...], findings, stats }
 *
 * Pure function.
 */

import { SEVERITY, makeFinding, parseTs, num } from "./helpers";

const AGENT = "alert-priority";

// Base urgency weight per alert type (higher = more urgent)
const TYPE_WEIGHT = {
  SOS: 100,
  PANIC: 100, // emergency
  ACC: 90,
  CRASH: 90, // accident
  HBR: 60,
  HAR: 55, // harsh brake / accel
  OVS: 50, // overspeed
  TOW: 45,
  TAMPER: 70, // tamper / tow
  GEO: 40, // geofence
  BAT: 30, // battery
  IGN: 20,
  IDL: 15, // ignition / idle
};
const DEFAULT_WEIGHT = 25;

// Alerts of the same type from the same vehicle within this window = one burst
const BURST_WINDOW_MIN = 10;

export function runAlertPriorityAgent(input = {}, opts = {}) {
  const now = opts.now ?? Date.now();
  const alerts = input.data ?? [];
  const findings = [];

  // Group into bursts: key = imei|type, within BURST_WINDOW_MIN
  const groups = new Map();

  for (const a of alerts) {
    const imei = a.imei ?? null;
    const type = String(a.type ?? "UNK").toUpperCase();
    const epoch = parseTs(a.createdOn ?? a.dateTime ?? a.deviceTime);
    const key = `${imei}|${type}`;

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ ...a, _epoch: epoch });
  }

  const ranked = [];

  for (const [key, items] of groups) {
    // Sort burst members by time
    items.sort((x, y) => (x._epoch ?? 0) - (y._epoch ?? 0));

    // Split into sub-bursts separated by > BURST_WINDOW_MIN
    let burst = [items[0]];
    const flush = () => {
      const first = burst[0];
      const last = burst[burst.length - 1];
      const type = String(first.type ?? "UNK").toUpperCase();
      const base = TYPE_WEIGHT[type] ?? DEFAULT_WEIGHT;

      // Recency boost: newer alerts score higher (decays over 24h)
      const ageMin = last._epoch
        ? Math.max(0, (now - last._epoch) / 60000)
        : 9999;
      const recency = Math.max(0, 1 - ageMin / (24 * 60)); // 1 → fresh, 0 → 24h old
      // Frequency boost: a burst of many repeats is more urgent
      const freq = Math.min(1, (burst.length - 1) / 10);

      const score = Math.round(base * (1 + 0.4 * recency + 0.3 * freq));

      ranked.push({
        id: `${key}|${first._epoch}`,
        type,
        imei: first.imei,
        vehnum: first.vehicleNumber ?? first.vehnum ?? null,
        accId: first.accId ?? null,
        count: burst.length,
        score,
        firstAt: first._epoch,
        lastAt: last._epoch,
        address: last.address ?? first.address ?? null,
        speed: num(last.speed, null),
        sample: last,
      });
    };

    for (let i = 1; i < items.length; i++) {
      const gapMin = (items[i]._epoch - burst[burst.length - 1]._epoch) / 60000;
      if (Number.isFinite(gapMin) && gapMin <= BURST_WINDOW_MIN) {
        burst.push(items[i]);
      } else {
        flush();
        burst = [items[i]];
      }
    }
    flush();
  }

  // Rank by score desc
  ranked.sort((a, b) => b.score - a.score);

  // Emit findings for the top critical alerts
  for (const r of ranked) {
    if (r.score < 60) continue; // only surface high-urgency ones as findings
    findings.push(
      makeFinding({
        agent: AGENT,
        severity: r.score >= 90 ? SEVERITY.CRITICAL : SEVERITY.WARNING,
        code: `ALERT_${r.type}`,
        title: `High-priority ${r.type} alert`,
        detail:
          r.count > 1
            ? `${r.count} ${r.type} alerts from ${r.vehnum ?? r.imei} in a short burst.`
            : `${r.type} alert from ${r.vehnum ?? r.imei}.`,
        imei: r.imei,
        vehnum: r.vehnum,
        accId: r.accId,
        value: `score ${r.score}`,
        raw: { address: r.address, lastAt: r.lastAt },
      }),
    );
  }

  const stats = {
    rawAlerts: alerts.length,
    bursts: ranked.length,
    critical: ranked.filter((r) => r.score >= 90).length,
    high: ranked.filter((r) => r.score >= 60 && r.score < 90).length,
    collapsed: alerts.length - ranked.length, // how much noise we removed
  };

  return { ranked, findings, stats };
}

export default runAlertPriorityAgent;

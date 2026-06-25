/**
 * deviceHealth.agent.js — Agent #8
 *
 * Scores each device's hardware/connectivity health from the telemetry fields
 * you already receive: battery / batAmp, gps, satellite, deviceTime freshness.
 *
 * Emits a per-device health record + findings for unhealthy devices.
 *
 * Input:  array of device records (VTS/ELK dashboard shape)
 * Output: { findings, devices: [{ imei, vehnum, score, status, issues[] }], stats }
 *
 * Pure function.
 */

import { SEVERITY, makeFinding, parseTs, num } from "./helpers";

const AGENT = "device-health";

// Thresholds
const LOW_BATTERY_V = 3.6; // volts — below this is concerning
const CRIT_BATTERY_V = 3.4;
const MIN_SATELLITES = 4; // fewer = weak fix
const STALE_MINUTES = 30; // no fresh packet beyond this = stale
const OFFLINE_MINUTES = 120; // beyond this = treat as offline-risk

export function runDeviceHealthAgent(records = [], opts = {}) {
  const now = opts.now ?? Date.now();
  const findings = [];
  const devices = [];
  const stats = { total: records.length, healthy: 0, degraded: 0, critical: 0 };

  for (const r of records) {
    const imei = r.imei ?? null;
    const vehnum = r.vehicleNumber ?? r.vehnum ?? r.name ?? null;
    const accId = r.accId ?? r.accid ?? null;

    const issues = [];
    let score = 100;

    // ── Battery ──
    const battery = num(r.battery ?? r.batAmp, null);
    if (battery != null && battery > 0) {
      if (battery < CRIT_BATTERY_V) {
        issues.push({
          k: "battery",
          sev: SEVERITY.CRITICAL,
          msg: `Battery critically low (${battery} V)`,
        });
        score -= 40;
      } else if (battery < LOW_BATTERY_V) {
        issues.push({
          k: "battery",
          sev: SEVERITY.WARNING,
          msg: `Battery low (${battery} V)`,
        });
        score -= 20;
      }
    }

    // ── GPS fix quality ──
    const gps = String(r.gps ?? "").toUpperCase();
    if (gps && gps !== "A") {
      issues.push({
        k: "gps",
        sev: SEVERITY.WARNING,
        msg: `No GPS fix (gps="${gps || "—"}")`,
      });
      score -= 25;
    }

    // ── Satellite count ──
    const sats = num(r.satellite, null);
    if (sats != null && sats < MIN_SATELLITES) {
      issues.push({
        k: "satellite",
        sev: SEVERITY.WARNING,
        msg: `Weak satellite lock (${sats} sats)`,
      });
      score -= 15;
    }

    // ── Freshness / staleness ──
    const epoch = parseTs(r.deviceTime ?? r.devTs ?? r.createdOn);
    if (epoch != null) {
      if (epoch > now + 86_400_000) {
        // Future-dated (the 2041 bug) — can't trust freshness at all
        issues.push({
          k: "stale",
          sev: SEVERITY.CRITICAL,
          msg: "Device clock is corrupt (future-dated)",
        });
        score -= 35;
      } else {
        const ageMin = (now - epoch) / 60000;
        if (ageMin > OFFLINE_MINUTES) {
          issues.push({
            k: "stale",
            sev: SEVERITY.CRITICAL,
            msg: `No data for ${Math.round(ageMin)} min (possible offline)`,
          });
          score -= 35;
        } else if (ageMin > STALE_MINUTES) {
          issues.push({
            k: "stale",
            sev: SEVERITY.WARNING,
            msg: `Stale data (${Math.round(ageMin)} min old)`,
          });
          score -= 15;
        }
      }
    }

    score = Math.max(0, score);
    const status =
      score >= 80 ? "healthy" : score >= 50 ? "degraded" : "critical";
    stats[status]++;

    devices.push({
      imei,
      vehnum,
      accId,
      score,
      status,
      battery,
      gps,
      satellites: sats,
      issues,
    });

    // Emit findings for the worst issue(s)
    for (const iss of issues) {
      findings.push(
        makeFinding({
          agent: AGENT,
          severity: iss.sev,
          code: `HEALTH_${iss.k.toUpperCase()}`,
          title: "Device health issue",
          detail: iss.msg,
          imei,
          vehnum,
          accId,
          value: String(score),
          expected: "≥ 80 health score",
        }),
      );
    }
  }

  return { findings, devices, stats };
}

export default runDeviceHealthAgent;

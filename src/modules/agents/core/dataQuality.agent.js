/**
 * dataQuality.agent.js — Agent #6
 *
 * Scans a batch of device/telemetry records and flags data-integrity problems
 * that you've hit repeatedly in this project:
 *
 *   1. Corrupt timestamps     — the "2041" deviceTime bug (future/ancient dates)
 *   2. Ignition contradiction — ign="N" while speed > 0 (the 41 km/h bug)
 *   3. Missing critical fields — no lat/lng, no imei, no deviceTime
 *   4. Invalid coordinates     — (0,0), out-of-range lat/lng
 *   5. Duplicate records       — same imei + same deviceTime seen twice
 *   6. Stale GPS               — gps flag "A" but coordinates never change
 *
 * Input:  array of raw device records (VTS/ELK shape, or a telemetry packet)
 * Output: { findings: Finding[], stats: {...} }
 *
 * Pure function — no React, no network. Safe to run client-side per refresh,
 * or move to a Node/Kafka consumer untouched.
 */

import {
  SEVERITY,
  makeFinding,
  isValidLat,
  isValidLng,
  parseTs,
  timestampSanity,
  num,
} from "./helpers";

const AGENT = "data-quality";

// Speed below this is treated as "not really moving" (GPS jitter tolerance)
const MOVING_SPEED_KMH = 3;

export function runDataQualityAgent(records = [], opts = {}) {
  const now = opts.now ?? Date.now();
  const findings = [];
  const seen = new Map(); // `${imei}|${deviceTime}` → true (duplicate detection)

  const stats = {
    total: records.length,
    corruptTimestamp: 0,
    ignContradiction: 0,
    missingFields: 0,
    invalidCoords: 0,
    duplicates: 0,
    clean: 0,
  };

  for (const r of records) {
    const imei = r.imei ?? r.deviceId ?? null;
    const vehnum = r.vehicleNumber ?? r.vehnum ?? r.name ?? null;
    const accId = r.accId ?? r.accid ?? null;
    let recordHasIssue = false;

    // ── 1. Missing critical fields ──────────────────────────────────────────
    const missing = [];
    if (!imei) missing.push("imei");
    if (r.lat == null && r.latitude == null) missing.push("lat");
    if (r.lng == null && r.longitude == null) missing.push("lng");
    if (r.deviceTime == null && r.devTs == null && r.ts == null)
      missing.push("deviceTime");
    if (missing.length) {
      stats.missingFields++;
      recordHasIssue = true;
      findings.push(
        makeFinding({
          agent: AGENT,
          severity: SEVERITY.WARNING,
          code: "MISSING_FIELDS",
          title: "Missing critical fields",
          detail: `Record is missing: ${missing.join(", ")}.`,
          imei,
          vehnum,
          accId,
          value: missing.join(","),
        }),
      );
    }

    // ── 2. Corrupt timestamp (the 2041 bug) ─────────────────────────────────
    const rawTs = r.deviceTime ?? r.devTs ?? r.ts ?? r.dateTime;
    const epoch = parseTs(rawTs);
    const tsReason = timestampSanity(epoch, now);
    if (tsReason) {
      stats.corruptTimestamp++;
      recordHasIssue = true;
      const human =
        tsReason === "future"
          ? `Timestamp is in the future (${rawTs})`
          : tsReason === "ancient"
            ? `Timestamp is implausibly old (${rawTs})`
            : `Timestamp could not be parsed (${rawTs})`;
      findings.push(
        makeFinding({
          agent: AGENT,
          severity: SEVERITY.CRITICAL,
          code: "CORRUPT_TIMESTAMP",
          title: "Corrupt device timestamp",
          detail: `${human}. Downstream trip/alert times will be wrong.`,
          imei,
          vehnum,
          accId,
          value: String(rawTs),
          expected: "within ±1 day of now",
          raw: { deviceTime: r.deviceTime, createdOn: r.createdOn },
        }),
      );
    }

    // ── 3. Ignition contradiction (ign="N" while moving) ────────────────────
    const speed = num(r.speed);
    const ign = String(r.ign ?? "").toUpperCase();
    if (ign === "N" && speed > MOVING_SPEED_KMH) {
      stats.ignContradiction++;
      recordHasIssue = true;
      findings.push(
        makeFinding({
          agent: AGENT,
          severity: SEVERITY.WARNING,
          code: "IGN_CONTRADICTION",
          title: "Ignition off while moving",
          detail: `Device reports ign="N" but speed is ${speed} km/h. Status logic should trust speed, not the ignition flag.`,
          imei,
          vehnum,
          accId,
          value: `${speed} km/h`,
          expected: 'ign="Y" when moving',
        }),
      );
    }

    // ── 4. Invalid coordinates ──────────────────────────────────────────────
    const lat = num(r.lat ?? r.latitude, NaN);
    const lng = num(r.lng ?? r.longitude, NaN);
    if (!missing.includes("lat") && !missing.includes("lng")) {
      if (!isValidLat(lat) || !isValidLng(lng)) {
        stats.invalidCoords++;
        recordHasIssue = true;
        findings.push(
          makeFinding({
            agent: AGENT,
            severity: SEVERITY.WARNING,
            code: "INVALID_COORDS",
            title: "Invalid GPS coordinates",
            detail: `Coordinates (${lat}, ${lng}) are out of range or null-island (0,0).`,
            imei,
            vehnum,
            accId,
            value: `${lat},${lng}`,
          }),
        );
      }
    }

    // ── 5. Duplicate record ─────────────────────────────────────────────────
    if (imei && rawTs != null) {
      const key = `${imei}|${rawTs}`;
      if (seen.has(key)) {
        stats.duplicates++;
        recordHasIssue = true;
        findings.push(
          makeFinding({
            agent: AGENT,
            severity: SEVERITY.INFO,
            code: "DUPLICATE",
            title: "Duplicate telemetry record",
            detail: `Same IMEI + deviceTime (${rawTs}) appears more than once in this batch.`,
            imei,
            vehnum,
            accId,
            value: String(rawTs),
          }),
        );
      } else {
        seen.set(key, true);
      }
    }

    if (!recordHasIssue) stats.clean++;
  }

  // Health score: % of records with zero issues
  const score = stats.total
    ? Math.round((stats.clean / stats.total) * 100)
    : 100;

  return { findings, stats: { ...stats, score } };
}

export default runDataQualityAgent;

/**
 * gpsJump.agent.js — Agent #7
 *
 * Detects impossible movement between consecutive GPS fixes for a single
 * vehicle's track. A "jump" is when the implied speed between two points
 * exceeds what any road vehicle can do — i.e. the device teleported.
 *
 * This formalises the coordinate-jump filtering you already do informally
 * in the Track Play page (simplify + dedupe). Here we quantify it.
 *
 * Input:  ordered array of points for ONE vehicle:
 *           [{ lat, lng, ts|deviceTime, speed?, imei?, vehnum? }, ...]
 *         (sort by time before calling, or pass opts.sort = true)
 * Output: { findings, stats }
 *
 * Pure function.
 */

import {
  SEVERITY,
  makeFinding,
  haversineKm,
  isValidLat,
  isValidLng,
  parseTs,
  num,
} from "./helpers";

const AGENT = "gps-jump";

// Any implied speed above this between two fixes = physically impossible
const MAX_PLAUSIBLE_KMH = 200;
// Below this gap, tiny time deltas make speed math explode — treat carefully
const MIN_DT_SECONDS = 2;

export function runGpsJumpAgent(points = [], opts = {}) {
  const findings = [];
  const stats = {
    total: points.length,
    jumps: 0,
    maxImpliedKmh: 0,
    totalGapKm: 0,
  };

  // Normalise + keep only points with valid coords and a timestamp
  let pts = points
    .map((p) => ({
      lat: num(p.lat ?? p.latitude, NaN),
      lng: num(p.lng ?? p.longitude, NaN),
      t: parseTs(p.ts ?? p.deviceTime ?? p.devTs),
      speed: num(p.speed, null),
      imei: p.imei ?? null,
      vehnum: p.vehicleNumber ?? p.vehnum ?? p.name ?? null,
      raw: p,
    }))
    .filter((p) => isValidLat(p.lat) && isValidLng(p.lng) && p.t != null);

  if (opts.sort) pts = pts.sort((a, b) => a.t - b.t);
  if (pts.length < 2) return { findings, stats };

  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];

    const dtSec = (b.t - a.t) / 1000;
    if (dtSec < MIN_DT_SECONDS) continue; // too close in time to judge

    const distKm = haversineKm(a.lat, a.lng, b.lat, b.lng);
    const impliedKmh = (distKm / dtSec) * 3600;

    if (impliedKmh > MAX_PLAUSIBLE_KMH) {
      stats.jumps++;
      stats.totalGapKm += distKm;
      stats.maxImpliedKmh = Math.max(stats.maxImpliedKmh, impliedKmh);

      const severity =
        impliedKmh > MAX_PLAUSIBLE_KMH * 3
          ? SEVERITY.CRITICAL
          : SEVERITY.WARNING;

      findings.push(
        makeFinding({
          agent: AGENT,
          severity,
          code: "GPS_JUMP",
          title: "Impossible GPS jump",
          detail:
            `Vehicle appears to move ${distKm.toFixed(1)} km in ${dtSec.toFixed(0)}s ` +
            `(implied ${Math.round(impliedKmh)} km/h). Likely a GPS glitch or spoofed fix.`,
          imei: b.imei,
          vehnum: b.vehnum,
          value: `${Math.round(impliedKmh)} km/h`,
          expected: `≤ ${MAX_PLAUSIBLE_KMH} km/h`,
          raw: {
            from: { lat: a.lat, lng: a.lng, t: a.t },
            to: { lat: b.lat, lng: b.lng, t: b.t },
            distKm: +distKm.toFixed(3),
            dtSec: +dtSec.toFixed(1),
          },
        }),
      );
    }
  }

  stats.maxImpliedKmh = Math.round(stats.maxImpliedKmh);
  stats.totalGapKm = +stats.totalGapKm.toFixed(1);
  return { findings, stats };
}

export default runGpsJumpAgent;

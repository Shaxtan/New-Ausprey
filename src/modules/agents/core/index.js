/**
 * index.js — Fleet Intelligence agents barrel
 *
 * Exposes each agent plus a `runFleetScan` that runs the deterministic
 * batch agents (data quality, device health, alert priority) over a single
 * fleet snapshot and returns a consolidated result.
 */

export { runDataQualityAgent } from "./dataQuality.agent";
export { runGpsJumpAgent } from "./gpsJump.agent";
export { runDeviceHealthAgent } from "./deviceHealth.agent";
export { runAlertPriorityAgent } from "./alertPriority.agent";
export { runTripSummaryAgent } from "./tripSummary.agent";
export * from "./helpers";

import { runDataQualityAgent } from "./dataQuality.agent";
import { runDeviceHealthAgent } from "./deviceHealth.agent";
import { runAlertPriorityAgent } from "./alertPriority.agent";
import { sortFindings } from "./helpers";

/**
 * Run the batch agents over a fleet snapshot.
 * @param {object} snap
 * @param {Array}  snap.devices  — VTS/ELK device records (for quality + health)
 * @param {object} snap.alerts   — db-alerts response { summary, data }
 */
export function runFleetScan({ devices = [], alerts = {} } = {}) {
  const quality = runDataQualityAgent(devices);
  const health = runDeviceHealthAgent(devices);
  const priority = runAlertPriorityAgent(alerts);

  const findings = sortFindings([
    ...quality.findings,
    ...health.findings,
    ...priority.findings,
  ]);

  return {
    findings,
    quality,
    health,
    priority,
    summary: {
      totalFindings: findings.length,
      critical: findings.filter((f) => f.severity === "critical").length,
      warning: findings.filter((f) => f.severity === "warning").length,
      info: findings.filter((f) => f.severity === "info").length,
      dataQualityScore: quality.stats.score,
      devicesScanned: devices.length,
    },
  };
}

export default runFleetScan;

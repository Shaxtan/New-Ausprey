/**
 * dashboard.service.js  — New-Ausprey
 *
 * Real API connections:
 *   getDashboardData  → POST /usage/reports/report/dashboard?accid=<id>
 *   getUnreachable    → POST /usage/reports/report/unrechableDevices?accid=<id>
 *   getMapViewData    → POST /usage/reports/report/mapview?accid=<id>
 */
import apiService from "@/services/apiService";

/**
 * Maps the raw dashboard API summary to the shape components expect.
 *
 * Raw shape:
 *   { offline, onlineIdle, unreachable, totalDevices, onlineStopped, onlineMotion }
 */
function normaliseSummary(summary = {}) {
  return {
    totalVehicles: summary.totalDevices ?? 0,
    activeVehicles:
      (summary.onlineMotion ?? 0) +
      (summary.onlineIdle ?? 0) +
      (summary.onlineStopped ?? 0),
    live: {
      online: summary.onlineMotion ?? 0,
      idle: summary.onlineIdle ?? 0,
      stopped: summary.onlineStopped ?? 0,
      offline: summary.offline ?? 0,
      unreachable: summary.unreachable ?? 0,
    },
  };
}

export const dashboardService = {
  /**
   * Returns { summary, VTS, ELK, ... } from the dashboard API.
   * Pass the numeric account id from useAccountStore's selectedAccount.numericId.
   */
  getDashboardData: async (accid = 1) => {
    const body = await apiService.getDashboardData(accid);
    // body.data = { summary: {...}, VTS: { available: [...] }, ELK: { available: [...] } }
    const inner = body?.data?.data ?? body?.data ?? {};
    return {
      summary: normaliseSummary(inner.summary),
      VTS: inner.VTS ?? { available: [] },
      ELK: inner.ELK ?? { available: [] },
      raw: inner,
    };
  },

  /**
   * Returns an array of unreachable devices.
   */
  getUnreachableDevices: async (accid = 1) => {
    const body = await apiService.getUnreachableDevices(accid);
    return body?.data ?? [];
  },

  /**
   * Returns an array of all device positions for the map view.
   */
  getMapViewData: async (accid = 1) => {
    const body = await apiService.getMapViewData(accid);
    return body?.data ?? [];
  },
};

export default dashboardService;

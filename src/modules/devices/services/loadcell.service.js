/**
 * loadcell.service.js  — New-Ausprey
 *
 * Connects to real backend APIs (old Ausprey pattern):
 *   getImeis(accid)         → GET  /usage/reports/report/dropdown?accid=<id>
 *   getHistoricalData(...)  → POST /usage/reports/load-graph
 *   getLiveData(imei)       → POST /usage/reports/live-load-graph?IMEI=<imei>
 *
 * Row shape returned by both data methods:
 *   { time, V1, V2, V3, V4, Average, LoadPercent }
 */
import apiService from "@/services/apiService";

// ─── Date formatters (match old project exactly) ──────────────────────────────
const pad = (n) => String(n).padStart(2, "0");

const toLocalStr = (dateStr) => {
  const d = new Date(dateStr);
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
};

const convertTime = (ts) => {
  const d = new Date(ts);
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
};

// ─── Row normaliser — same shape for both historical and live endpoints ────────
function normaliseRows(rawRows = []) {
  return rawRows.map((d) => ({
    time: convertTime(new Date(d.deviceTime ?? d.time ?? Date.now())),
    V1: d.analog?.[0] ?? d.V1 ?? 0,
    V2: d.analog?.[1] ?? d.V2 ?? 0,
    V3: d.analog?.[2] ?? d.V3 ?? 0,
    V4: d.analog?.[3] ?? d.V4 ?? 0,
    Average: d.average ?? d.Average ?? 0,
    LoadPercent: d.loadPercent ?? d.LoadPercent ?? 0,
  }));
}

export const loadcellService = {
  /**
   * Returns IMEI dropdown list for the given account.
   * Shape: [{ value: imei, label: 'VehicleNo (imei)' }]
   */
  getImeis: async (accid = 1) => {
    try {
      const list = await apiService.getImeiDropdown(accid);
      return list.map((item) => ({
        value: item.imei,
        label: item.vehnum ? `${item.vehnum} (${item.imei})` : item.imei,
      }));
    } catch (e) {
      console.error("loadcellService.getImeis error:", e);
      return [];
    }
  },

  /**
   * Historical load cell data.
   * @param {{ imei: string, from: string, to: string }} params
   *   `from` and `to` are datetime-local strings (e.g. "2026-06-09T00:00")
   */
  getHistoricalData: async ({ imei, from, to }) => {
    try {
      const body = await apiService.getLoadCellHistory(
        imei,
        toLocalStr(from),
        toLocalStr(to),
      );
      if (body?.resultCode !== 1 || !Array.isArray(body?.data)) return [];
      return normaliseRows(body.data);
    } catch (e) {
      console.error("loadcellService.getHistoricalData error:", e);
      return [];
    }
  },

  /**
   * Live load cell data (last N readings).
   * Called every 30 s by LiveLoadPage.
   */
  getLiveData: async (imei) => {
    try {
      const body = await apiService.getLiveLoadGraph(imei);
      if (body?.resultCode !== 1 || !Array.isArray(body?.data)) return [];
      return normaliseRows(body.data);
    } catch (e) {
      console.error("loadcellService.getLiveData error:", e);
      return [];
    }
  },
};

export default loadcellService;

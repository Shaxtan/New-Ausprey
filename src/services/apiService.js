/**
 * apiService.js  — New-Ausprey
 *
 * Mirrors the pattern from the old Ausprey project's ApiService.js.
 * Uses the VITE_API_BASE_URL env variable (set in .env) as the root.
 *
 * Service name → path suffix (matches old project's nginx rewrite config):
 *   main     → /users          (user/auth endpoints)
 *   accounts → /accounts       (account dropdown etc.)
 *   usage    → /usage          (reports, dashboard, mapview, livetrack …)
 *   commands → /commands
 *   template → /template
 *   tripOps  → /tripops
 *   geofence → /geofence
 */

import axios from "axios";

// ── Service base-URL map ──────────────────────────────────────────────────────
const BASE = import.meta.env.VITE_API_BASE_URL ?? "https://tech-hop.com/api";

export const SERVICES = {
  main: `${BASE}/users`,
  accounts: `${BASE}/accounts`,
  usage: `${BASE}/usage`,
  dashboard: `${BASE}/usage`,
  commands: `${BASE}/commands`,
  template: `${BASE}/template`,
  tripOps: `${BASE}/tripops`,
  geofence: `${BASE}/geofence`,
};

// ── Auth header helper ────────────────────────────────────────────────────────
function authHeader() {
  try {
    const stored = JSON.parse(localStorage.getItem("userDetails") || "{}");
    const token = stored?.token ?? localStorage.getItem("auspre-token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

// ── Global axios interceptors ─────────────────────────────────────────────────
axios.interceptors.response.use(
  (response) => {
    // Backend custom 500 / "Unauthorized" response
    if (
      response?.data?.resultCode === 500 &&
      response?.data?.message === "Unauthorized"
    ) {
      console.warn("⚠️ Backend says unauthorized, redirecting…");
      localStorage.removeItem("userDetails");
      localStorage.removeItem("auspre-auth");
      localStorage.removeItem("auspre-token");
      window.location.replace("/login");
      return Promise.reject("Unauthorized");
    }
    return response;
  },
  (error) => {
    const status = error?.response?.status;
    if ([400, 401, 403].includes(status)) {
      console.warn(`⚠️ HTTP ${status} detected, redirecting…`);
      localStorage.removeItem("userDetails");
      localStorage.removeItem("auspre-auth");
      localStorage.removeItem("auspre-token");
      window.location.replace("/login");
    }
    return Promise.reject(error);
  },
);

// ── ApiService class ──────────────────────────────────────────────────────────
class ApiService {
  // ── Core helpers ──────────────────────────────────────────────────────────

  getRequest(url, callback = null, withAuth = true, base = SERVICES.main) {
    const config = withAuth ? { headers: authHeader() } : {};
    return axios
      .get(base + url, config)
      .then((res) => {
        if (callback) callback(res);
        return res;
      })
      .catch((error) => {
        if (callback) callback({ message: error?.message });
        throw error;
      });
  }

  postRequest(
    url,
    data = {},
    withAuth = true,
    base = SERVICES.main,
    params = {},
  ) {
    const config = {
      ...(withAuth ? { headers: authHeader() } : {}),
      params,
    };
    return axios.post(base + url, data, config);
  }

  deleteRequest(url, withAuth = true, base = SERVICES.main) {
    const config = withAuth ? { headers: authHeader() } : {};
    return axios.delete(base + url, config);
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  /**
   * Sign in.  Sends { username, password, signInHere: true } to
   * POST /users/users/signin  (no auth header needed).
   *
   * The old project accepted both username and e-mail in the `username` field
   * because the backend checks both — so we pass whatever the user typed.
   */
  login(credentials) {
    return this.postRequest(
      "/users/signin",
      { ...credentials, signInHere: true },
      false, // no auth header
      SERVICES.main,
    );
  }

  // ── Account dropdown ──────────────────────────────────────────────────────

  /**
   * GET /accounts/accounts/accountDropdown
   * Returns only accounts with status === 'A'.
   */
  getAccountDropdown() {
    return this.getRequest(
      "/accounts/accountDropdown",
      null,
      true,
      SERVICES.accounts,
    ).then((res) => {
      if (res?.data?.resultCode === 1) {
        const filtered = res.data.data.filter((a) => a.status === "A");
        return { ...res, data: { ...res.data, data: filtered } };
      }
      throw new Error(res?.data?.message || "Failed to fetch account list");
    });
  }

  getAccountStatus(accountId) {
    return this.getRequest(
      `/account-status?accountId=${accountId}`,
      null,
      true,
      SERVICES.accounts,
    ).then((res) => {
      if (res?.data?.resultCode === 1) return res.data.data;
      throw new Error(res?.data?.message || "Failed to fetch account status");
    });
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────

  /**
   * POST /usage/reports/report/dashboard?accid=<id>
   */
  getDashboardData(accid) {
    return this.postRequest(
      "/reports/report/dashboard",
      { accid },
      true,
      SERVICES.dashboard,
      { accid },
    ).then((res) => res?.data);
  }

  // ── Unreachable devices ───────────────────────────────────────────────────

  /**
   * POST /usage/reports/report/unrechableDevices?accid=<id>
   */
  getUnreachableDevices(accid) {
    return this.postRequest(
      "/reports/report/unrechableDevices",
      { accid },
      true,
      SERVICES.dashboard,
      { accid },
    ).then((res) => res?.data);
  }

  // ── Live track ────────────────────────────────────────────────────────────

  /**
   * POST /usage/reports/livetrack?accountId=<id>&imei=<imei>
   */
  getLiveTrack(accountId, imei) {
    return this.postRequest(
      `/reports/livetrack?accountId=${accountId}&imei=${imei}`,
      {},
      true,
      SERVICES.usage,
    ).then((res) => res?.data);
  }

  // ── Map view ──────────────────────────────────────────────────────────────

  /**
   * POST /usage/reports/report/mapview?accid=<id>
   */
  getMapViewData(accid) {
    return this.postRequest(
      "/reports/report/mapview",
      { accid },
      true,
      SERVICES.dashboard,
      { accid },
    ).then((res) => res?.data);
  }

  // ── All devices (normalised for map/tracking) ─────────────────────────────

  /**
   * Fetches dashboard data then normalises both VTS and ELK device lists
   * into a unified shape for the tracking/map pages.
   */
  getAllDevices(accid = 1) {
    return this.postRequest(
      "/reports/report/dashboard",
      { accid },
      true,
      SERVICES.dashboard,
      { accid },
    ).then((res) => {
      const vts = res?.data?.data?.data?.VTS?.available ?? [];
      const elk = res?.data?.data?.data?.ELK?.available ?? [];

      const all = [
        ...vts.map((d) => ({ ...d, _src: "VTS" })),
        ...elk.map((d) => ({ ...d, _src: "ELK" })),
      ];

      return all.map((d) => {
        const speed = Number(d.speed) || 0;
        const ign = (d.ign ?? "").toUpperCase();
        const lat = parseFloat(d.lat);
        const lng = parseFloat(d.lng);

        let status = "Inactive";
        if (d._src === "ELK") {
          status = speed > 0 ? "Running" : "Stopped";
        } else {
          if (ign === "Y") status = speed > 5 ? "Running" : "Idle";
          else status = speed === 0 ? "Stopped" : "Inactive";
        }

        return {
          id: d.imei,
          name: d.vehnum || d.name || d.imei,
          status,
          speed,
          ignition: ign === "Y",
          lat,
          lng,
          lastUpdate: d.devTs ?? "No Data",
          accountId: d.accid ?? accid,
          deviceType: d.deviceType ?? d._src,
          raw: d,
        };
      });
    });
  }

  // ── IMEI dropdown ─────────────────────────────────────────────────────────

  getImeiDropdown(accid = 1) {
    return this.getRequest(
      `/reports/report/dropdown?accid=${accid}`,
      null,
      true,
      SERVICES.dashboard,
    ).then((res) => {
      const list = res?.data?.data?.imeiVehnumList ?? [];
      return list.map((item) => ({ imei: item.imei, vehnum: item.vehnum }));
    });
  }

  // ── Track play history ────────────────────────────────────────────────────

  getTrackPlayHistory(data = {}) {
    return this.postRequest(
      "/reports/trackPlayHistory",
      data,
      true,
      SERVICES.dashboard,
    ).then((res) => {
      const raw = res?.data?.data ?? [];
      return raw.map((item) => {
        const speed = Number(item.speed) || 0;
        const ign = (item.ign ?? "").toUpperCase();
        // Speed is the reliable movement signal — some devices report ign="N"
        // even while moving, so don't require ign==="Y" for MOTION.
        let status;
        if (speed > 5) status = "MOTION";
        else if (speed > 0)
          status = "IDLE"; // crawling / low speed
        else if (ign === "Y")
          status = "IDLE"; // engine on but not moving
        else status = "STOP"; // speed 0 + ign off
        return {
          name: item.vehicleNumber || item.imei,
          lat: item.latitude,
          lng: item.longitude,
          ts: item.deviceTime,
          speed,
          disha: item.disha != null ? Number(item.disha) : null,
          ign,
          status,
        };
      });
    });
  }
  // ── Trips ─────────────────────────────────────────────────────────────────

  getActiveTrips(pageNo = 0) {
    return this.getRequest(
      `/trips/view-active?pageNo=${pageNo}`,
      null,
      true,
      SERVICES.tripOps,
    ).then((res) =>
      res?.data?.resultCode === 1
        ? res.data.data
        : { trips: [], totalPages: 0 },
    );
  }

  createTrip(payload) {
    return this.postRequest("/trips/create", payload, true, SERVICES.tripOps);
  }

  getTripTemplate(accountId = 1) {
    return this.getRequest(
      `/trip-template/${accountId}`,
      null,
      true,
      SERVICES.template,
    );
  }

  // ── Geofence ──────────────────────────────────────────────────────────────

  getGeofences(pageNo = 0, exclude = []) {
    return this.postRequest(
      "/geo-fence/view-all",
      { pageNo, exclude },
      true,
      SERVICES.geofence,
    ).then((res) => (res?.data?.resultCode === 1 ? res.data.data : []));
  }

  getViewDetailed() {
    return this.getRequest(
      "/geo-fence/view-detailed",
      null,
      true,
      SERVICES.geofence,
    ).then((res) => (res?.data?.resultCode === 1 ? res.data.data : []));
  }

  createGeofence(payload) {
    return this.postRequest(
      "/geo-fence/create",
      { geoHubList: [payload] },
      true,
      SERVICES.geofence,
    );
  }

  // ── Alerts ────────────────────────────────────────────────────────────────

  getAlertsByAccount(data) {
    return this.postRequest(
      "/alerts/by-account",
      data,
      true,
      SERVICES.dashboard,
    );
  }

  getDbAlerts(accid) {
    return this.postRequest("/alerts/db-alerts", {}, true, SERVICES.dashboard, {
      accid,
    });
  }

  // ── Reports ───────────────────────────────────────────────────────────────

  getDistanceReport(data = {}) {
    return this.postRequest(
      "/reports/distance-report",
      data,
      true,
      SERVICES.dashboard,
    ).then((res) => {
      if (res?.data?.resultCode === 1) return res.data;
      throw new Error(res?.data?.message || "Failed to fetch distance report");
    });
  }

  getWorkingHourReport(data) {
    return this.postRequest(
      "/reports/workinghourreport",
      data,
      true,
      SERVICES.usage,
    );
  }

  getAccountSummaryReport(startDate, endDate, accid = 1) {
    return this.postRequest(
      `/reports/account-summary-report?accid=${accid}`,
      { startDate, endDate },
      true,
      SERVICES.dashboard,
    );
  }

  // ── Misc ──────────────────────────────────────────────────────────────────

  getAllDevicesByAccount() {
    return this.getRequest("/devices", null, true, SERVICES.accounts);
  }

  // ── Load Cell Report ──────────────────────────────────────────────────────

  /**
   * POST /usage/reports/load-graph
   * Historical load cell data for a given IMEI + date range.
   */
  getLoadCellHistory(imei, startDate, endDate) {
    return this.postRequest(
      "/reports/load-graph",
      { imei, startDate, endDate },
      true,
      SERVICES.dashboard,
    ).then((res) => res?.data);
  }

  /**
   * POST /usage/reports/live-load-graph?IMEI=<imei>
   * Live (last N readings) load cell data.
   */
  getLiveLoadGraph(imei) {
    return this.postRequest(
      `/reports/live-load-graph?IMEI=${imei}`,
      {},
      true,
      SERVICES.dashboard,
    ).then((res) => res?.data);
  }
}

export const apiService = new ApiService();
export default apiService;

/**
 * tracking.service.js  — New-Ausprey
 *
 * Real API connections:
 *   getLiveVehicles → normalised list from POST dashboard (VTS + ELK)
 *   getLiveTrack    → POST /usage/reports/livetrack?accountId=<id>&imei=<imei>
 */
import apiService from "@/services/apiService";

export const trackingService = {
  /**
   * Returns a normalised list of all live vehicles for the given account.
   * Shape: { id, name, status, speed, ignition, lat, lng, lastUpdate, ... }
   */
  getLiveVehicles: (accid = 1) => apiService.getAllDevices(accid),

  /**
   * Returns single-vehicle live telemetry.
   */
  getLiveTrack: (accountId, imei) => apiService.getLiveTrack(accountId, imei),
};

export default trackingService;

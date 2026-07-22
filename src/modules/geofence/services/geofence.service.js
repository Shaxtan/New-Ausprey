/**
 * geofence.service.js — New-Ausprey
 *
 * Thin wrapper around the real geofence endpoints already defined in
 * apiService.js:
 *   getViewDetailed()      → GET  /geo-fence/view-detailed
 *   createGeofence(payload)→ POST /geo-fence/create   { geoHubList: [payload] }
 *
 * No mock data — everything here reads/writes the real backend.
 */
import apiService from "@/services/apiService";

export const geofenceService = {
  /** Returns the raw array of geofence records for the authenticated user. */
  getGeofences: () => apiService.getViewDetailed(),

  /**
   * Creates a single circular geofence.
   * @param {object} payload — { name, category, client, type, mobileno,
   *   accid, radius, location: { x, y, type, coordinates: [lng, lat] } }
   */
  createGeofence: (payload) => apiService.createGeofence(payload),
};

export default geofenceService;

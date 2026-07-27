/**
 * vehicles.service.js — New-Ausprey
 *
 * Real device/vehicle registry — GET /devices (no mock data).
 * Normalises the raw records into the shape the Vehicles page components
 * expect, without inventing fields the API doesn't provide (no driver,
 * speed, fuel, odometer, or location here — this is a registry endpoint,
 * not live telemetry. Use the Dashboard / Live Tracking pages for that.)
 */
import apiService from "@/services/apiService";

const DEVICE_TYPE_LABEL = {
  9: "GPS Tracker",
};

function normaliseDevice(d) {
  return {
    id: d.imei,
    imei: d.imei,
    vehicleNumber: d.vehicleNumber || d.name || d.imei,
    accountId: d.accountId,
    simNo: d.simNo || "—",
    deviceType: DEVICE_TYPE_LABEL[d.deviceTypeId] ?? d.iconType ?? "Unknown",
    iconType: d.iconType,
    active: d.status === "A",
    status: d.status === "A" ? "Active" : "Inactive",
    connected: d.connected, // null in the sample data — surfaced as "Unknown" in the UI
    joiningDate: d.joiningDate,
    updatedOn: d.updatedOn,
    updatedBy: d.updatedBy,
  };
}

export const vehiclesService = {
  getVehicles: async () => {
    const res = await apiService.getDevices();
    const body = res?.data;
    if (body?.resultCode !== 1) return [];
    return (body.data ?? []).map(normaliseDevice);
  },
};

export default vehiclesService;

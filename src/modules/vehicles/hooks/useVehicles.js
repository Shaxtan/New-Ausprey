/**
 * useVehicles.js — New-Ausprey
 *
 * Real data hook for the Vehicles page (GET /devices).
 * deriveVehicleStats() computes KPI numbers purely from the real list —
 * no fabricated "in maintenance"/"idle" counts, since the registry
 * endpoint doesn't report live vehicle state.
 */
import { useQuery } from "@tanstack/react-query";
import { vehiclesService } from "../services/vehicles.service";

const KEY = "vehicles";

export const useVehicles = () =>
  useQuery({ queryKey: [KEY, "list"], queryFn: vehiclesService.getVehicles });

/** Client-derived KPI numbers — only counts fields that actually exist. */
export function deriveVehicleStats(vehicles = []) {
  const total = vehicles.length;
  const active = vehicles.filter((v) => v.active).length;
  const inactive = total - active;
  const deviceTypes = new Set(
    vehicles.map((v) => v.deviceType).filter(Boolean),
  );

  return { total, active, inactive, deviceTypes: deviceTypes.size };
}

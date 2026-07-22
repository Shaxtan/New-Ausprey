/**
 * useGeofences.js — New-Ausprey
 *
 * Real data hooks for the Geofence page.
 *
 *   useGeofences()       — fetches the geofence list from getViewDetailed()
 *   useCreateGeofence()  — mutation wrapping createGeofence(), invalidates
 *                          the list on success so the new zone appears
 *                          immediately without a manual refresh
 *   deriveGeofenceStats()— pure function computing KPI numbers from the
 *                          real list (no fabricated "violations"/"vehicles
 *                          inside" — those fields don't exist in this API)
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccountStore } from "@/store";
import { geofenceService } from "../services/geofence.service";

const KEY = "geofence";

export const useGeofences = () => {
  const accid = useAccountStore((s) => s.selectedAccount?.id);
  return useQuery({
    // getViewDetailed() takes no params, but keying on accid means switching
    // accounts still triggers a fresh fetch in case the backend scopes the
    // response by the authenticated session/account.
    queryKey: [KEY, "list", accid],
    queryFn: () => geofenceService.getGeofences(),
  });
};

export const useCreateGeofence = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => geofenceService.createGeofence(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, "list"] });
    },
  });
};

/** Client-derived KPI numbers — only counts fields that actually exist. */
export function deriveGeofenceStats(geofences = []) {
  const total = geofences.length;
  const categories = new Set(geofences.map((g) => g.category).filter(Boolean));
  const circleZones = geofences.filter(
    (g) => g.type === "CIRCLE" || g.radius != null,
  ).length;
  const radii = geofences
    .map((g) => Number(g.radius))
    .filter((r) => Number.isFinite(r) && r > 0);
  const avgRadius = radii.length
    ? Math.round(radii.reduce((s, r) => s + r, 0) / radii.length)
    : 0;

  return {
    total,
    categories: categories.size,
    circleZones,
    avgRadius,
  };
}

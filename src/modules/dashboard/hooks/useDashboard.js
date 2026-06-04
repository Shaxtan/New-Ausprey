/**
 * useDashboard.js  — New-Ausprey
 *
 * React-Query hooks that drive the dashboard page.
 * All hooks re-fetch automatically when the selected account changes.
 */
import { useQuery } from "@tanstack/react-query";
import { useAccountStore } from "@/store";
import { dashboardService } from "../services/dashboard.service";

const KEY = "dashboard";

/** Core dashboard data (summary + VTS + ELK device lists). */
export const useDashboardData = () => {
  const accid = useAccountStore((s) => s.selectedAccount?.id);
  return useQuery({
    queryKey: [KEY, "data", accid],
    queryFn: () => dashboardService.getDashboardData(accid ?? 1),
    enabled: accid != null,
    staleTime: 30_000,
  });
};

/** Fleet summary statistics (derived from dashboard data). */
export const useFleetStats = () => {
  const query = useDashboardData();
  return {
    ...query,
    data: query.data?.summary ?? null,
  };
};

/**
 * Vehicle status distribution for the donut chart.
 * Shape: [{ name, value, color }]
 */
export const useVehicleStatus = () => {
  const query = useDashboardData();
  const summary = query.data?.summary?.live;
  const data = summary
    ? [
        { name: "Moving", value: summary.online, color: "#10b981" },
        { name: "Idle", value: summary.idle, color: "#f59e0b" },
        { name: "Stopped", value: summary.stopped, color: "#3b82f6" },
        { name: "Offline", value: summary.offline, color: "#94a3b8" },
        { name: "Unreachable", value: summary.unreachable, color: "#f43f5e" },
      ].filter((d) => d.value > 0)
    : null;
  return { ...query, data };
};

/** All available devices (combined VTS + ELK) for the live strip. */
export const useLiveDevices = () => {
  const query = useDashboardData();
  const vts = query.data?.VTS?.available ?? [];
  const elk = query.data?.ELK?.available ?? [];
  return { ...query, data: [...vts, ...elk] };
};

/** Unreachable devices list. */
export const useUnreachableDevices = () => {
  const accid = useAccountStore((s) => s.selectedAccount?.id);
  return useQuery({
    queryKey: [KEY, "unreachable", accid],
    queryFn: () => dashboardService.getUnreachableDevices(accid ?? 1),
    enabled: accid != null,
    staleTime: 60_000,
  });
};

/** Map view data (all device positions). */
export const useMapViewData = () => {
  const accid = useAccountStore((s) => s.selectedAccount?.id);
  return useQuery({
    queryKey: [KEY, "mapview", accid],
    queryFn: () => dashboardService.getMapViewData(accid ?? 1),
    enabled: accid != null,
    staleTime: 30_000,
  });
};

// Legacy aliases so existing page components don't break
export const useDailyMovement = useDashboardData;
export const useTopSpeeding = useDashboardData;
export const useAlertsSummary = useDashboardData;
export const useRecentAlerts = useDashboardData;

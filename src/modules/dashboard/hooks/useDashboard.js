/**
 * useDashboard.js  — New-Ausprey
 *
 * Auto-refreshes every 5 minutes (matching old Ausprey behaviour).
 * Exposes `refetch` and `isRefetching` for the manual refresh button.
 */
import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccountStore } from "@/store";
import { dashboardService } from "../services/dashboard.service";
import apiService from "@/services/apiService";

const KEY = "dashboard";
const REFRESH_MS = 5 * 60 * 1000; // 5 minutes

const pad = (n) => String(n).padStart(2, "0");
const toLocalYmd = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** yyyy-mm-dd → d/MM/yyyy (matches the API payload format) */
const toApiDate = (s) => {
  const [y, m, d] = s.split("-");
  return `${Number(d)}/${m}/${y}`;
};

/**
 * Top sub-accounts by total distance for today — used by the dashboard chart.
 * Uses getAccountSummaryReport which returns childAccounts[] with totalDistance.
 */
export const useTopDistanceDevices = (topN = 5) => {
  const accid = useAccountStore((s) => s.selectedAccount?.id);
  return useQuery({
    queryKey: [KEY, "top-distance", accid],
    enabled: accid != null,
    staleTime: REFRESH_MS,
    refetchInterval: REFRESH_MS,
    queryFn: async () => {
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      const startDate = toApiDate(toLocalYmd(yesterday));
      const endDate = toApiDate(toLocalYmd(today));

      const res = await apiService.getAccountSummaryReport(
        startDate,
        endDate,
        accid ?? 1,
      );
      const body = res?.data;
      if (body?.resultCode !== 1) return [];

      // Recursively collect all accounts that have actual fleet data.
      // The tree can be arbitrarily deep (Ausprey → Tech-Hop → sub-accounts).
      // We want the deepest nodes with distance > 0 — i.e. real fleet accounts,
      // not intermediate aggregation nodes.
      const collectLeaves = (node) => {
        if (!node) return [];
        const children = node.childAccounts ?? [];
        if (children.length === 0) {
          // Leaf node — return itself if it has distance data
          return Number(node.totalDistance ?? 0) > 0 ? [node] : [];
        }
        // Internal node — recurse into children
        return children.flatMap(collectLeaves);
      };

      const root = Array.isArray(body.data) ? body.data[0] : null;
      const list = collectLeaves(root);

      return [...list]
        .filter((a) => Number(a.totalDistance ?? 0) > 0)
        .sort((a, b) => Number(b.totalDistance) - Number(a.totalDistance))
        .slice(0, topN)
        .map((a) => ({
          name: a.accountName,
          value: Number(a.totalDistance ?? 0),
          devices: Number(a.deviceCount ?? 0),
          accountId: a.accountId,
        }));
    },
  });
};

// Recursively collect real fleet accounts (leaf nodes) from an account-summary tree.
// Shared by useTopDistanceDevices and useFleetUtilization.
const collectLeafAccounts = (node) => {
  if (!node) return [];
  const children = node.childAccounts ?? [];
  if (children.length === 0) return [node];
  return children.flatMap(collectLeafAccounts);
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Fleet utilization over the last 7 days — % of fleet accounts that moved
 * (totalDistance > 0) each day, derived from getAccountSummaryReport.
 * Used by the dashboard's Fleet Utilization trend chart.
 */
export const useFleetUtilization = () => {
  const accid = useAccountStore((s) => s.selectedAccount?.id);
  return useQuery({
    queryKey: [KEY, "utilization", accid],
    enabled: accid != null,
    staleTime: REFRESH_MS,
    refetchInterval: REFRESH_MS,
    queryFn: async () => {
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d;
      });

      const results = await Promise.all(
        days.map(async (d) => {
          const apiDate = toApiDate(toLocalYmd(d));
          try {
            const res = await apiService.getAccountSummaryReport(
              apiDate,
              apiDate,
              accid ?? 1,
            );
            const body = res?.data;
            if (body?.resultCode !== 1)
              return { day: d, pct: 0, active: 0, total: 0 };

            const root = Array.isArray(body.data) ? body.data[0] : null;
            const leaves = collectLeafAccounts(root);
            const total = leaves.length;
            const active = leaves.filter(
              (a) => Number(a.totalDistance ?? 0) > 0,
            ).length;
            const pct = total > 0 ? Math.round((active / total) * 100) : 0;
            return { day: d, pct, active, total };
          } catch {
            return { day: d, pct: 0, active: 0, total: 0 };
          }
        }),
      );

      const points = results.map((r) => ({
        name: DAY_LABELS[r.day.getDay()],
        utilization: r.pct,
      }));

      const avg = points.length
        ? Math.round(
            points.reduce((s, p) => s + p.utilization, 0) / points.length,
          )
        : 0;

      // Trend: compare last point to the average of the first half
      const half = Math.floor(points.length / 2) || 1;
      const earlyAvg =
        points.slice(0, half).reduce((s, p) => s + p.utilization, 0) / half;
      const latest = points[points.length - 1]?.utilization ?? 0;
      const trend =
        earlyAvg > 0 ? Math.round(((latest - earlyAvg) / earlyAvg) * 100) : 0;

      return { points, avg, trend };
    },
  });
};

/** Alerts (summary + full list) from /alerts/db-alerts. Auto-refreshes every 5 min. */
export const useDashboardAlerts = () => {
  const accid = useAccountStore((s) => s.selectedAccount?.id);
  return useQuery({
    queryKey: [KEY, "alerts", accid],
    queryFn: async () => {
      const res = await apiService.getDbAlerts(accid ?? 1);
      const body = res?.data;
      if (body?.resultCode !== 1) return { summary: [], data: [] };
      return {
        summary: body.data?.summary ?? [],
        data: body.data?.data ?? [],
      };
    },
    enabled: accid != null,
    staleTime: REFRESH_MS,
    refetchInterval: REFRESH_MS,
  });
};

/** Core dashboard data (summary + VTS + ELK). Auto-refreshes every 5 min. */
export const useDashboardData = () => {
  const accid = useAccountStore((s) => s.selectedAccount?.id);
  return useQuery({
    queryKey: [KEY, "data", accid],
    queryFn: () => dashboardService.getDashboardData(accid ?? 1),
    enabled: accid != null,
    staleTime: REFRESH_MS,
    refetchInterval: REFRESH_MS,
  });
};

/** Unreachable devices. Auto-refreshes every 5 min. */
export const useUnreachableDevices = () => {
  const accid = useAccountStore((s) => s.selectedAccount?.id);
  return useQuery({
    queryKey: [KEY, "unreachable", accid],
    queryFn: () => dashboardService.getUnreachableDevices(accid ?? 1),
    enabled: accid != null,
    staleTime: REFRESH_MS,
    refetchInterval: REFRESH_MS,
  });
};

/**
 * Manual refresh — invalidates both dashboard queries simultaneously.
 * Returns { refresh, isRefreshing, lastRefreshTime }.
 */
export const useDashboardRefresh = () => {
  const qc = useQueryClient();
  const accid = useAccountStore((s) => s.selectedAccount?.id);

  const { isRefetching: r1 } = useQuery({
    queryKey: [KEY, "data", accid],
    enabled: false, // observer only — not a new fetch
  });
  const { isRefetching: r2 } = useQuery({
    queryKey: [KEY, "unreachable", accid],
    enabled: false,
  });

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: [KEY, "data", accid] });
    qc.invalidateQueries({ queryKey: [KEY, "unreachable", accid] });
  }, [qc, accid]);

  return {
    refresh,
    isRefreshing: r1 || r2,
  };
};

// ─── Derived helpers ──────────────────────────────────────────────────────────

export const useFleetStats = () => {
  const query = useDashboardData();
  return { ...query, data: query.data?.summary ?? null };
};

export const useVehicleStatus = () => {
  const query = useDashboardData();
  const summary = query.data?.summary?.live;
  const data = summary
    ? [
        { name: "Moving", value: summary.online, color: "#10b981" },
        { name: "Idle", value: summary.idle, color: "#f59e0b" },
        { name: "Stopped", value: summary.stopped, color: "#ef4444" },
        { name: "Offline", value: summary.offline, color: "#94a3b8" },
        { name: "Unreachable", value: summary.unreachable, color: "#f43f5e" },
      ].filter((d) => d.value > 0)
    : null;
  return { ...query, data };
};

export const useLiveDevices = () => {
  const query = useDashboardData();
  const vts = query.data?.VTS?.available ?? [];
  const elk = query.data?.ELK?.available ?? [];
  return { ...query, data: [...vts, ...elk] };
};

export const useMapViewData = () => {
  const accid = useAccountStore((s) => s.selectedAccount?.id);
  return useQuery({
    queryKey: [KEY, "mapview", accid],
    queryFn: () => dashboardService.getMapViewData(accid ?? 1),
    enabled: accid != null,
    staleTime: REFRESH_MS,
    refetchInterval: REFRESH_MS,
  });
};

// Legacy aliases
export const useDailyMovement = useDashboardData;
export const useTopSpeeding = useDashboardData;
export const useAlertsSummary = useDashboardData;
export const useRecentAlerts = useDashboardData;

/**
 * useDashboard.js  — New-Ausprey
 *
 * Auto-refreshes every 5 minutes (matching old Ausprey behaviour).
 * Exposes `refetch` and `isRefetching` for the manual refresh button.
 */
import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAccountStore } from '@/store';
import { dashboardService } from '../services/dashboard.service';

const KEY        = 'dashboard';
const REFRESH_MS = 5 * 60 * 1000; // 5 minutes

/** Core dashboard data (summary + VTS + ELK). Auto-refreshes every 5 min. */
export const useDashboardData = () => {
  const accid = useAccountStore((s) => s.selectedAccount?.id);
  return useQuery({
    queryKey:        [KEY, 'data', accid],
    queryFn:         () => dashboardService.getDashboardData(accid ?? 1),
    enabled:         accid != null,
    staleTime:       REFRESH_MS,
    refetchInterval: REFRESH_MS,
  });
};

/** Unreachable devices. Auto-refreshes every 5 min. */
export const useUnreachableDevices = () => {
  const accid = useAccountStore((s) => s.selectedAccount?.id);
  return useQuery({
    queryKey:        [KEY, 'unreachable', accid],
    queryFn:         () => dashboardService.getUnreachableDevices(accid ?? 1),
    enabled:         accid != null,
    staleTime:       REFRESH_MS,
    refetchInterval: REFRESH_MS,
  });
};

/**
 * Manual refresh — invalidates both dashboard queries simultaneously.
 * Returns { refresh, isRefreshing, lastRefreshTime }.
 */
export const useDashboardRefresh = () => {
  const qc    = useQueryClient();
  const accid = useAccountStore((s) => s.selectedAccount?.id);

  const { isRefetching: r1 } = useQuery({
    queryKey: [KEY, 'data',        accid],
    enabled:  false,  // observer only — not a new fetch
  });
  const { isRefetching: r2 } = useQuery({
    queryKey: [KEY, 'unreachable', accid],
    enabled:  false,
  });

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: [KEY, 'data',        accid] });
    qc.invalidateQueries({ queryKey: [KEY, 'unreachable', accid] });
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
  const query   = useDashboardData();
  const summary = query.data?.summary?.live;
  const data    = summary
    ? [
        { name: 'Moving',      value: summary.online,      color: '#10b981' },
        { name: 'Idle',        value: summary.idle,         color: '#f59e0b' },
        { name: 'Stopped',     value: summary.stopped,      color: '#ef4444' },
        { name: 'Offline',     value: summary.offline,      color: '#94a3b8' },
        { name: 'Unreachable', value: summary.unreachable,  color: '#f43f5e' },
      ].filter((d) => d.value > 0)
    : null;
  return { ...query, data };
};

export const useLiveDevices = () => {
  const query = useDashboardData();
  const vts   = query.data?.VTS?.available ?? [];
  const elk   = query.data?.ELK?.available ?? [];
  return { ...query, data: [...vts, ...elk] };
};

export const useMapViewData = () => {
  const accid = useAccountStore((s) => s.selectedAccount?.id);
  return useQuery({
    queryKey:        [KEY, 'mapview', accid],
    queryFn:         () => dashboardService.getMapViewData(accid ?? 1),
    enabled:         accid != null,
    staleTime:       REFRESH_MS,
    refetchInterval: REFRESH_MS,
  });
};

// Legacy aliases
export const useDailyMovement = useDashboardData;
export const useTopSpeeding   = useDashboardData;
export const useAlertsSummary = useDashboardData;
export const useRecentAlerts  = useDashboardData;

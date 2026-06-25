/**
 * useFleetScan.js — runs the batch agents over the current account's fleet.
 *
 * Reuses the same APIs the dashboard already calls (getAllDevices + getDbAlerts),
 * so no new backend endpoints are required. Re-runs whenever the account changes
 * or the 5-minute refresh fires.
 */
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAccountStore } from "@/store";
import apiService from "@/services/apiService";
import { runFleetScan } from "../core";

const REFRESH_MS = 5 * 60 * 1000;

/** Raw fleet snapshot (devices + alerts) for the selected account. */
function useFleetSnapshot() {
  const accid = useAccountStore((s) => s.selectedAccount?.id);

  return useQuery({
    queryKey: ["agents", "snapshot", accid],
    enabled: accid != null,
    staleTime: REFRESH_MS,
    refetchInterval: REFRESH_MS,
    queryFn: async () => {
      const [devices, alertsRes] = await Promise.all([
        apiService.getAllDevices(accid ?? 1), // normalised VTS+ELK list
        apiService.getDbAlerts(accid ?? 1),
      ]);
      const body = alertsRes?.data;
      const alerts =
        body?.resultCode === 1
          ? { summary: body.data?.summary ?? [], data: body.data?.data ?? [] }
          : { summary: [], data: [] };
      // Agents need the RAW telemetry fields (deviceTime, battery, ign, gps…),
      // which getAllDevices preserves under `.raw`.
      const rawDevices = (devices ?? []).map((d) => d.raw ?? d);
      return { devices: rawDevices, alerts };
    },
  });
}

/**
 * Runs all batch agents and returns the consolidated scan result.
 * @returns {{ scan, isLoading, isFetching, refetch }}
 */
export function useFleetScan() {
  const { data, isLoading, isFetching, refetch } = useFleetSnapshot();

  const scan = useMemo(() => {
    if (!data) return null;
    return runFleetScan({ devices: data.devices, alerts: data.alerts });
  }, [data]);

  return { scan, isLoading, isFetching, refetch };
}

export default useFleetScan;

import { useQuery } from "@tanstack/react-query";
import { useAccountStore } from "@/store";
import { trackingService } from "../services/tracking.service";

// Polls every 15 s to emulate a realtime feed (swap for WebSocket later).
export const useLiveVehicles = () => {
  const accid = useAccountStore((s) => s.selectedAccount?.id);
  return useQuery({
    queryKey: ["tracking", "live", accid],
    queryFn: () => trackingService.getLiveVehicles(accid ?? 1),
    refetchInterval: 3 * 60 * 1000,
    enabled: accid != null,
  });
};

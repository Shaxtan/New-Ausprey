import { useQuery } from '@tanstack/react-query';
import { trackingService } from '../services/tracking.service';

// Polls every 10s to emulate a realtime feed (swap for WebSocket later).
export const useLiveVehicles = () =>
  useQuery({ queryKey: ['tracking', 'live'], queryFn: trackingService.getLiveVehicles, refetchInterval: 10000 });

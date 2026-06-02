import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';

const KEY = 'dashboard';

export const useFleetStats    = () => useQuery({ queryKey: [KEY, 'fleet-stats'],    queryFn: dashboardService.getFleetStats });
export const useVehicleStatus = () => useQuery({ queryKey: [KEY, 'vehicle-status'], queryFn: dashboardService.getVehicleStatus });
export const useDailyMovement = () => useQuery({ queryKey: [KEY, 'daily-movement'], queryFn: dashboardService.getDailyMovement });
export const useTopSpeeding   = () => useQuery({ queryKey: [KEY, 'top-speeding'],   queryFn: dashboardService.getTopSpeeding });
export const useAlertsSummary = () => useQuery({ queryKey: [KEY, 'alerts-summary'], queryFn: dashboardService.getAlertsSummary });
export const useRecentAlerts  = () => useQuery({ queryKey: [KEY, 'recent-alerts'],  queryFn: dashboardService.getRecentAlerts });

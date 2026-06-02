import { useQuery } from '@tanstack/react-query';
import { useAccountStore } from '@/store';
import { dashboardService } from '../services/dashboard.service';

const KEY = 'dashboard';

// accountId is included in queryKey — switching accounts auto-refetches.
export const useFleetStats = () => {
  const accountId = useAccountStore((s) => s.selectedAccount.id);
  return useQuery({
    queryKey: [KEY, 'fleet-stats', accountId],
    queryFn:  () => dashboardService.getFleetStats(accountId),
  });
};

export const useVehicleStatus = () => {
  const accountId = useAccountStore((s) => s.selectedAccount.id);
  return useQuery({
    queryKey: [KEY, 'vehicle-status', accountId],
    queryFn:  () => dashboardService.getVehicleStatus(accountId),
  });
};

export const useDailyMovement = () => {
  const accountId = useAccountStore((s) => s.selectedAccount.id);
  return useQuery({
    queryKey: [KEY, 'daily-movement', accountId],
    queryFn:  () => dashboardService.getDailyMovement(accountId),
  });
};

export const useTopSpeeding   = () => useQuery({ queryKey: [KEY, 'top-speeding'],   queryFn: dashboardService.getTopSpeeding });
export const useAlertsSummary = () => useQuery({ queryKey: [KEY, 'alerts-summary'], queryFn: dashboardService.getAlertsSummary });
export const useRecentAlerts  = () => useQuery({ queryKey: [KEY, 'recent-alerts'],  queryFn: dashboardService.getRecentAlerts });
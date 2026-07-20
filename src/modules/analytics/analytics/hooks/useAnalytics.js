import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services/analytics.service';

const KEY = 'analytics';

// `dateRange` is included in the query key so changing the date picker
// triggers a refetch. The mock service doesn't filter by exact dates yet —
// swap the queryFn for a real API call later and this wiring won't change.
export const useAnalyticsKpis = (dateRange) =>
  useQuery({ queryKey: [KEY, 'kpis', dateRange], queryFn: analyticsService.getKpis });

export const useDistanceTrend = (dateRange) =>
  useQuery({ queryKey: [KEY, 'distance-trend', dateRange], queryFn: analyticsService.getDistanceTrend });

export const useFuelConsumptionTrend = (dateRange) =>
  useQuery({ queryKey: [KEY, 'fuel-trend', dateRange], queryFn: analyticsService.getFuelConsumptionTrend });

export const useVehiclePerformance = (dateRange) =>
  useQuery({ queryKey: [KEY, 'vehicle-performance', dateRange], queryFn: analyticsService.getVehiclePerformance });

export const useIdleTimeAnalysis = (dateRange) =>
  useQuery({ queryKey: [KEY, 'idle-time', dateRange], queryFn: analyticsService.getIdleTimeAnalysis });

export const useSpeedCompliance = (dateRange) =>
  useQuery({ queryKey: [KEY, 'speed-compliance', dateRange], queryFn: analyticsService.getSpeedCompliance });

export const useDriverPerformance = (dateRange) =>
  useQuery({ queryKey: [KEY, 'driver-performance', dateRange], queryFn: analyticsService.getDriverPerformance });

export const useCostBreakdown = (dateRange) =>
  useQuery({ queryKey: [KEY, 'cost-breakdown', dateRange], queryFn: analyticsService.getCostBreakdown });

export const useInsights = (dateRange) =>
  useQuery({ queryKey: [KEY, 'insights', dateRange], queryFn: analyticsService.getInsights });

// Not date-range scoped — used by the Utilization and Trip Performance tabs.
export const useUtilizationTrend = () =>
  useQuery({ queryKey: [KEY, 'utilization'], queryFn: analyticsService.getUtilizationTrend });

export const useTopRoutes = () =>
  useQuery({ queryKey: [KEY, 'top-routes'], queryFn: analyticsService.getTopRoutes });
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services/analytics.service';

const KEY = 'analytics';
export const useAnalyticsKpis = () => useQuery({ queryKey: [KEY, 'kpis'], queryFn: analyticsService.getKpis });
export const useUtilizationTrend = () => useQuery({ queryKey: [KEY, 'utilization'], queryFn: analyticsService.getUtilizationTrend });
export const useDistanceVsFuel = () => useQuery({ queryKey: [KEY, 'distance-fuel'], queryFn: analyticsService.getDistanceVsFuel });
export const useFleetMix = () => useQuery({ queryKey: [KEY, 'fleet-mix'], queryFn: analyticsService.getFleetMix });
export const useTopRoutes = () => useQuery({ queryKey: [KEY, 'top-routes'], queryFn: analyticsService.getTopRoutes });

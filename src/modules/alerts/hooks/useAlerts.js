import { useQuery } from '@tanstack/react-query';
import { alertsService } from '../services/alerts.service';

const KEY = 'alerts';
export const useAlertStats = () => useQuery({ queryKey: [KEY, 'stats'], queryFn: alertsService.getStats });
export const useAlertSummary = () => useQuery({ queryKey: [KEY, 'summary'], queryFn: alertsService.getSummary });
export const useAlerts = () => useQuery({ queryKey: [KEY, 'list'], queryFn: alertsService.getAlerts });

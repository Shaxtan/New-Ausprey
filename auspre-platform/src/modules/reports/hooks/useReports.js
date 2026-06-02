import { useQuery } from '@tanstack/react-query';
import { reportsService } from '../services/reports.service';

const KEY = 'reports';
export const useReportTypes = () => useQuery({ queryKey: [KEY, 'types'], queryFn: reportsService.getReportTypes });
export const useReportSummary = () => useQuery({ queryKey: [KEY, 'summary'], queryFn: reportsService.getSummary });
export const useDistanceSeries = () => useQuery({ queryKey: [KEY, 'distance'], queryFn: reportsService.getDistanceSeries });
export const useReportRows = () => useQuery({ queryKey: [KEY, 'rows'], queryFn: reportsService.getRows });

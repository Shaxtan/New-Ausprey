import { useQuery } from '@tanstack/react-query';
import { tripsService } from '../services/trips.service';

const KEY = 'trips';
export const useTripStats = () => useQuery({ queryKey: [KEY, 'stats'], queryFn: tripsService.getStats });
export const useTrips     = () => useQuery({ queryKey: [KEY, 'list'],  queryFn: tripsService.getTrips  });
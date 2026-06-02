import { useQuery } from '@tanstack/react-query';
import { geofenceService } from '../services/geofence.service';

const KEY = 'geofence';
export const useGeofences = () => useQuery({ queryKey: [KEY, 'list'], queryFn: geofenceService.getGeofences });
export const useGeofenceStats = () => useQuery({ queryKey: [KEY, 'stats'], queryFn: geofenceService.getStats });

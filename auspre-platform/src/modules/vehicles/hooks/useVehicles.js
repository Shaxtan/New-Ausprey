import { useQuery } from '@tanstack/react-query';
import { vehiclesService } from '../services/vehicles.service';

const KEY = 'vehicles';
export const useVehicleStats = () => useQuery({ queryKey: [KEY, 'stats'], queryFn: vehiclesService.getStats });
export const useVehicles = () => useQuery({ queryKey: [KEY, 'list'], queryFn: vehiclesService.getVehicles });

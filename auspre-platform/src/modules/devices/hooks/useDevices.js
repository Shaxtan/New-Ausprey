import { useQuery } from '@tanstack/react-query';
import { devicesService } from '../services/devices.service';

const KEY = 'devices';
export const useDeviceStats = () => useQuery({ queryKey: [KEY, 'stats'], queryFn: devicesService.getStats });
export const useDevices = () => useQuery({ queryKey: [KEY, 'list'], queryFn: devicesService.getDevices });

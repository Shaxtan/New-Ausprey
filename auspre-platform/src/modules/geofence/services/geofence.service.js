import { mockDelay } from '@/services/mockDelay';

const geofences = [
  { id: 1, name: 'Warehouse Zone', type: 'In/Out', entry: true, exit: true, color: '#2563eb', vehicles: 124, lat: 12.9716, lng: 77.5946, radius: 1200 },
  { id: 2, name: 'City Center', type: 'In', entry: true, exit: false, color: '#10b981', vehicles: 86, lat: 12.9750, lng: 77.6050, radius: 900 },
  { id: 3, name: 'Restricted Area', type: 'Out', entry: false, exit: true, color: '#f43f5e', vehicles: 12, lat: 12.9600, lng: 77.5800, radius: 700 },
  { id: 4, name: 'Depot North', type: 'In/Out', entry: true, exit: true, color: '#f59e0b', vehicles: 54, lat: 13.0100, lng: 77.5700, radius: 1000 },
];

const stats = { total: 18, active: 16, violationsToday: 23, vehiclesInside: 264 };

export const geofenceService = {
  getGeofences: () => mockDelay(geofences),
  getStats: () => mockDelay(stats),
};

export default geofenceService;

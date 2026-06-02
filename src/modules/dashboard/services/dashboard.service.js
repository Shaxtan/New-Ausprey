import { mockDelay } from '@/services/mockDelay';
// import { apiClient } from '@/services/apiClient'; // swap mocks for these

const fleetStats = {
  totalVehicles: 1245, activeVehicles: 1034, totalDistance: 45892, totalAlerts: 128, avgSpeed: 56,
  live: { online: 1034, idle: 156, offline: 55, activeTrips: 128 },
};
const vehicleStatus = [
  { name: 'Moving', value: 1034, color: '#10b981' },
  { name: 'Stopped', value: 156, color: '#f59e0b' },
  { name: 'Inactive', value: 55, color: '#cbd5e1' },
];
const dailyMovement = [
  { name: '14 May', value: 12400 }, { name: '15 May', value: 9600 }, { name: '16 May', value: 15200 },
  { name: '17 May', value: 13100 }, { name: '18 May', value: 11800 }, { name: '19 May', value: 16400 }, { name: '20 May', value: 14200 },
];
const topSpeeding = [
  { id: 1, vehicle: 'KA01AB1234', speed: 98 }, { id: 2, vehicle: 'KA05CD5678', speed: 92 },
  { id: 3, vehicle: 'KA03EF9012', speed: 91 }, { id: 4, vehicle: 'KA02GH3456', speed: 90 }, { id: 5, vehicle: 'KA04IJ7890', speed: 88 },
];
const alertsSummary = [
  { name: 'Overspeed', value: 45, color: '#ef4444' }, { name: 'Geofence', value: 32, color: '#10b981' },
  { name: 'Ign ON', value: 21, color: '#2563eb' }, { name: 'Ign OFF', value: 18, color: '#8b5cf6' },
  { name: 'Power Cut', value: 8, color: '#f59e0b' }, { name: 'SOS', value: 4, color: '#f43f5e' },
];
const recentAlerts = [
  { id: 1, type: 'Overspeed', color: '#e11d48', vehicle: 'KA01AB1234', time: '2024-05-20T08:15:00', location: 'Bangalore, Karnataka' },
  { id: 2, type: 'Geofence In', color: '#0369a1', vehicle: 'KA05CD5678', time: '2024-05-20T09:15:00', location: 'Tumkur, Karnataka' },
  { id: 3, type: 'Ignition ON', color: '#047857', vehicle: 'KA03EF9012', time: '2024-05-20T08:42:00', location: 'Mysore, Karnataka' },
  { id: 4, type: 'Power Cut', color: '#b45309', vehicle: 'KA02GH3456', time: '2024-05-20T07:50:00', location: 'Hassan, Karnataka' },
  { id: 5, type: 'Geofence Out', color: '#6d28d9', vehicle: 'KA04IJ7890', time: '2024-05-20T07:20:00', location: 'Mandya, Karnataka' },
];

export const dashboardService = {
  getFleetStats: () => mockDelay(fleetStats),
  getVehicleStatus: () => mockDelay(vehicleStatus),
  getDailyMovement: () => mockDelay(dailyMovement),
  getTopSpeeding: () => mockDelay(topSpeeding),
  getAlertsSummary: () => mockDelay(alertsSummary),
  getRecentAlerts: () => mockDelay(recentAlerts),
};

export default dashboardService;

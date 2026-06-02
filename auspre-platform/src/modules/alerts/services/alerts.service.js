import { mockDelay } from '@/services/mockDelay';

const stats = { total: 128, critical: 14, resolved: 96, pending: 32 };

const summary = [
  { name: 'Overspeed', value: 45, color: '#ef4444' }, { name: 'Geofence', value: 32, color: '#10b981' },
  { name: 'Ign ON', value: 21, color: '#2563eb' }, { name: 'Ign OFF', value: 18, color: '#8b5cf6' },
  { name: 'Power Cut', value: 8, color: '#f59e0b' }, { name: 'SOS', value: 4, color: '#f43f5e' },
];

const alerts = [
  { id: 1, type: 'Overspeed', severity: 'Critical', color: '#e11d48', vehicle: 'KA01AB1234', driver: 'Ramesh Kumar', time: '2024-05-20T08:15:00', location: 'Bangalore', status: 'Pending' },
  { id: 2, type: 'Geofence In', severity: 'Info', color: '#0369a1', vehicle: 'KA05CD5678', driver: 'Amit Singh', time: '2024-05-20T09:15:00', location: 'Tumkur', status: 'Resolved' },
  { id: 3, type: 'Ignition ON', severity: 'Info', color: '#047857', vehicle: 'KA03EF9012', driver: 'Neha Patel', time: '2024-05-20T08:42:00', location: 'Mysore', status: 'Resolved' },
  { id: 4, type: 'Power Cut', severity: 'Critical', color: '#b45309', vehicle: 'KA02GH3456', driver: 'Deepak Sharma', time: '2024-05-20T07:50:00', location: 'Hassan', status: 'Pending' },
  { id: 5, type: 'SOS', severity: 'Critical', color: '#f43f5e', vehicle: 'KA04IJ7890', driver: 'Vikram Singh', time: '2024-05-20T07:20:00', location: 'Mandya', status: 'Pending' },
  { id: 6, type: 'Geofence Out', severity: 'Warning', color: '#6d28d9', vehicle: 'KA09KL2345', driver: 'Suresh Yadav', time: '2024-05-20T06:58:00', location: 'Bangalore', status: 'Resolved' },
  { id: 7, type: 'Overspeed', severity: 'Warning', color: '#e11d48', vehicle: 'KA11MN6789', driver: 'Rahul Verma', time: '2024-05-20T06:30:00', location: 'Hubli', status: 'Resolved' },
];

export const alertsService = {
  getStats: () => mockDelay(stats),
  getSummary: () => mockDelay(summary),
  getAlerts: () => mockDelay(alerts),
};

export default alertsService;

import { mockDelay } from '@/services/mockDelay';

const stats = { total: 1245, online: 1158, offline: 87, lowBattery: 34 };

const devices = [
  { id: 'GPS-100234', type: 'GPS Tracker', vehicle: 'KA01AB1234', status: 'Online', battery: 86, signal: 92, firmware: 'v3.4.1', lastSeen: '2024-05-20T10:23:00' },
  { id: 'GPS-100235', type: 'GPS Tracker', vehicle: 'KA05CD5678', status: 'Online', battery: 64, signal: 78, firmware: 'v3.4.1', lastSeen: '2024-05-20T10:21:00' },
  { id: 'OBD-200110', type: 'OBD-II Sensor', vehicle: 'KA03EF9012', status: 'Offline', battery: 12, signal: 0, firmware: 'v2.8.0', lastSeen: '2024-05-20T07:58:00' },
  { id: 'FUEL-300087', type: 'Fuel Sensor', vehicle: 'KA02GH3456', status: 'Online', battery: 91, signal: 88, firmware: 'v1.9.2', lastSeen: '2024-05-20T10:24:00' },
  { id: 'TEMP-400055', type: 'Temperature', vehicle: 'KA04IJ7890', status: 'Online', battery: 73, signal: 81, firmware: 'v1.2.5', lastSeen: '2024-05-20T10:20:00' },
  { id: 'GPS-100240', type: 'GPS Tracker', vehicle: 'KA09KL2345', status: 'Online', battery: 18, signal: 64, firmware: 'v3.4.0', lastSeen: '2024-05-20T10:18:00' },
  { id: 'OBD-200118', type: 'OBD-II Sensor', vehicle: 'KA11MN6789', status: 'Offline', battery: 0, signal: 0, firmware: 'v2.7.3', lastSeen: '2024-05-19T21:40:00' },
];

export const devicesService = {
  getStats: () => mockDelay(stats),
  getDevices: () => mockDelay(devices),
};

export default devicesService;

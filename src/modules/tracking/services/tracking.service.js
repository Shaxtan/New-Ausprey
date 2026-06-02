import { mockDelay } from '@/services/mockDelay';

const liveVehicles = [
  { id: 'KA01AB1234', reg: 'KA01AB1234', status: 'Moving', speed: 56, driver: 'Ramesh', ignition: 'ON', location: 'Outer Ring Rd, Bangalore', lat: 12.9716, lng: 77.5946, lastUpdate: '2024-05-20T10:23:00' },
  { id: 'KA05CD5678', reg: 'KA05CD5678', status: 'Moving', speed: 48, driver: 'Amit', ignition: 'ON', location: 'Tumkur Rd', lat: 13.0410, lng: 77.5050, lastUpdate: '2024-05-20T10:21:00' },
  { id: 'KA03EF9012', reg: 'KA03EF9012', status: 'Stopped', speed: 0, driver: 'Neha', ignition: 'OFF', location: 'Mysore Rd', lat: 12.9100, lng: 77.5200, lastUpdate: '2024-05-20T09:58:00' },
  { id: 'KA02GH3456', reg: 'KA02GH3456', status: 'Moving', speed: 63, driver: 'Deepak', ignition: 'ON', location: 'Hosur Rd', lat: 12.9050, lng: 77.6400, lastUpdate: '2024-05-20T10:24:00' },
  { id: 'KA04IJ7890', reg: 'KA04IJ7890', status: 'Moving', speed: 51, driver: 'Vikram', ignition: 'ON', location: 'Whitefield', lat: 12.9698, lng: 77.7500, lastUpdate: '2024-05-20T10:22:00' },
];

export const trackingService = {
  getLiveVehicles: () => mockDelay(liveVehicles, 500),
};

export default trackingService;

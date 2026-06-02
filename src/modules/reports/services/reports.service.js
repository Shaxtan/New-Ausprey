import { mockDelay } from '@/services/mockDelay';

const reportTypes = [
  { id: 'distance', name: 'Distance Report', desc: 'Daily distance per vehicle' },
  { id: 'trips', name: 'Trip Report', desc: 'Completed trips & duration' },
  { id: 'fuel', name: 'Fuel Report', desc: 'Consumption & efficiency' },
  { id: 'idle', name: 'Idle Report', desc: 'Idling time analysis' },
  { id: 'speed', name: 'Overspeed Report', desc: 'Violations by vehicle' },
  { id: 'stoppage', name: 'Stoppage Report', desc: 'Stop duration & location' },
];

const summary = { totalDistance: 45892, totalTrips: 1284, avgTrip: 35.7, fuelUsed: 6120 };

const distanceSeries = [
  { name: 'Mon', value: 6240 }, { name: 'Tue', value: 5870 }, { name: 'Wed', value: 7120 },
  { name: 'Thu', value: 6680 }, { name: 'Fri', value: 7430 }, { name: 'Sat', value: 5210 }, { name: 'Sun', value: 4120 },
];

const rows = [
  { id: 1, vehicle: 'KA01AB1234', distance: 412, trips: 14, fuel: 58, idle: '1h 12m' },
  { id: 2, vehicle: 'KA05CD5678', distance: 388, trips: 11, fuel: 49, idle: '0h 48m' },
  { id: 3, vehicle: 'KA03EF9012', distance: 356, trips: 9, fuel: 44, idle: '2h 05m' },
  { id: 4, vehicle: 'KA02GH3456', distance: 503, trips: 16, fuel: 71, idle: '0h 36m' },
  { id: 5, vehicle: 'KA04IJ7890', distance: 297, trips: 8, fuel: 39, idle: '1h 40m' },
];

export const reportsService = {
  getReportTypes: () => mockDelay(reportTypes, 300),
  getSummary: () => mockDelay(summary),
  getDistanceSeries: () => mockDelay(distanceSeries),
  getRows: () => mockDelay(rows),
};

export default reportsService;

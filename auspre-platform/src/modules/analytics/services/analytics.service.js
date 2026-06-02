import { mockDelay } from '@/services/mockDelay';

const kpis = { utilization: 78.4, avgDistance: 312, fuelEfficiency: 7.6, onTime: 94.2 };

const utilizationTrend = [
  { name: 'Wk1', value: 72 }, { name: 'Wk2', value: 75 }, { name: 'Wk3', value: 71 },
  { name: 'Wk4', value: 78 }, { name: 'Wk5', value: 80 }, { name: 'Wk6', value: 78 },
];

const distanceVsFuel = [
  { name: 'Mon', distance: 6240, fuel: 820 }, { name: 'Tue', distance: 5870, fuel: 770 },
  { name: 'Wed', distance: 7120, fuel: 910 }, { name: 'Thu', distance: 6680, fuel: 860 },
  { name: 'Fri', distance: 7430, fuel: 960 }, { name: 'Sat', distance: 5210, fuel: 690 }, { name: 'Sun', distance: 4120, fuel: 540 },
];

const fleetMix = [
  { name: 'Light Trucks', value: 540, color: '#2563eb' },
  { name: 'Medium Trucks', value: 410, color: '#10b981' },
  { name: 'Heavy Trucks', value: 220, color: '#f59e0b' },
  { name: 'Vans', value: 75, color: '#8b5cf6' },
];

const topRoutes = [
  { id: 1, route: 'Bangalore → Mysore', trips: 142, distance: 21300 },
  { id: 2, route: 'Bangalore → Tumkur', trips: 118, distance: 8260 },
  { id: 3, route: 'Bangalore → Hosur', trips: 96, distance: 3840 },
  { id: 4, route: 'Mysore → Mandya', trips: 74, distance: 3330 },
];

export const analyticsService = {
  getKpis: () => mockDelay(kpis),
  getUtilizationTrend: () => mockDelay(utilizationTrend),
  getDistanceVsFuel: () => mockDelay(distanceVsFuel),
  getFleetMix: () => mockDelay(fleetMix),
  getTopRoutes: () => mockDelay(topRoutes),
};

export default analyticsService;

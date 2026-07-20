import { mockDelay } from '@/services/mockDelay';

// Small jitter so refetching (e.g. after changing the date range) feels
// alive without a real backend yet — doesn't currently filter by date.
const jitter = (base, pct = 0.04) => Math.round(base + base * pct * (Math.random() * 2 - 1));
const jitterFloat = (base, pct = 0.04, decimals = 1) =>
  Number((base + base * pct * (Math.random() * 2 - 1)).toFixed(decimals));

const BASE_KPIS = {
  totalDistance: 12540, totalDistanceTrend: 8.5,
  totalFuel: 3245, totalFuelTrend: 6.2,
  fuelEfficiency: 3.86, fuelEfficiencyTrend: 4.1,
  engineHours: 1024, engineHoursTrend: 7.8,
  operatingCost: 248750, operatingCostTrend: -3.4,
  utilizationRate: 78.6, utilizationRateTrend: 5.3,
};

const DAY_LABELS = ['12 May', '13 May', '14 May', '15 May', '16 May', '17 May', '18 May'];
const DISTANCE_THIS_WEEK = [1620, 2080, 1580, 1310, 1740, 2240, 1970]; // sums to 12,540
const DISTANCE_LAST_WEEK = [1080, 1620, 1890, 1120, 1430, 1860, 1400];
const FUEL_THIS_WEEK = [420, 450, 540, 470, 510, 580, 275]; // sums to 3,245
const FUEL_LAST_WEEK = [380, 430, 500, 430, 470, 540, 250];

const VEHICLE_PERFORMANCE = [
  { name: 'HR 55 AB 1234', value: 2450, color: '#2563eb' },
  { name: 'DL 1L AF 5678', value: 2180, color: '#f59e0b' },
  { name: 'HR 26 DA 9876', value: 1920, color: '#10b981' },
  { name: 'RJ 14 CA 6789', value: 1640, color: '#8b5cf6' },
  { name: 'Others (45)',   value: 4350, color: '#94a3b8' },
]; // sums to 12,540

const IDLE_BREAKDOWN = {
  totalIdleHours: 235,
  trend: -6.4,
  segments: [
    { name: 'Moving',  value: 1024, color: '#10b981' },
    { name: 'Idle',    value: 235,  color: '#f59e0b' },
    { name: 'Stopped', value: 136,  color: '#ef4444' },
  ],
};

const SPEED_COMPLIANCE = {
  compliantPct: 78.4,
  segments: [
    { name: 'Compliant',       value: 78.4, trend: 9.3,  color: '#10b981' },
    { name: 'Minor Violation', value: 15.6, trend: -2.1, color: '#f59e0b' },
    { name: 'Major Violation', value: 6.0,  trend: -7.2, color: '#ef4444' },
  ],
};

const DRIVER_PERFORMANCE = [
  { name: 'Ravi Kumar',    score: 94 },
  { name: 'Suresh Yadav',  score: 88 },
  { name: 'Amit Singh',    score: 82 },
  { name: 'Vikram Patel',  score: 78 },
  { name: 'Pankaj Sharma', score: 71 },
];

const COST_BREAKDOWN = {
  totalCost: 248750,
  segments: [
    { name: 'Fuel Cost',      value: 132450, color: '#2563eb' },
    { name: 'Maintenance',    value: 62300,  color: '#f59e0b' },
    { name: 'Toll & Parking', value: 28750,  color: '#10b981' },
    { name: 'Others',         value: 25250,  color: '#8b5cf6' },
  ],
}; // sums to 248,750

const INSIGHTS = [
  { icon: 'route', text: 'Fuel efficiency improved by 4.1% compared to last week.' },
  { icon: 'check', text: 'Idle time reduced by 6.4% improving overall efficiency.' },
  { icon: 'trend', text: 'Speed compliance improved by 9.3% ensuring better safety.' },
  { icon: 'rupee', text: 'Operating cost reduced by 3.4% through better utilization.' },
];

const UTILIZATION_TREND = [
  { name: 'Wk 1', value: 70.2 },
  { name: 'Wk 2', value: 72.8 },
  { name: 'Wk 3', value: 74.5 },
  { name: 'Wk 4', value: 73.9 },
  { name: 'Wk 5', value: 76.7 },
  { name: 'Wk 6', value: 78.6 },
];

const TOP_ROUTES = [
  { id: 1, route: 'Pune → Mumbai',      trips: 42, distance: 6552 },
  { id: 2, route: 'Mumbai → Pune',      trips: 40, distance: 6240 },
  { id: 3, route: 'Pune → Nashik',      trips: 18, distance: 3204 },
  { id: 4, route: 'Pune → Aurangabad',  trips: 12, distance: 3552 },
  { id: 5, route: 'Pune → Kolhapur',    trips: 9,  distance: 2205 },
];

export const analyticsService = {
  getKpis: () =>
    mockDelay({
      totalDistance: jitter(BASE_KPIS.totalDistance),
      totalDistanceTrend: jitterFloat(BASE_KPIS.totalDistanceTrend),
      totalFuel: jitter(BASE_KPIS.totalFuel),
      totalFuelTrend: jitterFloat(BASE_KPIS.totalFuelTrend),
      fuelEfficiency: jitterFloat(BASE_KPIS.fuelEfficiency, 0.03, 2),
      fuelEfficiencyTrend: jitterFloat(BASE_KPIS.fuelEfficiencyTrend),
      engineHours: jitter(BASE_KPIS.engineHours),
      engineHoursTrend: jitterFloat(BASE_KPIS.engineHoursTrend),
      operatingCost: jitter(BASE_KPIS.operatingCost),
      operatingCostTrend: jitterFloat(BASE_KPIS.operatingCostTrend),
      utilizationRate: jitterFloat(BASE_KPIS.utilizationRate),
      utilizationRateTrend: jitterFloat(BASE_KPIS.utilizationRateTrend),
    }, 350),

  getDistanceTrend: () =>
    mockDelay(DAY_LABELS.map((day, i) => ({
      day, thisWeek: DISTANCE_THIS_WEEK[i], lastWeek: DISTANCE_LAST_WEEK[i],
    })), 400),

  getFuelConsumptionTrend: () =>
    mockDelay(DAY_LABELS.map((day, i) => ({
      day, thisWeek: FUEL_THIS_WEEK[i], lastWeek: FUEL_LAST_WEEK[i],
    })), 400),

  getVehiclePerformance: () =>
    mockDelay({
      totalDistance: VEHICLE_PERFORMANCE.reduce((s, v) => s + v.value, 0),
      vehicles: VEHICLE_PERFORMANCE,
    }, 350),

  getIdleTimeAnalysis: () => mockDelay(IDLE_BREAKDOWN, 350),
  getSpeedCompliance:  () => mockDelay(SPEED_COMPLIANCE, 350),
  getDriverPerformance: () => mockDelay(DRIVER_PERFORMANCE, 350),
  getCostBreakdown: () => mockDelay(COST_BREAKDOWN, 350),
  getInsights: () => mockDelay(INSIGHTS, 300),
  getUtilizationTrend: () => mockDelay(UTILIZATION_TREND, 400),
  getTopRoutes: () => mockDelay(TOP_ROUTES, 400),
};

export default analyticsService;
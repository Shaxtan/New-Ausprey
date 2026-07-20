import { Route, Fuel, Gauge, Cog, IndianRupee, PieChart } from 'lucide-react';
import { KpiCard, Trend } from '@/components/common';

const formatINR = (v) => `₹${Math.round(v ?? 0).toLocaleString('en-IN')}`;
const formatKm  = (v) => `${Math.round(v ?? 0).toLocaleString('en-IN')} km`;
const formatHr  = (v) => `${Math.round(v ?? 0).toLocaleString('en-IN')} hr`;
const formatLtr = (v) => `${Math.round(v ?? 0).toLocaleString('en-IN')} Ltr`;

// `invert`: for metrics where a DECREASE is the good outcome (e.g. cost),
// so the arrow/colour still reads as "positive" even though the sign is negative.
const trendProps = (v, invert = false) => {
  const positive = invert ? v <= 0 : v >= 0;
  return {
    value: `${v > 0 ? '+' : ''}${v}% vs last week`,
    direction: positive ? 'up' : 'down',
  };
};

export function AnalyticsKpis({ kpis, loading }) {
  const cards = [
    {
      icon: Route, iconBg: '#eff6ff', iconColor: '#2563eb',
      label: 'Total Distance', value: kpis ? formatKm(kpis.totalDistance) : '—',
      trend: <Trend {...trendProps(kpis?.totalDistanceTrend ?? 0)} />,
    },
    {
      icon: Fuel, iconBg: '#fffbeb', iconColor: '#f59e0b',
      label: 'Total Fuel Used', value: kpis ? formatLtr(kpis.totalFuel) : '—',
      trend: <Trend {...trendProps(kpis?.totalFuelTrend ?? 0)} />,
    },
    {
      icon: Gauge, iconBg: '#ecfdf5', iconColor: '#10b981',
      label: 'Avg. Fuel Efficiency', value: kpis ? `${kpis.fuelEfficiency} km/L` : '—',
      trend: <Trend {...trendProps(kpis?.fuelEfficiencyTrend ?? 0)} />,
    },
    {
      icon: Cog, iconBg: '#f5f3ff', iconColor: '#8b5cf6',
      label: 'Total Engine Hours', value: kpis ? formatHr(kpis.engineHours) : '—',
      trend: <Trend {...trendProps(kpis?.engineHoursTrend ?? 0)} />,
    },
    {
      icon: IndianRupee, iconBg: '#fef2f2', iconColor: '#e11d48',
      label: 'Operating Cost', value: kpis ? formatINR(kpis.operatingCost) : '—',
      trend: <Trend {...trendProps(kpis?.operatingCostTrend ?? 0, true)} />,
    },
    {
      icon: PieChart, iconBg: '#ecfeff', iconColor: '#0891b2',
      label: 'Utilization Rate', value: kpis ? `${kpis.utilizationRate}%` : '—',
      trend: <Trend {...trendProps(kpis?.utilizationRateTrend ?? 0)} />,
    },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 mb-5">
      {cards.map((c, i) => <KpiCard key={c.label} {...c} index={i} loading={loading} />)}
    </div>
  );
}

export default AnalyticsKpis;
import { Activity, MapPin, Fuel, Timer } from 'lucide-react';
import { KpiCard, Trend } from '@/components/common';
import { formatPercent, formatKm } from '@/utils';

export function AnalyticsKpis({ kpis, loading }) {
  const cards = [
    { icon: Activity, iconBg: '#eff6ff', iconColor: '#2563eb', label: 'Fleet Utilization', value: formatPercent(kpis?.utilization), trend: <Trend value="+3.2%" direction="up" /> },
    { icon: MapPin, iconBg: '#ecfdf5', iconColor: '#10b981', label: 'Avg Distance / Vehicle', value: formatKm(kpis?.avgDistance), trend: <Trend value="+5.1%" direction="up" /> },
    { icon: Fuel, iconBg: '#fffbeb', iconColor: '#f59e0b', label: 'Fuel Efficiency', value: kpis ? `${kpis.fuelEfficiency} km/L` : '—', trend: <Trend value="-0.4%" direction="down" /> },
    { icon: Timer, iconBg: '#f5f3ff', iconColor: '#8b5cf6', label: 'On-Time Rate', value: formatPercent(kpis?.onTime), trend: <Trend value="+1.8%" direction="up" /> },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
      {cards.map((c, i) => <KpiCard key={c.label} {...c} index={i} loading={loading} />)}
    </div>
  );
}

export default AnalyticsKpis;

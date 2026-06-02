import { Truck, Activity, Wrench, PauseCircle } from 'lucide-react';
import { KpiCard, Trend } from '@/components/common';
import { formatNumber } from '@/utils';

export function VehicleStatsCards({ stats, loading }) {
  const cards = [
    { icon: Truck, iconBg: '#eff6ff', iconColor: '#2563eb', label: 'Total Vehicles', value: formatNumber(stats?.total), trend: <Trend value="+12" direction="up" /> },
    { icon: Activity, iconBg: '#ecfdf5', iconColor: '#10b981', label: 'Active', value: formatNumber(stats?.active), trend: <Trend value="+3.1%" direction="up" /> },
    { icon: Wrench, iconBg: '#fffbeb', iconColor: '#f59e0b', label: 'In Maintenance', value: formatNumber(stats?.maintenance), trend: <Trend value="-2" direction="down" /> },
    { icon: PauseCircle, iconBg: '#f1f5f9', iconColor: '#64748b', label: 'Idle', value: formatNumber(stats?.idle), trend: <Trend value="No change" neutral /> },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
      {cards.map((c, i) => <KpiCard key={c.label} {...c} index={i} loading={loading} />)}
    </div>
  );
}

export default VehicleStatsCards;

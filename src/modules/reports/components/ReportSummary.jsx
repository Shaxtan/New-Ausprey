import { Route, MapPin, Gauge, Fuel } from 'lucide-react';
import { KpiCard, Trend } from '@/components/common';
import { formatNumber, formatKm } from '@/utils';

export function ReportSummary({ summary, loading }) {
  const cards = [
    { icon: MapPin, iconBg: '#eff6ff', iconColor: '#2563eb', label: 'Total Distance', value: formatKm(summary?.totalDistance), trend: <Trend value="+8.7%" direction="up" /> },
    { icon: Route, iconBg: '#ecfdf5', iconColor: '#10b981', label: 'Total Trips', value: formatNumber(summary?.totalTrips), trend: <Trend value="+4.1%" direction="up" /> },
    { icon: Gauge, iconBg: '#fffbeb', iconColor: '#f59e0b', label: 'Avg Trip', value: summary ? `${summary.avgTrip} km` : '—', trend: <Trend value="-1.2%" direction="down" /> },
    { icon: Fuel, iconBg: '#f5f3ff', iconColor: '#8b5cf6', label: 'Fuel Used', value: summary ? `${formatNumber(summary.fuelUsed)} L` : '—', trend: <Trend value="+2.3%" direction="up" /> },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
      {cards.map((c, i) => <KpiCard key={c.label} {...c} index={i} loading={loading} />)}
    </div>
  );
}

export default ReportSummary;

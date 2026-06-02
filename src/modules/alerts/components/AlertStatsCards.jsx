import { Bell, AlertOctagon, CheckCircle2, Clock } from 'lucide-react';
import { KpiCard, Trend } from '@/components/common';
import { formatNumber } from '@/utils';

export function AlertStatsCards({ stats, loading }) {
  const cards = [
    { icon: Bell, iconBg: '#eff6ff', iconColor: '#2563eb', label: 'Total Alerts', value: formatNumber(stats?.total), trend: <Trend value="-5.4%" direction="down" /> },
    { icon: AlertOctagon, iconBg: '#fff1f2', iconColor: '#f43f5e', label: 'Critical', value: formatNumber(stats?.critical), trend: <Trend value="+2" direction="up" /> },
    { icon: CheckCircle2, iconBg: '#ecfdf5', iconColor: '#10b981', label: 'Resolved', value: formatNumber(stats?.resolved), trend: <Trend value="+12%" direction="up" /> },
    { icon: Clock, iconBg: '#fffbeb', iconColor: '#f59e0b', label: 'Pending', value: formatNumber(stats?.pending), trend: <Trend value="-3" direction="down" /> },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
      {cards.map((c, i) => <KpiCard key={c.label} {...c} index={i} loading={loading} />)}
    </div>
  );
}

export default AlertStatsCards;

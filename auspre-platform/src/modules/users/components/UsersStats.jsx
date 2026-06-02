import { Users, UserCheck, UserX, Shield, ShieldCheck } from 'lucide-react';
import { KpiCard, Trend } from '@/components/common';
import { formatNumber } from '@/utils';

export function UsersStats({ stats, loading }) {
  const cards = [
    { icon: Users, iconBg: '#eff6ff', iconColor: '#2563eb', label: 'Total Users', value: formatNumber(stats?.total), trend: <Trend value="+8" direction="up" /> },
    { icon: UserCheck, iconBg: '#ecfdf5', iconColor: '#10b981', label: 'Active', value: formatNumber(stats?.active), trend: <Trend value="83.2%" direction="up" suffix="of total" /> },
    { icon: UserX, iconBg: '#fff1f2', iconColor: '#f43f5e', label: 'Inactive', value: formatNumber(stats?.inactive), trend: <Trend value="-3" direction="down" /> },
    { icon: Shield, iconBg: '#fffbeb', iconColor: '#f59e0b', label: 'Total Roles', value: formatNumber(stats?.totalRoles), trend: <Trend value="No change" neutral /> },
    { icon: ShieldCheck, iconBg: '#f5f3ff', iconColor: '#8b5cf6', label: 'Administrators', value: formatNumber(stats?.administrators), trend: <Trend value="+1" direction="up" /> },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-5">
      {cards.map((c, i) => <KpiCard key={c.label} {...c} index={i} loading={loading} />)}
    </div>
  );
}

export default UsersStats;

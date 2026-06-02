import { Radio, Wifi, WifiOff, BatteryLow } from 'lucide-react';
import { KpiCard, Trend } from '@/components/common';
import { formatNumber } from '@/utils';

export function DeviceStats({ stats, loading }) {
  const cards = [
    { icon: Radio, iconBg: '#eff6ff', iconColor: '#2563eb', label: 'Total Devices', value: formatNumber(stats?.total), trend: <Trend value="+15" direction="up" /> },
    { icon: Wifi, iconBg: '#ecfdf5', iconColor: '#10b981', label: 'Online', value: formatNumber(stats?.online), trend: <Trend value="93%" direction="up" suffix="uptime" /> },
    { icon: WifiOff, iconBg: '#f1f5f9', iconColor: '#64748b', label: 'Offline', value: formatNumber(stats?.offline), trend: <Trend value="+4" direction="up" /> },
    { icon: BatteryLow, iconBg: '#fff1f2', iconColor: '#f43f5e', label: 'Low Battery', value: formatNumber(stats?.lowBattery), trend: <Trend value="+6" direction="up" /> },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
      {cards.map((c, i) => <KpiCard key={c.label} {...c} index={i} loading={loading} />)}
    </div>
  );
}

export default DeviceStats;

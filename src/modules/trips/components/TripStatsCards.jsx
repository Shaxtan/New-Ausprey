import { ClipboardList, Truck, MapPin, Flag, AlertTriangle } from 'lucide-react';
import { KpiCard } from '@/components/common';
import { formatNumber } from '@/utils';
export function TripStatsCards({ stats, loading }) {
  const cards = [
    { icon:ClipboardList, iconBg:'#eff6ff', iconColor:'#2563eb', label:'Total Trips',    value:formatNumber(stats?.total??0) },
    { icon:Truck,         iconBg:'#ecfdf5', iconColor:'#10b981', label:'In Transit',     value:formatNumber(stats?.inTransit??0) },
    { icon:MapPin,        iconBg:'#fffbeb', iconColor:'#f59e0b', label:'At Source',      value:formatNumber(stats?.atSource??0) },
    { icon:Flag,          iconBg:'#f0fdf4', iconColor:'#059669', label:'At Destination', value:formatNumber(stats?.atDestination??0) },
    { icon:AlertTriangle, iconBg:'#fff1f2', iconColor:'#f43f5e', label:'Alerts',         value:formatNumber(stats?.alerts??0) },
  ];
  return <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-5">{cards.map((c,i)=><KpiCard key={c.label} {...c} index={i} loading={loading}/>)}</div>;
}
export default TripStatsCards;
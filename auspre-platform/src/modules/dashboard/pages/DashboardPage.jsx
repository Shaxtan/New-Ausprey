import { Clock, ChevronDown, Truck, Activity, Route, AlertTriangle, Gauge } from 'lucide-react';
import { PageHeader, KpiCard, Trend } from '@/components/common';
import { formatNumber, formatKm } from '@/utils';
import {
  useFleetStats, useVehicleStatus, useDailyMovement, useTopSpeeding, useAlertsSummary, useRecentAlerts,
} from '../hooks/useDashboard';
import { FleetLiveStrip } from '../components/FleetLiveStrip';
import { VehicleStatusCard } from '../components/VehicleStatusCard';
import { DailyMovementCard } from '../components/DailyMovementCard';
import { TopSpeedingCard } from '../components/TopSpeedingCard';
import { AlertsSummaryCard } from '../components/AlertsSummaryCard';
import { RecentAlertsCard } from '../components/RecentAlertsCard';

export default function DashboardPage() {
  const fleet = useFleetStats();
  const status = useVehicleStatus();
  const movement = useDailyMovement();
  const speeding = useTopSpeeding();
  const alerts = useAlertsSummary();
  const recent = useRecentAlerts();
  const s = fleet.data;

  const kpis = [
    { icon: Truck, iconBg: '#eff6ff', iconColor: '#2563eb', label: 'Total Vehicles', value: formatNumber(s?.totalVehicles), trend: <Trend value="+12 this week" direction="up" suffix="" /> },
    { icon: Activity, iconBg: '#ecfdf5', iconColor: '#10b981', label: 'Active Vehicles', value: formatNumber(s?.activeVehicles), trend: <Trend value="83.1%" direction="up" suffix="of fleet" /> },
    { icon: Route, iconBg: '#fffbeb', iconColor: '#f59e0b', label: 'Total Distance', value: formatKm(s?.totalDistance), trend: <Trend value="+8.7%" direction="up" /> },
    { icon: AlertTriangle, iconBg: '#fff1f2', iconColor: '#f43f5e', label: 'Total Alerts', value: formatNumber(s?.totalAlerts), trend: <Trend value="-5.4%" direction="down" /> },
    { icon: Gauge, iconBg: '#f5f3ff', iconColor: '#8b5cf6', label: 'Avg Speed', value: s ? `${s.avgSpeed} km/h` : '—', trend: <Trend value="+4.3%" direction="up" /> },
  ];

  return (
    <div>
      <PageHeader
        crumbs={['Home', 'Dashboard']}
        title="Dashboard Overview"
        description="Real-time visibility and intelligent insights to manage your entire fleet."
        actions={
          <>
            <button className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 px-3.5 py-2 rounded-lg hover:bg-slate-50 transition">
              All Groups <ChevronDown size={15} className="text-slate-400" />
            </button>
            <button className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 px-3.5 py-2 rounded-lg hover:bg-slate-50 transition">
              <Clock size={15} className="text-slate-400" /> May 14 – May 20
            </button>
          </>
        }
      />

      <FleetLiveStrip data={s?.live} loading={fleet.isLoading} />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-5">
        {kpis.map((k, i) => <KpiCard key={k.label} {...k} index={i} loading={fleet.isLoading} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-5">
        <div className="lg:col-span-3"><VehicleStatusCard data={status.data ?? []} total={s?.totalVehicles} loading={status.isLoading} /></div>
        <div className="lg:col-span-6"><DailyMovementCard data={movement.data ?? []} loading={movement.isLoading} /></div>
        <div className="lg:col-span-3"><TopSpeedingCard data={speeding.data ?? []} loading={speeding.isLoading} /></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4"><AlertsSummaryCard data={alerts.data ?? []} loading={alerts.isLoading} /></div>
        <div className="lg:col-span-8"><RecentAlertsCard data={recent.data ?? []} loading={recent.isLoading} /></div>
      </div>
    </div>
  );
}

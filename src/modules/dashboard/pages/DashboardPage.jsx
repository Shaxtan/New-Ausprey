import {
  Clock,
  ChevronDown,
  Truck,
  Activity,
  AlertTriangle,
  Gauge,
  Map,
} from "lucide-react";
import { PageHeader, KpiCard, Trend } from "@/components/common";
import { formatNumber } from "@/utils";
import {
  useDashboardData,
  useVehicleStatus,
  useUnreachableDevices,
} from "../hooks/useDashboard";
import { FleetLiveStrip } from "../components/FleetLiveStrip";
import { VehicleStatusCard } from "../components/VehicleStatusCard";
import { DailyMovementCard } from "../components/DailyMovementCard";
import { TopSpeedingCard } from "../components/TopSpeedingCard";
import { AlertsSummaryCard } from "../components/AlertsSummaryCard";
import { RecentAlertsCard } from "../components/RecentAlertsCard";

export default function DashboardPage() {
  const { data, isLoading } = useDashboardData();
  const statusQuery = useVehicleStatus();
  const unreachableQuery = useUnreachableDevices();

  // summary shape: { totalVehicles, activeVehicles, live: { online, idle, stopped, offline, unreachable } }
  const summary = data?.summary ?? null;
  const live = summary?.live ?? null;

  const kpis = [
    {
      icon: Truck,
      iconBg: "#eff6ff",
      iconColor: "#2563eb",
      label: "Total Vehicles",
      value: formatNumber(summary?.totalVehicles),
    },
    {
      icon: Activity,
      iconBg: "#ecfdf5",
      iconColor: "#10b981",
      label: "Online Motion",
      value: formatNumber(live?.online),
    },
    {
      icon: Gauge,
      iconBg: "#fffbeb",
      iconColor: "#f59e0b",
      label: "Idle",
      value: formatNumber(live?.idle),
    },
    {
      icon: Map,
      iconBg: "#fff1f2",
      iconColor: "#f43f5e",
      label: "Unreachable",
      value: formatNumber(live?.unreachable),
    },
    {
      icon: AlertTriangle,
      iconBg: "#f5f3ff",
      iconColor: "#8b5cf6",
      label: "Offline",
      value: formatNumber(live?.offline),
    },
  ];

  return (
    <div>
      <PageHeader
        crumbs={["Home", "Dashboard"]}
        title="Dashboard Overview"
        description="Real-time visibility across your entire fleet."
        actions={
          <>
            <button className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 px-3.5 py-2 rounded-lg hover:bg-slate-50 transition">
              All Groups <ChevronDown size={15} className="text-slate-400" />
            </button>
            <button className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 px-3.5 py-2 rounded-lg hover:bg-slate-50 transition">
              <Clock size={15} className="text-slate-400" /> Today
            </button>
          </>
        }
      />

      {/* Live status strip */}
      <FleetLiveStrip data={live} loading={isLoading} />

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-5">
        {kpis.map((k, i) => (
          <KpiCard key={k.label} {...k} index={i} loading={isLoading} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-5">
        <div className="lg:col-span-4">
          <VehicleStatusCard
            data={statusQuery.data ?? []}
            total={summary?.totalVehicles}
            loading={statusQuery.isLoading}
          />
        </div>
        <div className="lg:col-span-4">
          <DailyMovementCard data={[]} loading={isLoading} />
        </div>
        <div className="lg:col-span-4">
          <TopSpeedingCard data={[]} loading={isLoading} />
        </div>
      </div>

      {/* Alerts row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4">
          <AlertsSummaryCard data={[]} loading={isLoading} />
        </div>
        <div className="lg:col-span-8">
          <RecentAlertsCard
            data={unreachableQuery.data ?? []}
            loading={unreachableQuery.isLoading}
          />
        </div>
      </div>
    </div>
  );
}

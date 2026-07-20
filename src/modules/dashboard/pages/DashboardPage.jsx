import {
  Truck,
  Activity,
  AlertOctagon,
  Gauge,
  WifiOff,
  MapPinOff,
} from "lucide-react";
import { PageHeader, KpiCard, Trend } from "@/components/common";
import { formatNumber } from "@/utils";
import {
  useDashboardData,
  useUnreachableDevices,
  useDashboardAlerts,
  useTopDistanceDevices,
  useFleetUtilization,
  useMapViewData,
} from "../hooks/useDashboard";
import { DashboardLiveMap } from "../components/DashboardLiveMap";
import { RecentAlertsListCard } from "../components/RecentAlertsListCard";
import { FleetUtilizationCard } from "../components/FleetUtilizationCard";
import { TopDistanceCard } from "../components/TopDistanceCard";
import { FleetTableCard } from "../components/FleetTableCard";

export default function DashboardPage() {
  const { data, isLoading } = useDashboardData();
  const unreachableQuery = useUnreachableDevices();
  const alertsQuery = useDashboardAlerts();
  const distanceQuery = useTopDistanceDevices();
  const utilizationQuery = useFleetUtilization();
  const mapQuery = useMapViewData();

  const summary = data?.summary ?? null;
  const live = summary?.live ?? null;
  const vtsRaw = data?.VTS?.available ?? [];
  const total = summary?.totalVehicles ?? 0;

  const pctOfTotal = (n) =>
    total > 0
      ? `${((Number(n ?? 0) / total) * 100).toFixed(1)}% of total`
      : "—";

  // 6-card KPI row — Total / Moving / Stopped / Idle / Offline / Unreachable
  const kpis = [
    {
      icon: Truck,
      iconBg: "#eff6ff",
      iconColor: "#2563eb",
      label: "Total Vehicles",
      value: formatNumber(summary?.totalVehicles),
      trend: <Trend value="Across all accounts" neutral />,
    },
    {
      icon: Activity,
      iconBg: "#ecfdf5",
      iconColor: "#10b981",
      label: "Moving",
      value: formatNumber(live?.online),
      trend: <Trend value={pctOfTotal(live?.online)} neutral />,
    },
    {
      icon: AlertOctagon,
      iconBg: "#fff1f2",
      iconColor: "#f43f5e",
      label: "Stopped",
      value: formatNumber(live?.stopped),
      trend: <Trend value={pctOfTotal(live?.stopped)} neutral />,
    },
    {
      icon: Gauge,
      iconBg: "#fffbeb",
      iconColor: "#f59e0b",
      label: "Idle",
      value: formatNumber(live?.idle),
      trend: <Trend value={pctOfTotal(live?.idle)} neutral />,
    },
    {
      icon: WifiOff,
      iconBg: "#f5f3ff",
      iconColor: "#8b5cf6",
      label: "Offline",
      value: formatNumber(live?.offline),
      trend: <Trend value={pctOfTotal(live?.offline)} neutral />,
    },
    {
      icon: MapPinOff,
      iconBg: "#f1f5f9",
      iconColor: "#64748b",
      label: "Unreachable",
      value: formatNumber(live?.unreachable),
      trend: <Trend value={pctOfTotal(live?.unreachable)} neutral />,
    },
  ];

  return (
    <div>
      <PageHeader
        crumbs={["Home", "Dashboard"]}
        title="Fleet Overview"
        description="Real-time insights and intelligence across your fleet"
      />

      {/* ── Fleet summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 mb-5">
        {kpis.map((k, i) => (
          <KpiCard key={k.label} {...k} index={i} loading={isLoading} />
        ))}
      </div>

      {/* ── Live map + recent alerts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-5">
        <div className="lg:col-span-8">
          <DashboardLiveMap
            data={mapQuery.data ?? []}
            loading={mapQuery.isLoading}
          />
        </div>
        <div className="lg:col-span-4">
          <RecentAlertsListCard
            alerts={alertsQuery.data?.data ?? []}
            loading={alertsQuery.isLoading}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <FleetUtilizationCard
          points={utilizationQuery.data?.points ?? []}
          avg={utilizationQuery.data?.avg ?? 0}
          trend={utilizationQuery.data?.trend ?? 0}
          loading={utilizationQuery.isLoading}
        />
        <TopDistanceCard
          data={distanceQuery.data ?? []}
          loading={distanceQuery.isLoading}
        />
      </div>

      {/* ── Live vehicles / unreachable tables ── */}
      <FleetTableCard
        vtsData={vtsRaw}
        unreachableData={unreachableQuery.data ?? []}
        loadingVts={isLoading}
        loadingUnreachable={unreachableQuery.isLoading}
      />
    </div>
  );
}

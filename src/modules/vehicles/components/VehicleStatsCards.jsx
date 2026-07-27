import { Truck, CheckCircle2, XCircle, Cpu } from "lucide-react";
import { KpiCard, Trend } from "@/components/common";
import { formatNumber } from "@/utils";

export function VehicleStatsCards({ stats, loading }) {
  const total = stats?.total ?? 0;
  const pct = (n) =>
    total ? `${((n / total) * 100).toFixed(1)}% of total` : "—";

  const cards = [
    {
      icon: Truck,
      iconBg: "#eff6ff",
      iconColor: "#2563eb",
      label: "Total Vehicles",
      value: formatNumber(stats?.total),
      trend: <Trend value="From device registry" neutral />,
    },
    {
      icon: CheckCircle2,
      iconBg: "#ecfdf5",
      iconColor: "#10b981",
      label: "Active",
      value: formatNumber(stats?.active),
      trend: <Trend value={pct(stats?.active)} neutral />,
    },
    {
      icon: XCircle,
      iconBg: "#fff1f2",
      iconColor: "#f43f5e",
      label: "Inactive",
      value: formatNumber(stats?.inactive),
      trend: <Trend value={pct(stats?.inactive)} neutral />,
    },
    {
      icon: Cpu,
      iconBg: "#f5f3ff",
      iconColor: "#8b5cf6",
      label: "Device Types",
      value: formatNumber(stats?.deviceTypes),
      trend: <Trend value="Unique types" neutral />,
    },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
      {cards.map((c, i) => (
        <KpiCard key={c.label} {...c} index={i} loading={loading} />
      ))}
    </div>
  );
}

export default VehicleStatsCards;

/**
 * GeofencePage.jsx — New-Ausprey
 *
 * Real geofence creation + listing, backed by:
 *   getViewDetailed()  → GET  /geo-fence/view-detailed   (list)
 *   createGeofence()   → POST /geo-fence/create          (draw-to-create)
 *
 * No mock data. KPI cards only show numbers genuinely derivable from the
 * real list (total zones, categories, circle zones, average radius) — the
 * old mock page's "Violations Today" / "Vehicles Inside" cards are dropped
 * since there's no real endpoint backing them.
 *
 * There's no update/delete endpoint provided, so edit/delete actions are
 * intentionally not offered on the list — only create + view.
 */
import { useMemo, useRef, useState } from "react";
import { Search, MapPin, Layers, Radar, Ruler } from "lucide-react";
import { PageHeader, KpiCard, Trend } from "@/components/common";
import { formatNumber } from "@/utils";
import { useAccountStore } from "@/store";
import {
  useGeofences,
  useCreateGeofence,
  deriveGeofenceStats,
} from "../hooks/useGeofences";
import { GeofenceList } from "../components/GeofenceList";
import { GeofenceMap } from "../components/GeofenceMap";

export default function GeofencePage() {
  const accid = useAccountStore((s) => s.selectedAccount?.id);
  const { data: geofences = [], isLoading } = useGeofences();
  const createMutation = useCreateGeofence();

  const [activeId, setActiveId] = useState(null);
  const [search, setSearch] = useState("");
  const mapRef = useRef(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return geofences;
    return geofences.filter(
      (g) =>
        (g.name ?? "").toLowerCase().includes(term) ||
        (g.category ?? "").toLowerCase().includes(term) ||
        (g.client ?? "").toLowerCase().includes(term),
    );
  }, [geofences, search]);

  const stats = useMemo(() => deriveGeofenceStats(geofences), [geofences]);

  const handleSelect = (g) => {
    setActiveId(g.id);
    mapRef.current?.flyTo(g.id);
  };

  const handleCreate = async (payload) => {
    await createMutation.mutateAsync(payload);
  };

  const cards = [
    {
      icon: MapIconWrap,
      iconBg: "#eff6ff",
      iconColor: "#2563eb",
      label: "Total Geofences",
      value: formatNumber(stats.total),
      trend: <Trend value="From your account" neutral />,
    },
    {
      icon: Layers,
      iconBg: "#f5f3ff",
      iconColor: "#8b5cf6",
      label: "Categories",
      value: formatNumber(stats.categories),
      trend: <Trend value="Unique categories" neutral />,
    },
    {
      icon: Radar,
      iconBg: "#ecfdf5",
      iconColor: "#10b981",
      label: "Circle Zones",
      value: formatNumber(stats.circleZones),
      trend: (
        <Trend
          value={
            stats.total
              ? `${((stats.circleZones / stats.total) * 100).toFixed(0)}% of total`
              : "—"
          }
          neutral
        />
      ),
    },
    {
      icon: Ruler,
      iconBg: "#fffbeb",
      iconColor: "#f59e0b",
      label: "Avg. Radius",
      value: stats.avgRadius ? `${formatNumber(stats.avgRadius)}m` : "—",
      trend: <Trend value="Across all zones" neutral />,
    },
  ];

  return (
    <div>
      <PageHeader
        crumbs={["Monitoring", "Geofence"]}
        title="Geofence Management"
        description='Draw a zone on the map to create it — click "Draw Zone", then click-drag to size the circle.'
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        {cards.map((c, i) => (
          <KpiCard key={c.label} {...c} index={i} loading={isLoading} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-3 flex flex-col gap-3">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search zones…"
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <GeofenceList
            data={filtered}
            loading={isLoading}
            activeId={activeId}
            onSelect={handleSelect}
          />
        </div>
        <div className="lg:col-span-9">
          <GeofenceMap
            ref={mapRef}
            geofences={filtered}
            accid={accid}
            onCreate={handleCreate}
            creating={createMutation.isPending}
          />
        </div>
      </div>
    </div>
  );
}

// Small wrapper so the KPI icon list above stays declarative without an
// extra import line — MapPin already imported for the list/empty-state icon.
function MapIconWrap(props) {
  return <MapPin {...props} />;
}

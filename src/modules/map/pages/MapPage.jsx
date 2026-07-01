/**
 * MapPage.jsx — New-Ausprey
 *
 * Full-page Leaflet map with:
 *  - MarkerCluster for all fleet vehicles
 *  - Floating LEFT sidebar: search + status filter chips + vehicle list
 *  - Sidebar overlays the map; toggle collapses/expands from the left
 *  - Clicking a vehicle flies to its marker and opens popup
 *  - Fetches from POST /usage/reports/report/mapview?accid=<id>
 *  - Auto-refreshes every 3 minutes
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";

// Inject markercluster CSS via CDN (avoids Vite path resolution issues)
if (typeof document !== "undefined") {
  const cssUrls = [
    "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css",
    "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css",
  ];
  cssUrls.forEach((href) => {
    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    }
  });
}

import {
  Search,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { Skeleton } from "@/components/ui";
import { cn } from "@/utils";
import { useAccountStore } from "@/store";
import apiService from "@/services/apiService";

// ─── Constants ────────────────────────────────────────────────────────────────
const TRUCK_ICON_URL =
  "https://cdn-icons-png.flaticon.com/512/1048/1048329.png";
const INDIA_CENTER = [22.5589, 75.6089];
const REFRESH_MS = 3 * 60 * 1000;

// ─── Status helpers ───────────────────────────────────────────────────────────
function getStatus(v) {
  const speed = Number(v.speed) || 0;
  const ign = (v.ign ?? "").toUpperCase();
  const isLock = v.lock === "1" || v.lock === true;
  if (isLock) return "Lock";
  if (speed > 5 && ign === "Y") return "Motion";
  if (ign === "Y") return "Idle";
  return "Stop";
}

const STATUS_COLOR = {
  Motion: "#4CAF50",
  Idle: "#FF9800",
  Stop: "#F44336",
  Lock: "#2196F3",
};

const STATUS_META = {
  Motion: {
    label: "Motion",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  Idle: {
    label: "Idle",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-400",
  },
  Stop: {
    label: "Stopped",
    bg: "bg-rose-50",
    text: "text-rose-700",
    dot: "bg-rose-500",
  },
  Lock: {
    label: "Locked",
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
};

function buildMarkerIcon(status, highlighted = false) {
  const size = highlighted ? 40 : 28;
  const color = STATUS_COLOR[status] ?? "#94a3b8";
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;
      border-radius:50%;
      background:${color};
      border:3px solid #fff;
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
      display:flex;align-items:center;justify-content:center;
      overflow:hidden;
    ">
      <img src="${TRUCK_ICON_URL}" style="width:${size * 0.65}px;height:${size * 0.65}px;object-fit:contain;" />
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });
}

// ─── Sidebar (floats over the map on the left) ────────────────────────────────
const FILTERS = ["All", "Motion", "Idle", "Stop", "Lock"];

function Sidebar({
  vehicles,
  counts,
  loading,
  filter,
  onFilter,
  search,
  onSearch,
  highlighted,
  onVehicleClick,
  collapsed,
  onToggle,
}) {
  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    return vehicles
      .filter((v) => {
        const matchFilter = filter === "All" || v.status === filter;
        const matchSearch =
          !term || (v.vehnum ?? "").toLowerCase().includes(term);
        return matchFilter && matchSearch;
      })
      .sort((a, b) => {
        const at = (a.vehnum ?? "").toLowerCase();
        const bt = (b.vehnum ?? "").toLowerCase();
        if (at === search && bt !== search) return -1;
        if (bt === search && at !== search) return 1;
        if (at.startsWith(search) && !bt.startsWith(search)) return -1;
        if (bt.startsWith(search) && !at.startsWith(search)) return 1;
        return 0;
      });
  }, [vehicles, filter, search]);

  // ── Collapsed: just a slim toggle tab on the left edge ──
  if (collapsed) {
    return (
      <div className="flex flex-col items-center pt-3">
        {/* Toggle button — ChevronRight means "expand to the right" */}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg bg-white shadow-lg border border-slate-200 hover:bg-slate-50 transition"
          title="Expand sidebar"
        >
          <ChevronRight size={18} className="text-slate-600" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 shrink-0">
        <span className="text-sm font-bold text-white">
          Vehicle Status {loading ? "" : `(${counts.All})`}
        </span>
        {/* ChevronLeft means "collapse to the left" */}
        <button
          onClick={onToggle}
          className="text-slate-300 hover:text-white transition"
          title="Collapse sidebar"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2.5 border-b border-slate-100 shrink-0">
        <div className="relative">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => {
              onSearch(e.target.value);
              if (e.target.value && filter !== "All") onFilter("All");
            }}
            placeholder="Search vehicle..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Filter chips */}
      <div className="px-3 py-2 flex flex-wrap gap-1 border-b border-slate-100 shrink-0">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => onFilter(f)}
            className={cn(
              "px-2 py-0.5 rounded-full text-[11px] font-semibold transition",
              filter === f
                ? "bg-primary text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200",
            )}
          >
            {f} ({counts[f] ?? 0})
          </button>
        ))}
      </div>

      {/* Vehicle list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="px-3 py-2.5 border-b border-slate-50">
              <Skeleton className="h-9 w-full rounded" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">
            No vehicles found
          </div>
        ) : (
          filtered.map((v, i) => {
            const meta = STATUS_META[v.status] ?? STATUS_META.Stop;
            const isActive = highlighted === v.vehnum;
            const isTop = search && i === 0;
            return (
              <button
                key={v.vehnum}
                onClick={() => onVehicleClick(v)}
                className={cn(
                  "w-full text-left px-3 py-2.5 border-b border-slate-50 transition relative",
                  isActive
                    ? "bg-blue-50 border-l-2 border-l-blue-500"
                    : isTop
                      ? "bg-yellow-50 border-l-2 border-l-yellow-400"
                      : "hover:bg-slate-50 hover:translate-x-1",
                )}
              >
                {/* Status dot bubble */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center bg-white shadow-sm border border-slate-100">
                  <span className={cn("w-2 h-2 rounded-full", meta.dot)} />
                </div>
                <div className="text-xs font-bold text-slate-800 pr-8">
                  {v.vehnum}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {v.time}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function MapPage() {
  const accid = useAccountStore((s) => s.selectedAccount?.id ?? 1);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const clusterRef = useRef(null);
  const markerMapRef = useRef({}); // vehnum → { marker, status }
  const timerRef = useRef(null);

  const [vehicles, setVehicles] = useState([]);
  const [counts, setCounts] = useState({
    All: 0,
    Motion: 0,
    Idle: 0,
    Stop: 0,
    Lock: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [highlighted, setHighlighted] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  // ── Init Leaflet map once ─────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: INDIA_CENTER,
      zoom: 6,
      maxZoom: 19,
      zoomControl: true,
    });
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    const cluster = L.markerClusterGroup({
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 60,
    });
    clusterRef.current = cluster;
    map.addLayer(cluster);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      map.remove();
      mapRef.current = null;
      clusterRef.current = null;
    };
  }, []);

  // ── Fetch + render markers ────────────────────────────────────────────────
  const fetchMapData = useCallback(async () => {
    if (!mapRef.current || !clusterRef.current) return;
    setLoading(true);
    try {
      const res = await apiService.getMapViewData(accid);
      const data = res?.data ?? [];
      if (!Array.isArray(data)) return;

      clusterRef.current.clearLayers();
      markerMapRef.current = {};

      const allLatLngs = [];
      const vList = [];
      const newCounts = { All: 0, Motion: 0, Idle: 0, Stop: 0, Lock: 0 };

      data.forEach((v) => {
        const lat = parseFloat(v.lat);
        const lng = parseFloat(v.lng);
        if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

        const status = getStatus(v);
        const marker = L.marker([lat, lng], { icon: buildMarkerIcon(status) });

        marker.bindPopup(`
          <div style="min-width:160px;font-family:sans-serif">
            <div style="font-weight:700;font-size:13px;margin-bottom:4px">${v.vehnum ?? v.name}</div>
            <div style="font-size:11px;color:#555">Status: <b>${STATUS_META[status]?.label ?? status}</b></div>
            <div style="font-size:11px;color:#555">Speed: <b>${Number(v.speed) ?? 0} km/h</b></div>
            <div style="font-size:11px;color:#555">Ignition: <b>${v.ign === "Y" ? "ON" : "OFF"}</b></div>
            <div style="font-size:11px;color:#555">Updated: <b>${v.devTs ?? v.cts ?? "—"}</b></div>
            ${v.address ? `<div style="font-size:11px;color:#555;margin-top:4px">${v.address}</div>` : ""}
          </div>
        `);

        clusterRef.current.addLayer(marker);
        markerMapRef.current[v.vehnum] = { marker, status, v };
        allLatLngs.push([lat, lng]);

        newCounts.All++;
        newCounts[status] = (newCounts[status] ?? 0) + 1;

        vList.push({
          vehnum: v.vehnum ?? v.name,
          status,
          time: v.devTs ?? v.cts ?? "—",
          address: v.address ?? "",
        });
      });

      setVehicles(vList);
      setCounts(newCounts);

      if (allLatLngs.length > 0 && mapRef.current) {
        mapRef.current.fitBounds(allLatLngs, {
          padding: [50, 50],
          maxZoom: 13,
        });
      }
    } catch (e) {
      console.error("MapPage fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [accid]);

  useEffect(() => {
    fetchMapData();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(fetchMapData, REFRESH_MS);
    return () => clearInterval(timerRef.current);
  }, [fetchMapData]);

  // ── Vehicle click → fly + highlight ──────────────────────────────────────
  const handleVehicleClick = useCallback(
    (v) => {
      const entry = markerMapRef.current[v.vehnum];
      if (!entry || !mapRef.current) return;

      if (highlighted && markerMapRef.current[highlighted]) {
        const prev = markerMapRef.current[highlighted];
        prev.marker.setIcon(buildMarkerIcon(prev.status, false));
      }

      entry.marker.setIcon(buildMarkerIcon(entry.status, true));
      setHighlighted(v.vehnum);

      clusterRef.current.zoomToShowLayer(entry.marker, () => {
        mapRef.current.flyTo(entry.marker.getLatLng(), 15, {
          animate: true,
          duration: 1.2,
        });
        entry.marker.openPopup();
      });

      // Collapse sidebar on vehicle click to reveal more of the map
      setCollapsed(true);
    },
    [highlighted],
  );

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Minimal header strip — tight padding, no wasted vertical space */}
      <div className="px-4 py-1.5 shrink-0 flex items-center justify-between border-b border-slate-100 bg-white">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>Home</span>
          <span className="text-slate-300">›</span>
          <span className="text-primary font-semibold text-slate-700">Map View</span>
        </nav>
        {/* Refresh */}
        <button
          onClick={fetchMapData}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition"
        >
          <RotateCcw size={12} /> Refresh
        </button>
      </div>

      {/* Map fills ALL remaining space — zero padding, true edge-to-edge */}
      <div className="relative flex-1 min-h-0">
        {/* Map — absolute fill, no horizontal gap */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            ref={mapContainerRef}
            style={{ height: "100%", width: "100%" }}
          />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-[1000]">
              <div className="text-sm text-slate-500 font-medium animate-pulse">
                Loading vehicles…
              </div>
            </div>
          )}
        </div>

        {/* Floating sidebar — overlays the map on the LEFT with a small inset */}
        <div
          className={cn(
            "absolute left-3 top-3 bottom-3 z-[1001] transition-all duration-300",
            collapsed ? "w-10" : "w-80",
          )}
        >
          <Sidebar
            vehicles={vehicles}
            counts={counts}
            loading={loading}
            filter={filter}
            onFilter={setFilter}
            search={search}
            onSearch={setSearch}
            highlighted={highlighted}
            onVehicleClick={handleVehicleClick}
            collapsed={collapsed}
            onToggle={() => setCollapsed((c) => !c)}
          />
        </div>
      </div>
    </div>
  );
}

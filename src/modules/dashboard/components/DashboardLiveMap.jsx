/**
 * DashboardLiveMap.jsx — Dashboard
 *
 * Compact live-map card for the dashboard overview, matching the reference
 * design's "Live Map" widget: small map, coloured status dots, a pulsing
 * "Live" badge, and a "View Full Map" link through to the full /map page.
 *
 * Data: useMapViewData() → array of { lat, lng, vehnum/name, speed, ign, ... }
 * Reuses the same status classification as the full MapPage.
 */
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Maximize2 } from "lucide-react";
import { Card, Skeleton } from "@/components/ui";
import { PATHS } from "@/constants";
import { cn } from "@/utils";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function getStatus(v) {
  const speed = Number(v.speed) || 0;
  const ign = (v.ign ?? "").toUpperCase();
  if (speed > 5 && ign === "Y") return "Motion";
  if (ign === "Y") return "Idle";
  return "Stop";
}

const STATUS_COLOR = { Motion: "#10b981", Idle: "#f59e0b", Stop: "#ef4444" };

export function DashboardLiveMap({ data = [], loading }) {
  const navigate = useNavigate();
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);

  const TILE =
    import.meta.env.VITE_MAP_TILE_URL ||
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  // Init map once
  useEffect(() => {
    if (mapRef.current || !mapDivRef.current) return;
    const map = L.map(mapDivRef.current, {
      center: [22.5, 78.9],
      zoom: 4.3,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
      dragging: true,
    });
    L.tileLayer(TILE, { attribution: "" }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 50);
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when data changes
  useEffect(() => {
    const map = mapRef.current,
      layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    const points = [];
    for (const v of data) {
      const lat = parseFloat(v.lat);
      const lng = parseFloat(v.lng);
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) continue;

      const status = getStatus(v);
      const color = STATUS_COLOR[status];
      const marker = L.circleMarker([lat, lng], {
        radius: 5,
        color: "#fff",
        weight: 1.5,
        fillColor: color,
        fillOpacity: 0.95,
      }).bindTooltip(`${v.vehnum ?? v.name ?? "Vehicle"} · ${status}`);
      marker.addTo(layer);
      points.push([lat, lng]);
    }

    if (points.length > 0) {
      map.fitBounds(points, { padding: [24, 24], maxZoom: 6 });
    }
  }, [data]);

  return (
    <Card hover padded={false} className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <h3 className="text-sm font-bold text-slate-800">Live Map</h3>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary text-white text-[11px] font-bold shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Live
          </span>
          <button
            onClick={() => navigate(PATHS.MAP)}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <Maximize2 size={12} /> View Full Map
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10">
            <Skeleton className="w-full h-full rounded-none" />
          </div>
        )}
        <div ref={mapDivRef} className="w-full" style={{ height: 260 }} />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-5 py-2.5 border-t border-slate-100 bg-slate-50">
        {Object.entries(STATUS_COLOR).map(([label, color]) => (
          <span
            key={label}
            className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium"
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: color }}
            />
            {label}
          </span>
        ))}
        <span className="ml-auto text-[11px] text-slate-400">
          {data.length} vehicle{data.length !== 1 ? "s" : ""}
        </span>
      </div>
    </Card>
  );
}

export default DashboardLiveMap;

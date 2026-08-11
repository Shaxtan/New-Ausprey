/**
 * AlertLiveMap.jsx — Alert Dashboard
 *
 * Plots every alert with valid coordinates as a coloured marker
 * (colour = derived severity). Clicking a marker shows a popup with
 * type, vehicle, time, and message.
 */
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Skeleton } from "@/components/ui";
import { MapStyleControl } from "@/components/maps";
import { MAP_MODES, DEFAULT_MAP_MODE } from "@/utils/mapTiles";
import { classifyAlert, SEVERITY_META } from "../utils/alertSeverity";
import { typeLabel } from "@/modules/dashboard/components/AlertsModal";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const fmtTime = (s) => {
  if (!s) return "—";
  const d = new Date((s ?? "").replace?.(" ", "T") ?? s);
  if (isNaN(d)) return s;
  return d.toLocaleString([], {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function AlertLiveMap({ alerts = [], loading }) {
  const divRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const tileLayerRef = useRef(null);
  const [mapMode, setMapMode] = useState(DEFAULT_MAP_MODE);

  useEffect(() => {
    if (mapRef.current || !divRef.current) return;
    const map = L.map(divRef.current, {
      center: [22.5, 71.5],
      zoom: 6,
      zoomControl: false,
      attributionControl: false,
    });
    tileLayerRef.current = L.tileLayer(MAP_MODES[DEFAULT_MAP_MODE].url, {
      attribution: "",
    }).addTo(map);
    L.control.zoom({ position: "topright" }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 50);
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep Leaflet's internal canvas size in sync with the container.
  // The container's own height is driven by the parent (RowPanel's
  // flex-1 wrapper), which changes when the map is expanded/collapsed —
  // Leaflet doesn't detect that on its own, so a ResizeObserver is needed
  // to call invalidateSize() whenever the container is actually resized.
  useEffect(() => {
    if (!divRef.current) return;
    const observer = new ResizeObserver(() => {
      mapRef.current?.invalidateSize();
    });
    observer.observe(divRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    tileLayerRef.current?.setUrl(MAP_MODES[mapMode].url);
  }, [mapMode]);

  useEffect(() => {
    const map = mapRef.current,
      layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    const points = [];
    for (const a of alerts) {
      const lat = parseFloat(a.latitude);
      const lng = parseFloat(a.longitude);
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) continue;

      const { severity, label } = classifyAlert(a, typeLabel(a.type));
      const meta = SEVERITY_META[severity];
      const marker = L.circleMarker([lat, lng], {
        radius: 7,
        color: "#fff",
        weight: 2,
        fillColor: meta.color,
        fillOpacity: 0.95,
      }).bindPopup(`
        <div style="min-width:170px;font-family:sans-serif">
          <div style="font-weight:700;font-size:12px;margin-bottom:2px;color:${meta.color}">${label}</div>
          <div style="font-size:11px;color:#334155;font-weight:600">${a.vehicleNumber ?? a.imei}</div>
          <div style="font-size:10px;color:#94a3b8;margin-top:2px">${fmtTime(a.createdOn)}</div>
          ${a.address ? `<div style="font-size:10px;color:#64748b;margin-top:3px">${a.address}</div>` : ""}
        </div>
      `);
      marker.addTo(layer);
      points.push([lat, lng]);
    }

    if (points.length > 0)
      map.fitBounds(points, { padding: [30, 30], maxZoom: 10 });
  }, [alerts]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-slate-100">
      {loading && (
        <div className="absolute inset-0 z-10">
          <Skeleton className="w-full h-full rounded-none" />
        </div>
      )}
      {!loading && alerts.length === 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50 text-slate-400 text-sm">
          No located alerts to show on the map.
        </div>
      )}
      <div ref={divRef} className="w-full h-full" />
      <MapStyleControl
        value={mapMode}
        onChange={setMapMode}
        className="absolute top-2.5 left-2.5 z-[1000]"
      />
    </div>
  );
}

export default AlertLiveMap;

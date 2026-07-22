/**
 * GeofenceMap.jsx — New-Ausprey
 *
 * Imperative Leaflet canvas for the Geofence page:
 *   - Renders every real geofence as a circle + popup (name/category/client/radius)
 *   - "Draw Zone" tool: click-drag to draw a new circle, release opens a
 *     popup form (name/category/client/mobile) that POSTs to the real
 *     createGeofence API on submit
 *   - Exposes flyTo(id) via ref so the list panel can click-to-locate
 *
 * Ported from the reference project's mousedown/mousemove/mouseup drawing
 * flow, adapted to this app's Tailwind design system and real API service.
 */
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Pencil, X } from "lucide-react";
import { cn } from "@/utils";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const INDIA_CENTER = [22.5589, 75.6089];
const ZONE_COLOR = "#2563eb";

// ─── Popup form (raw DOM — Leaflet popups aren't React-rendered, but the
// app's Tailwind utility classes still apply globally so we can use them). ──
function buildFormHtml(radius) {
  return `
    <div class="min-w-[230px] p-1 font-sans">
      <h4 class="text-sm font-bold text-slate-800 mb-2">New Geofence</h4>
      <input id="gf-name" type="text" placeholder="Name (e.g. Warehouse Zone)"
        class="w-full mb-2 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:border-primary" />
      <input id="gf-category" type="text" placeholder="Category (e.g. OFFICE)"
        class="w-full mb-2 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:border-primary" />
      <input id="gf-client" type="text" placeholder="Client"
        class="w-full mb-2 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:border-primary" />
      <input id="gf-mobile" type="text" placeholder="Mobile Number"
        class="w-full mb-2 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:border-primary" />
      <div class="text-[11px] text-slate-400 mb-2">Radius: ${Math.round(radius)}m</div>
      <div id="gf-error" class="text-[11px] text-rose-500 mb-2 hidden"></div>
      <div class="flex justify-end gap-1.5">
        <button id="gf-cancel" class="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition">Cancel</button>
        <button id="gf-done" class="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-primary text-white hover:bg-primary-hover transition">Save Zone</button>
      </div>
    </div>
  `;
}

function popupContent(g) {
  return `
    <div class="p-1 font-sans min-w-[160px]">
      <div class="text-sm font-bold text-slate-800">${g.name ?? "Unnamed Zone"}</div>
      <div class="text-[11px] text-slate-500 mt-0.5">${g.category ?? "—"}${g.client ? ` · ${g.client}` : ""}</div>
      <div class="text-[11px] text-slate-400 mt-1">Radius: ${g.radius ?? "—"}m</div>
    </div>
  `;
}

export const GeofenceMap = forwardRef(function GeofenceMap(
  { geofences = [], accid, onCreate, creating },
  ref,
) {
  const divRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const circlesById = useRef({});

  const [drawMode, setDrawMode] = useState(false);
  const drawModeRef = useRef(false);
  useEffect(() => {
    drawModeRef.current = drawMode;
  }, [drawMode]);

  const isDrawingRef = useRef(false);
  const centerRef = useRef(null);
  const tempCircleRef = useRef(null);

  const TILE =
    import.meta.env.VITE_MAP_TILE_URL ||
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  // Expose flyTo(id) to the parent (list click → locate on map)
  useImperativeHandle(ref, () => ({
    flyTo: (id) => {
      const map = mapRef.current;
      const circle = circlesById.current[id];
      if (!map || !circle) return;
      map.flyTo(circle.getLatLng(), 15, { animate: true, duration: 1.2 });
      circle.openPopup();
    },
  }));

  // ── Init map once ──
  useEffect(() => {
    if (mapRef.current || !divRef.current) return;
    const map = L.map(divRef.current, {
      center: INDIA_CENTER,
      zoom: 5,
      zoomControl: false,
    });
    L.tileLayer(TILE, { attribution: "© OpenStreetMap" }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const disableInteractions = () => {
      map.dragging.disable();
      map.scrollWheelZoom.disable();
      map.doubleClickZoom.disable();
      map.boxZoom.disable();
    };
    const enableInteractions = () => {
      map.dragging.enable();
      map.scrollWheelZoom.enable();
      map.doubleClickZoom.enable();
      map.boxZoom.enable();
    };

    const finishDrawing = () => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;
      enableInteractions();
      if (tempCircleRef.current) openCreatePopup(tempCircleRef.current);
      centerRef.current = null;
    };

    const openCreatePopup = (circle) => {
      const radius = circle.getRadius();
      const latlng = circle.getLatLng();
      circle.bindPopup(buildFormHtml(radius), {
        closeOnClick: false,
        autoClose: false,
      });
      circle.openPopup();

      circle.on("popupopen", () => {
        const doneBtn = document.getElementById("gf-done");
        const cancelBtn = document.getElementById("gf-cancel");
        const errEl = document.getElementById("gf-error");

        if (cancelBtn) {
          cancelBtn.onclick = () => {
            circle.closePopup();
            layerRef.current.removeLayer(circle);
            tempCircleRef.current = null;
          };
        }
        if (doneBtn) {
          doneBtn.onclick = async () => {
            const name = document.getElementById("gf-name")?.value?.trim();
            const category = document
              .getElementById("gf-category")
              ?.value?.trim();
            const client = document.getElementById("gf-client")?.value?.trim();
            const mobile = document.getElementById("gf-mobile")?.value?.trim();

            if (!name) {
              if (errEl) {
                errEl.textContent = "Name is required.";
                errEl.classList.remove("hidden");
              }
              return;
            }

            doneBtn.disabled = true;
            doneBtn.textContent = "Saving…";

            const payload = {
              name,
              category: category || "GENERAL",
              client: client || "",
              type: "CIRCLE",
              mobileno: mobile || "0",
              accid: accid ?? 1,
              radius: Math.round(radius),
              location: {
                x: latlng.lng,
                y: latlng.lat,
                type: "Point",
                coordinates: [latlng.lng, latlng.lat],
              },
            };

            try {
              await onCreate?.(payload);
              circle.closePopup();
              layerRef.current.removeLayer(circle); // real one will re-render from refetched list
              tempCircleRef.current = null;
              setDrawMode(false);
            } catch {
              if (errEl) {
                errEl.textContent = "Failed to save. Try again.";
                errEl.classList.remove("hidden");
              }
              doneBtn.disabled = false;
              doneBtn.textContent = "Save Zone";
            }
          };
        }
      });
    };

    const handleMouseDown = (e) => {
      if (!drawModeRef.current) return;
      isDrawingRef.current = true;
      centerRef.current = e.latlng;
      disableInteractions();
      const circle = L.circle(e.latlng, {
        radius: 10,
        color: ZONE_COLOR,
        fillColor: ZONE_COLOR,
        fillOpacity: 0.15,
        weight: 2,
      }).addTo(layerRef.current);
      tempCircleRef.current = circle;
    };
    const handleMouseMove = (e) => {
      if (!isDrawingRef.current || !tempCircleRef.current || !centerRef.current)
        return;
      tempCircleRef.current.setRadius(
        map.distance(centerRef.current, e.latlng),
      );
    };
    const handleMouseUp = () => finishDrawing();

    map.on("mousedown", handleMouseDown);
    map.on("mousemove", handleMouseMove);
    map.on("mouseup", handleMouseUp);

    return () => {
      map.off("mousedown", handleMouseDown);
      map.off("mousemove", handleMouseMove);
      map.off("mouseup", handleMouseUp);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accid]);

  // ── Sync real geofences to the map whenever the list changes ──
  useEffect(() => {
    const map = mapRef.current,
      layer = layerRef.current;
    if (!map || !layer) return;

    // Clear only the "existing zone" circles (not an in-progress temp circle)
    Object.values(circlesById.current).forEach((c) => layer.removeLayer(c));
    circlesById.current = {};

    const bounds = [];
    for (const g of geofences) {
      const coords = g.location?.coordinates;
      if (!coords || coords.length < 2) continue;
      const [lng, lat] = coords;
      if (!lat || !lng) continue;

      const circle = L.circle([lat, lng], {
        radius: g.radius || 100,
        color: ZONE_COLOR,
        fillColor: ZONE_COLOR,
        fillOpacity: 0.15,
        weight: 2,
      }).addTo(layer);
      circle.bindPopup(popupContent(g));
      circlesById.current[g.id] = circle;
      bounds.push([lat, lng]);
    }

    if (bounds.length > 0 && !mapRef.current._userMoved) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }, [geofences]);

  // Mark once the user has manually panned, so re-fetches don't yank the view
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const flag = () => {
      map._userMoved = true;
    };
    map.on("dragstart", flag);
    return () => map.off("dragstart", flag);
  }, []);

  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-slate-200"
      style={{ height: 560 }}
    >
      <div
        ref={divRef}
        className="w-full h-full"
        style={{ cursor: drawMode ? "crosshair" : "grab" }}
      />

      {/* Draw toggle */}
      <button
        onClick={() => setDrawMode((v) => !v)}
        disabled={creating}
        className={cn(
          "absolute top-4 left-4 z-[1000] flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold shadow-lg transition",
          drawMode
            ? "bg-primary text-white"
            : "bg-white text-slate-600 hover:bg-slate-50",
        )}
      >
        {drawMode ? <X size={14} /> : <Pencil size={14} />}
        {drawMode ? "Cancel Drawing" : "Draw Zone"}
      </button>

      {drawMode && (
        <div className="absolute top-16 left-4 z-[1000] bg-white/95 backdrop-blur px-3 py-2 rounded-xl shadow-lg text-[11px] text-slate-500 max-w-[220px]">
          Click and drag on the map to draw a circular zone, then release to
          name and save it.
        </div>
      )}
    </div>
  );
});

export default GeofenceMap;

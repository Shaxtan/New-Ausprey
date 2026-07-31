/**
 * GeofenceMap.jsx — New-Ausprey
 *
 * Imperative Leaflet canvas for the Geofence page:
 *   - Renders every real geofence (CIRCLE or POLYGON) with a popup
 *   - Two draw tools:
 *       CIRCLE  — click-drag to size, OR a simple click (no drag) creates
 *                 a zone with the DEFAULT_RADIUS (200 m)
 *       POLYGON — click each vertex, then double-click / "Finish" to close
 *   - Release/finish opens a popup form that POSTs to the real
 *     createGeofence API
 *   - Exposes flyTo(id) via ref so the list panel can click-to-locate
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
import { Circle as CircleIcon, Hexagon, X, Check } from "lucide-react";
import { cn } from "@/utils";
import { MapStyleControl } from "@/components/maps";
import { MAP_MODES, DEFAULT_MAP_MODE } from "@/utils/mapTiles";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const INDIA_CENTER = [22.5589, 75.6089];
const ZONE_COLOR = "#2563eb";

/** A plain click (no meaningful drag) creates a circle with this radius. */
export const DEFAULT_RADIUS = 200; // metres
/** Drag distance below this is treated as a click, not a drag. */
const DRAG_THRESHOLD = 15; // metres
/** Minimum vertices before a polygon can be finished. */
const MIN_POLYGON_POINTS = 3;

// ─── Popup form (raw DOM — Leaflet popups aren't React-rendered, but the
// app's Tailwind utility classes still apply globally so we can use them). ──
function buildFormHtml(shapeType, sizeLabel) {
  return `
    <div class="min-w-[230px] p-1 font-sans">
      <h4 class="text-sm font-bold text-slate-800 mb-2">New ${shapeType === "POLYGON" ? "Polygon" : "Circle"} Geofence</h4>
      <input id="gf-name" type="text" placeholder="Name (e.g. Warehouse Zone)"
        class="w-full mb-2 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:border-primary" />
      <input id="gf-category" type="text" placeholder="Category (e.g. OFFICE)"
        class="w-full mb-2 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:border-primary" />
      <input id="gf-client" type="text" placeholder="Client"
        class="w-full mb-2 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:border-primary" />
      <input id="gf-mobile" type="text" placeholder="Mobile Number"
        class="w-full mb-2 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:border-primary" />
      <div class="text-[11px] text-slate-400 mb-2">${sizeLabel}</div>
      <div id="gf-error" class="text-[11px] text-rose-500 mb-2 hidden"></div>
      <button id="gf-fallback" class="hidden w-full mb-2 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 transition">
        Save as enclosing circle instead
      </button>
      <div class="flex justify-end gap-1.5">
        <button id="gf-cancel" class="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition">Cancel</button>
        <button id="gf-done" class="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-primary text-white hover:bg-primary-hover transition">Save Zone</button>
      </div>
    </div>
  `;
}

function popupContent(g) {
  const isPolygon = g.type === "POLYGON";
  const size = isPolygon
    ? `${(g.location?.coordinates?.[0]?.length ?? 1) - 1} vertices`
    : `Radius: ${g.radius ?? "—"}m`;
  return `
    <div class="p-1 font-sans min-w-[160px]">
      <div class="text-sm font-bold text-slate-800">${g.name ?? "Unnamed Zone"}</div>
      <div class="text-[11px] text-slate-500 mt-0.5">${g.category ?? "—"}${g.client ? ` · ${g.client}` : ""}</div>
      <div class="text-[11px] text-slate-400 mt-1">${isPolygon ? "Polygon" : "Circle"} · ${size}</div>
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
  const tileLayerRef = useRef(null);
  const shapesById = useRef({});

  // 'circle' | 'polygon' | null
  const [drawMode, setDrawMode] = useState(null);
  const drawModeRef = useRef(null);
  useEffect(() => {
    drawModeRef.current = drawMode;
  }, [drawMode]);

  const [mapMode, setMapMode] = useState(DEFAULT_MAP_MODE);

  // Circle drawing refs
  const isDrawingRef = useRef(false);
  const centerRef = useRef(null);
  const tempShapeRef = useRef(null);

  // Polygon drawing refs
  const polyPointsRef = useRef([]);
  const polyVertexMarkersRef = useRef([]);
  const [polyCount, setPolyCount] = useState(0);
  // finishPolygon is assigned inside the init effect but called from the
  // React "Finish" button, so it lives in a ref.
  const finishPolygonRef = useRef(null);

  // Expose flyTo(id) to the parent (list click → locate on map)
  useImperativeHandle(ref, () => ({
    flyTo: (id) => {
      const map = mapRef.current;
      const shape = shapesById.current[id];
      if (!map || !shape) return;
      if (shape.getBounds) {
        map.flyToBounds(shape.getBounds(), {
          padding: [60, 60],
          maxZoom: 16,
          duration: 1.2,
        });
      } else if (shape.getLatLng) {
        map.flyTo(shape.getLatLng(), 15, { animate: true, duration: 1.2 });
      }
      shape.openPopup();
    },
  }));

  // ── Init map once ──
  useEffect(() => {
    if (mapRef.current || !divRef.current) return;
    const map = L.map(divRef.current, {
      center: INDIA_CENTER,
      zoom: 5,
      zoomControl: false,
      doubleClickZoom: false, // dbl-click finishes a polygon instead
    });
    tileLayerRef.current = L.tileLayer(MAP_MODES[DEFAULT_MAP_MODE].url, {
      attribution: "© OpenStreetMap",
    }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const disableInteractions = () => {
      map.dragging.disable();
      map.scrollWheelZoom.disable();
      map.boxZoom.disable();
    };
    const enableInteractions = () => {
      map.dragging.enable();
      map.scrollWheelZoom.enable();
      map.boxZoom.enable();
    };

    // ── Shared: open the create form on a finished shape ──
    const openCreatePopup = (
      shape,
      shapeType,
      geometry,
      sizeLabel,
      fallbackGeometry = null,
    ) => {
      // Stop drawing while the form is open, otherwise clicks inside the
      // popup would keep adding polygon vertices behind it.
      drawModeRef.current = null;

      shape.bindPopup(buildFormHtml(shapeType, sizeLabel), {
        closeOnClick: false,
        autoClose: false,
        closeButton: false,
      });

      const cleanupTemp = () => {
        shape.closePopup();
        layerRef.current?.removeLayer(shape);
        tempShapeRef.current = null;
        setDrawMode(null);
      };

      // IMPORTANT: register the handler BEFORE openPopup() — otherwise the
      // popupopen event fires first and the buttons never get wired up.
      shape.once("popupopen", (ev) => {
        const root = ev.popup.getElement();
        if (!root) return;

        // Keep clicks/scrolls inside the form from reaching the map handlers
        L.DomEvent.disableClickPropagation(root);
        L.DomEvent.disableScrollPropagation(root);

        const q = (id) => root.querySelector(`#${id}`);
        const doneBtn = q("gf-done");
        const cancelBtn = q("gf-cancel");
        const errEl = q("gf-error");

        const showError = (msg) => {
          if (!errEl) return;
          errEl.textContent = msg;
          errEl.classList.remove("hidden");
        };

        if (cancelBtn) {
          L.DomEvent.on(cancelBtn, "click", (e) => {
            L.DomEvent.stop(e);
            cleanupTemp();
          });
        }

        if (doneBtn) {
          L.DomEvent.on(doneBtn, "click", async (e) => {
            L.DomEvent.stop(e);

            const name = q("gf-name")?.value?.trim();
            const category = q("gf-category")?.value?.trim();
            const client = q("gf-client")?.value?.trim();
            const mobile = q("gf-mobile")?.value?.trim();

            if (!name) {
              showError("Name is required.");
              return;
            }

            const buildPayload = (geom, type) => ({
              name,
              category: category || "GENERAL",
              client: client || "DEFAULT",
              type,
              mobileno: mobile || "0",
              accid: accid ?? 1,
              ...geom,
            });

            const submit = async (geom, type, label) => {
              doneBtn.disabled = true;
              doneBtn.textContent = "Saving…";
              const payload = buildPayload(geom, type);
              try {
                await onCreate?.(payload);
                cleanupTemp();
                return true;
              } catch (err) {
                const res = err?.response;
                const isRedirectOrBlocked = !res;
                const serverMsg =
                  res?.data?.message || res?.data?.error || err?.message;

                console.error(`Geofence create failed (${label}):`, {
                  status: res?.status,
                  response: res?.data,
                  payloadSent: payload,
                  likelyCause: isRedirectOrBlocked
                    ? "No response — server redirected (302 → /login) or blocked the request."
                    : "Server responded with an error.",
                });

                showError(
                  isRedirectOrBlocked
                    ? "Server rejected this shape (redirected to login)."
                    : serverMsg
                      ? `Failed: ${serverMsg}`
                      : "Failed to save. Try again.",
                );
                doneBtn.disabled = false;
                doneBtn.textContent = "Save Zone";
                return false;
              }
            };

            const ok = await submit(geometry, shapeType, shapeType);

            // If a POLYGON was rejected, offer to store it as the smallest
            // circle that encloses it — the backend's `location` model looks
            // Point-only, so this keeps the tool usable. The user opts in;
            // nothing is silently substituted.
            if (!ok && fallbackGeometry) {
              const fb = q("gf-fallback");
              if (fb) {
                fb.classList.remove("hidden");
                fb.onclick = async (ev) => {
                  L.DomEvent.stop(ev);
                  fb.disabled = true;
                  await submit(fallbackGeometry, "CIRCLE", "CIRCLE fallback");
                };
              }
            }
          });
        }
      });

      shape.openPopup();
    };

    // ── CIRCLE drawing ──
    const finishCircle = () => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;
      enableInteractions();

      const circle = tempShapeRef.current;
      centerRef.current = null;
      if (!circle) return;

      // A plain click (or a negligible drag) → use the default radius.
      if (circle.getRadius() < DRAG_THRESHOLD) {
        circle.setRadius(DEFAULT_RADIUS);
      }

      const radius = Math.round(circle.getRadius());
      const latlng = circle.getLatLng();

      openCreatePopup(
        circle,
        "CIRCLE",
        {
          radius,
          location: {
            x: latlng.lng,
            y: latlng.lat,
            type: "Point",
            coordinates: [latlng.lng, latlng.lat],
          },
        },
        `Radius: ${radius}m`,
      );
    };

    // ── POLYGON drawing ──
    const redrawPolygon = () => {
      const pts = polyPointsRef.current;
      if (tempShapeRef.current)
        layerRef.current.removeLayer(tempShapeRef.current);
      if (pts.length < 2) {
        tempShapeRef.current = null;
        return;
      }
      const shape =
        pts.length >= MIN_POLYGON_POINTS
          ? L.polygon(pts, {
              color: ZONE_COLOR,
              fillColor: ZONE_COLOR,
              fillOpacity: 0.15,
              weight: 2,
            })
          : L.polyline(pts, { color: ZONE_COLOR, weight: 2, dashArray: "5,5" });
      shape.addTo(layerRef.current);
      tempShapeRef.current = shape;
    };

    const addPolygonVertex = (latlng) => {
      polyPointsRef.current.push(latlng);
      const marker = L.circleMarker(latlng, {
        radius: 4,
        color: "#fff",
        weight: 2,
        fillColor: ZONE_COLOR,
        fillOpacity: 1,
      }).addTo(layerRef.current);
      polyVertexMarkersRef.current.push(marker);
      setPolyCount(polyPointsRef.current.length);
      redrawPolygon();
    };

    const clearPolygonVertexMarkers = () => {
      polyVertexMarkersRef.current.forEach((m) =>
        layerRef.current.removeLayer(m),
      );
      polyVertexMarkersRef.current = [];
    };

    const resetPolygonState = () => {
      polyPointsRef.current = [];
      clearPolygonVertexMarkers();
      setPolyCount(0);
    };

    const finishPolygon = () => {
      const pts = polyPointsRef.current;
      if (pts.length < MIN_POLYGON_POINTS) return;

      redrawPolygon();
      const polygon = tempShapeRef.current;
      clearPolygonVertexMarkers();
      polyPointsRef.current = [];
      setPolyCount(0);
      if (!polygon) return;

      // GeoJSON Polygon: [[ [lng,lat], …, first point repeated to close ]]
      const ring = pts.map((p) => [p.lng, p.lat]);
      ring.push([pts[0].lng, pts[0].lat]);
      const center = polygon.getBounds().getCenter();

      // Fallback: the smallest circle centred on the polygon that encloses
      // every vertex. Offered if the backend rejects the polygon geometry
      // (its `location` object exposes scalar x/y, which suggests it may
      // only model Point + radius — i.e. circles).
      const enclosingRadius = Math.ceil(
        Math.max(...pts.map((p) => map.distance(center, p))),
      );
      const fallbackGeometry = {
        radius: enclosingRadius,
        location: {
          x: center.lng,
          y: center.lat,
          type: "Point",
          coordinates: [center.lng, center.lat],
        },
      };

      openCreatePopup(
        polygon,
        "POLYGON",
        {
          radius: 0,
          location: {
            x: center.lng,
            y: center.lat,
            type: "Polygon",
            coordinates: [ring],
          },
        },
        `${pts.length} vertices`,
        fallbackGeometry,
      );
    };
    finishPolygonRef.current = finishPolygon;

    // ── Map event handlers ──
    const handleMouseDown = (e) => {
      if (drawModeRef.current !== "circle") return;
      isDrawingRef.current = true;
      centerRef.current = e.latlng;
      disableInteractions();
      const circle = L.circle(e.latlng, {
        radius: 0,
        color: ZONE_COLOR,
        fillColor: ZONE_COLOR,
        fillOpacity: 0.15,
        weight: 2,
      }).addTo(layerRef.current);
      tempShapeRef.current = circle;
    };

    const handleMouseMove = (e) => {
      if (
        drawModeRef.current !== "circle" ||
        !isDrawingRef.current ||
        !tempShapeRef.current ||
        !centerRef.current
      )
        return;
      tempShapeRef.current.setRadius(map.distance(centerRef.current, e.latlng));
    };

    const handleMouseUp = () => {
      if (drawModeRef.current !== "circle") return;
      finishCircle();
    };

    const handleClick = (e) => {
      if (drawModeRef.current !== "polygon") return;
      addPolygonVertex(e.latlng);
    };

    const handleDblClick = () => {
      if (drawModeRef.current !== "polygon") return;
      finishPolygon();
    };

    map.on("mousedown", handleMouseDown);
    map.on("mousemove", handleMouseMove);
    map.on("mouseup", handleMouseUp);
    map.on("click", handleClick);
    map.on("dblclick", handleDblClick);

    // Expose a reset so the toggle buttons can abort a partial polygon
    map._resetPolygonState = resetPolygonState;

    return () => {
      map.off("mousedown", handleMouseDown);
      map.off("mousemove", handleMouseMove);
      map.off("mouseup", handleMouseUp);
      map.off("click", handleClick);
      map.off("dblclick", handleDblClick);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accid]);

  // Swap tile layer when the style mode changes
  useEffect(() => {
    tileLayerRef.current?.setUrl(MAP_MODES[mapMode].url);
  }, [mapMode]);

  // ── Sync real geofences to the map whenever the list changes ──
  useEffect(() => {
    const map = mapRef.current,
      layer = layerRef.current;
    if (!map || !layer) return;

    Object.values(shapesById.current).forEach((s) => layer.removeLayer(s));
    shapesById.current = {};

    const bounds = [];
    for (const g of geofences) {
      const coords = g.location?.coordinates;
      if (!coords) continue;

      let shape = null;

      if (g.type === "POLYGON" || g.location?.type === "Polygon") {
        // GeoJSON ring(s): [[ [lng,lat], … ]] → Leaflet wants [lat,lng]
        const ring = Array.isArray(coords[0]?.[0]) ? coords[0] : coords;
        const latLngs = ring
          .filter((p) => Array.isArray(p) && p.length >= 2)
          .map(([lng, lat]) => [lat, lng]);
        if (latLngs.length < 3) continue;
        shape = L.polygon(latLngs, {
          color: ZONE_COLOR,
          fillColor: ZONE_COLOR,
          fillOpacity: 0.15,
          weight: 2,
        }).addTo(layer);
        latLngs.forEach((p) => bounds.push(p));
      } else {
        if (coords.length < 2) continue;
        const [lng, lat] = coords;
        if (!lat || !lng) continue;
        shape = L.circle([lat, lng], {
          radius: g.radius || DEFAULT_RADIUS,
          color: ZONE_COLOR,
          fillColor: ZONE_COLOR,
          fillOpacity: 0.15,
          weight: 2,
        }).addTo(layer);
        bounds.push([lat, lng]);
      }

      if (!shape) continue;
      shape.bindPopup(popupContent(g));
      shapesById.current[g.id] = shape;
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

  // ── Toggle helpers ──
  const selectMode = (mode) => {
    // Abort any partially-drawn polygon when switching/cancelling
    mapRef.current?._resetPolygonState?.();
    if (tempShapeRef.current) {
      layerRef.current?.removeLayer(tempShapeRef.current);
      tempShapeRef.current = null;
    }
    setDrawMode((prev) => (prev === mode ? null : mode));
  };

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

      {/* Draw tool toggles */}
      <div className="absolute top-4 left-4 z-[1000] flex items-center gap-2">
        <button
          onClick={() => selectMode("circle")}
          disabled={creating}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold shadow-lg transition",
            drawMode === "circle"
              ? "bg-primary text-white"
              : "bg-white text-slate-600 hover:bg-slate-50",
          )}
        >
          {drawMode === "circle" ? <X size={14} /> : <CircleIcon size={14} />}
          {drawMode === "circle" ? "Cancel" : "Circle"}
        </button>

        <button
          onClick={() => selectMode("polygon")}
          disabled={creating}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold shadow-lg transition",
            drawMode === "polygon"
              ? "bg-primary text-white"
              : "bg-white text-slate-600 hover:bg-slate-50",
          )}
        >
          {drawMode === "polygon" ? <X size={14} /> : <Hexagon size={14} />}
          {drawMode === "polygon" ? "Cancel" : "Polygon"}
        </button>

        {drawMode === "polygon" && polyCount >= MIN_POLYGON_POINTS && (
          <button
            onClick={() => finishPolygonRef.current?.()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold shadow-lg bg-emerald-500 text-white hover:bg-emerald-600 transition"
          >
            <Check size={14} /> Finish ({polyCount})
          </button>
        )}
      </div>

      <MapStyleControl
        value={mapMode}
        onChange={setMapMode}
        className="absolute top-4 right-4 z-[1000]"
      />

      {drawMode && (
        <div className="absolute top-16 left-4 z-[1000] bg-white/95 backdrop-blur px-3 py-2 rounded-xl shadow-lg text-[11px] text-slate-500 max-w-[260px]">
          {drawMode === "circle" ? (
            <>
              <strong className="text-slate-700">Circle:</strong> drag to size
              the zone, or just{" "}
              <strong className="text-slate-700">click</strong> to place one
              with the default {DEFAULT_RADIUS}m radius.
            </>
          ) : (
            <>
              <strong className="text-slate-700">Polygon:</strong> click each
              corner, then double-click (or press Finish) to close the shape.
              Minimum {MIN_POLYGON_POINTS} points.
            </>
          )}
        </div>
      )}
    </div>
  );
});

export default GeofenceMap;

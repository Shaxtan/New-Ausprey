/**
 * GeofenceList.jsx — New-Ausprey
 *
 * Lists real geofences from getViewDetailed(). Clicking a row asks the map
 * (via the onSelect callback → GeofenceMap's flyTo ref) to fly to that zone.
 * Circles and polygons get distinct icons and size labels.
 */
import { MapPin, Circle as CircleIcon, Hexagon } from "lucide-react";
import { Card, CardHeader, Skeleton } from "@/components/ui";
import { cn } from "@/utils";

const isPolygon = (g) => g.type === "POLYGON" || g.location?.type === "Polygon";

/** Vertex count for a polygon (GeoJSON rings repeat the first point at the end). */
function vertexCount(g) {
  const coords = g.location?.coordinates;
  const ring = Array.isArray(coords?.[0]?.[0]) ? coords[0] : coords;
  if (!Array.isArray(ring)) return 0;
  return Math.max(0, ring.length - 1);
}

export function GeofenceList({ data = [], loading, activeId, onSelect }) {
  return (
    <Card padded={false} className="h-full">
      <div className="p-5 pb-3">
        <CardHeader
          title="Geofences"
          subtitle={`${data.length} zone${data.length !== 1 ? "s" : ""}`}
        />
      </div>
      <div className="max-h-[500px] overflow-y-auto scrollbar-thin">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4">
              <Skeleton className="h-12 w-full" />
            </div>
          ))
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <MapPin size={26} className="mb-2 text-slate-300" />
            <p className="text-xs text-center px-4">
              No geofences yet. Use the Circle or Polygon tool on the map to
              create one.
            </p>
          </div>
        ) : (
          data.map((g) => {
            const poly = isPolygon(g);
            const Icon = poly ? Hexagon : CircleIcon;
            const sizeLabel = poly
              ? `${vertexCount(g)} pts`
              : g.radius
                ? `${g.radius}m`
                : "—";
            return (
              <button
                key={g.id}
                onClick={() => onSelect?.(g)}
                className={cn(
                  "w-full flex items-center gap-3 px-5 py-3.5 border-b border-slate-50 text-left transition",
                  activeId === g.id ? "bg-blue-50/70" : "hover:bg-slate-50",
                )}
              >
                <span
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                    poly ? "bg-violet-50" : "bg-blue-50",
                  )}
                >
                  <Icon
                    size={17}
                    className={poly ? "text-violet-500" : "text-primary"}
                  />
                </span>
                <div className="flex-1 min-w-0 leading-tight">
                  <div className="text-sm font-bold text-slate-800 truncate">
                    {g.name || "Unnamed Zone"}
                  </div>
                  <div className="text-xs text-slate-400 truncate">
                    {g.category ?? "—"}
                    {g.client ? ` · ${g.client}` : ""}
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-500 shrink-0">
                  {sizeLabel}
                </span>
              </button>
            );
          })
        )}
      </div>
    </Card>
  );
}

export default GeofenceList;

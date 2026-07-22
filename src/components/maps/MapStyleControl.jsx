/**
 * MapStyleControl.jsx — shared floating control for switching between
 * Standard / Satellite / Dark tile layers. Drop this onto ANY Leaflet map
 * in the app (imperative L.map() or declarative react-leaflet) — it's a
 * plain positioned button group, so it works the same way everywhere.
 *
 * Usage:
 *   const [mapMode, setMapMode] = useState(DEFAULT_MAP_MODE);
 *   <MapStyleControl value={mapMode} onChange={setMapMode} className="absolute top-3 right-3 z-[1000]" />
 *
 * For imperative maps: call tileLayerRef.current.setUrl(MAP_MODES[mapMode].url)
 * in a useEffect watching mapMode.
 * For react-leaflet: render <TileLayer key={mapMode} url={MAP_MODES[mapMode].url} .../>
 */
import { Map as MapIcon, Satellite, Moon } from "lucide-react";
import { cn } from "@/utils";
import { MAP_MODE_ORDER, MAP_MODES } from "@/utils/mapTiles";

const ICONS = { standard: MapIcon, satellite: Satellite, dark: Moon };

export function MapStyleControl({ value, onChange, className }) {
  return (
    <div
      className={cn(
        "flex items-center gap-0.5 bg-white rounded-xl shadow-lg p-1 border border-slate-200",
        className,
      )}
    >
      {MAP_MODE_ORDER.map((key) => {
        const Icon = ICONS[key];
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            title={MAP_MODES[key].label}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition",
              active
                ? "bg-primary text-white"
                : "text-slate-500 hover:bg-slate-100",
            )}
          >
            <Icon size={15} />
          </button>
        );
      })}
    </div>
  );
}

export default MapStyleControl;

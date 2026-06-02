import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const TILE_URL = import.meta.env.VITE_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

// Custom HTML marker avoids Leaflet's default-image asset issues under bundlers.
const buildIcon = (color = '#2563eb') =>
  L.divIcon({
    className: 'auspre-marker',
    html: `<span style="display:flex;width:30px;height:30px;align-items:center;justify-content:center;border-radius:9999px;background:${color};border:2px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,.25)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
    </span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

// markers: [{ id, lat, lng, color, label, sublabel }]
// circles: [{ lat, lng, radius, color }]
export function FleetMap({
  center = [12.9716, 77.5946], zoom = 11, markers = [], circles = [],
  onMarkerClick, height = 540, scrollWheelZoom = true,
}) {
  return (
    <div style={{ height }} className="w-full rounded-2xl overflow-hidden">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={scrollWheelZoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer url={TILE_URL} attribution='&copy; OpenStreetMap contributors' />
        {circles.map((c, i) => (
          <Circle key={`c-${i}`} center={[c.lat, c.lng]} radius={c.radius}
            pathOptions={{ color: c.color || '#2563eb', fillColor: c.color || '#2563eb', fillOpacity: 0.12, weight: 2 }} />
        ))}
        {markers.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]} icon={buildIcon(m.color)}
            eventHandlers={{ click: () => onMarkerClick?.(m) }}>
            <Popup>
              <div className="text-sm">
                <div className="font-bold text-slate-800">{m.label}</div>
                {m.sublabel && <div className="text-slate-500">{m.sublabel}</div>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default FleetMap;

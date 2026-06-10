import { useMemo, useState } from 'react';
import { Search, X, Gauge, MapPin, User, Power, Clock, Layers, Locate } from 'lucide-react';
import { PageHeader } from '@/components/common';
import { Button, Card, StatusBadge } from '@/components/ui';
import { FleetMap } from '@/components/maps';
import { useLiveVehicles } from '@/modules/tracking/hooks/useLiveVehicles';
import { formatDateTime } from '@/utils';
import { cn } from '@/utils';

// ─── helpers ──────────────────────────────────────────────────────────────────
const markerColor = (s) =>
  s === 'Moving' ? '#10b981' : s === 'Stopped' ? '#ef4444' : '#f59e0b';

const CHIPS = [
  { key: 'All',     label: 'All',     dot: '#64748b' },
  { key: 'Moving',  label: 'Moving',  dot: '#10b981' },
  { key: 'Stopped', label: 'Stopped', dot: '#ef4444' },
  { key: 'Idle',    label: 'Idle',    dot: '#f59e0b' },
];

// ─── Floating filter bar ───────────────────────────────────────────────────────
function MapFilterBar({ search, onSearch, status, onStatus, counts }) {
  return (
    <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-col sm:flex-row sm:items-center gap-2.5 pointer-events-none">
      <div className="relative w-full sm:w-72 pointer-events-auto">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search vehicle..."
          className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white/95 backdrop-blur shadow-card text-slate-700 placeholder-slate-400 outline-none"
        />
      </div>
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/95 backdrop-blur shadow-card border border-slate-200 w-fit pointer-events-auto">
        {CHIPS.map((c) => {
          const active = status === c.key;
          return (
            <button
              key={c.key}
              onClick={() => onStatus(c.key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition',
                active ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-100'
              )}
            >
              <span className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: active ? '#fff' : c.dot }} />
              {c.label}
              <span className={cn('ml-0.5', active ? 'text-white/80' : 'text-slate-400')}>
                {counts?.[c.key] ?? 0}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Vehicle detail popup ──────────────────────────────────────────────────────
function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <Icon size={15} className="text-slate-400 shrink-0" />
      <span className="text-slate-400">{label}</span>
      <span className="ml-auto font-semibold text-slate-700 text-right">{value}</span>
    </div>
  );
}

function MapVehiclePopup({ vehicle, onClose }) {
  if (!vehicle) return null;
  return (
    <div className="absolute bottom-3 left-3 z-[1000] w-[290px] bg-white rounded-2xl border border-slate-200 shadow-float p-4 animate-fade-up">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-base font-extrabold text-slate-900">{vehicle.reg}</div>
          <div className="mt-1"><StatusBadge status={vehicle.status} /></div>
        </div>
        <button onClick={onClose}
          className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1 transition">
          <X size={16} />
        </button>
      </div>
      <div className="space-y-2.5">
        <Row icon={User}   label="Driver"   value={vehicle.driver} />
        <Row icon={Gauge}  label="Speed"    value={`${vehicle.speed} km/h`} />
        <Row icon={Power}  label="Ignition" value={vehicle.ignition} />
        <Row icon={MapPin} label="Location" value={vehicle.location} />
        <Row icon={Clock}  label="Updated"  value={formatDateTime(vehicle.lastUpdate)} />
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function MapPage() {
  const { data: vehicles = [], isLoading } = useLiveVehicles();
  const [search, setSearch]     = useState('');
  const [status, setStatus]     = useState('All');
  const [activeId, setActiveId] = useState(null);

  const counts = useMemo(() => ({
    All:     vehicles.length,
    Moving:  vehicles.filter((v) => v.status === 'Moving').length,
    Stopped: vehicles.filter((v) => v.status === 'Stopped').length,
    Idle:    vehicles.filter((v) => v.status === 'Idle').length,
  }), [vehicles]);

  const filtered = useMemo(() =>
    vehicles.filter((v) =>
      (status === 'All' || v.status === status) &&
      v.reg.toLowerCase().includes(search.toLowerCase())
    ), [vehicles, status, search]);

  const markers = filtered.map((v) => ({
    id: v.id, lat: v.lat, lng: v.lng,
    color: markerColor(v.status),
    label: v.reg,
    sublabel: `${v.status} · ${v.speed} km/h`,
  }));

  const active = vehicles.find((v) => v.id === activeId) ?? null;

  return (
    <div>
      <PageHeader
        crumbs={['Home', 'Map View']}
        title="Map View"
        description="A live, map-first view of every vehicle across your fleet."
        actions={
          <>
            <Button variant="secondary" icon={Layers}>Layers</Button>
            <Button icon={Locate}>Recenter</Button>
          </>
        }
      />
      <Card padded={false} className="relative overflow-hidden">
        <MapFilterBar
          search={search}   onSearch={setSearch}
          status={status}   onStatus={setStatus}
          counts={counts}
        />
        <FleetMap
          markers={markers}
          center={active ? [active.lat, active.lng] : undefined}
          zoom={11}
          height={620}
          onMarkerClick={(m) => setActiveId(m.id)}
        />
        <MapVehiclePopup vehicle={active} onClose={() => setActiveId(null)} />
      </Card>
      {isLoading && <p className="mt-3 text-xs text-slate-400">Loading live positions…</p>}
    </div>
  );
} 
import { useEffect, useState } from 'react';
import { Plus, Map as MapIcon, ShieldAlert, Car, CheckCircle2 } from 'lucide-react';
import { PageHeader, KpiCard, Trend } from '@/components/common';
import { Button, Card } from '@/components/ui';
import { FleetMap } from '@/components/maps';
import { formatNumber } from '@/utils';
import { useGeofences, useGeofenceStats } from '../hooks/useGeofences';
import { GeofenceList } from '../components/GeofenceList';
import { AddGeofenceForm } from '../components/AddGeofenceForm';

export default function GeofencePage() {
  const { data: geofences = [], isLoading } = useGeofences();
  const { data: stats, isLoading: statsLoading } = useGeofenceStats();
  const [activeId, setActiveId] = useState(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => { if (!activeId && geofences.length) setActiveId(geofences[0].id); }, [geofences, activeId]);
  const active = geofences.find((g) => g.id === activeId);

  const circles = geofences.map((g) => ({ lat: g.lat, lng: g.lng, radius: g.radius, color: g.color }));
  const markers = geofences.map((g) => ({ id: g.id, lat: g.lat, lng: g.lng, color: g.color, label: g.name, sublabel: `${g.vehicles} vehicles` }));

  const cards = [
    { icon: MapIcon, iconBg: '#eff6ff', iconColor: '#2563eb', label: 'Total Geofences', value: formatNumber(stats?.total), trend: <Trend value="+2" direction="up" /> },
    { icon: CheckCircle2, iconBg: '#ecfdf5', iconColor: '#10b981', label: 'Active', value: formatNumber(stats?.active), trend: <Trend value="89%" direction="up" suffix="of total" /> },
    { icon: ShieldAlert, iconBg: '#fff1f2', iconColor: '#f43f5e', label: 'Violations Today', value: formatNumber(stats?.violationsToday), trend: <Trend value="+5" direction="up" /> },
    { icon: Car, iconBg: '#f5f3ff', iconColor: '#8b5cf6', label: 'Vehicles Inside', value: formatNumber(stats?.vehiclesInside), trend: <Trend value="No change" neutral /> },
  ];

  return (
    <div>
      <PageHeader
        crumbs={['Monitoring', 'Geofence']}
        title="Geofence Management"
        description="Create geofences and get instant alerts for entry / exit violations."
        actions={<Button icon={Plus} onClick={() => setAdding(true)}>Add Geofence</Button>}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        {cards.map((c, i) => <KpiCard key={c.label} {...c} index={i} loading={statsLoading} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-3"><GeofenceList data={geofences} loading={isLoading} activeId={activeId} onSelect={(g) => setActiveId(g.id)} /></div>
        <div className="lg:col-span-9">
          <Card padded={false} className="overflow-hidden">
            <FleetMap markers={markers} circles={circles} center={active ? [active.lat, active.lng] : undefined} zoom={12} height={560} onMarkerClick={(m) => setActiveId(m.id)} />
          </Card>
        </div>
      </div>
      <AddGeofenceForm open={adding} onClose={() => setAdding(false)} onSubmit={() => {}} />
    </div>
  );
}

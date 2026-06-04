import { useEffect, useMemo, useState } from "react";
import { Filter, Locate } from "lucide-react";
import { PageHeader } from "@/components/common";
import { Button, Card } from "@/components/ui";
import { FleetMap } from "@/components/maps";
import { tokens } from "@/themes";
import { useLiveVehicles } from "../hooks/useLiveVehicles";
import { VehicleListPanel } from "../components/VehicleListPanel";
import { VehicleDetailCard } from "../components/VehicleDetailCard";

const markerColor = (s) =>
  s === "Running"
    ? (tokens.status?.moving ?? "#10b981")
    : s === "Stopped"
      ? "#ef4444"
      : "#f59e0b"; // Idle / Inactive

export default function TrackingPage() {
  const { data: rawVehicles = [], isLoading } = useLiveVehicles();
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState(null);

  // Normalise real-API shape → shape the page components expect.
  // Real shape: { id, name, status, speed, ignition, lat, lng, lastUpdate, deviceType }
  // Page expects: { id, reg, status, speed, lat, lng, ... }
  const vehicles = useMemo(
    () =>
      rawVehicles
        .filter((v) => v && v.lat && v.lng) // drop devices without coordinates
        .map((v) => ({
          ...v,
          reg: v.name ?? v.id, // page uses v.reg for display/search
          driver: v.driverName ?? "N/A",
          ignition: v.ignition ? "ON" : "OFF",
        })),
    [rawVehicles],
  );

  useEffect(() => {
    if (!activeId && vehicles.length) setActiveId(vehicles[0].id);
  }, [vehicles, activeId]);

  const filtered = useMemo(
    () =>
      vehicles.filter((v) =>
        (v.reg ?? "").toLowerCase().includes(search.toLowerCase()),
      ),
    [vehicles, search],
  );

  const active = vehicles.find((v) => v.id === activeId) ?? null;
  const markers = vehicles.map((v) => ({
    id: v.id,
    lat: v.lat,
    lng: v.lng,
    color: markerColor(v.status),
    label: v.reg,
    sublabel: `${v.status} · ${v.speed} km/h`,
  }));
  const center = active ? [active.lat, active.lng] : undefined;

  return (
    <div>
      <PageHeader
        crumbs={["Home", "Live Tracking"]}
        title="Live Tracking"
        description="Real-time vehicle tracking with advanced data points and map intelligence."
        actions={
          <>
            <Button variant="secondary" icon={Filter}>
              Filter
            </Button>
            <Button icon={Locate}>Center Map</Button>
          </>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-3">
          <VehicleListPanel
            vehicles={filtered}
            loading={isLoading}
            activeId={activeId}
            onSelect={(v) => setActiveId(v.id)}
            search={search}
            onSearch={setSearch}
          />
        </div>
        <div className="lg:col-span-9">
          <Card padded={false} className="relative overflow-hidden">
            <FleetMap
              markers={markers}
              center={center}
              zoom={11}
              height={540}
              onMarkerClick={(m) => setActiveId(m.id)}
            />
            <VehicleDetailCard vehicle={active} />
          </Card>
        </div>
      </div>
    </div>
  );
}

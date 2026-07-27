/**
 * VehiclesPage.jsx — New-Ausprey
 *
 * Real device/vehicle registry from GET /devices (no mock data).
 *
 * Note: this endpoint is a device REGISTRY, not live telemetry — there's no
 * driver, speed, fuel, odometer, or location field here, so those columns
 * from the old mock table are gone. For live status/position, see the
 * Dashboard or Live Tracking pages. "Add Vehicle" / "Import" actions are
 * also omitted since no create/import endpoint was provided for this API.
 */
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common";
import { SearchInput, Select } from "@/components/ui";
import { useDebounce } from "@/hooks";
import { useVehicles, deriveVehicleStats } from "../hooks/useVehicles";
import { VehicleStatsCards } from "../components/VehicleStatsCards";
import { VehiclesTable } from "../components/VehiclesTable";

const STATUS_OPTIONS = ["All Status", "Active", "Inactive"];

export default function VehiclesPage() {
  const vehicles = useVehicles();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All Status");
  const debounced = useDebounce(search, 250);

  const stats = useMemo(
    () => deriveVehicleStats(vehicles.data ?? []),
    [vehicles.data],
  );

  const filtered = useMemo(() => {
    const list = vehicles.data ?? [];
    const term = debounced.trim().toLowerCase();
    return list.filter((v) => {
      const statusOk = status === "All Status" || v.status === status;
      const searchOk =
        !term ||
        v.vehicleNumber.toLowerCase().includes(term) ||
        v.imei.toLowerCase().includes(term) ||
        v.simNo.toLowerCase().includes(term);
      return statusOk && searchOk;
    });
  }, [vehicles.data, debounced, status]);

  const toolbar = (
    <div className="p-5 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <h3 className="text-base font-bold text-slate-800">
        Fleet ({stats.total})
      </h3>
      <div className="flex items-center gap-2">
        <SearchInput
          placeholder="Search vehicle, IMEI, or SIM…"
          value={search}
          onChange={setSearch}
          className="w-full sm:w-64"
        />
        <Select
          value={status}
          onChange={setStatus}
          options={STATUS_OPTIONS}
          className="w-36"
        />
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        crumbs={["Fleet", "Vehicles"]}
        title="Vehicles"
        description="Your registered device/vehicle inventory."
      />
      <VehicleStatsCards stats={stats} loading={vehicles.isLoading} />
      <VehiclesTable
        data={filtered}
        loading={vehicles.isLoading}
        total={stats.total}
        toolbar={toolbar}
      />
    </div>
  );
}

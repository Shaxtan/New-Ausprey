import { StatusBadge } from "@/components/ui";

export function VehicleDetailCard({ vehicle }) {
  if (!vehicle) return null;

  // Build a readable location string from lat/lng if no string address available
  const locationStr =
    vehicle.location ??
    (vehicle.lat && vehicle.lng
      ? `${vehicle.lat.toFixed(4)}, ${vehicle.lng.toFixed(4)}`
      : "—");

  const rows = [
    ["Speed", `${vehicle.speed ?? 0} km/h`],
    ["Last Update", vehicle.lastUpdate ?? "—"],
    ["Location", locationStr],
    ["Driver", vehicle.driver ?? "N/A"],
    ["Ignition", vehicle.ignition ?? "—"],
    ["Device Type", vehicle.deviceType ?? "—"],
  ];

  return (
    <div className="absolute bottom-4 left-4 z-[500] w-72 bg-white rounded-2xl shadow-float border border-slate-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-slate-800">
          {vehicle.reg ?? vehicle.name}
        </span>
        <StatusBadge status={vehicle.status} />
      </div>
      {rows.map(([k, v]) => (
        <div
          key={k}
          className="flex items-center justify-between py-1.5 text-sm border-b border-slate-50 last:border-0"
        >
          <span className="text-slate-400 font-medium">{k}</span>
          <span className="font-semibold text-slate-700 text-right max-w-[160px] truncate">
            {v}
          </span>
        </div>
      ))}
    </div>
  );
}

export default VehicleDetailCard;

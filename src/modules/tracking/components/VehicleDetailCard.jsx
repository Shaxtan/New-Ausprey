import { StatusBadge } from '@/components/ui';
import { formatDateTime } from '@/utils';

export function VehicleDetailCard({ vehicle }) {
  if (!vehicle) return null;
  const rows = [
    ['Speed', `${vehicle.speed} km/h`],
    ['Last Update', formatDateTime(vehicle.lastUpdate)],
    ['Location', vehicle.location],
    ['Driver', vehicle.driver],
    ['Ignition', vehicle.ignition],
  ];
  return (
    <div className="absolute bottom-4 left-4 z-[500] w-72 bg-white rounded-2xl shadow-float border border-slate-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-slate-800">{vehicle.reg}</span>
        <StatusBadge status={vehicle.status} />
      </div>
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between py-1.5 text-sm border-b border-slate-50 last:border-0">
          <span className="text-slate-400 font-medium">{k}</span>
          <span className="font-semibold text-slate-700 text-right">{v}</span>
        </div>
      ))}
    </div>
  );
}

export default VehicleDetailCard;

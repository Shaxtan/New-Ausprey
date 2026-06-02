import { Truck, User, Phone, Gauge, Flag, Clock, Route as RouteIcon } from 'lucide-react';
import { Modal, StatusBadge } from '@/components/ui';
import { formatKm, formatDateTime } from '@/utils';
const Info=({icon:Icon,label,value})=>(<div className="flex items-start gap-2.5"><div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><Icon size={15} className="text-slate-500"/></div><div className="min-w-0"><div className="text-xs text-slate-400 font-medium">{label}</div><div className="text-sm font-semibold text-slate-700 truncate">{value}</div></div></div>);
export function TripDetailModal({ trip, open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} size="lg" title={trip?trip.id:'Trip'} description="Trip assignment and live progress">
      {trip&&<div className="space-y-6">
        <div className="flex items-center justify-between"><StatusBadge status={trip.status}/><span className="text-xs text-slate-400">IMEI {trip.imei}</span></div>
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wide mb-3"><RouteIcon size={14}/> Route</div>
          <div className="flex gap-3">
            <div className="flex flex-col items-center pt-1"><span className="w-2.5 h-2.5 rounded-full bg-primary"/><span className="w-px flex-1 bg-slate-200 my-1"/><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"/></div>
            <div className="flex-1 space-y-4">
              <div><div className="text-xs text-slate-400">Source</div><div className="text-sm font-semibold text-slate-700">{trip.source}</div></div>
              <div><div className="text-xs text-slate-400">Destination</div><div className="text-sm font-semibold text-slate-700">{trip.destination}</div></div>
            </div>
          </div>
        </div>
        <div><div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5"><span>{formatKm(trip.covered)} covered</span><span>{trip.progress}% · {formatKm(trip.distance)} total</span></div><div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full" style={{width:`${trip.progress}%`,backgroundColor:trip.status==='Delayed'?'#ef4444':'#2563eb'}}/></div></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Info icon={Truck} label="Vehicle"  value={trip.vehicle}/><Info icon={User}  label="Driver"   value={trip.driver}/>
          <Info icon={Phone} label="Contact"  value={trip.phone}/> <Info icon={Gauge} label="Distance" value={formatKm(trip.distance)}/>
          <Info icon={Clock} label="Started"  value={formatDateTime(trip.startedAt)}/><Info icon={Flag} label="ETA" value={formatDateTime(trip.eta)}/>
        </div>
      </div>}
    </Modal>
  );
}
export default TripDetailModal;
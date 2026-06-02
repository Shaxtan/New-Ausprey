import { MapPin } from 'lucide-react';
import { Card, CardHeader, Badge, Skeleton } from '@/components/ui';
import { cn } from '@/utils';

export function GeofenceList({ data = [], loading, activeId, onSelect }) {
  return (
    <Card padded={false} className="h-full">
      <div className="p-5 pb-3"><CardHeader title="Geofences" subtitle={`${data.length} zones`} /></div>
      <div className="max-h-[500px] overflow-y-auto scrollbar-thin">
        {loading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="p-4"><Skeleton className="h-12 w-full" /></div>)
          : data.map((g) => (
            <button key={g.id} onClick={() => onSelect?.(g)}
              className={cn('w-full flex items-center gap-3 px-5 py-3.5 border-b border-slate-50 text-left transition', activeId === g.id ? 'bg-blue-50/70' : 'hover:bg-slate-50')}>
              <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${g.color}1a` }}>
                <MapPin size={17} style={{ color: g.color }} />
              </span>
              <div className="flex-1 leading-tight">
                <div className="text-sm font-bold text-slate-800">{g.name}</div>
                <div className="text-xs text-slate-400">{g.vehicles} vehicles</div>
              </div>
              <Badge color={g.color} bg={`${g.color}14`}>{g.type}</Badge>
            </button>
          ))}
      </div>
    </Card>
  );
}

export default GeofenceList;

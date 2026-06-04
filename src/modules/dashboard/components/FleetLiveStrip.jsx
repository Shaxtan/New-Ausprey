import { Card, Skeleton } from "@/components/ui";
import { cn } from "@/utils";

function LivePill({ color, value, label, pulse }) {
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
      <span
        className={cn(
          "w-2.5 h-2.5 rounded-full",
          pulse && "animate-pulse-ring",
        )}
        style={{ backgroundColor: color }}
      />
      <div className="leading-tight">
        <div className="text-base font-extrabold text-slate-900">
          {value ?? "—"}
        </div>
        <div className="text-[11px] text-slate-400 font-semibold">{label}</div>
      </div>
    </div>
  );
}

export function FleetLiveStrip({ data, loading }) {
  const showSkeleton = loading || !data;

  return (
    <Card className="mb-5">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 pr-4 mr-1 border-r border-slate-100">
          <span
            className="w-2 h-2 rounded-full animate-pulse-ring"
            style={{ backgroundColor: "#10b981" }}
          />
          <span className="text-sm font-bold text-slate-700">Fleet Live</span>
        </div>
        {showSkeleton ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-32 rounded-xl" />
          ))
        ) : (
          <>
            <LivePill
              color="#10b981"
              value={(data.online ?? 0).toLocaleString()}
              label="Online Motion"
              pulse
            />
            <LivePill
              color="#f59e0b"
              value={(data.idle ?? 0).toLocaleString()}
              label="Idle"
            />
            <LivePill
              color="#3b82f6"
              value={(data.stopped ?? 0).toLocaleString()}
              label="Stopped"
            />
            <LivePill
              color="#94a3b8"
              value={(data.offline ?? 0).toLocaleString()}
              label="Offline"
            />
            <LivePill
              color="#f43f5e"
              value={(data.unreachable ?? 0).toLocaleString()}
              label="Unreachable"
            />
          </>
        )}
        <span className="ml-auto text-xs text-slate-400 font-medium hidden md:block">
          Updated just now
        </span>
      </div>
    </Card>
  );
}

export default FleetLiveStrip;

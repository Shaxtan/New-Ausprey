import { Truck } from "lucide-react";
import { Card, SearchInput, Skeleton } from "@/components/ui";
import { cn } from "@/utils";

// Supports both old mock statuses (Moving) and real API statuses (Running)
const statusColor = (s) =>
  s === "Running" || s === "Moving"
    ? "#10b981"
    : s === "Stopped"
      ? "#ef4444"
      : "#f59e0b"; // Idle / Inactive

export function VehicleListPanel({
  vehicles = [],
  loading,
  activeId,
  onSelect,
  search,
  onSearch,
}) {
  return (
    <Card padded={false} className="h-full">
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800">Vehicle List</h3>
          <span className="text-xs text-slate-400 font-semibold">
            {vehicles.length} total
          </span>
        </div>
        <SearchInput
          placeholder="Search vehicle..."
          value={search}
          onChange={onSearch}
        />
      </div>
      <div className="max-h-[460px] overflow-y-auto scrollbar-thin">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4">
                <Skeleton className="h-10 w-full" />
              </div>
            ))
          : vehicles.map((v) => (
              <button
                key={v.id}
                onClick={() => onSelect(v)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 border-b border-slate-50 text-left transition",
                  activeId === v.id ? "bg-blue-50/70" : "hover:bg-slate-50",
                )}
              >
                <span
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                    activeId === v.id ? "bg-blue-100" : "bg-slate-100",
                  )}
                >
                  <Truck size={17} style={{ color: statusColor(v.status) }} />
                </span>
                <div className="flex-1 leading-tight">
                  <div className="text-sm font-bold text-slate-800">
                    {v.reg ?? v.name}
                  </div>
                  <div
                    className="text-xs flex items-center gap-1.5"
                    style={{ color: statusColor(v.status) }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: statusColor(v.status) }}
                    />
                    {v.status} · {v.speed} km/h
                  </div>
                </div>
              </button>
            ))}
      </div>
    </Card>
  );
}

export default VehicleListPanel;

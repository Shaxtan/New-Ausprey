import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation, HelpCircle } from "lucide-react";
import { Card } from "@/components/ui";
import { DataTable, Pagination } from "@/components/tables";
import { formatNumber, cn } from "@/utils";
import { PATHS } from "@/constants";

const PAGE_SIZE = 10;

const fmtDate = (s) => {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d)) return s;
  return d.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export function VehiclesTable({ data = [], loading, total, toolbar }) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  // Reset to page 1 whenever the filtered set changes size (new search/status filter)
  useEffect(() => {
    setPage(1);
  }, [data.length]);

  const pageCount = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
  const pageRows = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const trackVehicle = (v) =>
    navigate(PATHS.TRACKING, {
      state: { targetImei: v.imei, targetAccountId: v.accountId },
    });

  const columns = [
    {
      key: "vehicleNumber",
      header: "Vehicle",
      render: (r) => (
        <div className="leading-tight">
          <div className="font-bold text-slate-800">{r.vehicleNumber}</div>
          <div className="text-xs text-slate-400 font-mono">{r.imei}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold",
            r.active
              ? "bg-emerald-50 text-emerald-600"
              : "bg-slate-100 text-slate-500",
          )}
        >
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              r.active ? "bg-emerald-500" : "bg-slate-400",
            )}
          />
          {r.status}
        </span>
      ),
    },
    { key: "deviceType", header: "Device Type", hide: "md" },
    {
      key: "simNo",
      header: "SIM No.",
      hide: "lg",
      render: (r) => <span className="font-mono text-xs">{r.simNo}</span>,
    },
    {
      key: "connected",
      header: "Connected",
      hide: "lg",
      render: (r) =>
        r.connected == null ? (
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            <HelpCircle size={12} /> Unknown
          </span>
        ) : r.connected ? (
          <span className="text-xs font-semibold text-emerald-600">Yes</span>
        ) : (
          <span className="text-xs font-semibold text-rose-500">No</span>
        ),
    },
    {
      key: "joiningDate",
      header: "Joined",
      hide: "lg",
      render: (r) => fmtDate(r.joiningDate),
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <button
          onClick={() => trackVehicle(r)}
          title="Track this vehicle"
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          <Navigation size={12} /> Track
        </button>
      ),
    },
  ];

  return (
    <Card padded={false}>
      {toolbar}
      <DataTable
        columns={columns}
        data={pageRows}
        loading={loading}
        rowKey="id"
        emptyText="No vehicles found."
      />
      <Pagination
        page={page}
        pageCount={pageCount}
        onPageChange={setPage}
        summary={`Showing ${pageRows.length ? (page - 1) * PAGE_SIZE + 1 : 0}–${(page - 1) * PAGE_SIZE + pageRows.length} of ${formatNumber(data.length)} vehicles`}
      />
    </Card>
  );
}

export default VehiclesTable;

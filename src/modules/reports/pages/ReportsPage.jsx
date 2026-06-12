import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/common";
import { ReportTypeList } from "../components/ReportTypeList";
import DistanceReportPage from "./DistanceReportPage";
import HourlyReportPage from "./HourlyReportPage";
import LoadCellReportPage from "@/modules/devices/pages/LoadCellReportPage";
import LiveLoadPage from "@/modules/devices/pages/LiveLoadPage";

const REPORT_TYPES = [
  {
    id: "distance",
    name: "Distance Report",
    desc: "Daily distance per vehicle",
  },
  {
    id: "hourly",
    name: "Working Hour Report",
    desc: "Session trips & account analytics",
  },
  { id: "idle", name: "Idle Report", desc: "Idling time analysis" },
  { id: "speed", name: "Overspeed Report", desc: "Violations by vehicle" },
  { id: "stoppage", name: "Stoppage Report", desc: "Stop duration & location" },
  {
    id: "load-cell",
    name: "Load Cell Report",
    desc: "Sensor load data & averages",
  },
  {
    id: "live-load",
    name: "Live Load Graph",
    desc: "Real-time load monitoring",
  },
];

const FULL_PAGES = {
  "load-cell": LoadCellReportPage,
  "live-load": LiveLoadPage,
};

function ComingSoon({ name }) {
  return (
    <div className="flex items-center justify-center h-64 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-500">{name}</p>
        <p className="text-xs text-slate-400 mt-1">Coming soon</p>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [active, setActive] = useState("distance");

  const FullPage = FULL_PAGES[active];
  if (FullPage) {
    return (
      <div>
        <button
          onClick={() => setActive("distance")}
          className="inline-flex items-center gap-2 mb-4 px-3 py-2 text-sm font-semibold text-slate-600 hover:text-primary bg-white border border-slate-200 rounded-xl hover:border-primary transition"
        >
          <ArrowLeft size={16} /> Back to Reports
        </button>
        <FullPage />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        crumbs={["Insights", "Reports"]}
        title="Reports & Analytics"
        description="Generate detailed operational reports and export them in one click."
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-3">
          <ReportTypeList
            types={REPORT_TYPES}
            loading={false}
            activeId={active}
            onSelect={setActive}
          />
        </div>
        <div className="lg:col-span-9">
          {active === "distance" && <DistanceReportPage />}
          {active === "hourly" && <HourlyReportPage />}
          {active !== "distance" && active !== "hourly" && (
            <ComingSoon
              name={REPORT_TYPES.find((r) => r.id === active)?.name ?? active}
            />
          )}
        </div>
      </div>
    </div>
  );
}

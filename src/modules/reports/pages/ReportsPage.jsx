import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, FileBarChart, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/common";
import DistanceReportPage from "./DistanceReportPage";
import HourlyReportPage from "./HourlyReportPage";
import TrackPlayPage from "./TrackPlayPage";
import StoppageReportPage from "./StoppageReportPage";
import OverspeedReportPage from "./OverspeedReportPage";
import FuelTheftReportPage from "./FuelTheftReportPage";
import { PATHS } from "@/constants";

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
  { id: "trackplay", name: "Track Play", desc: "Historical route playback" },
  { id: "speed", name: "Overspeed Report", desc: "Violations by vehicle" },
  { id: "stoppage", name: "Stoppage Report", desc: "Stop duration & location" },
  {
    id: "fuel-theft",
    name: "Fuel Theft Report",
    desc: "Detect sudden analog sensor drops",
  },
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

// Reports that render inline inside this page
const INLINE_PAGES = {
  distance: DistanceReportPage,
  hourly: HourlyReportPage,
  trackplay: TrackPlayPage,
  speed: OverspeedReportPage,
  stoppage: StoppageReportPage,
  "fuel-theft": FuelTheftReportPage,
};

// Reports that have their own dedicated routes — navigate there directly
const ROUTE_PAGES = {
  "load-cell": PATHS.LOAD_CELL,
  "live-load": PATHS.LIVE_LOAD,
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
  const location = useLocation();
  const navigate = useNavigate();
  const [active, setActive] = useState(null);

  // Chatbot can navigate here with { activeReport } in location.state
  useEffect(() => {
    const st = location.state;
    if (!st?.activeReport) return;
    const id = st.activeReport;
    if (ROUTE_PAGES[id]) {
      navigate(ROUTE_PAGES[id]);
    } else if (INLINE_PAGES[id]) {
      setActive(id);
    }
  }, [location.state, navigate]);

  const handleSelect = (id) => {
    if (ROUTE_PAGES[id]) {
      navigate(ROUTE_PAGES[id]);
    } else {
      setActive(id);
    }
  };

  // ── Active inline report ──
  if (active) {
    const InlinePage = INLINE_PAGES[active];
    return (
      <div>
        <button
          onClick={() => setActive(null)}
          className="inline-flex items-center gap-2 mb-4 px-3 py-2 text-sm font-semibold
                     text-slate-600 hover:text-primary bg-white border border-slate-200
                     rounded-xl hover:border-primary transition"
        >
          <ArrowLeft size={16} /> Back to Reports
        </button>
        {InlinePage ? (
          <InlinePage />
        ) : (
          <ComingSoon
            name={REPORT_TYPES.find((r) => r.id === active)?.name ?? active}
          />
        )}
      </div>
    );
  }

  // ── Landing — grid of report type cards ──
  return (
    <div>
      <PageHeader
        crumbs={["Insights", "Reports"]}
        title="Reports & Analytics"
        description="Choose a report to generate detailed operational insights."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {REPORT_TYPES.map((r) => (
          <button
            key={r.id}
            onClick={() => handleSelect(r.id)}
            className="group flex items-center gap-4 p-5 rounded-2xl border border-slate-200
                       bg-white text-left hover:border-primary hover:shadow-card transition"
          >
            <span
              className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-blue-100
                             flex items-center justify-center shrink-0 transition"
            >
              <FileBarChart
                size={20}
                className="text-slate-500 group-hover:text-primary transition"
              />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-slate-800 group-hover:text-primary transition">
                {r.name}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">{r.desc}</div>
            </div>
            <ChevronRight
              size={18}
              className="text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition shrink-0"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

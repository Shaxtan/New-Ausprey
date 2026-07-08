/**
 * ActionExecutor.jsx
 *
 * Watches the useChatActionStore for pending actions dispatched by the
 * Fleet Chat Assistant and executes them against the real application state.
 *
 * Mounted once inside DashboardLayout so it has access to useNavigate
 * and all the stores it needs to drive.
 *
 * Action handlers:
 *   NAVIGATE            → react-router navigate()
 *   TRACK_VEHICLE       → navigate to /tracking with targetImei state
 *   OPEN_VEHICLE_DRAWER → write imei to useFleetTableStore → drawer opens
 *   OPEN_REPORT         → navigate to /reports with report tab state
 *   FILTER_FLEET_TABLE  → write filter to useFleetTableStore → table reacts
 *   OPEN_ALERTS         → navigate to /alerts
 *   OPEN_TRACK_PLAY     → navigate to /reports with trackplay tab + imei state
 */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useChatActionStore } from "@/store/useChatActionStore";
import { useFleetTableStore } from "@/store/useFleetTableStore";
import { PATHS } from "@/constants";

// Map report names the LLM might use → report IDs used in ReportsPage
const REPORT_ID_MAP = {
  distance: "distance",
  stoppage: "stoppage",
  overspeed: "speed",
  speed: "speed",
  trackplay: "trackplay",
  track_play: "trackplay",
  hourly: "hourly",
  working: "hourly",
  loadcell: "load-cell",
  liveload: "live-load",
};

export function ActionExecutor() {
  const navigate = useNavigate();
  const pendingAction = useChatActionStore((s) => s.pendingAction);
  const clearAction = useChatActionStore((s) => s.clear);
  const openDrawer = useFleetTableStore((s) => s.openDrawerByImei);
  const applyFilter = useFleetTableStore((s) => s.applyTableFilter);

  useEffect(() => {
    if (!pendingAction) return;

    const act = pendingAction;
    clearAction(); // clear immediately to avoid re-triggering

    switch (act.type) {
      case "NAVIGATE": {
        const target = act.to ?? PATHS.DASHBOARD;
        navigate(target, { state: act.state ?? {} });
        break;
      }

      case "TRACK_VEHICLE": {
        if (!act.imei) break;
        navigate(PATHS.TRACKING, {
          state: { targetImei: act.imei, targetAccountId: act.accountId },
        });
        break;
      }

      case "OPEN_VEHICLE_DRAWER": {
        if (!act.imei) break;
        // Navigate to dashboard first if not there, then open drawer
        navigate(PATHS.DASHBOARD);
        // Small delay so the dashboard mounts before we write to the store
        setTimeout(() => openDrawer(act.imei), 300);
        break;
      }

      case "OPEN_REPORT": {
        const reportId = REPORT_ID_MAP[act.report?.toLowerCase()] ?? act.report;
        navigate(PATHS.REPORTS, {
          state: {
            activeReport: reportId,
            prefillImei: act.imei ?? null,
            prefillRange: act.range ?? null,
          },
        });
        break;
      }

      case "FILTER_FLEET_TABLE": {
        // Navigate to dashboard, then apply the filter
        navigate(PATHS.DASHBOARD);
        setTimeout(() => {
          applyFilter({
            tab: act.tab ?? "vts",
            filter: act.filter ?? "all",
            search: act.search ?? null,
          });
          // Scroll to the fleet table
          setTimeout(() => {
            document.getElementById("fleet-table-card")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }, 400);
        }, 300);
        break;
      }

      case "OPEN_ALERTS": {
        navigate(PATHS.ALERTS);
        break;
      }

      case "OPEN_TRACK_PLAY": {
        navigate(PATHS.REPORTS, {
          state: {
            activeReport: "trackplay",
            prefillImei: act.imei ?? null,
            prefillRange: act.range ?? null,
          },
        });
        break;
      }

      default:
        console.warn("[ActionExecutor] Unknown action type:", act.type);
    }
  }, [pendingAction, clearAction, navigate, openDrawer, applyFilter]);

  return null; // purely side-effects, no UI
}

export default ActionExecutor;

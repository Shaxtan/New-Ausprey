/**
 * ActionExecutor.jsx
 *
 * Watches useChatActionStore for pending actions and executes them.
 *
 * Key improvement: resolveImei() — when the LLM returns a vehicleNumber
 * instead of (or alongside) an IMEI, we look it up from the live fleet
 * snapshot in useFleetTableStore so vehicle-number-based commands work
 * even if the LLM doesn't reliably copy the IMEI from the context.
 */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useChatActionStore } from "@/store/useChatActionStore";
import { useFleetTableStore } from "@/store/useFleetTableStore";
import { PATHS } from "@/constants";

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

  // Access the live fleet vehicles list stored in the chat hook via a ref
  // We pull it from the window-level cache set by useFleetChat
  const resolveImei = (act) => {
    // If a valid IMEI is already provided, use it directly
    const provided = act.imei?.trim();

    // Grab the fleet snapshot the chat hook stashed on window
    const vehicles = window.__fleetChatVehicles ?? [];

    if (provided && provided.length > 8) {
      // Looks like a real IMEI — verify it exists in our fleet, return it
      const match = vehicles.find(
        (v) => v.id === provided || v.imei === provided,
      );
      if (match) return { imei: provided, accountId: match.accountId };
    }

    // Try to match by vehicleNumber (what the user typed / LLM returned)
    const vehicleNumber = act.vehicleNumber?.trim();
    if (vehicleNumber) {
      const match = vehicles.find((v) => {
        const name = (v.name ?? "").toLowerCase();
        const vn = vehicleNumber.toLowerCase();
        return name === vn || name.includes(vn) || vn.includes(name);
      });
      if (match) return { imei: match.id, accountId: match.accountId };
    }

    // Last resort: partial match on the provided IMEI value against vehicle names
    if (provided) {
      const match = vehicles.find((v) =>
        (v.name ?? "").toLowerCase().includes(provided.toLowerCase()),
      );
      if (match) return { imei: match.id, accountId: match.accountId };
    }

    return { imei: provided ?? null, accountId: act.accountId ?? null };
  };

  useEffect(() => {
    if (!pendingAction) return;
    const act = pendingAction;
    clearAction();

    switch (act.type) {
      case "NAVIGATE": {
        navigate(act.to ?? PATHS.DASHBOARD, { state: act.state ?? {} });
        break;
      }

      case "TRACK_VEHICLE": {
        const { imei, accountId } = resolveImei(act);
        if (!imei) break;
        navigate(PATHS.TRACKING, {
          state: { targetImei: imei, targetAccountId: accountId },
        });
        break;
      }

      case "OPEN_VEHICLE_DRAWER": {
        const { imei } = resolveImei(act);
        if (!imei) break;
        navigate(PATHS.DASHBOARD);
        setTimeout(() => openDrawer(imei), 300);
        break;
      }

      case "OPEN_REPORT": {
        const { imei } = resolveImei(act);
        const reportId = REPORT_ID_MAP[act.report?.toLowerCase()] ?? act.report;
        navigate(PATHS.REPORTS, {
          state: { activeReport: reportId, prefillImei: imei ?? null },
        });
        break;
      }

      case "FILTER_FLEET_TABLE": {
        navigate(PATHS.DASHBOARD);
        setTimeout(() => {
          applyFilter({
            tab: act.tab ?? "vts",
            filter: act.filter ?? "all",
            search: act.search ?? null,
          });
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
        const { imei } = resolveImei(act);
        navigate(PATHS.REPORTS, {
          state: { activeReport: "trackplay", prefillImei: imei ?? null },
        });
        break;
      }

      default:
        console.warn("[ActionExecutor] Unknown action type:", act.type);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAction]);

  return null;
}

export default ActionExecutor;

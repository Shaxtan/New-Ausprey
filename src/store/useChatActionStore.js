/**
 * useChatActionStore.js
 *
 * Global action bus — the Fleet Chat Assistant dispatches actions here,
 * and the ActionExecutor component (in DashboardLayout) consumes them.
 *
 * Action types:
 *   NAVIGATE          — go to a page, optionally with state
 *   TRACK_VEHICLE     — open live tracking for a specific IMEI
 *   OPEN_VEHICLE_DRAWER — open the VehicleDrawer for a specific IMEI
 *   OPEN_REPORT       — navigate to Reports and open a specific report tab
 *   FILTER_FLEET_TABLE — scroll to and filter the dashboard fleet table
 *   OPEN_ALERTS       — navigate to Alerts page with pre-filled filters
 *   OPEN_TRACK_PLAY   — open Track Play report pre-filled with IMEI + range
 */
import { create } from "zustand";

export const useChatActionStore = create((set) => ({
  pendingAction: null,

  /** Dispatch an action for the ActionExecutor to handle. */
  dispatch: (action) => set({ pendingAction: action }),

  /** Clear after the action has been executed. */
  clear: () => set({ pendingAction: null }),
}));

export default useChatActionStore;

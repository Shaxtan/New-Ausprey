/**
 * useFleetTableStore.js
 *
 * Lifts the FleetTableCard's drawer + filter state into a global Zustand store
 * so the Fleet Chat Assistant can drive it from outside the component.
 *
 * FleetTableCard reads from here instead of local useState.
 * The ActionExecutor writes here when the LLM dispatches a fleet-table action.
 */
import { create } from "zustand";

export const useFleetTableStore = create((set) => ({
  // Drawer
  drawerImei: null, // IMEI of the vehicle whose drawer is open (null = closed)
  drawerVehicle: null, // full vehicle row object (set by FleetTableCard on match)

  // Table filters (written by chatbot, read by FleetTableCard)
  pendingTab: null, // 'vts' | 'unreachable' | null
  pendingFilter: null, // 'all' | 'running' | 'idle' | 'stopped' | 'inactive' | null
  pendingSearch: null, // search string | null

  // Actions
  openDrawerByImei: (imei) => set({ drawerImei: imei, drawerVehicle: null }),
  setDrawerVehicle: (vehicle) => set({ drawerVehicle: vehicle }),
  closeDrawer: () => set({ drawerImei: null, drawerVehicle: null }),
  applyTableFilter: ({ tab, filter, search }) =>
    set({
      pendingTab: tab ?? null,
      pendingFilter: filter ?? null,
      pendingSearch: search ?? null,
    }),
  clearTableFilter: () =>
    set({ pendingTab: null, pendingFilter: null, pendingSearch: null }),
}));

export default useFleetTableStore;

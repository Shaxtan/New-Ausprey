/**
 * useCommandPaletteStore.js
 *
 * Tiny shared open/close state for the global command palette, so both the
 * Cmd+K keyboard shortcut (in CommandPalette.jsx) and any UI trigger
 * (the Topbar search bar) can control the same instance.
 */
import { create } from "zustand";

export const useCommandPaletteStore = create((set) => ({
  open: false,
  toggle: () => set((s) => ({ open: !s.open })),
  setOpen: (open) => set({ open }),
}));

export default useCommandPaletteStore;

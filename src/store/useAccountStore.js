/**
 * useAccountStore.js  — New-Ausprey
 *
 * Loads the account list from the real API (accountDropdown) on first use.
 * Falls back to an empty list while loading.
 *
 * Each account has:
 *   { id (numeric), label (name), type, parentAccountId, status }
 *
 * The Topbar's AccountSelector uses `selectedAccount` + `setAccount(id)`.
 */
import { create } from "zustand";
import apiService from "@/services/apiService";

export const useAccountStore = create((set, get) => ({
  accounts: [],
  selectedAccount: null,
  loading: false,
  loaded: false,

  /** Fetch account list from API. Call once on app boot. */
  loadAccounts: async () => {
    if (get().loading || get().loaded) return;
    set({ loading: true });
    try {
      const res = await apiService.getAccountDropdown();
      const accounts = (res?.data?.data ?? []).map((a) => ({
        id: a.id, // numeric id used in API calls
        label: a.name,
        type: a.type,
        parentAccountId: a.parentAccountId,
        status: a.status,
        // vehicles count is not in dropdown — fill lazily or show 0
        vehicles: 0,
      }));
      set({
        accounts,
        selectedAccount: accounts[0] ?? null,
        loaded: true,
        loading: false,
      });
    } catch (err) {
      console.error("Failed to load account list:", err);
      set({ loading: false, loaded: true });
    }
  },

  setAccount: (id) => {
    const found = get().accounts.find((a) => a.id === id);
    if (found) set({ selectedAccount: found });
  },
}));

export default useAccountStore;

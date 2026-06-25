/**
 * useAccountStore.js  — New-Ausprey
 *
 * Loads the account list from the real API (accountDropdown) on first use.
 *
 * Each account has:
 *   { id (numeric), label (name), type, parentAccountId, status }
 *
 * The Topbar's AccountSelector uses `selectedAccount` + `setAccount(id)`.
 *
 * IMPORTANT:
 *  - On load, the selected account defaults to the LOGGED-IN user's account
 *    (from auth/userDetails), NOT simply accounts[0]. This stops the dropdown
 *    snapping to whichever account happens to be first (e.g. techhop → shree
 *    ganesh on refresh).
 *  - `reset()` clears everything so logging out + back in as a different
 *    account doesn't show the previous account until a hard refresh.
 */
import { create } from "zustand";
import apiService from "@/services/apiService";

/** Read the logged-in user's accountId from persisted auth/userDetails. */
function loggedInAccountId() {
  try {
    const auth = JSON.parse(localStorage.getItem("auspre-auth") || "null");
    if (auth?.user?.accountId != null) return Number(auth.user.accountId);
  } catch {
    /* noop */
  }
  try {
    const details = JSON.parse(localStorage.getItem("userDetails") || "null");
    if (details?.accountId != null) return Number(details.accountId);
    if (details?.accid != null) return Number(details.accid);
  } catch {
    /* noop */
  }
  return null;
}

export const useAccountStore = create((set, get) => ({
  accounts: [],
  selectedAccount: null,
  loading: false,
  loaded: false,

  /** Fetch account list from API. Selects the logged-in user's account. */
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
        vehicles: 0,
      }));

      // Prefer the account the user actually logged in with; fall back to first.
      const myId = loggedInAccountId();
      const mine =
        myId != null ? accounts.find((a) => Number(a.id) === myId) : null;

      set({
        accounts,
        selectedAccount: mine ?? accounts[0] ?? null,
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

  /** Clear all account state — call on logout so the next login starts fresh. */
  reset: () =>
    set({ accounts: [], selectedAccount: null, loading: false, loaded: false }),
}));

export default useAccountStore;

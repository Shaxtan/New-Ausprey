import { create } from "zustand";

// Build a display name from a raw userDetails object (real API shape)
const deriveUser = (d) => {
  if (!d) return null;
  const fullName = [d.firstName, d.lastName].filter(Boolean).join(" ").trim();
  const name =
    fullName || d.username || d.userName || d.name || d.email || "User";
  const role =
    (Array.isArray(d.roles) && d.roles.length
      ? d.roles[0].replace(/^ROLE_/, "")
      : null) ||
    d.roleId ||
    d.role ||
    "Member";
  return {
    name,
    email: d.email || "",
    role,
    username: d.username ?? "",
    accountId: d.accountId ?? d.accid ?? 1,
  };
};

const load = () => {
  // Prefer the new auth key
  try {
    const auth = JSON.parse(localStorage.getItem("auspre-auth") || "{}");
    if (auth.user) return auth;
  } catch {
    /* noop */
  }

  // Fall back to the raw userDetails saved at login (re-derive a clean user)
  try {
    const details = JSON.parse(localStorage.getItem("userDetails") || "null");
    const token =
      localStorage.getItem("auspre-token") ||
      details?.jwtToken ||
      details?.token ||
      null;
    if (details) {
      return { user: deriveUser(details), token, isAuthenticated: !!token };
    }
  } catch {
    /* noop */
  }

  return {};
};

const stored = load();

export const useAuthStore = create((set) => ({
  user: stored.user ?? null,
  token: stored.token ?? null,
  isAuthenticated: stored.isAuthenticated ?? false,

  login: ({ user, token }) => {
    try {
      localStorage.setItem(
        "auspre-auth",
        JSON.stringify({ user, token, isAuthenticated: true }),
      );
      if (token) localStorage.setItem("auspre-token", token);
    } catch {
      /* noop */
    }
    set({ user, token, isAuthenticated: true });
  },

  updateUser: (patch) => set((s) => ({ user: { ...s.user, ...patch } })),

  logout: () => {
    try {
      localStorage.removeItem("auspre-auth");
      localStorage.removeItem("auspre-token");
      localStorage.removeItem("userDetails");
    } catch {
      /* noop */
    }
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

export default useAuthStore;

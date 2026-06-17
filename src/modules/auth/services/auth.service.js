/**
 * auth.service.js  — New-Ausprey
 *
 * Connects to the real Ausprey backend.
 * POST /users/users/signin  { username, password, signInHere: true }
 *
 * The `username` field accepts BOTH a username string and an e-mail address —
 * the backend handles both.  The LoginPage sends whatever the user typed.
 */
import apiService from "@/services/apiService";

export const authService = {
  /**
   * @param {{ identifier: string, password: string }} credentials
   *   `identifier` can be either a username or an e-mail address.
   */
  login: async ({ identifier, password }) => {
    if (!identifier || !password) {
      return Promise.reject({
        message: "Username/email and password are required.",
      });
    }

    const res = await apiService.login({ username: identifier, password });
    const body = res?.data;

    // resultCode 208 = "already signed in elsewhere" — surface the message
    if (body?.resultCode === 208) {
      return Promise.reject({ message: body.message, code: 208 });
    }

    if (!body?.data) {
      return Promise.reject({
        message:
          body?.message || "Login failed. Please check your credentials.",
      });
    }

    // Save raw token details the same way the old project did
    const tokenDetails = body.data;
    tokenDetails.expireDate = new Date(
      new Date().getTime() + (tokenDetails.expiresIn ?? 86400) * 1000,
    );
    localStorage.setItem("userDetails", JSON.stringify(tokenDetails));

    // The real API returns the JWT in `jwtToken` (older code used `token`)
    const token = tokenDetails.jwtToken ?? tokenDetails.token ?? "";
    if (token) {
      localStorage.setItem("auspre-token", token);
    }

    // Build a display name from the API fields.
    // Response shape: { username, firstName, middleName, lastName, ... }
    const fullName = [tokenDetails.firstName, tokenDetails.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    const displayName =
      fullName ||
      tokenDetails.username ||
      tokenDetails.userName ||
      tokenDetails.email ||
      identifier ||
      "User";

    const roleLabel =
      (Array.isArray(tokenDetails.roles) && tokenDetails.roles.length
        ? tokenDetails.roles[0].replace(/^ROLE_/, "") // ROLE_ADMIN → ADMIN
        : null) ||
      tokenDetails.roleId ||
      tokenDetails.role ||
      "Member";

    // Return a shape that useAuthStore.login({ user, token }) expects
    return {
      token,
      user: {
        name: displayName,
        email: tokenDetails.email || identifier,
        role: roleLabel,
        username: tokenDetails.username ?? identifier,
        accountId: tokenDetails.accountId ?? tokenDetails.accid ?? 1,
      },
    };
  },
};

export default authService;

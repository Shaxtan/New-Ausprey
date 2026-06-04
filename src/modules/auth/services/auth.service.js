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

    // Also persist in the new key so apiClient interceptor picks it up
    if (tokenDetails.token) {
      localStorage.setItem("auspre-token", tokenDetails.token);
    }

    // Return a shape that useAuthStore.login({ user, token }) expects
    return {
      token: tokenDetails.token ?? tokenDetails.jwtToken ?? "",
      user: {
        name: tokenDetails.name ?? tokenDetails.userName ?? "User",
        email: tokenDetails.email ?? identifier,
        role: tokenDetails.role ?? tokenDetails.userType ?? "Fleet Manager",
        accountId: tokenDetails.accountId ?? tokenDetails.accid ?? 1,
      },
    };
  },
};

export default authService;

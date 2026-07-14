import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LogIn,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui";
import { TextField } from "@/components/forms";
import { useAuthStore } from "@/store";
import { PATHS } from "@/constants";
import { authService } from "../services/auth.service";
import { AuthLayout } from "../components/AuthLayout";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const login = useAuthStore((state) => state.login);

  const [form, setForm] = useState({
    identifier: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (key) => (event) => {
    setForm((prev) => ({
      ...prev,
      [key]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const { user, token } = await authService.login(form);

      login({
        user,
        token,
      });

      navigate(location.state?.from?.pathname ?? PATHS.DASHBOARD, {
        replace: true,
      });
    } catch (err) {
      setError(err?.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to continue to your EyeOTY Fleet Platform."
      footer={
        <>
          Don't have an account?{" "}
          <Link
            to={PATHS.SIGNUP}
            className="font-semibold text-blue-600 hover:text-blue-700 transition"
          >
            Create Account
          </Link>
        </>
      }
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
            <AlertCircle size={20} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <TextField
          label="Username or Email"
          placeholder="Enter your username or email"
          type="text"
          required
          autoComplete="username"
          value={form.identifier}
          onChange={handleChange("identifier")}
        />

        <div className="relative">
          <TextField
            label="Password"
            placeholder="Enter your password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange("password")}
          />

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-4 top-[42px] text-slate-400 transition hover:text-blue-600"
          >
            {showPassword ? (
              <EyeOff size={20} />
            ) : (
              <Eye size={20} />
            )}
          </button>
        </div>
                <div className="flex items-center justify-between">

          <label className="flex items-center gap-3 cursor-pointer select-none">

            <input
              type="checkbox"
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />

            <span className="text-sm text-slate-600">
              Remember me
            </span>

          </label>

          <button
            type="button"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
          >
            Forgot Password?
          </button>

        </div>

        <Button
          type="submit"
          size="lg"
          disabled={loading}
          className="
            w-full
            h-14
            rounded-2xl
            bg-gradient-to-r
            from-blue-600
            to-cyan-500
            hover:from-blue-700
            hover:to-cyan-600
            shadow-xl
            shadow-blue-500/20
            transition-all
            duration-300
            hover:-translate-y-0.5
            text-base
            font-semibold
          "
        >
          <div className="flex items-center justify-center gap-2">

            {loading ? (

              <>
                <svg
                  className="h-5 w-5 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-20"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />

                  <path
                    className="opacity-100"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>

                Signing In...

              </>

            ) : (

              <>

                <LogIn size={20} />

                Sign In

                <ArrowRight size={18} />

              </>

            )}

          </div>

        </Button>

        <div className="relative py-2">

          <div className="absolute inset-0 flex items-center">

            <div className="w-full border-t border-slate-200" />

          </div>

          <div className="relative flex justify-center">

            <span className="bg-white px-4 text-xs uppercase tracking-wider text-slate-400">

              Secure Login

            </span>

          </div>

        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">

          <div className="flex items-start gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white">

              <ShieldCheck size={18} />

            </div>

            <div>

              <h4 className="font-semibold text-slate-800">

                Enterprise Grade Security

              </h4>

              <p className="mt-1 text-sm leading-6 text-slate-500">

                Your account is protected using encrypted authentication,
                secure session management and enterprise-grade security
                standards.

              </p>

            </div>

          </div>

        </div>

      </form>
    </AuthLayout>
  );
}
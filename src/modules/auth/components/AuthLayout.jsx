import {
  ShieldCheck,
  Navigation,
  Radio,
  BarChart3,
  Truck,
  Activity,
  Wifi,
} from "lucide-react";
import { Logo } from "@/layouts/components/Logo";

const FEATURES = [
  {
    icon: Navigation,
    title: "Real-time Tracking",
    description: "Track every vehicle with live GPS updates.",
  },
  {
    icon: Wifi,
    title: "IoT Sensors",
    description: "Monitor temperature, fuel, load and diagnostics.",
  },
  {
    icon: Activity,
    title: "AI Analytics",
    description: "Actionable insights powered by intelligent analytics.",
  },
];

const STATS = [
  {
    value: "12.5K",
    label: "Connected Vehicles",
  },
  {
    value: "98.9%",
    label: "Fleet Uptime",
  },
  {
    value: "24/7",
    label: "Monitoring",
  },
];

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100">

      {/* Background */}

      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-blue-50" />

      <div className="absolute top-[-250px] left-[-250px] h-[500px] w-[500px] rounded-full bg-blue-400/20 blur-3xl" />

      <div className="absolute bottom-[-250px] right-[-250px] h-[500px] w-[500px] rounded-full bg-cyan-400/20 blur-3xl" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,.08),transparent_40%)]" />

      <div className="relative z-10 flex min-h-screen">

        {/* LEFT SIDE */}

        <div className="hidden lg:flex w-[58%] relative overflow-hidden">

          <div className="absolute inset-0 bg-[#081B36]" />

          <div className="absolute inset-0 opacity-[0.07] bg-[linear-gradient(rgba(255,255,255,.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.15)_1px,transparent_1px)] bg-[size:42px_42px]" />

          <div className="absolute top-20 left-20 h-72 w-72 rounded-full bg-blue-500/20 blur-[120px]" />

          <div className="absolute bottom-20 right-20 h-72 w-72 rounded-full bg-cyan-400/10 blur-[120px]" />

          <div className="relative z-10 flex h-full flex-col justify-between p-14">

            {/* Logo */}

            <div>

              <Logo />

            </div>

            {/* Heading */}

            <div className="max-w-xl">

              <div className="inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-200 backdrop-blur-md">

                Enterprise Fleet Intelligence

              </div>

              <h1 className="mt-8 text-6xl font-black leading-tight tracking-tight text-white">

                Smarter Fleet.
                <br />
                Better Decisions.

              </h1>

              <p className="mt-8 text-lg leading-8 text-slate-300">

                EyeOTY brings GPS tracking, IoT sensors, analytics,
                alerts and operational intelligence into one unified
                platform designed for enterprises.

              </p>

              <div className="mt-14 grid gap-6">

                {FEATURES.map((item) => (

                  <div
                    key={item.title}
                    className="flex items-start gap-5"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">

                      <item.icon
                        className="text-blue-400"
                        size={24}
                      />

                    </div>

                    <div>

                      <h3 className="text-lg font-semibold text-white">

                        {item.title}

                      </h3>

                      <p className="mt-1 text-slate-400">

                        {item.description}

                      </p>

                    </div>

                  </div>

                ))}

              </div>

            </div>

            {/* Bottom */}

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-3 text-slate-400">

                <ShieldCheck
                  size={18}
                  className="text-green-400"
                />

                SOC 2 Certified • 256-bit Encryption

              </div>

              <div className="flex gap-8">

                {STATS.map((stat) => (

                  <div key={stat.label}>

                    <div className="text-3xl font-bold text-white">

                      {stat.value}

                    </div>

                    <div className="text-sm text-slate-400">

                      {stat.label}

                    </div>

                  </div>

                ))}

              </div>

            </div>

          </div>

          {/* Floating Dashboard Card */}

          <div className="absolute right-10 top-24 w-72 rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl shadow-2xl">

            <div className="flex items-center justify-between">

              <span className="text-sm text-white">

                Fleet Overview

              </span>

              <Truck
                className="text-blue-400"
                size={20}
              />

            </div>

            <div className="mt-8 space-y-4">

              <div>

                <div className="flex justify-between text-sm text-slate-300">

                  <span>Active Vehicles</span>

                  <span>2,451</span>

                </div>

                <div className="mt-2 h-2 rounded-full bg-slate-700">

                  <div className="h-2 w-[88%] rounded-full bg-blue-500"></div>

                </div>

              </div>

              <div>

                <div className="flex justify-between text-sm text-slate-300">

                  <span>Online Sensors</span>

                  <span>96%</span>

                </div>

                <div className="mt-2 h-2 rounded-full bg-slate-700">

                  <div className="h-2 w-[96%] rounded-full bg-emerald-400"></div>

                </div>

              </div>

              <div>

                <div className="flex justify-between text-sm text-slate-300">

                  <span>System Health</span>

                  <span>99%</span>

                </div>

                <div className="mt-2 h-2 rounded-full bg-slate-700">

                  <div className="h-2 w-[99%] rounded-full bg-cyan-400"></div>

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* RIGHT SIDE */}

        <div className="flex flex-1 items-center justify-center px-8 py-12">

          <div className="w-full max-w-md">

            <div className="rounded-[34px] border border-white/70 bg-white/80 p-10 shadow-[0_25px_80px_rgba(15,23,42,.12)] backdrop-blur-2xl">

              <div className="mb-8 flex justify-center lg:hidden">

                <Logo />

              </div>

              <h2 className="text-4xl font-black tracking-tight text-slate-900">

                {title}

              </h2>

              {subtitle && (

                <p className="mt-3 text-slate-500">

                  {subtitle}

                </p>

              )}

              <div className="mt-8">

                {children}

              </div>

              {footer && (

                <div className="mt-8 text-center text-sm text-slate-500">

                  {footer}

                </div>

              )}

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default AuthLayout;
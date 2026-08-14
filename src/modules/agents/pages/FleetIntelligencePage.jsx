/**
 * FleetIntelligencePage.jsx — surfaces the AI agent findings.
 *
 * Runs the batch agents (Data Quality #6, Device Health #8, Alert Priority #18)
 * over the current account's fleet and presents:
 *   - Top summary KPIs (data quality score, findings by severity)
 *   - Per-agent stat cards
 *   - A filterable, searchable findings table
 */
import { useMemo, useState, useRef } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  Activity,
  Database,
  Radio,
  Bell,
  Search,
  RefreshCw,
  ChevronRight,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common";
import { Card, Skeleton, Spinner } from "@/components/ui";
import { PATHS } from "@/constants";
import { cn } from "@/utils";
import { useFleetScan } from "../hooks/useFleetScan";

const SEV_META = {
  critical: {
    label: "Critical",
    color: "text-rose-600",
    bg: "bg-rose-50",
    dot: "bg-rose-500",
  },
  warning: {
    label: "Warning",
    color: "text-amber-600",
    bg: "bg-amber-50",
    dot: "bg-amber-400",
  },
  info: {
    label: "Info",
    color: "text-slate-500",
    bg: "bg-slate-100",
    dot: "bg-slate-400",
  },
};

const AGENT_META = {
  "data-quality": { label: "Data Quality", icon: Database, num: 6 },
  "device-health": { label: "Device Health", icon: Radio, num: 8 },
  "alert-priority": { label: "Alert Priority", icon: Bell, num: 18 },
  "gps-jump": { label: "GPS Jump", icon: Activity, num: 7 },
};

// ─── Small stat tile ──────────────────────────────────────────────────────────
function StatTile({
  icon: Icon,
  label,
  value,
  sub,
  color = "#2563eb",
  bg = "#eff6ff",
  loading,
  onClick,
}) {
  return (
    <Card
      hover={!!onClick}
      className={onClick ? "cursor-pointer" : ""}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: bg }}
        >
          <Icon size={20} style={{ color }} />
        </div>
        <div>
          <div className="text-xs text-slate-400 font-medium">{label}</div>
          {loading ? (
            <Skeleton className="h-6 w-16 mt-1" />
          ) : (
            <div className="text-xl font-extrabold text-slate-800 leading-tight">
              {value}
            </div>
          )}
          {sub && <div className="text-[11px] text-slate-400">{sub}</div>}
        </div>
      </div>
    </Card>
  );
}

// ─── Data quality score ring ──────────────────────────────────────────────────
function ScoreRing({ score }) {
  const r = 26,
    c = 2 * Math.PI * r;
  const off = c - (score / 100) * c;
  const col = score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <svg width="68" height="68" viewBox="0 0 68 68">
      <circle
        cx="34"
        cy="34"
        r={r}
        fill="none"
        stroke="#f1f5f9"
        strokeWidth="7"
      />
      <circle
        cx="34"
        cy="34"
        r={r}
        fill="none"
        stroke={col}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={off}
        transform="rotate(-90 34 34)"
      />
      <text
        x="34"
        y="34"
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: 16, fontWeight: 800, fill: "#0f172a" }}
      >
        {score}
      </text>
    </svg>
  );
}

export default function FleetIntelligencePage() {
  const { scan, isLoading, isFetching, refetch } = useFleetScan();
  const navigate = useNavigate();
  const [sevFilter, setSevFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [codeFilter, setCodeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const findingsRef = useRef(null);

  const findings = scan?.findings ?? [];

  // Scroll to the findings table after a card click
  const scrollToFindings = () => {
    requestAnimationFrame(() =>
      findingsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      }),
    );
  };

  // Apply a filter set from a card click, then scroll down to the table
  const focusFindings = ({
    severity = "all",
    agent = "all",
    code = "all",
  } = {}) => {
    setSevFilter(severity);
    setAgentFilter(agent);
    setCodeFilter(code);
    setSearch("");
    scrollToFindings();
  };

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return findings.filter((f) => {
      if (sevFilter !== "all" && f.severity !== sevFilter) return false;
      if (agentFilter !== "all" && f.agent !== agentFilter) return false;
      if (codeFilter !== "all" && f.code !== codeFilter) return false;
      if (
        term &&
        !(
          f.title.toLowerCase().includes(term) ||
          f.detail.toLowerCase().includes(term) ||
          (f.vehnum ?? "").toLowerCase().includes(term) ||
          (f.imei ?? "").toLowerCase().includes(term)
        )
      )
        return false;
      return true;
    });
  }, [findings, sevFilter, agentFilter, codeFilter, search]);

  const sum = scan?.summary;
  const hasActiveFilter =
    sevFilter !== "all" ||
    agentFilter !== "all" ||
    codeFilter !== "all" ||
    search !== "";
  const clearFilters = () => {
    setSevFilter("all");
    setAgentFilter("all");
    setCodeFilter("all");
    setSearch("");
  };

  return (
    <div className="pb-10">
      <PageHeader
        crumbs={["Insights", "Fleet Intelligence"]}
        title="Fleet Intelligence"
        description="AI agents continuously scan your fleet data for quality, health, and priority issues."
        actions={
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className={cn(
              "inline-flex items-center gap-2 text-sm font-semibold px-3.5 py-2 rounded-xl border transition",
              isFetching
                ? "text-slate-300 border-slate-100 bg-slate-50 cursor-not-allowed"
                : "text-slate-600 border-slate-200 bg-white hover:bg-slate-50 hover:border-primary/40",
            )}
          >
            <RefreshCw size={14} className={cn(isFetching && "animate-spin")} />
            {isFetching ? "Scanning…" : "Re-scan"}
          </button>
        }
      />

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        <Card
          hover
          className="cursor-pointer"
          onClick={() => focusFindings({ agent: "data-quality" })}
        >
          <div className="flex items-center gap-3">
            {isLoading ? (
              <Skeleton className="h-16 w-16 rounded-full" />
            ) : (
              <ScoreRing score={sum?.dataQualityScore ?? 100} />
            )}
            <div>
              <div className="text-xs text-slate-400 font-medium">
                Data Quality Score
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {sum?.devicesScanned ?? 0} devices scanned
              </div>
            </div>
          </div>
        </Card>
        <StatTile
          icon={AlertTriangle}
          label="Critical"
          value={sum?.critical ?? 0}
          color="#e11d48"
          bg="#fff1f2"
          loading={isLoading}
          onClick={() => focusFindings({ severity: "critical" })}
        />
        <StatTile
          icon={Activity}
          label="Warnings"
          value={sum?.warning ?? 0}
          color="#f59e0b"
          bg="#fffbeb"
          loading={isLoading}
          onClick={() => focusFindings({ severity: "warning" })}
        />
        <StatTile
          icon={ShieldCheck}
          label="Total Findings"
          value={sum?.totalFindings ?? 0}
          color="#2563eb"
          bg="#eff6ff"
          loading={isLoading}
          onClick={() => focusFindings({})}
        />
      </div>

      {/* Per-agent cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <AgentCard
          agentKey="data-quality"
          loading={isLoading}
          onAgentClick={() => focusFindings({ agent: "data-quality" })}
          stats={
            scan && [
              [
                "Corrupt timestamps",
                scan.quality.stats.corruptTimestamp,
                "CORRUPT_TIMESTAMP",
              ],
              [
                "Ignition mismatches",
                scan.quality.stats.ignContradiction,
                "IGN_CONTRADICTION",
              ],
              [
                "Invalid coords",
                scan.quality.stats.invalidCoords,
                "INVALID_COORDS",
              ],
              ["Duplicates", scan.quality.stats.duplicates, "DUPLICATE"],
            ]
          }
          onStatClick={(code) => focusFindings({ agent: "data-quality", code })}
        />
        <AgentCard
          agentKey="device-health"
          loading={isLoading}
          onAgentClick={() => focusFindings({ agent: "device-health" })}
          stats={
            scan && [
              // "Healthy" devices never generate a finding at all (a device
              // only produces findings for its problems), so there's no
              // findings-table subset this row could filter to — it's
              // shown for context only, not as a button.
              ["Healthy", scan.health.stats.healthy, null, false],
              // Degraded/Critical are per-device score buckets; the closest
              // real correspondence in the findings table is severity
              // (warning ≈ degraded-contributing issues, critical ≈
              // severe issues) — an approximation, but a genuine,
              // consistently-applied one instead of a no-op.
              ["Degraded", scan.health.stats.degraded, "warning", true],
              ["Critical", scan.health.stats.critical, "critical", true],
            ]
          }
          onStatClick={(severity) =>
            focusFindings({ agent: "device-health", severity })
          }
        />
        <AgentCard
          agentKey="alert-priority"
          loading={isLoading}
          onAgentClick={() => focusFindings({ agent: "alert-priority" })}
          stats={
            scan && [
              // Raw alerts / Noise removed are counts over the WHOLE alert
              // stream (including low-score bursts that never became a
              // finding), so neither corresponds to a subset of the
              // findings table — display-only, and clicking them does
              // nothing rather than falling back to "show everything"
              // (which would make them look like an equally-valid filter).
              ["Raw alerts", scan.priority.stats.rawAlerts, null, false],
              ["Noise removed", scan.priority.stats.collapsed, null, false],
              // Every alert-priority finding scores ≥ 60 by construction —
              // "high urgency" as a single bucket would be identical to
              // the whole agent's findings (same as clicking the card
              // header), so it's split into its two real severity tiers
              // instead, each mapping to a genuinely different subset.
              [
                "Critical priority",
                scan.priority.stats.critical,
                "critical",
                true,
              ],
              ["High priority", scan.priority.stats.high, "warning", true],
            ]
          }
          onStatClick={(severity) =>
            focusFindings({ agent: "alert-priority", severity })
          }
        />
      </div>

      {/* Findings table */}
      <Card ref={findingsRef}>
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-slate-800">
              Findings{" "}
              <span className="text-slate-400 font-normal">
                ({filtered.length})
              </span>
            </h3>
            {agentFilter !== "all" && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {AGENT_META[agentFilter]?.label ?? agentFilter}
              </span>
            )}
            {sevFilter !== "all" && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full capitalize",
                  SEV_META[sevFilter]?.bg,
                  SEV_META[sevFilter]?.color,
                )}
              >
                {SEV_META[sevFilter]?.label ?? sevFilter}
              </span>
            )}
            {codeFilter !== "all" && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {codeFilter.replace(/_/g, " ").toLowerCase()}
              </span>
            )}
            {hasActiveFilter && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-rose-500 transition"
              >
                <X size={12} /> clear
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Severity filter */}
            <div className="flex gap-1">
              {["all", "critical", "warning", "info"].map((s) => (
                <button
                  key={s}
                  onClick={() => setSevFilter(s)}
                  className={cn(
                    "px-2.5 py-1 text-xs font-bold rounded-lg border transition capitalize",
                    sevFilter === s
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-slate-500 border-slate-200 hover:border-primary",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            {/* Search */}
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vehicle, IMEI…"
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:border-primary w-48"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size={28} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <ShieldCheck size={32} className="mb-2 text-emerald-400" />
            <p className="text-sm">No findings — fleet data looks clean.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-3 py-2.5 text-left text-slate-400 font-semibold">
                    Severity
                  </th>
                  <th className="px-3 py-2.5 text-left text-slate-400 font-semibold">
                    Agent
                  </th>
                  <th className="px-3 py-2.5 text-left text-slate-400 font-semibold">
                    Finding
                  </th>
                  <th className="px-3 py-2.5 text-left text-slate-400 font-semibold">
                    Vehicle
                  </th>
                  <th className="px-3 py-2.5 text-left text-slate-400 font-semibold">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.slice(0, 200).map((f) => {
                  const sev = SEV_META[f.severity] ?? SEV_META.info;
                  const ag = AGENT_META[f.agent] ?? {
                    label: f.agent,
                    icon: Activity,
                  };
                  const AgIcon = ag.icon;
                  const canOpen = !!f.imei;
                  const openVehicle = () => {
                    if (!f.imei) return;
                    navigate(PATHS.TRACKING, {
                      state: {
                        targetImei: f.imei,
                        targetAccountId: f.accId ?? undefined,
                      },
                    });
                  };
                  return (
                    <tr
                      key={f.id}
                      onClick={canOpen ? openVehicle : undefined}
                      className={cn(
                        "transition align-top",
                        canOpen
                          ? "hover:bg-primary/5 cursor-pointer"
                          : "hover:bg-slate-50",
                      )}
                      title={
                        canOpen
                          ? `Open ${f.vehnum ?? f.imei} in live tracking`
                          : undefined
                      }
                    >
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold",
                            sev.bg,
                            sev.color,
                          )}
                        >
                          <span
                            className={cn("w-1.5 h-1.5 rounded-full", sev.dot)}
                          />
                          {sev.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-slate-500">
                          <AgIcon size={13} className="text-slate-400" />
                          {ag.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="font-semibold text-slate-800">
                          {f.title}
                        </div>
                        <div className="text-slate-500 mt-0.5 max-w-md">
                          {f.detail}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {f.vehnum ? (
                          <span className="font-bold text-primary">
                            {f.vehnum}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                        {f.imei && (
                          <div className="font-mono text-[10px] text-slate-400">
                            {f.imei}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div>
                            {f.value && (
                              <span className="font-mono text-slate-600">
                                {f.value}
                              </span>
                            )}
                            {f.expected && (
                              <div className="text-[10px] text-slate-400">
                                exp: {f.expected}
                              </div>
                            )}
                          </div>
                          {canOpen && (
                            <ChevronRight
                              size={14}
                              className="text-slate-300 ml-auto"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Per-agent summary card ───────────────────────────────────────────────────
// Each stats row is [label, value, filterArg, clickable?]. clickable defaults
// to true when omitted (Data Quality's tuples rely on this). Some rows have
// NO real corresponding subset in the findings table — e.g. "Healthy"
// devices never produce a finding at all — so those are passed with
// clickable=false and render as plain rows instead of buttons, rather than
// offering a filter that silently does nothing or (as before this fix)
// falls back to the same fixed filter regardless of which row was clicked.
function AgentCard({ agentKey, stats, loading, onAgentClick, onStatClick }) {
  const meta = AGENT_META[agentKey];
  const Icon = meta.icon;
  return (
    <Card hover className="cursor-pointer" onClick={onAgentClick}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon size={17} className="text-primary" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-slate-800">{meta.label}</div>
          <div className="text-[10px] text-slate-400">Agent #{meta.num}</div>
        </div>
        <ChevronRight size={16} className="text-slate-300" />
      </div>
      {loading || !stats ? (
        <Skeleton className="h-20 w-full" />
      ) : (
        <div className="space-y-1">
          {stats.map(([label, value, filterArg, clickable = true]) =>
            clickable ? (
              <button
                key={label}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatClick?.(filterArg);
                }}
                className="w-full flex items-center justify-between text-xs px-2 py-1 -mx-2 rounded-lg hover:bg-slate-50 transition group"
              >
                <span className="text-slate-500 group-hover:text-primary transition">
                  {label}
                </span>
                <span className="font-bold text-slate-800">{value}</span>
              </button>
            ) : (
              <div
                key={label}
                onClick={(e) => e.stopPropagation()}
                className="w-full flex items-center justify-between text-xs px-2 py-1 -mx-2 rounded-lg"
                title="Not individually filterable"
              >
                <span className="text-slate-400">{label}</span>
                <span className="font-bold text-slate-500">{value}</span>
              </div>
            ),
          )}
        </div>
      )}
    </Card>
  );
}

/**
 * AlertsPage.jsx — New-Ausprey
 *
 * Real implementation against POST /usage/alerts/by-account, ported from the
 * old Ausprey Alerts.jsx (account dropdown + date range + quick selects +
 * IMEI/vehicle filter + results table), restyled to the New-Ausprey design
 * system.
 *
 * API: apiService.getAlertsByAccount({ accid, startTime, endTime, pageSize })
 *   → { resultCode, data: [ { imei, vehicleNumber, type, deviceTime,
 *         message, address, speed, battery, createdOn, ... } ] }
 */
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Bell, MapPin, Clock, Battery } from "lucide-react";
import { PageHeader } from "@/components/common";
import { Card, Skeleton, Spinner } from "@/components/ui";
import apiService from "@/services/apiService";
import { useAccountStore } from "@/store";
import { cn } from "@/utils";
import {
  ALERT_META,
  typeLabel,
  typeColor,
} from "@/modules/dashboard/components/AlertsModal";

const pad = (n) => String(n).padStart(2, "0");

/** yyyy-mm-dd'T'HH:mm using LOCAL date parts (no UTC shift) */
const toLocalInput = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** API wants "yyyy-MM-dd HH:mm:ss" */
const toApiDateTime = (inputValue) => {
  if (!inputValue) return "";
  return inputValue.replace("T", " ") + ":00";
};

const fmtDate = (s) => {
  if (!s) return "—";
  const d = new Date(s.replace(" ", "T"));
  if (isNaN(d)) return s;
  return d.toLocaleString([], {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const QUICK = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "Last 7 Days" },
];

export default function AlertsPage() {
  const [searchParams] = useSearchParams();
  const imeiFromQuery = searchParams.get("imei") || "";

  const accounts = useAccountStore((s) => s.accounts);
  const storeSelected = useAccountStore((s) => s.selectedAccount);
  const loadAccounts = useAccountStore((s) => s.loadAccounts);

  const [accountId, setAccountId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [quick, setQuick] = useState(null);
  const [imeiFilter, setImeiFilter] = useState(imeiFromQuery);

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  // Ensure account list is loaded, then default the dropdown to the
  // currently selected account (falls back to the first option).
  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);
  useEffect(() => {
    if (!accountId && accounts.length) {
      setAccountId(storeSelected?.id ?? accounts[0].id);
    }
  }, [accounts, storeSelected, accountId]);

  const handleQuick = (type) => {
    setQuick(type);
    const now = new Date();
    now.setSeconds(0, 0);
    let s = new Date(),
      e = new Date();
    if (type === "today") {
      s.setHours(0, 0, 0, 0);
      e.setHours(23, 59, 59, 999);
    }
    if (type === "yesterday") {
      s.setDate(now.getDate() - 1);
      s.setHours(0, 0, 0, 0);
      e.setDate(now.getDate() - 1);
      e.setHours(23, 59, 59, 999);
    }
    if (type === "week") {
      s.setDate(now.getDate() - 7);
    }
    setFromDate(toLocalInput(s));
    setToDate(toLocalInput(e));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!accountId || !fromDate || !toDate) {
      setError("Please select an account and both dates.");
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const payload = {
        accid: String(accountId),
        startTime: toApiDateTime(fromDate),
        endTime: toApiDateTime(toDate),
        pageSize: 0,
      };
      const res = await apiService.getAlertsByAccount(payload);
      if (res?.data?.resultCode === 1) {
        setAlerts(res.data.data ?? []);
      } else {
        setAlerts([]);
        setError(res?.data?.message || "Failed to fetch alerts.");
      }
    } catch (err) {
      setAlerts([]);
      setError("Failed to fetch alerts.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const term = imeiFilter.trim().toLowerCase();
    const list = term
      ? alerts.filter(
          (a) =>
            (a.imei || "").toLowerCase().includes(term) ||
            (a.vehicleNumber || "").toLowerCase().includes(term),
        )
      : alerts;
    return [...list].sort(
      (a, b) => new Date(b.createdOn) - new Date(a.createdOn),
    );
  }, [alerts, imeiFilter]);

  return (
    <div className="pb-10">
      <PageHeader
        crumbs={["Monitoring", "Alerts"]}
        title="Alerts"
        description="Search alert history for any account and date range."
      />

      {/* Chatbot / deep-link filter banner */}
      {imeiFromQuery && (
        <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 border-l-4 border-primary">
          <Bell size={14} className="text-primary shrink-0" />
          <span className="text-sm text-slate-700">
            Filter active: showing alerts for IMEI{" "}
            <strong className="text-primary">{imeiFromQuery}</strong>
          </span>
          <button
            onClick={() => setImeiFilter("")}
            className="ml-auto text-xs font-semibold text-rose-500 hover:text-rose-600"
          >
            ✕ Clear
          </button>
        </div>
      )}

      {/* Filter form */}
      <Card className="mb-5">
        <h3 className="text-sm font-bold text-slate-800 mb-4">
          Filter Alert Logs
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                Account
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white outline-none focus:border-primary"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                From Date
              </label>
              <input
                type="datetime-local"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                To Date
              </label>
              <input
                type="datetime-local"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                Filter by IMEI / Vehicle No
              </label>
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={imeiFilter}
                  onChange={(e) => setImeiFilter(e.target.value)}
                  placeholder="e.g. 356938035643809"
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Quick selects */}
          <div className="flex items-center gap-2 mb-4">
            {QUICK.map((q) => (
              <button
                key={q.key}
                type="button"
                onClick={() => handleQuick(q.key)}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-lg border transition",
                  quick === q.key
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-slate-500 border-slate-200 hover:border-primary",
                )}
              >
                {q.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-rose-50 border border-rose-100 text-xs text-rose-600 font-medium">
              {error}
            </div>
          )}

          <div className="text-center">
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "px-8 py-2.5 rounded-xl text-sm font-bold text-white transition",
                loading
                  ? "bg-primary/50 cursor-not-allowed"
                  : "bg-primary hover:bg-primary-hover",
              )}
            >
              {loading ? "Searching…" : "Search Logs"}
            </button>
          </div>
        </form>
      </Card>

      {/* Results */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800">
            Alert Results{" "}
            <span className="text-slate-400 font-normal">
              ({filtered.length})
            </span>
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size={28} />
          </div>
        ) : !searched ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Bell size={28} className="mb-2 text-slate-300" />
            <p className="text-sm">
              Choose an account and date range, then search.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Bell size={28} className="mb-2 text-slate-300" />
            <p className="text-sm">No alerts found for this selection.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-3 py-2.5 text-left text-slate-400 font-semibold">
                    No
                  </th>
                  <th className="px-3 py-2.5 text-left text-slate-400 font-semibold">
                    Vehicle No
                  </th>
                  <th className="px-3 py-2.5 text-left text-slate-400 font-semibold">
                    Alert Type
                  </th>
                  <th className="px-3 py-2.5 text-left text-slate-400 font-semibold">
                    Time
                  </th>
                  <th className="px-3 py-2.5 text-left text-slate-400 font-semibold">
                    Message / Location
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((a, i) => (
                  <tr
                    key={a.id ?? i}
                    className="hover:bg-slate-50 transition align-top"
                  >
                    <td className="px-3 py-2.5 font-bold text-slate-400">
                      {i + 1}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-bold text-primary whitespace-nowrap">
                        {a.vehicleNumber || "N/A"}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">
                        {a.imei}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold"
                        style={{
                          background: `${typeColor(a.type)}1a`,
                          color: typeColor(a.type),
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: typeColor(a.type) }}
                        />
                        {typeLabel(a.type) || "General Alert"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock size={11} className="text-slate-400" />
                        {fmtDate(a.deviceTime || a.createdOn)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 max-w-md">
                      {a.message ? (
                        <span>{a.message}</span>
                      ) : (
                        <span className="flex items-start gap-1">
                          <MapPin
                            size={11}
                            className="text-slate-400 shrink-0 mt-0.5"
                          />
                          {a.address || "No details"}
                        </span>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
                        {a.speed != null && <span>{a.speed} km/h</span>}
                        {a.battery && (
                          <span className="flex items-center gap-0.5">
                            <Battery size={10} />
                            {a.battery} V
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search, ChevronDown, X, MessageCircle, Send,
  RefreshCw, CheckSquare, Square, Wifi, Download,
} from 'lucide-react';
import { PageHeader } from '@/components/common';
import { Button, Card, Spinner, Badge } from '@/components/ui';
import { useAccountStore } from '@/store';
import { loadcellService } from '../services/loadcell.service';
import { cn } from '@/utils';

// ─── Shared helpers ───────────────────────────────────────────────────────────
const TOOLTIP_STYLE = { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 };
const fmtTime = (iso) => { const d = new Date(iso); return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; };

function Toggle({ label, checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition select-none">
      {checked ? <CheckSquare size={18} className="text-primary" /> : <Square size={18} className="text-slate-300" />}
      {label}
    </button>
  );
}

// ─── Searchable IMEI combobox ─────────────────────────────────────────────────
function ImeiSelect({ options, value, onChange, loading }) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const ref               = useRef(null);
  const selected          = options.find((o) => o.value === value);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-xl border bg-white text-left transition',
          open ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200 hover:border-slate-300'
        )}>
        {loading
          ? <span className="text-slate-400 flex-1">Loading IMEIs…</span>
          : selected
            ? <span className="text-slate-700 flex-1 truncate">{selected.label}</span>
            : <span className="text-slate-400 flex-1">Search IMEI…</span>}
        <ChevronDown size={15} className={cn('text-slate-400 transition-transform shrink-0', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.13 }}
            className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-float overflow-hidden"
          >
            <div className="p-2 border-b border-slate-100">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search IMEI or vehicle…"
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-primary" />
              </div>
            </div>
            <div className="max-h-52 overflow-y-auto py-1">
              {filtered.length === 0
                ? <p className="px-4 py-4 text-sm text-slate-400 text-center">No matches</p>
                : filtered.map((o) => (
                  <button key={o.value} type="button"
                    onClick={() => { onChange(o.value); setOpen(false); setQuery(''); }}
                    className={cn(
                      'w-full px-3 py-2.5 text-left text-sm transition',
                      o.value === value ? 'bg-primary/5 text-primary font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    )}>
                    {o.label}
                  </button>
                ))
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Charts ───────────────────────────────────────────────────────────────────
function LiveCellChart({ data, showData, avgConfig }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <defs>
          {['v1','v2','v3','v4'].map((k, i) => (
            <linearGradient key={k} id={`lg${k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={['#8b5cf6','#10b981','#f59e0b','#f43f5e'][i]} stopOpacity={0.15} />
              <stop offset="95%" stopColor={['#8b5cf6','#10b981','#f59e0b','#f43f5e'][i]} stopOpacity={0} />
            </linearGradient>
          ))}
          {avgConfig && (
            <linearGradient id="lgavg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={avgConfig.stroke} stopOpacity={0.3} />
              <stop offset="95%" stopColor={avgConfig.stroke} stopOpacity={0} />
            </linearGradient>
          )}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={fmtTime} />
        <YAxis yAxisId="l" tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={fmtTime} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        {showData && [
          { key: 'V1', color: '#8b5cf6', name: 'Load Cell 1' },
          { key: 'V2', color: '#10b981', name: 'Load Cell 2' },
          { key: 'V3', color: '#f59e0b', name: 'Load Cell 3' },
          { key: 'V4', color: '#f43f5e', name: 'Load Cell 4' },
        ].map(({ key, color, name }) => (
          <Area key={key} yAxisId="l" type="monotone" dataKey={key} name={name}
            stroke={color} fill={`url(#lg${key.toLowerCase()})`} strokeWidth={1.5} dot={false} />
        ))}
        {avgConfig && (
          <Area yAxisId="l" type="monotone" dataKey="Average" name="Average Load"
            stroke={avgConfig.stroke} fill="url(#lgavg)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}

function LivePercentChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="lgpct" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={fmtTime} />
        <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={fmtTime}
          formatter={(v) => [`${Number(v).toFixed(1)}%`, 'Load %']} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Area type="monotone" dataKey="LoadPercent" name="Load %" stroke="#7c3aed"
          fill="url(#lgpct)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Chatbot widget ───────────────────────────────────────────────────────────
const STEP = { IMEI: 'imei', OPTIONS: 'options', DONE: 'done' };

function ChatbotWidget() {
  const [open, setOpen]   = useState(false);
  const [step, setStep]   = useState(STEP.IMEI);
  const [input, setInput] = useState('');
  const [msgs, setMsgs]   = useState([{
    role: 'bot',
    text: "Hello! I'm your virtual assistant. Please provide the IMEI number of the device you want to manage.",
  }]);
  const bodyRef = useRef(null);

  const scroll = () => setTimeout(() => { if (bodyRef.current) bodyRef.current.scrollTop = 9999; }, 50);
  const renderText = (t) => t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  const sendImei = () => {
    if (!input.trim()) return;
    const imei = input.trim();
    setMsgs((p) => [...p,
      { role: 'user', text: imei },
      { role: 'bot',  text: `IMEI **${imei}** identified. What would you like to do?` },
    ]);
    setInput(''); setStep(STEP.OPTIONS); scroll();
  };

  const selectOption = (opt) => {
    setMsgs((p) => [...p,
      { role: 'user', text: opt },
      { role: 'bot',  text: `You selected **${opt}**. Conversation complete. You can close the widget.` },
    ]);
    setStep(STEP.DONE); scroll();
  };

  return (
    <>
      <button onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary shadow-float flex items-center justify-center text-white hover:bg-primary-hover transition">
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-24 right-6 z-50 w-80 bg-white rounded-2xl border border-slate-200 shadow-float overflow-hidden flex flex-col"
            style={{ height: 420 }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-sidebar text-white">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <MessageCircle size={16} />
              </div>
              <div>
                <div className="text-sm font-bold">Virtual Assistant</div>
                <div className="text-xs text-sidebar-muted">IoT Support</div>
              </div>
              <button onClick={() => setOpen(false)} className="ml-auto text-sidebar-muted hover:text-white transition">
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div ref={bodyRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
              {msgs.map((m, i) => (
                <div key={i}
                  className={cn('max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed',
                    m.role === 'user'
                      ? 'ml-auto bg-primary text-white rounded-br-sm'
                      : 'bg-slate-100 text-slate-700 rounded-bl-sm')}
                  dangerouslySetInnerHTML={{ __html: renderText(m.text) }} />
              ))}
              {step === STEP.OPTIONS && (
                <div className="space-y-2 pt-1">
                  {['Track / Play', 'Alert Logs', 'Trip Report'].map((opt) => (
                    <button key={opt} onClick={() => selectOption(opt)}
                      className="w-full text-left px-3 py-2.5 text-sm font-medium text-primary border border-primary/30 rounded-xl hover:bg-primary/5 transition">
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-slate-100 flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && step === STEP.IMEI && sendImei()}
                placeholder={
                  step === STEP.IMEI  ? 'Enter IMEI…'          :
                  step === STEP.DONE  ? 'Conversation complete' : 'Select an option above'
                }
                disabled={step !== STEP.IMEI}
                className="flex-1 text-sm px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-primary transition disabled:bg-slate-50 disabled:text-slate-400" />
              <button onClick={sendImei} disabled={step !== STEP.IMEI || !input.trim()}
                className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary-hover transition disabled:opacity-40">
                <Send size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── CSV export ───────────────────────────────────────────────────────────────
function exportCsv(data, imei) {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const csv  = [keys.join(','), ...data.map((r) => keys.map((k) => r[k]).join(','))].join('\n');
  const url  = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a    = Object.assign(document.createElement('a'), {
    href: url, download: `LiveLoad_${imei || 'data'}_${Date.now()}.csv`,
  });
  a.click(); URL.revokeObjectURL(url);
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const REFRESH_INTERVAL = 30000; // 30 seconds

export default function LiveLoadPage() {
  const accountId = useAccountStore((s) => s.selectedAccount.id);

  const [imeiList,     setImeiList]     = useState([]);
  const [imeiLoading,  setImeiLoading]  = useState(false);
  const [imei,         setImei]         = useState('');
  const [showAvg,      setShowAvg]      = useState(true);
  const [showData,     setShowData]     = useState(true);
  const [chartData,    setChartData]    = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [lastRefresh,  setLastRefresh]  = useState(null);
  const [autoRefresh,  setAutoRefresh]  = useState(true);
  const timerRef = useRef(null);

  // Reload IMEI list on account change
  useEffect(() => {
    setImei(''); setImeiList([]); setImeiLoading(true);
    loadcellService.getImeis(accountId)
      .then((list) => { setImeiList(list); setImeiLoading(false); });
  }, [accountId]);

  const fetchLive = useCallback(async (imeiVal) => {
    if (!imeiVal) return;
    setLoading(true);
    const data = await loadcellService.getLiveData(imeiVal);
    setChartData(data); setLastRefresh(new Date()); setLoading(false);
  }, []);

  // Auto-select the first IMEI and fetch immediately when the list loads
  useEffect(() => {
    if (imeiList.length > 0 && !imei) {
      setImei(imeiList[0].value);
      fetchLive(imeiList[0].value);
    }
  }, [imeiList]);

  // Set up / tear down the auto-refresh timer
  useEffect(() => {
    if (!imei || !autoRefresh) { clearInterval(timerRef.current); return; }
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => fetchLive(imei), REFRESH_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [imei, autoRefresh, fetchLive]);

  const handleImeiChange    = (v) => { setImei(v); if (v) fetchLive(v); };
  const handleManualRefresh = () => fetchLive(imei);

  const avgConfig = (() => {
    if (!showAvg || !chartData.length) return null;
    const last = chartData[chartData.length - 1].Average;
    if (last > 100) return { stroke: '#ef4444', label: 'High Load',     badge: 'bg-rose-100 text-rose-700'       };
    if (last > 50)  return { stroke: '#10b981', label: 'Moderate Load', badge: 'bg-emerald-100 text-emerald-700' };
    return              { stroke: '#2563eb', label: 'Low Load',       badge: 'bg-blue-100 text-blue-700'       };
  })();

  return (
    <div className="pb-20">
      <PageHeader
        crumbs={['IoT Sensors', 'Live Load Graph']}
        title="Live Load Graph"
        description="Real-time load cell readings — auto-refreshes every 30 seconds."
        actions={
          <div className="flex items-center gap-2">
            <Badge
              color={autoRefresh ? '#10b981' : '#94a3b8'}
              bg={autoRefresh ? '#ecfdf5' : '#f1f5f9'}
              dot
            >
              {autoRefresh ? 'Live' : 'Paused'}
            </Badge>
            <Button variant="secondary" icon={RefreshCw} size="sm"
              onClick={handleManualRefresh} disabled={!imei || loading}>
              Refresh
            </Button>
          </div>
        }
      />

      {/* ── Controls card ── */}
      <Card className="mb-5">
        <h2 className="text-base font-bold text-slate-800 mb-5">Search Live Load Cell Data</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">

          <div className="lg:col-span-1">
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              Select IMEI <span className="text-rose-500">*</span>
            </label>
            <ImeiSelect options={imeiList} value={imei} onChange={handleImeiChange} loading={imeiLoading} />
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <Toggle label="Average" checked={showAvg}  onChange={setShowAvg}  />
            <Toggle label="Data"    checked={showData} onChange={setShowData} />
          </div>

          <div className="flex items-center gap-3 flex-wrap lg:col-span-2 lg:justify-end">
            <Toggle
              label={autoRefresh ? 'Auto-refresh on' : 'Auto-refresh off'}
              checked={autoRefresh}
              onChange={setAutoRefresh}
            />
            {chartData.length > 0 && (
              <Button variant="secondary" icon={Download} size="sm"
                onClick={() => exportCsv(chartData, imei)}>
                Export CSV
              </Button>
            )}
          </div>
        </div>

        {lastRefresh && (
          <p className="mt-3 text-xs text-slate-400 flex items-center gap-1">
            <Wifi size={12} /> Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        )}
      </Card>

      {/* ── Initial spinner ── */}
      {loading && !chartData.length && (
        <div className="flex items-center justify-center py-20">
          <Spinner size={32} />
        </div>
      )}

      {/* ── Idle state (no IMEI yet) ── */}
      {!loading && !imei && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {['Live Load Cell Graph', 'Live Load Percentage (%)'].map((title) => (
            <Card key={title}>
              <h3 className="text-sm font-bold text-slate-800 mb-4">{title}</h3>
              <div className="flex items-center justify-center py-16">
                <p className="text-sm text-slate-400 text-center max-w-xs">
                  Select an IMEI above to start streaming live data.
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Live charts ── */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Live Load Cell Graph</h3>
                {avgConfig && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', avgConfig.badge)}>
                      {avgConfig.label}
                    </span>
                    <span className="text-xs text-slate-400">
                      Avg: {chartData[chartData.length - 1].Average.toFixed(2)} tons
                    </span>
                  </div>
                )}
              </div>
              {loading && <Spinner size={16} />}
            </div>
            <LiveCellChart data={chartData} showData={showData} avgConfig={avgConfig} />
          </Card>

          <Card>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Live Load Percentage (%)</h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full">
                    Latest: {chartData[chartData.length - 1].LoadPercent.toFixed(1)}%
                  </span>
                  <span className="text-xs text-slate-400">Range: 0%–100%</span>
                </div>
              </div>
              {loading && <Spinner size={16} />}
            </div>
            <LivePercentChart data={chartData} />
          </Card>
        </div>
      )}

      <ChatbotWidget />
    </div>
  );
}
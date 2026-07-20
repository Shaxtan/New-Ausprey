import { useState } from 'react';
import { Calendar, ChevronDown, Download, Filter } from 'lucide-react';
import { PageHeader } from '@/components/common';
import { Button, Card } from '@/components/ui';
import { exportCSV, cn } from '@/utils';
import {
  useAnalyticsKpis,
  useDistanceTrend,
  useFuelConsumptionTrend,
  useVehiclePerformance,
  useIdleTimeAnalysis,
  useSpeedCompliance,
  useDriverPerformance,
  useCostBreakdown,
  useInsights,
  useUtilizationTrend,
  useTopRoutes,
} from '../hooks/useAnalytics';
import { AnalyticsKpis } from '../components/AnalyticsKpis';
import { DistanceTrendCard } from '../components/DistanceTrendCard';
import { FuelConsumptionCard } from '../components/FuelConsumptionCard';
import { VehiclePerformanceCard } from '../components/VehiclePerformanceCard';
import { IdleTimeCard } from '../components/IdleTimeCard';
import { SpeedComplianceCard } from '../components/SpeedComplianceCard';
import { DriverPerformanceCard } from '../components/DriverPerformanceCard';
import { CostBreakdownCard } from '../components/CostBreakdownCard';
import { InsightsBar } from '../components/InsightsBar';
import { UtilizationCard } from '../components/UtilizationCard';
import { TopRoutesCard } from '../components/TopRoutesCard';

// Locked per-row heights — every card in a row shares one of these so
// they always align regardless of how much content each one has.
const ROW_A_HEIGHT = 340; // Distance Trend / Fuel Consumption / Performance by Vehicle
const ROW_B_HEIGHT = 300; // Idle Time / Speed Compliance / Driver Performance / Cost Breakdown

const TABS = [
  'Overview', 'Fleet Performance', 'Driver Performance', 'Trip Performance',
  'Safety Performance', 'Utilization', 'Cost Analysis',
];

const pad = (n) => String(n).padStart(2, '0');
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toDisplay = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 6);
  return { from: toISO(from), to: toISO(to) };
}

// ── Date range picker — small self-contained dropdown ───────────────────────
function DateRangeButton({ range, onChange }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(range);

  return (
    <div className="relative">
      <button
        onClick={() => { setDraft(range); setOpen((v) => !v); }}
        className="flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:border-primary/40 transition"
      >
        <Calendar size={14} className="text-slate-400" />
        {toDisplay(range.from)} - {toDisplay(range.to)}
        <ChevronDown size={14} className={cn('text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-72 p-4 bg-white border border-slate-100 rounded-xl shadow-lg">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">From</label>
              <input
                type="date" value={draft.from}
                onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
                className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">To</label>
              <input
                type="date" value={draft.to}
                onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
                className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 outline-none focus:border-primary"
              />
            </div>
            <button
              onClick={() => { onChange(draft); setOpen(false); }}
              className="w-full py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary-hover transition"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ComingSoon({ title }) {
  return (
    <Card>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm font-semibold text-slate-500">{title}</p>
        <p className="text-xs text-slate-400 mt-1">
          Detailed {title.toLowerCase()} analytics are coming soon.
        </p>
      </div>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [tab, setTab] = useState('Overview');
  const [range, setRange] = useState(defaultRange);
  const rangeKey = `${range.from}_${range.to}`;

  const kpis = useAnalyticsKpis(rangeKey);
  const distanceTrend = useDistanceTrend(rangeKey);
  const fuelTrend = useFuelConsumptionTrend(rangeKey);
  const vehiclePerf = useVehiclePerformance(rangeKey);
  const idleTime = useIdleTimeAnalysis(rangeKey);
  const speedCompliance = useSpeedCompliance(rangeKey);
  const driverPerf = useDriverPerformance(rangeKey);
  const costBreakdown = useCostBreakdown(rangeKey);
  const insights = useInsights(rangeKey);
  const utilization = useUtilizationTrend();
  const topRoutes = useTopRoutes();

  const handleExport = () => {
    if (!kpis.data) return;
    const rows = [
      { metric: 'Total Distance (km)', value: kpis.data.totalDistance },
      { metric: 'Total Fuel Used (Ltr)', value: kpis.data.totalFuel },
      { metric: 'Avg Fuel Efficiency (km/L)', value: kpis.data.fuelEfficiency },
      { metric: 'Total Engine Hours', value: kpis.data.engineHours },
      { metric: 'Operating Cost (₹)', value: kpis.data.operatingCost },
      { metric: 'Utilization Rate (%)', value: kpis.data.utilizationRate },
    ];
    exportCSV(
      rows,
      `analytics_${range.from}_to_${range.to}.csv`,
      [{ key: 'metric', label: 'Metric' }, { key: 'value', label: 'Value' }],
    );
  };

  return (
    <div className="pb-10">
      <PageHeader
        crumbs={['Insights', 'Analytics']}
        title="Performance Analytics"
        description="Comprehensive analysis of your fleet performance and operational efficiency."
        actions={
          <div className="flex items-center gap-2">
            <DateRangeButton range={range} onChange={setRange} />
            <Button variant="secondary" icon={Filter}>Filters</Button>
            <Button icon={Download} onClick={handleExport}>Export</Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="mb-5 border-b border-slate-100 overflow-x-auto">
        <div className="flex items-center gap-6 min-w-max">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'relative py-2.5 text-sm font-semibold whitespace-nowrap transition',
                tab === t ? 'text-primary' : 'text-slate-400 hover:text-slate-600',
              )}
            >
              {t}
              {tab === t && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-primary rounded-full" />}
            </button>
          ))}
        </div>
      </div>

      {tab === 'Overview' && (
        <>
          <AnalyticsKpis kpis={kpis.data} loading={kpis.isLoading} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4 items-start">
            <div className="lg:col-span-4">
              <DistanceTrendCard data={distanceTrend.data ?? []} loading={distanceTrend.isLoading} height={ROW_A_HEIGHT} />
            </div>
            <div className="lg:col-span-4">
              <FuelConsumptionCard data={fuelTrend.data ?? []} loading={fuelTrend.isLoading} height={ROW_A_HEIGHT} />
            </div>
            <div className="lg:col-span-4">
              <VehiclePerformanceCard data={vehiclePerf.data} loading={vehiclePerf.isLoading} height={ROW_A_HEIGHT} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4 items-start">
            <IdleTimeCard data={idleTime.data} loading={idleTime.isLoading} height={ROW_B_HEIGHT} />
            <SpeedComplianceCard data={speedCompliance.data} loading={speedCompliance.isLoading} height={ROW_B_HEIGHT} />
            <DriverPerformanceCard data={driverPerf.data ?? []} loading={driverPerf.isLoading} height={ROW_B_HEIGHT} />
            <CostBreakdownCard data={costBreakdown.data} loading={costBreakdown.isLoading} height={ROW_B_HEIGHT} />
          </div>

          <InsightsBar data={insights.data ?? []} loading={insights.isLoading} />
        </>
      )}

      {tab === 'Utilization' && (
        <UtilizationCard data={utilization.data ?? []} loading={utilization.isLoading} />
      )}

      {tab === 'Trip Performance' && (
        <TopRoutesCard data={topRoutes.data ?? []} loading={topRoutes.isLoading} />
      )}

      {['Fleet Performance', 'Driver Performance', 'Safety Performance', 'Cost Analysis'].includes(tab) && (
        <ComingSoon title={tab} />
      )}
    </div>
  );
}
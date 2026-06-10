import { useState } from 'react';
import { Download, Calendar, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/common';
import { Button } from '@/components/ui';
import { useReportTypes, useReportSummary, useDistanceSeries, useReportRows } from '../hooks/useReports';
import { ReportTypeList } from '../components/ReportTypeList';
import { ReportSummary } from '../components/ReportSummary';
import { ReportContent } from '../components/ReportContent';
import LoadCellReportPage from '@/modules/devices/pages/LoadCellReportPage';
import LiveLoadPage from '@/modules/devices/pages/LiveLoadPage';

// Two IoT sensor reports rendered INLINE — no routing required
const IOT_REPORTS = [
  { id: 'load-cell', name: 'Load Cell Report', desc: 'Sensor load data & averages' },
  { id: 'live-load', name: 'Live Load Graph',  desc: 'Real-time load monitoring' },
];

export default function ReportsPage() {
  const types   = useReportTypes();
  const summary = useReportSummary();
  const series  = useDistanceSeries();
  const rows    = useReportRows();
  const [active, setActive] = useState('distance');

  // Built-in report types + the two IoT reports appended to the list
  const allTypes = [...(types.data ?? []), ...IOT_REPORTS];

  // When an IoT report is selected, take over full width with a Back button
  if (active === 'load-cell' || active === 'live-load') {
    return (
      <div>
        <button
          onClick={() => setActive('distance')}
          className="inline-flex items-center gap-2 mb-4 px-3 py-2 text-sm font-semibold text-slate-600 hover:text-primary bg-white border border-slate-200 rounded-xl hover:border-primary transition"
        >
          <ArrowLeft size={16} /> Back to Reports
        </button>
        {active === 'load-cell' ? <LoadCellReportPage /> : <LiveLoadPage />}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        crumbs={['Insights', 'Reports']}
        title="Reports & Analytics"
        description="Generate detailed operational reports and export them in one click."
        actions={<><Button variant="secondary" icon={Calendar}>May 14 – 20</Button><Button icon={Download}>Export</Button></>}
      />
      <ReportSummary summary={summary.data} loading={summary.isLoading} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-3">
          <ReportTypeList types={allTypes} loading={types.isLoading} activeId={active} onSelect={setActive} />
        </div>
        <div className="lg:col-span-9">
          <ReportContent series={series.data ?? []} rows={rows.data ?? []} loading={series.isLoading || rows.isLoading} />
        </div>
      </div>
    </div>
  );
}
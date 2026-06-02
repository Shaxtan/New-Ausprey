import { useState } from 'react';
import { Download, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/common';
import { Button } from '@/components/ui';
import { useReportTypes, useReportSummary, useDistanceSeries, useReportRows } from '../hooks/useReports';
import { ReportTypeList } from '../components/ReportTypeList';
import { ReportSummary } from '../components/ReportSummary';
import { ReportContent } from '../components/ReportContent';

export default function ReportsPage() {
  const types = useReportTypes();
  const summary = useReportSummary();
  const series = useDistanceSeries();
  const rows = useReportRows();
  const [active, setActive] = useState('distance');

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
        <div className="lg:col-span-3"><ReportTypeList types={types.data ?? []} loading={types.isLoading} activeId={active} onSelect={setActive} /></div>
        <div className="lg:col-span-9"><ReportContent series={series.data ?? []} rows={rows.data ?? []} loading={series.isLoading || rows.isLoading} /></div>
      </div>
    </div>
  );
}

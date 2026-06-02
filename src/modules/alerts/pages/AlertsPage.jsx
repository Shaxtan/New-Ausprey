import { useMemo, useState } from 'react';
import { Filter, Download } from 'lucide-react';
import { PageHeader } from '@/components/common';
import { Button, SearchInput, Select } from '@/components/ui';
import { useDebounce } from '@/hooks';
import { useAlerts, useAlertStats, useAlertSummary } from '../hooks/useAlerts';
import { AlertStatsCards } from '../components/AlertStatsCards';
import { AlertsBreakdownCard } from '../components/AlertsBreakdownCard';
import { AlertsTable } from '../components/AlertsTable';

export default function AlertsPage() {
  const stats = useAlertStats();
  const summary = useAlertSummary();
  const list = useAlerts();
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('All Severity');
  const debounced = useDebounce(search, 250);

  const filtered = useMemo(() => {
    const data = list.data ?? [];
    return data.filter((a) =>
      (severity === 'All Severity' || a.severity === severity) &&
      (a.vehicle.toLowerCase().includes(debounced.toLowerCase()) || a.type.toLowerCase().includes(debounced.toLowerCase()))
    );
  }, [list.data, debounced, severity]);

  const toolbar = (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-3">
      <SearchInput placeholder="Search alerts or vehicle..." value={search} onChange={setSearch} className="w-full sm:w-72" />
      <Select value={severity} onChange={setSeverity} options={['All Severity', 'Critical', 'Warning', 'Info']} className="w-40" />
    </div>
  );

  return (
    <div>
      <PageHeader
        crumbs={['Monitoring', 'Alerts']}
        title="Alerts"
        description="Real-time alerts, severities and resolution status across the fleet."
        actions={<><Button variant="secondary" icon={Filter}>Filter</Button><Button icon={Download}>Export</Button></>}
      />
      <AlertStatsCards stats={stats.data} loading={stats.isLoading} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4"><AlertsBreakdownCard data={summary.data ?? []} loading={summary.isLoading} /></div>
        <div className="lg:col-span-8"><AlertsTable data={filtered} loading={list.isLoading} toolbar={toolbar} /></div>
      </div>
    </div>
  );
}

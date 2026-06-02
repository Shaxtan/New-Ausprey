import { useMemo, useState } from 'react';
import { Plus, Upload } from 'lucide-react';
import { PageHeader } from '@/components/common';
import { Button, SearchInput, Select } from '@/components/ui';
import { useDebounce } from '@/hooks';
import { useVehicles, useVehicleStats } from '../hooks/useVehicles';
import { VehicleStatsCards } from '../components/VehicleStatsCards';
import { VehiclesTable } from '../components/VehiclesTable';

export default function VehiclesPage() {
  const stats = useVehicleStats();
  const vehicles = useVehicles();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All Status');
  const debounced = useDebounce(search, 250);

  const filtered = useMemo(() => {
    const list = vehicles.data ?? [];
    return list.filter((v) =>
      (status === 'All Status' || v.status === status) &&
      (v.reg.toLowerCase().includes(debounced.toLowerCase()) || v.driver.toLowerCase().includes(debounced.toLowerCase()))
    );
  }, [vehicles.data, debounced, status]);

  const toolbar = (
    <div className="p-5 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <h3 className="text-base font-bold text-slate-800">Fleet ({stats.data?.total ?? 0})</h3>
      <div className="flex items-center gap-2">
        <SearchInput placeholder="Search vehicle or driver..." value={search} onChange={setSearch} className="w-full sm:w-64" />
        <Select value={status} onChange={setStatus} options={['All Status', 'Moving', 'Stopped', 'Idle']} className="w-36" />
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        crumbs={['Fleet', 'Vehicles']}
        title="Vehicles"
        description="Manage your entire vehicle inventory, status and assignments."
        actions={<><Button variant="secondary" icon={Upload}>Import</Button><Button icon={Plus}>Add Vehicle</Button></>}
      />
      <VehicleStatsCards stats={stats.data} loading={stats.isLoading} />
      <VehiclesTable data={filtered} loading={vehicles.isLoading} total={stats.data?.total ?? 0} toolbar={toolbar} />
    </div>
  );
}

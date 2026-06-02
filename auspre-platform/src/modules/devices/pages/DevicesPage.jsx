import { useMemo, useState } from 'react';
import { Plus, Filter } from 'lucide-react';
import { PageHeader } from '@/components/common';
import { Button, SearchInput, Select } from '@/components/ui';
import { useDebounce } from '@/hooks';
import { useDevices, useDeviceStats } from '../hooks/useDevices';
import { DeviceStats } from '../components/DeviceStats';
import { DevicesTable } from '../components/DevicesTable';

export default function DevicesPage() {
  const stats = useDeviceStats();
  const devices = useDevices();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All Status');
  const debounced = useDebounce(search, 250);

  const filtered = useMemo(() => {
    const list = devices.data ?? [];
    return list.filter((d) =>
      (status === 'All Status' || d.status === status) &&
      (d.id.toLowerCase().includes(debounced.toLowerCase()) || d.vehicle.toLowerCase().includes(debounced.toLowerCase()))
    );
  }, [devices.data, debounced, status]);

  const toolbar = (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-3">
      <SearchInput placeholder="Search device or vehicle..." value={search} onChange={setSearch} className="w-full sm:w-72" />
      <Select value={status} onChange={setStatus} options={['All Status', 'Online', 'Offline']} className="w-40" />
    </div>
  );

  return (
    <div>
      <PageHeader
        crumbs={['Hardware', 'IoT Sensors']}
        title="IoT Sensors"
        description="Monitor device health, connectivity, battery and firmware across the fleet."
        actions={<><Button variant="secondary" icon={Filter}>Filter</Button><Button icon={Plus}>Add Device</Button></>}
      />
      <DeviceStats stats={stats.data} loading={stats.isLoading} />
      <DevicesTable data={filtered} loading={devices.isLoading} total={stats.data?.total ?? 0} toolbar={toolbar} />
    </div>
  );
}

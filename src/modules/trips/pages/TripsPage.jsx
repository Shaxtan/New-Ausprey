import { useMemo, useState } from 'react';
import { Plus, Download } from 'lucide-react';
import { PageHeader } from '@/components/common';
import { Button, SearchInput, Tabs } from '@/components/ui';
import { useDebounce } from '@/hooks';
import { useTrips, useTripStats } from '../hooks/useTrips';
import { TripStatsCards  } from '../components/TripStatsCards';
import { TripsTable      } from '../components/TripsTable';
import { TripDetailModal } from '../components/TripDetailModal';
const ACTIVE = ['In Transit','At Source','At Destination','Delayed','Scheduled'];
export default function TripsPage() {
  const stats = useTripStats();
  const trips = useTrips();
  const [tab,setTab]       = useState('Active');
  const [search,setSearch] = useState('');
  const [selected,setSelected] = useState(null);
  const debounced = useDebounce(search,250);
  const filtered = useMemo(()=>{
    const list  = trips.data??[];
    const byTab = list.filter(t=>tab==='Active'?ACTIVE.includes(t.status):t.status==='Completed');
    const q = debounced.toLowerCase();
    return byTab.filter(t=>t.id.toLowerCase().includes(q)||t.vehicle.toLowerCase().includes(q)||t.driver.toLowerCase().includes(q));
  },[trips.data,tab,debounced]);
  const toolbar = (
    <div className="p-5 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <Tabs tabs={['Active','Completed']} value={tab} onChange={setTab}/>
      <SearchInput placeholder="Search trip, vehicle or driver..." value={search} onChange={setSearch} className="w-full sm:w-72"/>
    </div>
  );
  return (
    <div>
      <PageHeader crumbs={['Operations','Trips']} title="" description=""
        actions={<><Button variant="secondary" icon={Download}>Export</Button><Button icon={Plus}>New Trip</Button></>}/>
      <TripStatsCards stats={stats.data} loading={stats.isLoading}/>
      <TripsTable data={filtered} loading={trips.isLoading} toolbar={toolbar} onRowClick={setSelected}/>
      <TripDetailModal trip={selected} open={!!selected} onClose={()=>setSelected(null)}/>
    </div>
  );
}
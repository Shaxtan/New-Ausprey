import { Download } from 'lucide-react';
import { PageHeader } from '@/components/common';
import { Button } from '@/components/ui';
import {
  useAnalyticsKpis, useUtilizationTrend, useDistanceVsFuel, useFleetMix, useTopRoutes,
} from '../hooks/useAnalytics';
import { AnalyticsKpis } from '../components/AnalyticsKpis';
import { UtilizationCard } from '../components/UtilizationCard';
import { DistanceFuelCard } from '../components/DistanceFuelCard';
import { FleetMixCard } from '../components/FleetMixCard';
import { TopRoutesCard } from '../components/TopRoutesCard';

export default function AnalyticsPage() {
  const kpis = useAnalyticsKpis();
  const utilization = useUtilizationTrend();
  const distanceFuel = useDistanceVsFuel();
  const fleetMix = useFleetMix();
  const topRoutes = useTopRoutes();

  return (
    <div>
      <PageHeader
        crumbs={['Insights', 'Analytics']}
        title="Analytics"
        description="Deep operational analytics on utilization, efficiency and routes."
        actions={<Button icon={Download}>Export</Button>}
      />
      <AnalyticsKpis kpis={kpis.data} loading={kpis.isLoading} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <UtilizationCard data={utilization.data ?? []} loading={utilization.isLoading} />
        <DistanceFuelCard data={distanceFuel.data ?? []} loading={distanceFuel.isLoading} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4"><FleetMixCard data={fleetMix.data ?? []} loading={fleetMix.isLoading} /></div>
        <div className="lg:col-span-8"><TopRoutesCard data={topRoutes.data ?? []} loading={topRoutes.isLoading} /></div>
      </div>
    </div>
  );
}

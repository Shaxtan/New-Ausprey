import { Card, CardHeader, Skeleton } from '@/components/ui';
import { AreaChart } from '@/components/charts';

export function UtilizationCard({ data = [], loading }) {
  return (
    <Card hover>
      <CardHeader title="Fleet Utilization Trend" subtitle="Last 6 weeks (%)" />
      {loading ? <Skeleton className="h-52 w-full" /> : <AreaChart data={data} color="#2563eb" height={220} />}
    </Card>
  );
}

export default UtilizationCard;

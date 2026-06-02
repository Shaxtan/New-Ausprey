import { Card, CardHeader, Skeleton } from '@/components/ui';
import { BarChart } from '@/components/charts';

export function AlertsSummaryCard({ data = [], loading }) {
  return (
    <Card hover>
      <CardHeader title="Alerts Summary" subtitle="By alert type · this week" />
      {loading ? <Skeleton className="h-48 w-full" /> : <BarChart data={data} height={210} />}
    </Card>
  );
}

export default AlertsSummaryCard;

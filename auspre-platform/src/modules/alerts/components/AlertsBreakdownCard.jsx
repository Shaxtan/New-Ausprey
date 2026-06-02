import { Card, CardHeader, Skeleton } from '@/components/ui';
import { BarChart } from '@/components/charts';

export function AlertsBreakdownCard({ data = [], loading }) {
  return (
    <Card hover>
      <CardHeader title="Alerts by Type" subtitle="This week" />
      {loading ? <Skeleton className="h-56 w-full" /> : <BarChart data={data} layout="vertical" height={240} />}
    </Card>
  );
}

export default AlertsBreakdownCard;

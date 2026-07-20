import { Card, CardHeader, Skeleton } from '@/components/ui';
import { LineChart } from '@/components/charts';

export function DistanceFuelCard({ data = [], loading }) {
  const lines = [{ key: 'distance', color: '#2563eb' }, { key: 'fuel', color: '#f59e0b' }];
  return (
    <Card hover>
      <CardHeader title="Distance vs Fuel" subtitle="Daily comparison" />
      {loading ? <Skeleton className="h-52 w-full" /> : <LineChart data={data} lines={lines} height={220} />}
    </Card>
  );
}

export default DistanceFuelCard;

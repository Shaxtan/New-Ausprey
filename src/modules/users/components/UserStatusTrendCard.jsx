import { Card, CardHeader, Skeleton } from '@/components/ui';
import { LineChart } from '@/components/charts';

export function UserStatusTrendCard({ data = [], loading }) {
  const lines = [{ key: 'active', color: '#10b981' }, { key: 'inactive', color: '#f43f5e' }];
  return (
    <Card hover>
      <CardHeader title="User Status Trend" subtitle="Active vs inactive (5 months)" />
      {loading ? <Skeleton className="h-52 w-full" /> : <LineChart data={data} lines={lines} height={220} />}
    </Card>
  );
}

export default UserStatusTrendCard;

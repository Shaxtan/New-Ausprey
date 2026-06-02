import { Card, CardHeader, Badge, Skeleton } from '@/components/ui';
import { AreaChart } from '@/components/charts';

export function DailyMovementCard({ data = [], loading }) {
  return (
    <Card hover>
      <CardHeader title="Daily Movement (km)" action={<Badge dot color="#047857" bg="#ecfdf5">+8.7%</Badge>} />
      {loading ? <Skeleton className="h-48 w-full" /> : <AreaChart data={data} color="#10b981" height={210} />}
    </Card>
  );
}

export default DailyMovementCard;

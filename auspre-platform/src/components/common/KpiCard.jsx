import { MotionCard, Skeleton } from '@/components/ui';

export function KpiCard({ icon: Icon, iconBg, iconColor, label, value, trend, index = 0, loading }) {
  if (loading) {
    return (
      <MotionCard initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-3 mb-3">
          <Skeleton className="w-11 h-11 rounded-xl" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-7 w-24 mb-2" />
        <Skeleton className="h-3 w-28" />
      </MotionCard>
    );
  }
  return (
    <MotionCard
      hover
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 0.61, 0.36, 1] }}
    >
      <div className="flex items-center gap-3 mb-3.5">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: iconBg }}>
          <Icon size={20} strokeWidth={2.2} style={{ color: iconColor }} />
        </div>
        <span className="text-sm font-semibold text-slate-500">{label}</span>
      </div>
      <div className="text-[1.625rem] leading-none font-extrabold tracking-tight text-slate-900 mb-2.5">{value}</div>
      {trend}
    </MotionCard>
  );
}

export default KpiCard;

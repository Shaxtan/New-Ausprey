import { cn } from '@/utils';

export function Spinner({ size = 22, className }) {
  return (
    <svg className={cn('animate-spin text-primary', className)} width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <Spinner size={28} />
    </div>
  );
}

export default Spinner;

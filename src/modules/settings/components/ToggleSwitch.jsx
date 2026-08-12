import { cn } from '@/utils';

export function ToggleSwitch({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange?.(!checked)}
      disabled={disabled}
      className={cn(
        'relative w-10 h-[22px] rounded-full transition shrink-0',
        checked ? 'bg-primary' : 'bg-slate-300',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white transition-all',
          checked ? 'left-[20px]' : 'left-0.5',
        )}
      />
    </button>
  );
}

export default ToggleSwitch;
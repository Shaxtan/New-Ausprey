import { cn } from '@/utils';
import fulllogo from '@/assets/new logo.png';
import smalllogo from '@/assets/small logo.png';

export function Logo({ compact = false }) {
  return (
    <div
      className={cn(
        'eyeoty-logo',
        compact ? 'eyeoty-logo--compact' : 'eyeoty-logo--expanded'
      )}
    >
      <img
        src={compact ? smalllogo : fulllogo}
        alt="Eyeoty logo"
        className={cn(
          'eyeoty-logo__image',
          compact ? 'eyeoty-logo__image--compact' : 'eyeoty-logo__image--expanded'
        )}
      />
    </div>
  );
}

export default Logo;
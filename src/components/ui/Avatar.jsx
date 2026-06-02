import { initialsOf } from '@/utils';
import { tokens } from '@/themes';

const PALETTE = tokens.chart;

export function Avatar({ name = '', size = 36 }) {
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length;
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.36, backgroundColor: PALETTE[idx] }}
    >
      {initialsOf(name)}
    </div>
  );
}

export default Avatar;

import { cn } from '@/utils';

/**
 * Eyeoty brand logo — Poppins SemiBold wordmark + gold signal glyph.
 * This is the single source of truth for the logo across the whole app
 * (sidebar, topbar, footer, landing page, marketing pages).
 *
 * Props:
 *  - compact: true  → glyph only (collapsed sidebar, favicon-style)
 *  - compact: false → full "eye((•))ty" lockup
 *  - size:    text size in px (default 22); glyph scales with it
 */

function SignalGlyph({ height }) {
  return (
    <svg
      width={height * 1.31}
      height={height}
      viewBox="0 0 42 32"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <circle cx="21" cy="16" r="5.6" fill="#D29A4A" />
      <g stroke="#D29A4A" strokeWidth="3.4" fill="none" strokeLinecap="round">
        <path d="M13.5 7.5 A11.5 11.5 0 0 0 13.5 24.5" />
        <path d="M8.5 3.5 A17.5 17.5 0 0 0 8.5 28.5" />
        <path d="M28.5 7.5 A11.5 11.5 0 0 1 28.5 24.5" />
        <path d="M33.5 3.5 A17.5 17.5 0 0 1 33.5 28.5" />
      </g>
    </svg>
  );
}

export function Logo({ compact = false, size = 22, className = '' }) {
  const glyphHeight = size * 0.95;

  const textStyle = {
    fontFamily: "'Poppins', system-ui, sans-serif",
    fontWeight: 600,
    fontSize: size,
    color: '#F5F7FA',
    letterSpacing: '0.01em',
    lineHeight: 1,
  };

  // Collapsed sidebar → glyph only
  if (compact) {
    return (
      <div className={cn('flex items-center justify-center select-none', className)}>
        <SignalGlyph height={size * 1.15} />
      </div>
    );
  }

  // Full lockup
  return (
    <div className={cn('flex items-center select-none', className)} aria-label="Eyeoty">
      <span style={textStyle}>eye</span>
      <span style={{ margin: '0 1px', transform: 'translateY(5%)' }}>
        <SignalGlyph height={glyphHeight} />
      </span>
      <span style={textStyle}>ty</span>
    </div>
  );
}

export default Logo;
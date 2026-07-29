import { useId } from 'react';
import { cn } from '@/utils';

/**
 * Eyeoty brand logo — Poppins SemiBold wordmark + gold signal glyph.
 * This is the single source of truth for the logo across the whole app
 * (sidebar, topbar, footer, landing page, marketing pages).
 *
 * Props:
 *  - compact: true  → glyph only (collapsed sidebar, favicon-style)
 *  - compact: false → full "eye((•))ty" lockup
 *  - size:    text size in px (default 32); glyph scales with it
 *
 * SIZING FIX: plain inline styles (style={{ fontSize: '20px !important' }})
 * don't work — browsers silently ignore `!important` set through the
 * inline `style` prop's shorthand assignment. `!important` only takes
 * effect when it's written into a real stylesheet rule. So sizing here
 * is now enforced via a scoped <style> block injected per instance
 * (keyed by React's useId, so it can't collide with other Logo instances
 * rendering elsewhere on the same page with different sizes), using real
 * `!important` CSS rules that will override anything else on the page
 * trying to constrain the logo's size.
 */

function SignalGlyph() {
  return (
    <svg className="eyeoty-logo-glyph" viewBox="0 0 42 32" aria-hidden="true">
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

export function Logo({ compact = false, size = 32, className = '' }) {
  const uid = useId().replace(/[:]/g, '');
  const scopeClass = `eyeoty-logo-${uid}`;

  const glyphHeight = size * 0.95;
  const glyphWidth = glyphHeight * 1.31;
  const compactGlyphHeight = size * 1.15;
  const compactGlyphWidth = compactGlyphHeight * 1.31;

  const finalGlyphHeight = compact ? compactGlyphHeight : glyphHeight;
  const finalGlyphWidth = compact ? compactGlyphWidth : glyphWidth;

  return (
    <div
      className={cn(scopeClass, 'flex items-center select-none', compact && 'justify-center', className)}
      aria-label="Eyeoty"
    >
      <style>{`
        .${scopeClass} .eyeoty-logo-text {
          font-family: 'Poppins', system-ui, sans-serif !important;
          font-weight: 600 !important;
          font-size: ${size}px !important;
          color: #F5F7FA !important;
          letter-spacing: 0.01em !important;
          line-height: 1 !important;
        }
        .${scopeClass} .eyeoty-logo-glyph {
          width: ${finalGlyphWidth}px !important;
          height: ${finalGlyphHeight}px !important;
          display: block !important;
        }
      `}</style>

      {compact ? (
        <SignalGlyph />
      ) : (
        <>
          <span className="eyeoty-logo-text">eye</span>
          <span style={{ margin: '0 1px', transform: 'translateY(5%)' }}>
            <SignalGlyph />
          </span>
          <span className="eyeoty-logo-text">ty</span>
        </>
      )}
    </div>
  );
}

export default Logo;
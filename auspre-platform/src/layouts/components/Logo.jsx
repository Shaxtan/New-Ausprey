export function Logo({ compact = false }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <svg width="26" height="26" viewBox="0 0 32 32" fill="none" className="shrink-0">
        <path d="M4 22 C10 8, 22 6, 30 10 C22 12, 16 16, 11 24 Z" fill="#d29a4a" />
        <path d="M6 24 C12 14, 20 12, 27 14 C20 17, 14 20, 10 26 Z" fill="#e0533a" opacity="0.92" />
      </svg>
      {!compact && (
        <div className="leading-none">
          <div className="text-[19px] font-extrabold tracking-tight">
            <span style={{ color: '#d29a4a' }}>au</span>
            <span style={{ color: '#e0533a' }}>s</span>
            <span style={{ color: '#e9eef6' }}>pre</span>
          </div>
          <div className="text-[7.5px] font-semibold tracking-[0.28em] mt-1 text-sidebar-muted">IGNITING POSSIBILITIES</div>
        </div>
      )}
    </div>
  );
}

export default Logo;

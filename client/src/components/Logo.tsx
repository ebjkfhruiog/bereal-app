export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="logo-bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7C6CF5" />
          <stop offset="1" stopColor="#5B4FE9" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#logo-bg)" />
      <g transform="rotate(-28 32 32)">
        <rect x="19" y="21" width="26" height="16" rx="7" fill="#FFF8EF" />
        <path d="M45 23 L54 29 L45 35 Z" fill="#FF7A50" />
        <rect x="38" y="24.5" width="4" height="11" fill="#E7DFFB" />
      </g>
    </svg>
  );
}

export function Logo({ size = 28, withWordmark = true }: { size?: number; withWordmark?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <LogoMark size={size} />
      {withWordmark && (
        <span className="font-display font-extrabold tracking-tight text-ink-900" style={{ fontSize: size * 0.72 }}>
          Stubby
        </span>
      )}
    </div>
  );
}

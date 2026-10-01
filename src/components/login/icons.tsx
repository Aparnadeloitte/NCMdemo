export function NationalEmblem({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 96" aria-hidden="true">
      <text
        x="40"
        y="10"
        textAnchor="middle"
        fontSize="7"
        fontFamily="serif"
        fill="#1a1a1a"
      >
        सत्यमेव जयते
      </text>
      <g fill="#1c1c1c">
        <ellipse cx="40" cy="28" rx="22" ry="6" />
        <path d="M18 30c2 8 8 14 22 14s20-6 22-14c-4 4-12 7-22 7s-18-3-22-7z" />
        <path d="M24 34c1 10 6 16 16 16s15-6 16-16c-3 5-8 8-16 8s-13-3-16-8z" />
        <circle cx="28" cy="24" r="3.2" />
        <circle cx="40" cy="22.5" r="3.4" />
        <circle cx="52" cy="24" r="3.2" />
        <path d="M22 22c2-6 6-9 10-8 1 3-1 6-4 7-3 0-5 1-6 1z" />
        <path d="M58 22c-2-6-6-9-10-8-1 3 1 6 4 7 3 0 5 1 6 1z" />
        <path d="M36 20c1-5 4-8 6-7 1 3 0 6-2 7-2 0-4 0-4 0z" />
        <path d="M30 42h20l2 6H28z" />
        <path d="M26 50h28v3H26z" />
        <path d="M22 55h36c-2 8-8 14-18 16-10-2-16-8-18-16z" />
        <path d="M32 58c2 2 5 3 8 3s6-1 8-3" fill="none" stroke="#f4f1e8" strokeWidth="1" />
        <circle cx="40" cy="62" r="2.2" fill="#f4f1e8" />
        <path d="M18 74h44v3.5H18z" />
        <path d="M14 80h52v3H14z" />
      </g>
      <path d="M8 86h64" stroke="#1c1c1c" strokeWidth="1.4" />
    </svg>
  );
}

export function NcmLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <linearGradient id="ncmRing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2f9b4a" />
          <stop offset="0.45" stopColor="#1f7d8a" />
          <stop offset="1" stopColor="#1d4f9c" />
        </linearGradient>
        <linearGradient id="ncmSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e8f6ff" />
          <stop offset="1" stopColor="#b7e3f5" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(#ncmRing)" />
      <circle cx="60" cy="60" r="48" fill="url(#ncmSky)" />
      <circle cx="78" cy="42" r="8" fill="#f4c542" />
      <path
        d="M28 78c8-8 16-10 22-8 4 1 8-2 14-2 8 0 14 6 20 6 6 0 10-3 14-6v16H28z"
        fill="#1f7ec4"
      />
      <path
        d="M30 84c10-6 18-6 26-2 6 3 10 0 16-1 8-1 14 4 22 3v10H30z"
        fill="#1565a8"
      />
      <path d="M60 74V46" stroke="#2e7d32" strokeWidth="3" strokeLinecap="round" />
      <path d="M60 52c-8 2-14 8-16 14 6-2 12-2 16 1z" fill="#43a047" />
      <path d="M60 48c8 1 14 7 17 13-6-1-12 0-17 2z" fill="#2e7d32" />
      <path d="M60 58c-7 2-12 7-13 12 5-1 10-1 13 1z" fill="#66bb6a" />
      <path d="M60 56c7 1 13 6 15 12-5 0-11 0-15 2z" fill="#388e3c" />
      <circle cx="60" cy="44" r="3.2" fill="#2e7d32" />
    </svg>
  );
}

export function HealthyCoastsIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 50V30" stroke="#2e7d32" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M32 34c-8 1-14 8-16 14 6-3 11-2 16 1z" fill="#43a047" />
      <path d="M32 32c8 0 15 7 17 14-6-2-12-1-17 2z" fill="#2e7d32" />
      <path d="M32 40c-6 1-11 6-12 11 5-2 9-1 12 1z" fill="#66bb6a" />
      <path d="M32 38c7 0 12 5 14 11-5-1-10 0-14 2z" fill="#1b5e20" />
      <path d="M24 52c2 4 6 6 8 6s6-2 8-6" stroke="#1b5e20" strokeWidth="1.6" fill="none" />
      <path d="M22 56h20" stroke="#1e88c7" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 60c4-2 8-2 14 0s10 2 14 0" stroke="#42a5f5" strokeWidth="1.6" fill="none" />
    </svg>
  );
}

export function ResilientCommunitiesIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path
        d="M8 40c6-10 12-10 18 0s12 10 18 0 12-10 18 0"
        fill="none"
        stroke="#1e88e5"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M8 50c6-8 12-8 18 0s12 8 18 0 12-8 18 0"
        fill="none"
        stroke="#1565c0"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path d="M22 28c6-8 14-8 20 0" fill="none" stroke="#f6c445" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function SustainableDevelopmentIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M18 46c8-4 16-16 18-28 6 10 14 18 22 22-10 2-20 2-28 8-4-2-8-2-12-2z" fill="#43a047" />
      <path d="M30 40c4-8 8-16 10-24" stroke="#2e7d32" strokeWidth="2" fill="none" />
      <path d="M40 18l6-8 2 8 8 2-8 2-2 8-6-8z" fill="#2e7d32" />
    </svg>
  );
}

export function CleanerOceansIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="24" cy="24" r="7" fill="#1e88e5" />
      <circle cx="40" cy="22" r="8" fill="#1565c0" />
      <circle cx="32" cy="32" r="7" fill="#42a5f5" />
      <path
        d="M10 48c6-7 12-7 18 0s12 7 18 0 10-7 14-4"
        fill="none"
        stroke="#1e88e5"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M12 56c6-5 11-5 16 0s11 5 16 0 9-5 14-3"
        fill="none"
        stroke="#64b5f6"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function DigiLockerIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 10V8a5 5 0 0 1 10 0v2"
        fill="none"
        stroke="#6d4aff"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <rect x="5" y="10" width="14" height="10" rx="2" fill="#6d4aff" />
      <circle cx="12" cy="15" r="1.3" fill="#fff" />
    </svg>
  );
}

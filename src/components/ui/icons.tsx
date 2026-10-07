export function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h12" />
      <path d="M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6" />
      <path d="M5.5 6l.6 9.2A2 2 0 0 0 8.1 17h3.8a2 2 0 0 0 2-1.8L14.5 6" />
      <path d="M8.3 9.5v4" />
      <path d="M11.7 9.5v4" />
    </svg>
  );
}

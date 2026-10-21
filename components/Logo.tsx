// Brand mark: a target ring with a tick that breaks out of it, on a rounded tile.
// The same drawing is used for the favicon and app icons (see public/logo.svg).
export default function Logo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={`shrink-0 ${className}`} aria-hidden="true" focusable="false">
      <rect width="48" height="48" rx="12" fill="#0b5f73" />
      <circle cx="23" cy="25" r="13" fill="none" stroke="#fff" strokeWidth="3.6" opacity="0.55" />
      <path d="M15.5 25.5 21.5 31.5 36 14" fill="none" stroke="#fff" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

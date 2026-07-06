export default function Logo({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="9" fill="#10b981" />
        <circle cx="14" cy="14" r="6.5" stroke="white" strokeWidth="2.25" />
        <path d="M18.7 18.7L24 24" stroke="white" strokeWidth="2.25" strokeLinecap="round" />
      </svg>
      <span className="font-display text-lg font-semibold tracking-tight text-ink-800 dark:text-canvas-100">
        Job<span className="text-brand-500 dark:text-brand-300">Prospects</span>
      </span>
    </span>
  );
}

export default function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? "brand-logo brand-logo-compact" : "brand-logo"}>
      <svg className="brand-logo-mark" viewBox="0 0 48 48" aria-hidden="true">
        <rect width="48" height="48" rx="15" className="brand-mark-surface" />
        <path d="M12 34V24.5h6V34h-6Zm9 0V18h6v16h-6Zm9 0V11h6v23h-6Z" className="brand-mark-bars" />
        <path d="m10.5 27.5 8.5-8 6.5 4 11-11" className="brand-mark-arrow" />
        <path d="M31.5 12.5h5v5" className="brand-mark-arrow" />
      </svg>
      <span className="brand-logo-copy">
        <span className="brand-wordmark"><strong>Fronta</strong><b>Budget</b></span>
        {!compact && <small>Mon budget, simplement</small>}
      </span>
    </span>
  );
}

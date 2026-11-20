import type { SVGProps } from "react";

export function BrandMark({ className = "", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" viewBox="0 0 40 40" fill="none" className={className} {...props}>
      <circle cx="20" cy="20" r="16.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M12 25.8V14.2l8 11.6V14.2M23.6 14.2h4.2a3.8 3.8 0 0 1 0 7.6h-4.2m0-7.6v11.6" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="31.5" cy="9" r="1.35" fill="#CD9F4E" />
    </svg>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand">
      <span className="brand-mark"><BrandMark /></span>
      {!compact && <span>open frontier</span>}
    </span>
  );
}

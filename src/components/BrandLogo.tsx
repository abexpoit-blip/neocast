/**
 * NeoCast brand logo — pure SVG so it stays razor-sharp at any size.
 * Mark: angular "N" cut from a black tile with a red edge.
 * Wordmark: NEOCAST in white + .CC accent in brand red.
 */

const RED = "#c62828";
const RED_LIGHT = "#ef5350";

export const BrandMark = ({ size = 36, className = "" }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="nc-tile" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop stopColor="#1e1e1e" />
        <stop offset="1" stopColor="#080808" />
      </linearGradient>
      <linearGradient id="nc-edge" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop stopColor={RED_LIGHT} />
        <stop offset="1" stopColor="#7f1414" />
      </linearGradient>
    </defs>
    <rect x="1.25" y="1.25" width="61.5" height="61.5" rx="16" fill="url(#nc-tile)" />
    <rect x="1.25" y="1.25" width="61.5" height="61.5" rx="16" stroke="url(#nc-edge)" strokeWidth="2.5" />
    {/* angular N */}
    <path d="M18 46V18h7.5l13 17.2V18H46v28h-7.5L25.5 28.8V46H18Z" fill="#fff" />
    <rect x="18" y="49" width="28" height="3" rx="1.5" fill={RED} />
  </svg>
);

export const BrandLogo = ({
  size = 36,
  showDomain = true,
  className = "",
  textClassName = "",
}: {
  size?: number;
  showDomain?: boolean;
  className?: string;
  textClassName?: string;
}) => (
  <span className={`inline-flex items-center gap-2.5 select-none ${className}`}>
    <BrandMark size={size} />
    <span
      className={`font-extrabold leading-none tracking-[-0.02em] text-white ${textClassName}`}
      style={{ fontSize: size * 0.5 }}
    >
      Neo<span className="text-white/85">Cast</span>
      {showDomain && (
        <span className="font-bold tracking-[0.04em]" style={{ color: RED_LIGHT, fontSize: size * 0.3 }}>
          .cc
        </span>
      )}
    </span>
  </span>
);

/** Big centered lockup for auth / splash screens. */
export const BrandLockup = ({ className = "" }: { className?: string }) => (
  <span className={`inline-flex flex-col items-center gap-3 ${className}`}>
    <BrandMark size={56} />
    <span className="flex flex-col items-center gap-1">
      <span className="text-white font-extrabold text-[26px] leading-none tracking-[-0.02em]">
        Neo<span className="text-white/85">Cast</span>
        <span className="text-[#ef5350] text-[15px] font-bold">.cc</span>
      </span>
      <span className="text-[9px] uppercase tracking-[0.4em] text-white/40">Verified marketplace</span>
    </span>
  </span>
);

export default BrandLogo;

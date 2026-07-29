/**
 * Payment network marks — pure inline SVG so they stay sharp at any size
 * and never depend on external image assets.
 */

type MarkProps = { className?: string };

const box = "0 0 48 32";

const Plate = ({
  children,
  fill = "#ffffff",
  className = "",
}: {
  children: React.ReactNode;
  fill?: string;
  className?: string;
}) => (
  <svg viewBox={box} className={className} role="img" aria-hidden="true">
    <rect x="0.5" y="0.5" width="47" height="31" rx="5" fill={fill} stroke="rgba(0,0,0,0.12)" />
    {children}
  </svg>
);

export const VisaMark = ({ className = "" }: MarkProps) => (
  <Plate className={className}>
    <text
      x="24"
      y="21.5"
      textAnchor="middle"
      fontFamily='"Space Grotesk", Arial, sans-serif'
      fontSize="13"
      fontStyle="italic"
      fontWeight="800"
      letterSpacing="0.5"
      fill="#1a1f71"
    >
      VISA
    </text>
    <rect x="10" y="24" width="28" height="1.6" rx="0.8" fill="#f7b600" />
  </Plate>
);

export const MastercardMark = ({ className = "" }: MarkProps) => (
  <Plate className={className} fill="#16181d">
    <circle cx="20" cy="16" r="9" fill="#eb001b" />
    <circle cx="30" cy="16" r="9" fill="#f79e1b" opacity="0.95" />
    <path
      d="M25 9.2a9 9 0 0 0 0 13.6 9 9 0 0 0 0-13.6Z"
      fill="#ff5f00"
    />
  </Plate>
);

export const AmexMark = ({ className = "" }: MarkProps) => (
  <Plate className={className} fill="#2e77bc">
    <text
      x="24"
      y="15"
      textAnchor="middle"
      fontFamily='"Space Grotesk", Arial, sans-serif'
      fontSize="8"
      fontWeight="800"
      letterSpacing="0.6"
      fill="#ffffff"
    >
      AMERICAN
    </text>
    <text
      x="24"
      y="24"
      textAnchor="middle"
      fontFamily='"Space Grotesk", Arial, sans-serif'
      fontSize="8"
      fontWeight="800"
      letterSpacing="0.6"
      fill="#ffffff"
    >
      EXPRESS
    </text>
  </Plate>
);

export const DiscoverMark = ({ className = "" }: MarkProps) => (
  <Plate className={className}>
    <text
      x="21"
      y="20"
      textAnchor="middle"
      fontFamily='"Space Grotesk", Arial, sans-serif'
      fontSize="7.6"
      fontWeight="800"
      letterSpacing="0.2"
      fill="#151515"
    >
      DISCOVER
    </text>
    <circle cx="40" cy="16.5" r="5.5" fill="#f26e21" />
    <rect x="6" y="24" width="36" height="1.6" rx="0.8" fill="#f26e21" opacity="0.7" />
  </Plate>
);

export const cardNetworks = [
  { name: "Visa", Mark: VisaMark },
  { name: "Mastercard", Mark: MastercardMark },
  { name: "Amex", Mark: AmexMark },
  { name: "Discover", Mark: DiscoverMark },
];

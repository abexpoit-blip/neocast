import { CreditCard } from "lucide-react";

type Props = {
  /** Full-screen overlay (default) or inline block. */
  variant?: "screen" | "inline";
  label?: string;
};

/**
 * NeoCast loading state — a shuffling stack of cards with an orbiting
 * spark and a shimmering progress rail. Distinct to the NeoCast brand.
 */
export function NeoCastLoader({ variant = "screen", label = "Loading" }: Props) {
  const body = (
    <div className="flex flex-col items-center gap-6">
      <div className="relative h-[92px] w-[140px]">
        {/* orbit ring */}
        <div
          className="absolute left-1/2 top-1/2 h-[126px] w-[126px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 neocast-spin"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, rgba(var(--nc-accent-rgb),0.75) 90deg, rgba(129,140,248,0.55) 190deg, transparent 300deg)",
            maskImage: "radial-gradient(circle, transparent 56%, black 58%, black 62%, transparent 64%)",
            WebkitMaskImage:
              "radial-gradient(circle, transparent 56%, black 58%, black 62%, transparent 64%)",
          }}
        />
        {/* card stack */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 h-[58px] w-[94px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/20 neocast-card"
            style={{
              background: [
                "linear-gradient(135deg, var(--nc-accent) 0%, #9e1c1c 100%)",
                "linear-gradient(135deg, #06b6d4 0%, #0f172a 100%)",
                "linear-gradient(135deg, #818cf8 0%, #1e293b 100%)",
              ][i],
              boxShadow: "0 18px 40px -18px rgba(2,6,23,0.9)",
              animationDelay: `${i * 0.42}s`,
            }}
          >
            <CreditCard className="absolute right-2 top-2 h-3.5 w-3.5 text-white/70" />
            <div className="absolute bottom-2.5 left-2.5 flex gap-1">
              {[0, 1, 2].map((d) => (
                <span key={d} className="h-1 w-4 rounded-full bg-white/45" />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="w-[190px]">
        <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full w-1/3 rounded-full neocast-rail"
            style={{ background: "linear-gradient(90deg, var(--nc-accent), #ef5350, #ffcdd2)" }}
          />
        </div>
        <div className="mt-3 text-center text-[10px] uppercase tracking-[0.38em] text-white/45">
          {label}
        </div>
      </div>

      <style>{`
        @keyframes neocast-spin { to { transform: translate(-50%, -50%) rotate(360deg); } }
        .neocast-spin { animation: neocast-spin 2.4s linear infinite; }
        @keyframes neocast-card {
          0%   { transform: translate(-50%, -50%) rotate(-10deg) translateY(6px) scale(0.94); opacity: .55; }
          35%  { transform: translate(-50%, -50%) rotate(0deg)  translateY(-6px) scale(1);    opacity: 1; }
          70%  { transform: translate(-50%, -50%) rotate(9deg)  translateY(6px)  scale(0.94); opacity: .55; }
          100% { transform: translate(-50%, -50%) rotate(-10deg) translateY(6px) scale(0.94); opacity: .55; }
        }
        .neocast-card { animation: neocast-card 1.26s ease-in-out infinite; }
        @keyframes neocast-rail {
          0%   { transform: translateX(-110%); }
          100% { transform: translateX(320%); }
        }
        .neocast-rail { animation: neocast-rail 1.15s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .neocast-spin, .neocast-card, .neocast-rail { animation-duration: 6s; }
        }
      `}</style>
    </div>
  );

  if (variant === "inline") return <div className="py-10 flex justify-center">{body}</div>;

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0a0a0a 0%, var(--nc-ink) 50%, #0a0a0a 100%)" }}
    >
      <div
        className="absolute -top-32 -left-24 h-[380px] w-[380px] rounded-full blur-[120px] opacity-50"
        style={{ background: "radial-gradient(circle, var(--nc-accent) 0%, transparent 70%)" }}
      />
      <div
        className="absolute -bottom-32 -right-20 h-[400px] w-[400px] rounded-full blur-[130px] opacity-40"
        style={{ background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)" }}
      />
      <div className="relative z-10">{body}</div>
    </div>
  );
}

export default NeoCastLoader;

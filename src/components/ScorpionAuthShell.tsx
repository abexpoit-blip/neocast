import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  title?: string;
  tagline?: ReactNode;
  accent?: "blue" | "red" | "gold";
};

const accentBar: Record<NonNullable<Props["accent"]>, string> = {
  blue: "from-transparent via-[#22d3ee] to-transparent",
  red: "from-transparent via-[#f472b6] to-transparent",
  gold: "from-transparent via-[#818cf8] to-transparent",
};

/**
 * NeoCast auth shell — midnight indigo canvas, electric cyan accents,
 * soft aurora glow and a fine grid. Used by every sign-in surface.
 */
export function ScorpionAuthShell({
  children,
  title = "NeoCast",
  tagline,
  accent = "blue",
}: Props) {
  return (
    <main
      className="min-h-screen w-full relative flex items-center justify-center px-4 py-12 overflow-hidden"
      style={{
        fontFamily: '"DM Sans", "Segoe UI", system-ui, sans-serif',
        background: "linear-gradient(160deg, #070b1c 0%, #0b1230 45%, #060814 100%)",
      }}
    >
      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(129,140,248,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(129,140,248,0.10) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at 50% 35%, black 10%, transparent 78%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 35%, black 10%, transparent 78%)",
        }}
      />
      {/* Aurora glows */}
      <div
        className="absolute -top-40 -left-32 h-[420px] w-[420px] rounded-full blur-[120px] opacity-60"
        style={{ background: "radial-gradient(circle, #4f46e5 0%, transparent 70%)" }}
      />
      <div
        className="absolute -bottom-48 -right-24 h-[460px] w-[460px] rounded-full blur-[130px] opacity-50"
        style={{ background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)" }}
      />

      <div className="relative z-10 w-full max-w-[430px]">
        <div className="relative rounded-[22px] overflow-hidden">
          {/* Gradient hairline border */}
          <div
            className="absolute -inset-[1px] rounded-[22px] opacity-80"
            style={{
              background:
                "linear-gradient(140deg, rgba(34,211,238,0.55), rgba(99,102,241,0.35) 45%, rgba(255,255,255,0.05) 100%)",
            }}
          />
          <div
            className="relative rounded-[22px] border border-white/10 shadow-[0_30px_90px_-25px_rgba(4,8,25,0.95)]"
            style={{
              background:
                "linear-gradient(165deg, rgba(18,24,52,0.86) 0%, rgba(9,12,30,0.92) 100%)",
              backdropFilter: "blur(24px) saturate(140%)",
            }}
          >
            <div className={`h-[2px] w-full bg-gradient-to-r ${accentBar[accent]}`} />
            <div className="px-8 py-9 sm:px-10 sm:py-10 text-white">
              <div className="text-center mb-8">
                <div className="flex justify-center mb-5">
                  <div className="relative h-16 w-16">
                    <div
                      className="absolute inset-0 rounded-2xl blur-xl opacity-70"
                      style={{
                        background:
                          "radial-gradient(circle, rgba(34,211,238,0.65) 0%, rgba(79,70,229,0) 70%)",
                      }}
                    />
                    <div
                      className="relative h-full w-full rounded-2xl border border-white/15 flex items-center justify-center"
                      style={{
                        background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 12px 30px -10px rgba(34,211,238,0.6)",
                      }}
                    >
                      <span
                        className="text-[26px] font-extrabold leading-none text-white"
                        style={{ fontFamily: '"Space Grotesk", "DM Sans", sans-serif' }}
                      >
                        N
                      </span>
                    </div>
                  </div>
                </div>
                <h1
                  className="text-[28px] leading-none font-extrabold tracking-[-0.02em] text-white"
                  style={{ fontFamily: '"Space Grotesk", "DM Sans", sans-serif' }}
                >
                  {title}
                </h1>
                <p className="mt-2 text-[10px] uppercase tracking-[0.35em] text-[#67e8f9]/70">
                  Secure Access
                </p>
                {tagline && (
                  <p className="mt-4 text-[13px] text-white/65 leading-relaxed">{tagline}</p>
                )}
              </div>
              {children}
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-white/40 mt-6 tracking-[0.18em] uppercase">
          © {new Date().getFullYear()} NeoCast · All rights reserved
        </p>
      </div>
    </main>
  );
}

export default ScorpionAuthShell;

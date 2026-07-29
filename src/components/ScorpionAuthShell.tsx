import { ReactNode } from "react";
import { BadgeCheck, Zap, Lock, Gift } from "lucide-react";

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

const perks = [
  { icon: Zap, title: "Instant delivery", copy: "Codes land in your account seconds after checkout." },
  { icon: BadgeCheck, title: "Verified stock", copy: "Every card is source-checked before it goes on sale." },
  { icon: Lock, title: "Protected payments", copy: "Encrypted crypto & card checkout with buyer cover." },
];

/** Premium gift-card marketplace card mock used in the brand panel. */
function CardMock({
  label,
  value,
  className = "",
  gradient,
}: {
  label: string;
  value: string;
  className?: string;
  gradient: string;
}) {
  return (
    <div
      className={`absolute w-[230px] rounded-2xl border border-white/15 p-4 backdrop-blur-md shadow-[0_28px_70px_-24px_rgba(2,6,23,0.95)] ${className}`}
      style={{ background: gradient }}
    >
      <div className="flex items-start justify-between">
        <Gift className="h-5 w-5 text-white/85" />
        <span className="text-[9px] uppercase tracking-[0.28em] text-white/70">Gift card</span>
      </div>
      <div className="mt-7 text-[11px] uppercase tracking-[0.22em] text-white/70">{label}</div>
      <div
        className="mt-1 text-2xl font-extrabold text-white"
        style={{ fontFamily: '"Space Grotesk", "DM Sans", sans-serif' }}
      >
        {value}
      </div>
      <div className="mt-4 flex gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <span key={i} className="h-1 w-6 rounded-full bg-white/35" />
        ))}
      </div>
    </div>
  );
}

/**
 * NeoCast auth shell — premium gift-card marketplace split layout.
 * Left: brand story, trust perks and floating card mocks. Right: the form.
 */
export function ScorpionAuthShell({
  children,
  title = "NeoCast",
  tagline,
  accent = "blue",
}: Props) {
  return (
    <main
      className="min-h-screen w-full relative flex items-center justify-center px-4 py-10 sm:py-14 overflow-hidden"
      style={{
        fontFamily: '"DM Sans", "Segoe UI", system-ui, sans-serif',
        background: "linear-gradient(160deg, #05070f 0%, #0b1230 48%, #05070f 100%)",
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
        className="absolute -top-40 -left-32 h-[460px] w-[460px] rounded-full blur-[130px] opacity-60"
        style={{ background: "radial-gradient(circle, #4f46e5 0%, transparent 70%)" }}
      />
      <div
        className="absolute -bottom-48 -right-24 h-[500px] w-[500px] rounded-full blur-[140px] opacity-50"
        style={{ background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)" }}
      />

      <div className="relative z-10 w-full max-w-[1060px] grid lg:grid-cols-[1.05fr_minmax(0,430px)] gap-10 lg:gap-14 items-center">
        {/* Brand panel */}
        <section className="hidden lg:block text-white">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-3 py-1.5 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-[#22d3ee] shadow-[0_0_10px_#22d3ee]" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-white/70">
              Premium gift card marketplace
            </span>
          </div>

          <h2
            className="mt-6 text-[46px] leading-[1.05] font-extrabold tracking-[-0.03em]"
            style={{ fontFamily: '"Space Grotesk", "DM Sans", sans-serif' }}
          >
            Buy gift cards
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(100deg, #818cf8 0%, #22d3ee 60%, #a5f3fc 100%)" }}
            >
              that just work.
            </span>
          </h2>
          <p className="mt-4 max-w-[420px] text-[14px] leading-relaxed text-white/60">
            Steam, Apple, PlayStation, Amazon and 200+ brands — verified stock, instant
            delivery and 24/7 support from a marketplace traders actually trust.
          </p>

          <div className="mt-8 space-y-3.5 max-w-[420px]">
            {perks.map(({ icon: Icon, title: t, copy }) => (
              <div key={t} className="flex items-start gap-3.5">
                <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/12 bg-white/[0.05] backdrop-blur-md">
                  <Icon className="h-4 w-4 text-[#67e8f9]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[13.5px] font-semibold text-white">{t}</div>
                  <div className="text-[12.5px] text-white/55 leading-snug">{copy}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Floating card mocks */}
          <div className="relative mt-10 h-[190px] max-w-[440px]">
            <CardMock
              label="Balance"
              value="$100.00"
              className="left-0 top-0 -rotate-6"
              gradient="linear-gradient(140deg, rgba(79,70,229,0.85) 0%, rgba(14,165,233,0.7) 100%)"
            />
            <CardMock
              label="Balance"
              value="$50.00"
              className="left-[150px] top-[46px] rotate-3"
              gradient="linear-gradient(140deg, rgba(6,182,212,0.8) 0%, rgba(15,23,42,0.85) 100%)"
            />
            <CardMock
              label="Balance"
              value="$25.00"
              className="left-[300px] top-[14px] rotate-[9deg]"
              gradient="linear-gradient(140deg, rgba(129,140,248,0.7) 0%, rgba(30,41,59,0.9) 100%)"
            />
          </div>

          <div className="mt-8 flex items-center gap-7 text-white/55">
            {[
              ["200+", "Brands"],
              ["1.2M+", "Codes sold"],
              ["4.9/5", "Buyer rating"],
            ].map(([n, l]) => (
              <div key={l}>
                <div
                  className="text-[19px] font-extrabold text-white"
                  style={{ fontFamily: '"Space Grotesk", "DM Sans", sans-serif' }}
                >
                  {n}
                </div>
                <div className="text-[10.5px] uppercase tracking-[0.2em]">{l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Form card */}
        <div className="w-full max-w-[430px] mx-auto lg:mx-0">
          <div className="relative rounded-[22px] overflow-hidden">
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
              <div className="px-7 py-8 sm:px-10 sm:py-10 text-white">
                <div className="text-center mb-7">
                  <div className="flex justify-center mb-5">
                    <div className="relative h-14 w-14">
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
                          boxShadow:
                            "inset 0 1px 0 rgba(255,255,255,0.35), 0 12px 30px -10px rgba(34,211,238,0.6)",
                        }}
                      >
                        <span
                          className="text-[24px] font-extrabold leading-none text-white"
                          style={{ fontFamily: '"Space Grotesk", "DM Sans", sans-serif' }}
                        >
                          N
                        </span>
                      </div>
                    </div>
                  </div>
                  <h1
                    className="text-[27px] leading-none font-extrabold tracking-[-0.02em] text-white"
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

          <div className="mt-5 flex items-center justify-center gap-4 text-[10px] uppercase tracking-[0.2em] text-white/40">
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-3 w-3" /> SSL secured
            </span>
            <span className="h-3 w-px bg-white/15" />
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheck className="h-3 w-3" /> Verified seller
            </span>
          </div>

          <p className="text-center text-[11px] text-white/35 mt-4 tracking-[0.18em] uppercase">
            © {new Date().getFullYear()} NeoCast · All rights reserved
          </p>
        </div>
      </div>
    </main>
  );
}

export default ScorpionAuthShell;

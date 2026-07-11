import { ReactNode } from "react";
import heroBg from "@/assets/scorpion-hero.jpg";
import dragonLogo from "@/assets/dragon-logo.png";

type Props = {
  children: ReactNode;
  title?: string;
  tagline?: ReactNode;
  accent?: "blue" | "red" | "gold";
};

const accentBar: Record<NonNullable<Props["accent"]>, string> = {
  blue: "from-[#2196f3] via-[#4fc3f7] to-[#2196f3]",
  red: "from-[#ff2d2d] via-[#ff6b6b] to-[#ff2d2d]",
  gold: "from-[#ffb300] via-[#ffe082] to-[#ffb300]",
};

export function ScorpionAuthShell({
  children,
  title = "Scorpion-Shop",
  tagline,
  accent = "blue",
}: Props) {
  return (
    <main
      className="min-h-screen w-full relative flex items-center justify-center px-4 py-10"
      style={{ fontFamily: '"DM Sans", "Segoe UI", system-ui, sans-serif' }}
    >
      {/* Background scorpion mascot */}
      <div
        className="absolute inset-0 bg-[#2a0808]"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.0) 0%, rgba(20,4,4,0.35) 60%, rgba(10,2,2,0.75) 100%)",
        }}
      />

      <div className="relative z-10 w-full max-w-[440px]">
        {/* Card */}
        <div className="rounded-md bg-[#1d2530]/85 backdrop-blur-md border border-white/10 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.7)] overflow-hidden">
          <div className={`h-[3px] w-full bg-gradient-to-r ${accentBar[accent]}`} />
          <div className="px-8 py-8 sm:px-10 sm:py-10 text-white">
            <div className="text-center mb-6">
              <h1
                className="text-[28px] leading-none font-extrabold tracking-tight"
                style={{ fontFamily: '"Space Grotesk", "DM Sans", sans-serif' }}
              >
                <span className="inline-block bg-[#2196f3] text-white px-2.5 py-0.5 rounded-sm">
                  {title}
                </span>
              </h1>
              {tagline && (
                <p className="mt-4 text-[13px] text-white/85 leading-relaxed">{tagline}</p>
              )}
            </div>
            {children}
          </div>
        </div>

        <p className="text-center text-[11px] text-white/50 mt-5 tracking-wide">
          Copyright © {new Date().getFullYear()} Scorpion-Shop · All Rights Reserved.
        </p>
      </div>
    </main>
  );
}

export default ScorpionAuthShell;

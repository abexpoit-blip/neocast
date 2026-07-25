import { ReactNode } from "react";
import dragonBgAsset from "@/assets/dragon-bg.jpg.asset.json";
import dragonLogo from "@/assets/dragon-logo.png";

const heroBg = dragonBgAsset.url;

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
  title = "Zoru Shop",
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
        className="absolute inset-0 bg-black"
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
            "radial-gradient(ellipse at center, rgba(0,0,0,0.05) 0%, rgba(10,2,2,0.35) 55%, rgba(0,0,0,0.7) 100%)",
        }}
      />

      <div className="relative z-10 w-full max-w-[420px]">
        {/* Premium glass card */}
        <div className="relative rounded-2xl overflow-hidden">
          {/* Outer glow */}
          <div
            className="absolute -inset-[1px] rounded-2xl opacity-70 blur-[2px]"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,45,45,0.6), rgba(255,179,0,0.35), rgba(0,229,255,0.4))",
            }}
          />
          {/* Glass surface */}
          <div
            className="relative rounded-2xl border border-white/15 shadow-[0_25px_80px_-15px_rgba(0,0,0,0.85)]"
            style={{
              background:
                "linear-gradient(160deg, rgba(20,10,15,0.35) 0%, rgba(10,5,10,0.5) 100%)",
              backdropFilter: "blur(22px) saturate(150%)",
            }}
          >
            <div className={`h-[2px] w-full bg-gradient-to-r ${accentBar[accent]}`} />
            <div className="px-8 py-9 sm:px-10 sm:py-10 text-white">
              <div className="text-center mb-7">
                <div className="flex justify-center mb-4">
                  <div className="relative h-20 w-20">
                    <div
                      className="absolute inset-0 rounded-2xl blur-lg opacity-70"
                      style={{
                        background:
                          "radial-gradient(circle, rgba(255,80,30,0.7) 0%, rgba(255,45,45,0) 70%)",
                      }}
                    />
                    <div className="relative h-full w-full rounded-2xl bg-gradient-to-br from-[#1a0505]/80 to-[#3a0a0a]/60 border border-[#ffb300]/50 shadow-[inset_0_0_20px_rgba(255,80,20,0.25),0_0_25px_rgba(255,45,45,0.35)] flex items-center justify-center overflow-hidden backdrop-blur-sm">
                      <img
                        src={dragonLogo}
                        alt="Dragon emblem"
                        width={512}
                        height={512}
                        loading="lazy"
                        className="h-[92%] w-[92%] object-contain drop-shadow-[0_0_14px_rgba(255,80,20,0.85)]"
                      />
                    </div>
                  </div>
                </div>
                <h1
                  className="text-[26px] leading-none font-extrabold tracking-tight"
                  style={{ fontFamily: '"Space Grotesk", "DM Sans", sans-serif' }}
                >
                  <span
                    className="inline-block bg-clip-text text-transparent"
                    style={{
                      backgroundImage:
                        "linear-gradient(90deg, #ff2d2d 0%, #ff8c1a 50%, #ffb300 100%)",
                    }}
                  >
                    {title}
                  </span>
                </h1>
                <div className="mt-2 flex justify-center">
                  <div className="h-[2px] w-14 rounded-full bg-gradient-to-r from-transparent via-[#ffb300]/70 to-transparent" />
                </div>
                {tagline && (
                  <p className="mt-4 text-[13px] text-white/80 leading-relaxed">{tagline}</p>
                )}
              </div>
              {children}
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-white/60 mt-5 tracking-[0.15em] uppercase">
          © {new Date().getFullYear()} Scorpion-Shop · All Rights Reserved
        </p>
      </div>
    </main>
  );
}

export default ScorpionAuthShell;

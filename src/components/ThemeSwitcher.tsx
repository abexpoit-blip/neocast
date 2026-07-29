import { useTheme, BrandTheme } from "@/hooks/useTheme";

const SWATCH: Record<BrandTheme, { dot: string; label: string }> = {
  crimson: { dot: "#c62828", label: "Crimson" },
  maroon: { dot: "#7b1e34", label: "Maroon" },
};

/** Compact brand-skin switcher: two color dots, works on every breakpoint. */
export const ThemeSwitcher = ({ className = "" }: { className?: string }) => {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 ${className}`}
      role="group"
      aria-label="Color theme"
    >
      {(Object.keys(SWATCH) as BrandTheme[]).map((t) => {
        const active = theme === t;
        return (
          <button
            key={t}
            type="button"
            onClick={() => setTheme(t)}
            title={SWATCH[t].label}
            aria-label={`${SWATCH[t].label} theme`}
            aria-pressed={active}
            className={`h-6 w-6 rounded-full transition-all duration-300 active:scale-90 ${
              active
                ? "ring-2 ring-white/80 scale-100"
                : "ring-1 ring-white/20 opacity-60 hover:opacity-100 hover:scale-105"
            }`}
            style={{ background: `linear-gradient(135deg, ${SWATCH[t].dot}, #000)` }}
          />
        );
      })}
    </div>
  );
};

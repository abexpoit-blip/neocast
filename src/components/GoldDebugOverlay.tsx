import { useEffect, useState } from "react";

/**
 * Tiny floating debug chip that samples the computed color of
 * the first `.gold-text` element on the page (typically the navbar
 * username or balance) so you can verify the active theme color.
 * Toggle off by removing the component from AppShell.
 */
export default function GoldDebugOverlay() {
  const [info, setInfo] = useState<{ color: string; fill: string; bg: string } | null>(null);

  useEffect(() => {
    let frame = 0;
    const sample = () => {
      const el = document.querySelector(".gold-text") as HTMLElement | null;
      if (el) {
        const cs = getComputedStyle(el);
        setInfo({
          color: cs.color,
          fill: cs.webkitTextFillColor || cs.color,
          bg: cs.backgroundImage?.slice(0, 60) || "—",
        });
      }
      frame = window.setTimeout(sample, 2000) as unknown as number;
    };
    sample();
    return () => clearTimeout(frame);
  }, []);

  if (!info) return null;

  const swatch = info.fill && info.fill !== "rgba(0, 0, 0, 0)" ? info.fill : info.color;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 10,
        left: 10,
        zIndex: 9999,
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 10,
        lineHeight: 1.4,
        padding: "6px 10px",
        borderRadius: 8,
        background: "rgba(0,0,0,0.75)",
        color: "#fff",
        border: "1px solid rgba(255,255,255,0.15)",
        display: "flex",
        alignItems: "center",
        gap: 8,
        backdropFilter: "blur(6px)",
        pointerEvents: "none",
      }}
      aria-hidden
    >
      <span
        style={{
          display: "inline-block",
          width: 14,
          height: 14,
          borderRadius: 4,
          background: swatch,
          border: "1px solid rgba(255,255,255,0.2)",
        }}
      />
      <span>gold-text: {swatch}</span>
    </div>
  );
}

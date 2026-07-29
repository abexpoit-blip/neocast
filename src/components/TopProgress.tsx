import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * Thin top loading bar. Shows on route change and while any fetch() is in flight.
 * Purely additive — does not alter any page layout.
 */
let pending = 0;
const listeners = new Set<(n: number) => void>();

function notify() {
  listeners.forEach((l) => l(pending));
}

let patched = false;
function patchFetch() {
  if (patched || typeof window === "undefined") return;
  patched = true;
  const orig = window.fetch.bind(window);
  window.fetch = async (...args: Parameters<typeof fetch>) => {
    pending += 1;
    notify();
    try {
      return await orig(...args);
    } finally {
      pending = Math.max(0, pending - 1);
      notify();
    }
  };
}

export function TopProgress() {
  const location = useLocation();
  const [active, setActive] = useState(false);
  const [width, setWidth] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    patchFetch();
    const l = (n: number) => setActive(n > 0);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  // Also pulse on route change
  useEffect(() => {
    setActive(true);
    const t = setTimeout(() => setActive(pending > 0), 400);
    return () => clearTimeout(t);
  }, [location.pathname]);

  useEffect(() => {
    if (active) {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setWidth((w) => (w > 0 && w < 90 ? w : 8));
      timer.current = setInterval(() => {
        setWidth((w) => (w >= 90 ? 90 : w + Math.max(0.5, (90 - w) * 0.08)));
      }, 120);
    } else {
      if (timer.current) clearInterval(timer.current);
      setWidth((w) => (w > 0 ? 100 : 0));
      hideTimer.current = setTimeout(() => setWidth(0), 320);
    }
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [active]);

  if (width === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none">
      <div
        className="h-full transition-[width,opacity] duration-300 ease-out"
        style={{
          width: `${width}%`,
          opacity: width >= 100 ? 0 : 1,
          background: "linear-gradient(90deg, var(--nc-accent) 0%, #9e1c1c 55%, #ef5350 100%)",
          boxShadow: "0 0 12px rgba(var(--nc-accent-rgb),0.75)",
        }}
      />
    </div>
  );
}

export default TopProgress;

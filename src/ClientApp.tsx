import { useEffect, useState, lazy, Suspense } from "react";

const App = lazy(() => import("./App"));

/**
 * Mounts the full vendor app (react-router-dom + AuthProvider + Routes)
 * client-only. TanStack Start only provides the SSR shell here.
 */
export default function ClientApp() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground font-mono text-xs tracking-[0.3em] uppercase">
          Loading…
        </div>
      </div>
    );
  }
  return (
    <Suspense fallback={null}>
      <App />
    </Suspense>
  );
}

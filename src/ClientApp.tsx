import { useEffect, useState, lazy, Suspense } from "react";

import { NeoCastLoader } from "./components/NeoCastLoader";

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
      <NeoCastLoader />
    );
  }
  return (
    <Suspense fallback={<NeoCastLoader />}>
      <App />
    </Suspense>
  );
}

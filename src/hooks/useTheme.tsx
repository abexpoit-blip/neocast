import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type BrandTheme = "crimson" | "maroon";

const KEY = "neocast-theme";

type Ctx = { theme: BrandTheme; setTheme: (t: BrandTheme) => void; toggleTheme: () => void };
const ThemeCtx = createContext<Ctx>({ theme: "crimson", setTheme: () => {}, toggleTheme: () => {} });

const apply = (t: BrandTheme) => {
  if (typeof document === "undefined") return;
  if (t === "crimson") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", t);
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<BrandTheme>("crimson");

  useEffect(() => {
    const saved = (localStorage.getItem(KEY) as BrandTheme | null) ?? "crimson";
    setThemeState(saved);
    apply(saved);
  }, []);

  const setTheme = (t: BrandTheme) => {
    setThemeState(t);
    apply(t);
    try { localStorage.setItem(KEY, t); } catch { /* ignore */ }
  };

  return (
    <ThemeCtx.Provider value={{ theme, setTheme, toggleTheme: () => setTheme(theme === "crimson" ? "maroon" : "crimson") }}>
      {children}
    </ThemeCtx.Provider>
  );
};

export const useTheme = () => useContext(ThemeCtx);

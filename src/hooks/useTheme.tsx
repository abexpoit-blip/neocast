import { createContext, useContext, ReactNode } from "react";

/** NeoCast ships a single maroon brand skin — the switcher was retired. */
export type BrandTheme = "maroon";

type Ctx = { theme: BrandTheme; setTheme: (t: BrandTheme) => void; toggleTheme: () => void };
const ThemeCtx = createContext<Ctx>({ theme: "maroon", setTheme: () => {}, toggleTheme: () => {} });

export const ThemeProvider = ({ children }: { children: ReactNode }) => (
  <ThemeCtx.Provider value={{ theme: "maroon", setTheme: () => {}, toggleTheme: () => {} }}>
    {children}
  </ThemeCtx.Provider>
);

export const useTheme = () => useContext(ThemeCtx);

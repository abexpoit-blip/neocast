import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { BuildBadge } from "@/components/BuildBadge";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { cartApi } from "@/lib/api";

// Scorpion-style navigation. Exactly 5 items, matching scorpionshopcc.su.
const buyerNav = [
  { to: "/", label: "ГЛАВНАЯ", end: true },
  { to: "/shop", label: "МАГАЗИН" },
  { to: "/cart", label: "КОРЗИНА" },
  { to: "/orders", label: "ЗАКАЗЫ" },
  { to: "/recharge", label: "ПОПОЛНЕНИЕ" },
];

export const AppShell = ({ children }: { children: ReactNode }) => {
  const { profile, signOut, user } = useAuth();
  const settings = useSiteSettings();
  const nav = useNavigate();
  const loc = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const items = buyerNav;

  const loadCart = useCallback(async () => {
    if (!user) return;
    try { const { items } = await cartApi.list(); setCartCount((items ?? []).length); } catch { /* ignore */ }
  }, [user]);

  useEffect(() => { loadCart(); }, [loadCart]);
  useEffect(() => { loadCart(); }, [loc.pathname, loadCart]);
  useEffect(() => {
    const h = () => loadCart();
    window.addEventListener("cart-updated", h);
    return () => window.removeEventListener("cart-updated", h);
  }, [loadCart]);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const balance = Number(profile?.balance ?? 0).toFixed(2);
  const uname = profile?.username ?? "пользователь";

  return (
    <div
      className="min-h-screen bg-white text-[#1a1a1a] flex flex-col"
      style={{ fontFamily: '"DM Sans", "Segoe UI", system-ui, sans-serif' }}
    >
      <ImpersonationBanner />
      <BuildBadge />

      {/* TOP NAV */}
      <header className="bg-[#304156] text-white sticky top-0 z-40">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 h-12 flex items-center justify-between gap-6">
          <nav className="hidden lg:flex items-center h-full text-[13px] tracking-wide">
            {items.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={(n as any).end}
                className={({ isActive }) =>
                  `h-full px-4 flex items-center transition-colors border-b-2 relative ${
                    isActive
                      ? "text-[#409EFF] border-[#409EFF] bg-[#263445]"
                      : "text-[#bfcbd9] border-transparent hover:text-white"
                  }`
                }
              >
                {n.label}
                {n.to === "/cart" && cartCount > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-[#e53935] text-white">
                    {cartCount}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
          <button
            onClick={() => setDrawerOpen((v) => !v)}
            className="lg:hidden p-2 -ml-2 text-white"
            aria-label="Меню"
          >
            {drawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="text-[13px] font-medium tracking-wide text-white/90 truncate">
            {settings.shop_name}
          </div>
        </div>
        {drawerOpen && (
          <div className="lg:hidden bg-[#304156] border-t border-white/10">
            {items.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={(n as any).end}
                onClick={() => setDrawerOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-3 text-sm border-l-2 ${
                    isActive ? "border-[#409EFF] text-[#409EFF] bg-white/5" : "border-transparent text-[#bfcbd9] hover:bg-white/5"
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {/* SUB BAR */}
      <div className="bg-white border-b border-[#e6e6e6]">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 h-12 flex items-center justify-end gap-3 text-[13px]">
          <span className="px-3 py-1.5 border border-[#e6e6e6] text-[#2196f3]">
            {uname}
          </span>
          <Link
            to="/recharge"
            className="px-3 py-1.5 border border-[#e6e6e6] text-[#2fb344] hover:bg-[#f4fbf5] transition font-medium"
          >
            $ {balance}
          </Link>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-1.5 pl-1 pr-2 py-1 hover:bg-[#f7f7f7] transition"
            >
              <span className="h-8 w-8 rounded-full bg-[#304156] text-white text-xs uppercase font-medium flex items-center justify-center">
                {uname.slice(0, 2)}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-[#666]" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-[#e6e6e6] shadow-md z-10 text-sm">
                <button
                  onClick={async () => { setMenuOpen(false); await signOut(); nav("/auth"); }}
                  className="w-full text-left px-3 py-2 hover:bg-[#f7f7f7] flex items-center gap-2 text-[#333]"
                >
                  <LogOut className="h-3.5 w-3.5" /> Выйти
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="flex-1 mx-auto w-full max-w-[1400px] px-4 sm:px-6 py-5">{children}</main>
    </div>
  );
};

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, profile, loading, signOut, profileError } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  if (loading && !profileError) return <div className="min-h-screen flex items-center justify-center text-[#666]">Загрузка…</div>;
  if (!user) return <Navigate to="/auth" replace state={{ from: loc }} />;
  if (profile?.banned) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-white">
        <div className="border border-[#e6e6e6] rounded-md p-8 max-w-md bg-white shadow-sm">
          <h2 className="text-2xl font-semibold text-[#d32f2f] mb-2">Аккаунт заблокирован</h2>
          <p className="text-[#666] text-sm mb-6">Ваш аккаунт заблокирован. Свяжитесь с поддержкой, если считаете это ошибкой.</p>
          <Button onClick={async () => { await signOut(); nav("/auth"); }} variant="outline">Выйти</Button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

export const AdminRoute = ({ children }: { children: ReactNode }) => {
  const { profile, loading, user, profileError } = useAuth();
  const loc = useLocation();
  if (loading && !profileError) {
    return <div className="min-h-screen flex items-center justify-center text-[#666]">Загрузка…</div>;
  }
  if (!user) return <Navigate to="/crzr-x9k2-panel" replace state={{ from: loc }} />;
  if (profile?.role !== "admin") {
    return <Navigate to="/crzr-x9k2-panel" replace state={{ from: loc, reason: "not-admin" }} />;
  }
  return <>{children}</>;
};

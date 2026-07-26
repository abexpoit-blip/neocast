import { ReactNode, useEffect, useRef, useState } from "react";
import { Link, Navigate, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { LanguageToggle } from "@/lib/i18n";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";


// NeoCast primary navigation — 5 items.
const buyerNav = [
  { to: "/", label: "HOME", end: true },
  { to: "/shop", label: "SHOP" },
  { to: "/cart", label: "CART" },
  { to: "/orders", label: "ORDERS" },
  { to: "/recharge", label: "RECHARGE" },
];

export const AppShell = ({ children }: { children: ReactNode }) => {
  const { profile, signOut, user } = useAuth();
  const settings = useSiteSettings();
  const nav = useNavigate();
  useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const items = buyerNav;

  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const balance = Number(profile?.balance ?? 0).toFixed(2);
  const uname = profile?.username ?? "user";

  return (
    <div
      className="min-h-screen bg-white text-[#1a1a1a] flex flex-col"
      style={{ fontFamily: '"DM Sans", "Segoe UI", system-ui, sans-serif' }}
    >

      {/* TOP NAV */}
      <header className="bg-[#0b1230] text-white sticky top-0 z-40 border-b border-white/10">
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
                      ? "text-[#22d3ee] border-[#22d3ee] bg-white/[0.06]"
                      : "text-[#aab6d6] border-transparent hover:text-white"
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <button
            onClick={() => setDrawerOpen((v) => !v)}
            className="lg:hidden p-2 -ml-2 text-white"
            aria-label="Menu"
          >
            {drawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="text-[13px] font-medium tracking-wide text-white/90 truncate">
            {settings.shop_name}
          </div>
        </div>
        {drawerOpen && (
          <div className="lg:hidden bg-[#0b1230] border-t border-white/10">
            {items.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={(n as any).end}
                onClick={() => setDrawerOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-3 text-sm border-l-2 ${
                    isActive ? "border-[#22d3ee] text-[#22d3ee] bg-white/5" : "border-transparent text-[#aab6d6] hover:bg-white/5"
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
        <div className="mx-auto max-w-[1400px] px-3 sm:px-6 min-h-12 py-1.5 flex flex-wrap items-center justify-end gap-2 sm:gap-3 text-[12px] sm:text-[13px]">
          <LanguageToggle />
          <span className="px-2 sm:px-3 py-1.5 border border-[#e6e6e6] text-[#0e7490] max-w-[120px] sm:max-w-none truncate">


            {uname}
          </span>
          <Link
            to="/recharge"
            className="px-2 sm:px-3 py-1.5 border border-[#e6e6e6] text-[#2fb344] hover:bg-[#f4fbf5] transition font-medium whitespace-nowrap"
          >
            $ {balance}
          </Link>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-1.5 pl-1 pr-2 py-1 hover:bg-[#f7f7f7] transition"
            >
              <span className="h-8 w-8 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#22d3ee] text-white text-xs uppercase font-medium flex items-center justify-center">
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
                  <LogOut className="h-3.5 w-3.5" /> Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="flex-1 mx-auto w-full max-w-[1400px] px-3 sm:px-6 py-4 sm:py-5">{children}</main>

      {/* FOOTER */}
      <footer className="mt-10 bg-[#0b1230] text-white/70 border-t border-white/10">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#4f46e5] to-[#22d3ee] text-white flex items-center justify-center text-sm font-extrabold shadow-[0_8px_24px_-8px_rgba(34,211,238,0.7)]">
                N
              </span>
              <span className="text-white text-[15px] font-bold tracking-tight">{settings.shop_name}</span>
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-white/55 max-w-[260px]">
              A verified marketplace built for speed — vetted stock, instant delivery and secure settlement.
            </p>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-[#67e8f9]/70 font-semibold">Marketplace</div>
            <ul className="mt-3 space-y-2 text-[13px]">
              <li><Link to="/shop" className="hover:text-white transition">Shop</Link></li>
              <li><Link to="/cart" className="hover:text-white transition">Cart</Link></li>
              <li><Link to="/orders" className="hover:text-white transition">Orders</Link></li>
              <li><Link to="/recharge" className="hover:text-white transition">Recharge</Link></li>
            </ul>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-[#67e8f9]/70 font-semibold">Account</div>
            <ul className="mt-3 space-y-2 text-[13px]">
              <li><Link to="/" className="hover:text-white transition">Dashboard</Link></li>
              <li><Link to="/orders" className="hover:text-white transition">Order history</Link></li>
              <li><Link to="/recharge" className="hover:text-white transition">Add funds</Link></li>
            </ul>
          </div>


          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-[#67e8f9]/70 font-semibold">Why NeoCast</div>
            <ul className="mt-3 space-y-2 text-[13px] text-white/60">
              <li>24/7 support</li>
              <li>Instant delivery</li>
              <li>Secure settlement</li>
              <li>Auto-replacement</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-[12px] text-white/45">
            <div>© {new Date().getFullYear()} {settings.shop_name}. All rights reserved.</div>
            <div className="tracking-[0.2em] uppercase text-[10px]">Encrypted · Verified · Instant</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, profile, loading, signOut, profileError } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  // 30-minute session limit — regular users only, admins are exempt.
  useSessionTimeout(Boolean(user) && profile?.role !== "admin");
  if (loading && !profileError) return <div className="min-h-screen flex items-center justify-center text-[#666]">Loading…</div>;

  if (!user) return <Navigate to="/auth" replace state={{ from: loc }} />;
  if (profile?.banned) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-white">
        <div className="border border-[#e6e6e6] rounded-md p-8 max-w-md bg-white shadow-sm">
          <h2 className="text-2xl font-semibold text-[#d32f2f] mb-2">Account blocked</h2>
          <p className="text-[#666] text-sm mb-6">Your account has been blocked. Contact support if you believe this is a mistake.</p>
          <Button onClick={async () => { await signOut(); nav("/auth"); }} variant="outline">Log out</Button>
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
    return <div className="min-h-screen flex items-center justify-center text-[#666]">Loading…</div>;
  }
  if (!user) return <Navigate to="/crzr-x9k2-panel" replace state={{ from: loc }} />;
  if (profile?.role !== "admin") {
    return <Navigate to="/crzr-x9k2-panel" replace state={{ from: loc, reason: "not-admin" }} />;
  }
  return <>{children}</>;
};

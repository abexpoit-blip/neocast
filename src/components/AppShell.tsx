import { ReactNode, useEffect, useRef, useState } from "react";
import { Link, Navigate, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { NeoCastLoader } from "@/components/NeoCastLoader";


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
      <header className="bg-[#141414] text-white sticky top-0 z-40 border-b-2 border-[#c62828]">
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
                      ? "text-white border-[#c62828] bg-[#c62828]"
                      : "text-white/70 border-transparent hover:text-white hover:bg-white/[0.06]"
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
          <div className="lg:hidden bg-[#141414] border-t border-white/10">
            {items.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={(n as any).end}
                onClick={() => setDrawerOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-3 text-sm border-l-2 ${
                    isActive ? "border-[#c62828] text-white bg-[#c62828]/80" : "border-transparent text-white/70 hover:bg-white/5"
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {/* ACCOUNT BAR */}
      <div className="bg-[#1c1c1c] border-b border-[#2a2a2a]">
        <div className="mx-auto max-w-[1400px] px-3 sm:px-6 min-h-14 py-2 flex flex-wrap items-center justify-end gap-2 sm:gap-3 text-[12px] sm:text-[13px]">
          {/* balance card */}
          <div className="flex items-stretch rounded-md overflow-hidden border border-[#333] bg-[#141414]">
            <div className="flex items-center gap-2 px-3 py-1.5">
              <Wallet className="h-4 w-4 text-[#c62828]" />
              <div className="leading-tight">
                <div className="text-[9px] uppercase tracking-[0.18em] text-white/40">Balance</div>
                <div className="text-[14px] font-semibold text-white tabular-nums">${balance}</div>
              </div>
            </div>
            <Link
              to="/recharge"
              className="flex items-center gap-1 px-3 bg-[#c62828] hover:bg-[#b02121] text-white text-[11px] font-semibold uppercase tracking-wide transition"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </Link>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-md border border-[#333] bg-[#141414] hover:border-[#c62828]/60 transition"
            >
              <span className="h-8 w-8 rounded-md bg-gradient-to-br from-[#c62828] to-[#7f1414] text-white text-xs uppercase font-bold flex items-center justify-center">
                {uname.slice(0, 2)}
              </span>
              <span className="hidden sm:block text-left leading-tight">
                <span className="block text-[13px] text-white font-medium max-w-[130px] truncate">{uname}</span>
                <span className="block text-[9px] uppercase tracking-[0.18em] text-[#c62828]">
                  {profile?.role === "admin" ? "Administrator" : "Verified buyer"}
                </span>
              </span>
              <ChevronDown className={`h-3.5 w-3.5 text-white/50 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-lg overflow-hidden bg-[#141414] border border-[#2f2f2f] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.8)] z-20 text-sm">
                <div className="px-4 py-3 border-b border-[#2a2a2a] bg-gradient-to-r from-[#c62828]/15 to-transparent">
                  <div className="text-white font-semibold truncate">{uname}</div>
                  <div className="text-[11px] text-white/45 truncate">{profile?.email ?? user?.email ?? "—"}</div>
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-[#2fb344]">
                    <ShieldCheck className="h-3.5 w-3.5" /> Account active
                  </div>
                </div>
                <div className="px-4 py-3 border-b border-[#2a2a2a] flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-[0.16em] text-white/40">Balance</span>
                  <span className="text-[15px] font-semibold text-white tabular-nums">${balance}</span>
                </div>
                <Link to="/orders" onClick={() => setMenuOpen(false)} className="px-4 py-2.5 flex items-center gap-2 text-white/75 hover:bg-white/5 hover:text-white transition">
                  <ClipboardList className="h-4 w-4" /> My orders
                </Link>
                <Link to="/recharge" onClick={() => setMenuOpen(false)} className="px-4 py-2.5 flex items-center gap-2 text-white/75 hover:bg-white/5 hover:text-white transition">
                  <Wallet className="h-4 w-4" /> Add funds
                </Link>
                <button
                  onClick={async () => { setMenuOpen(false); await signOut(); nav("/auth"); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#c62828]/15 flex items-center gap-2 text-[#ef5350] border-t border-[#2a2a2a] transition"
                >
                  <LogOut className="h-4 w-4" /> Log out
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
  if (loading && !profileError) return <NeoCastLoader />;

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
    return <NeoCastLoader />;
  }
  if (!user) return <Navigate to="/crzr-x9k2-panel" replace state={{ from: loc }} />;
  if (profile?.role !== "admin") {
    return <Navigate to="/crzr-x9k2-panel" replace state={{ from: loc, reason: "not-admin" }} />;
  }
  return <>{children}</>;
};

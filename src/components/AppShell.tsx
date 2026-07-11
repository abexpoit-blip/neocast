import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Menu, X, Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { BuildBadge } from "@/components/BuildBadge";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { cartApi, announcementsApi } from "@/lib/api";

// Scorpion-style navigation. Role-aware.
const buyerNav = [
  { to: "/", label: "HOME", end: true },
  { to: "/shop", label: "SHOP" },
  { to: "/super-shop", label: "SUPER SHOP" },
  { to: "/cart", label: "CART" },
  { to: "/orders", label: "ORDER" },
  { to: "/recharge", label: "RECHARGE CENTER" },
  { to: "/news", label: "NEWS" },
  { to: "/refunds", label: "REFUNDS" },
  { to: "/tickets", label: "SUPPORT" },
];

export const AppShell = ({ children }: { children: ReactNode }) => {
  const { profile, signOut, user } = useAuth();
  const settings = useSiteSettings();
  const nav = useNavigate();
  const loc = useLocation();
  const role = profile?.role ?? "buyer";
  const isAdmin = role === "admin";
  const isSeller = role === "seller" || isAdmin;

  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [announcements, setAnnouncements] = useState<Array<{ id: string; title: string; body: string; created_at: string }>>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const items = [...buyerNav];
  if (isSeller) items.push({ to: "/seller", label: "SELLER" });
  if (isAdmin) items.push({ to: "/admin", label: "ADMIN" });

  const loadCart = useCallback(async () => {
    if (!user) return;
    try { const { items } = await cartApi.list(); setCartCount((items ?? []).length); } catch { /* ignore */ }
  }, [user]);

  const loadAnn = useCallback(async () => {
    try { const r = await announcementsApi.list(); setAnnouncements((r.announcements ?? []).slice(0, 10) as any); } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadCart(); loadAnn(); }, [loadCart, loadAnn]);
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
  const uname = profile?.username ?? "member";

  return (
    <div
      className="min-h-screen bg-white text-[#1a1a1a] flex flex-col"
      style={{ fontFamily: '"DM Sans", "Segoe UI", system-ui, sans-serif' }}
    >
      <ImpersonationBanner />
      <BuildBadge />

      {/* TOP NAV */}
      <header className="bg-[#1f2d3d] text-white sticky top-0 z-40">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 h-12 flex items-center justify-between gap-6">
          <nav className="hidden lg:flex items-center h-full text-[13px] tracking-wide">
            {items.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={(n as any).end}
                className={({ isActive }) =>
                  `h-full px-3.5 flex items-center transition-colors border-b-2 relative ${
                    isActive
                      ? "text-[#4fc3f7] border-[#4fc3f7]"
                      : "text-white/85 border-transparent hover:text-white"
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
            aria-label="Menu"
          >
            {drawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="text-[13px] font-medium tracking-wide text-white/90 truncate">
            {settings.shop_name}
          </div>
        </div>
        {drawerOpen && (
          <div className="lg:hidden bg-[#1f2d3d] border-t border-white/10">
            {items.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={(n as any).end}
                onClick={() => setDrawerOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-3 text-sm border-l-2 ${
                    isActive ? "border-[#4fc3f7] text-[#4fc3f7] bg-white/5" : "border-transparent text-white/85 hover:bg-white/5"
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
          <div className="relative">
            <button
              onClick={() => setShowNotifs((v) => !v)}
              className="p-2 text-[#666] hover:text-[#1f2d3d] transition relative"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {announcements.length > 0 && (
                <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[#e53935]" />
              )}
            </button>
            {showNotifs && (
              <div className="absolute right-0 top-full mt-1 w-80 max-h-96 overflow-y-auto bg-white border border-[#e6e6e6] shadow-lg z-20 text-sm">
                <div className="p-3 border-b border-[#eee] flex items-center justify-between">
                  <span className="font-medium text-[#333]">Notifications</span>
                  <button onClick={() => setShowNotifs(false)} className="text-[#888] hover:text-[#333]"><X className="h-4 w-4" /></button>
                </div>
                {announcements.length === 0 ? (
                  <div className="p-6 text-center text-[#888]">No notifications</div>
                ) : (
                  <div className="divide-y divide-[#eee]">
                    {announcements.map((a) => (
                      <div key={a.id} className="p-3 hover:bg-[#f7f7f7]">
                        <p className="font-medium text-[#333]">{a.title}</p>
                        <p className="text-xs text-[#666] mt-0.5 line-clamp-2">{a.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <Link
            to="/settings"
            className="px-3 py-1.5 border border-[#e6e6e6] text-[#2196f3] hover:bg-[#f5faff] transition"
          >
            {uname}
          </Link>
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
              <span className="h-8 w-8 rounded-full bg-[#1f2d3d] text-white text-xs uppercase font-medium flex items-center justify-center">
                {uname.slice(0, 2)}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-[#666]" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-[#e6e6e6] shadow-md z-10 text-sm">
                <div className="px-3 py-2 border-b border-[#eee] text-[#333]">
                  <div className="font-medium truncate">{uname}</div>
                  <div className="text-[11px] text-[#888]">Balance: ${balance}</div>
                </div>
                <Link to="/settings" className="block px-3 py-2 hover:bg-[#f7f7f7]" onClick={() => setMenuOpen(false)}>Settings</Link>
                <Link to="/tickets" className="block px-3 py-2 hover:bg-[#f7f7f7]" onClick={() => setMenuOpen(false)}>Tickets</Link>
                {isSeller && (
                  <Link to="/seller" className="block px-3 py-2 hover:bg-[#f7f7f7]" onClick={() => setMenuOpen(false)}>Seller Panel</Link>
                )}
                {isAdmin && (
                  <Link to="/admin" className="block px-3 py-2 hover:bg-[#f7f7f7]" onClick={() => setMenuOpen(false)}>Admin</Link>
                )}
                <button
                  onClick={async () => { setMenuOpen(false); await signOut(); nav("/auth"); }}
                  className="w-full text-left px-3 py-2 hover:bg-[#f7f7f7] flex items-center gap-2 text-[#d32f2f]"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="flex-1 mx-auto w-full max-w-[1400px] px-4 sm:px-6 py-5">{children}</main>

      {/* FOOTER */}
      <footer className="border-t border-[#e6e6e6] bg-[#fafafa] mt-10">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6 text-center text-[11px] text-[#888]">
          © {new Date().getFullYear()} {settings.shop_name} · All rights reserved
        </div>
      </footer>
    </div>
  );
};

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, profile, loading, signOut, profileError } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  if (loading && !profileError) return <div className="min-h-screen flex items-center justify-center text-[#666]">Loading…</div>;
  if (!user) return <Navigate to="/auth" replace state={{ from: loc }} />;
  if (profile?.banned) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-white">
        <div className="border border-[#e6e6e6] rounded-md p-8 max-w-md bg-white shadow-sm">
          <h2 className="text-2xl font-semibold text-[#d32f2f] mb-2">Account Suspended</h2>
          <p className="text-[#666] text-sm mb-6">Your account has been banned. Contact support if you believe this is a mistake.</p>
          <Button onClick={async () => { await signOut(); nav("/auth"); }} variant="outline">Sign out</Button>
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

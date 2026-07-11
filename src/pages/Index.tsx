import { useEffect, useState, useRef, useCallback } from "react";
import { Link, NavLink } from "react-router-dom";
import { newsApi, announcementsApi, ordersApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import Seo from "@/components/Seo";
import { ChevronDown, LogOut } from "lucide-react";

/**
 * Buyer HOME dashboard — Scorpion-style layout:
 *  - Dark navy top nav (HOME, SHOP, CAR, ORDER, RECHARGE CENTER)
 *  - Balance chip + avatar top-right
 *  - Two columns: News & Updates (left) + Announcement (right)
 *  - Below: Shop Rules + Contact Information
 */

const NAV = [
  { to: "/", label: "HOME", end: true },
  { to: "/shop", label: "SHOP" },
  { to: "/cart", label: "CAR" },
  { to: "/orders", label: "ORDER" },
  { to: "/recharge", label: "RECHARGE CENTER" },
];

const Index = () => {
  const { profile, signOut } = useAuth();
  const [news, setNews] = useState<{ id: string; label: string; count: number }[]>([]);
  const [anns, setAnns] = useState<{ id: string; title: string; body: string }[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const loadNews = useCallback(async () => {
    try {
      const res = await newsApi.list();
      setNews((res.updates ?? []) as typeof news);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    (async () => {
      const [, a] = await Promise.allSettled([
        loadNews(),
        announcementsApi.list(),
        ordersApi.mine().catch(() => null),
      ]);
      if (a.status === "fulfilled" && a.value)
        setAnns((a.value.announcements ?? []) as typeof anns);
    })();
  }, [loadNews]);

  useEffect(() => {
    intervalRef.current = setInterval(loadNews, 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [loadNews]);

  const balance = Number(profile?.balance ?? 0).toFixed(2);
  const uname = profile?.username ?? "member";

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]" style={{ fontFamily: '"DM Sans", "Segoe UI", system-ui, sans-serif' }}>
      <Seo title="Scorpion-Shop — Home" description="Buyer dashboard, live stock feed and announcements." path="/" />

      {/* TOP NAV */}
      <header className="bg-[#1f2d3d] text-white">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 h-12 flex items-center gap-6">
          <nav className="flex items-center gap-1 h-full text-[13px] tracking-wide">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `h-full px-4 flex items-center transition-colors border-b-2 ${
                    isActive
                      ? "text-[#4fc3f7] border-[#4fc3f7]"
                      : "text-white/85 border-transparent hover:text-white"
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* SUB BAR — balance + user */}
      <div className="bg-white border-b border-[#e6e6e6]">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 h-12 flex items-center justify-end gap-3 text-[13px]">
          <Link
            to="/recharge"
            className="px-3 py-1.5 border border-[#e6e6e6] text-[#2196f3] hover:bg-[#f5faff] transition"
          >
            Samexpoit
          </Link>
          <Link
            to="/recharge"
            className="px-3 py-1.5 border border-[#e6e6e6] text-[#2fb344] hover:bg-[#f4fbf5] transition font-medium"
          >
            $ {balance}
          </Link>
          <div className="relative">
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
                <Link to="/settings" className="block px-3 py-2 hover:bg-[#f7f7f7]" onClick={() => setMenuOpen(false)}>
                  Settings
                </Link>
                <Link to="/tickets" className="block px-3 py-2 hover:bg-[#f7f7f7]" onClick={() => setMenuOpen(false)}>
                  Tickets
                </Link>
                <button
                  onClick={() => { setMenuOpen(false); signOut(); }}
                  className="w-full text-left px-3 py-2 hover:bg-[#f7f7f7] flex items-center gap-2 text-[#d32f2f]"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MAIN */}
      <main className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* NEWS & UPDATES */}
          <Panel title="News & Updates">
            <div className="max-h-[420px] overflow-y-auto py-3 text-center font-mono text-[15px] leading-[2.1] text-[#d32f2f]">
              {news.length === 0 && (
                <div className="text-[#888] font-sans text-sm py-6">No updates yet.</div>
              )}
              {news.map((n) => (
                <div key={n.id}>
                  {n.label}
                  {n.count ? `,COUNT:${n.count}` : ""}
                </div>
              ))}
            </div>
          </Panel>

          {/* ANNOUNCEMENT */}
          <Panel title="Announcement">
            <div className="px-6 py-6 space-y-6 text-center max-h-[420px] overflow-y-auto">
              {anns.length === 0 && (
                <div className="text-[#888] text-sm py-6">No announcements.</div>
              )}
              {anns.map((a, i) => (
                <div key={a.id}>
                  <h3
                    className={`text-lg font-semibold mb-2 ${
                      i === 0 ? "text-[#8e24aa]" : "text-[#d32f2f]"
                    }`}
                  >
                    {a.title}
                  </h3>
                  <p className="text-[14px] text-[#333] leading-[1.75] whitespace-pre-line">
                    {a.body}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* SHOP RULES + CONTACT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
          <Panel title="Scorpion-Shop Rules">
            <ul className="px-6 py-5 space-y-2 text-[13px] text-[#1976d2]">
              {[
                "By registering, you automatically agree to the rules of the store.",
                "Rules can be changed without notifying users.",
                "If you find bugs or vulnerabilities, report them via tickets.",
                "If you intentionally exploit bugs or vulnerabilities for profit, your account will be permanently banned.",
                "After buying, save the cards immediately — orders cannot be recovered after deletion.",
                "Account balance is non-refundable. Recharge responsibly.",
              ].map((r, i) => (
                <li key={i}>{i + 1}. {r}</li>
              ))}
            </ul>
          </Panel>

          <Panel title="Contact Information">
            <div className="px-6 py-5 space-y-3 text-[13px] text-[#333]">
              <p>Please be aware of fake Scorpion-Shop support. For any suggestion or problems, tell us on TG.</p>
              <div>
                <div className="text-[#888] text-xs mb-1">Telegram:</div>
                <a
                  href="https://t.me/scorpionccstore02"
                  target="_blank"
                  rel="noreferrer"
                  className="block text-[#1976d2] hover:underline"
                >
                  @scorpionccstore02
                </a>
              </div>
              <div>
                <div className="text-[#888] text-xs mb-1">Telegram channel:</div>
                <a
                  href="https://t.me/scorpionccstore02"
                  target="_blank"
                  rel="noreferrer"
                  className="block text-[#1976d2] hover:underline"
                >
                  @scorpionccstore02
                </a>
              </div>
            </div>
          </Panel>
        </div>
      </main>
    </div>
  );
};

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-[#e6e6e6]">
      <header className="px-5 py-3 border-b border-[#eee] text-center">
        <h2 className="text-[15px] font-medium text-[#1a1a1a]">{title}</h2>
      </header>
      <div>{children}</div>
    </section>
  );
}

export default Index;

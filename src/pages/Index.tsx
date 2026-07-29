import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { newsApi, announcementsApi, ordersApi } from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import Seo from "@/components/Seo";
import { useAuth } from "@/hooks/useAuth";
import {
  Activity, Megaphone, ShieldCheck, MessageCircle, ArrowRight,
  Zap, Layers, RefreshCw, Send,
} from "lucide-react";

/**
 * Buyer HOME — NeoCast premium layout.
 * Live stock feed + announcements + rules + contact.
 */

const Index = () => {
  const { profile } = useAuth();
  const [news, setNews] = useState<{ id: string; label: string; count: number }[]>([]);
  const [anns, setAnns] = useState<{ id: string; title: string; body: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadNews = useCallback(async () => {
    try {
      const res = await newsApi.list();
      setNews((res.updates ?? []) as typeof news);
      setUpdatedAt(new Date());
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
      setLoading(false);
    })();
  }, [loadNews]);

  useEffect(() => {
    intervalRef.current = setInterval(loadNews, 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [loadNews]);

  const totalStock = news.reduce((s, n) => s + (Number(n.count) || 0), 0);

  return (
    <AppShell>
      <Seo title="NeoCast — Home" description="Buyer dashboard, live stock feed and announcements." path="/" />

      {/* HERO */}
      <section className="rounded-xl overflow-hidden bg-[var(--nc-ink)] border border-[var(--nc-line)] relative mb-5">
        <div className="absolute -top-20 -right-16 h-64 w-64 rounded-full bg-[var(--nc-accent)]/25 blur-3xl" />
        <div className="relative px-5 sm:px-7 py-6 flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-[#ef5350] font-semibold">Welcome back</div>
            <h1 className="mt-1.5 text-white text-[22px] sm:text-[27px] font-bold tracking-tight">
              {profile?.username ?? "buyer"}
            </h1>
            <p className="mt-1 text-[12.5px] text-white/50 max-w-lg leading-relaxed">
              Fresh stock is pushed to the shop around the clock. Track new drops in the live feed below.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/shop" className="inline-flex items-center gap-1.5 px-4 h-9 rounded-md bg-[var(--nc-accent)] hover:bg-[#b02121] text-white text-[12px] font-semibold uppercase tracking-wide transition">
                Browse shop <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link to="/recharge" className="inline-flex items-center gap-1.5 px-4 h-9 rounded-md border border-[#3a3a3a] text-white/80 hover:text-white hover:border-[var(--nc-accent)] text-[12px] font-semibold uppercase tracking-wide transition">
                Add funds
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2.5 lg:min-w-[380px]">
            <Stat icon={<Zap className="h-4 w-4" />} label="Balance" value={`$${Number(profile?.balance ?? 0).toFixed(2)}`} />
            <Stat icon={<Layers className="h-4 w-4" />} label="Live items" value={totalStock ? String(totalStock) : "—"} />
            <Stat icon={<Activity className="h-4 w-4" />} label="Feeds" value={String(news.length)} />
          </div>
        </div>
        <div className="h-[3px] bg-gradient-to-r from-[var(--nc-accent)] via-[#ef5350] to-transparent" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* LIVE STOCK FEED */}
        <Panel
          title="Live stock feed"
          icon={<Activity className="h-4 w-4" />}
          right={
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-[#2fb344]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#2fb344] opacity-70 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2fb344]" />
              </span>
              Live
            </span>
          }
        >
          <div className="max-h-[420px] overflow-y-auto divide-y divide-[#f0f0f0]">
            {loading && Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-4 py-3">
                <div className="h-3 bg-[#f0f0f0] animate-pulse rounded" style={{ width: `${55 + (i % 3) * 14}%` }} />
              </div>
            ))}
            {!loading && news.length === 0 && (
              <div className="px-4 py-10 text-center text-[13px] text-[#888]">No updates yet.</div>
            )}
            {!loading && news.map((n) => (
              <div key={n.id} className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-[#fafafa] transition group">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--nc-accent)] shrink-0" />
                  <span className="text-[13px] text-[#222] truncate font-medium">{n.label}</span>
                </div>
                {n.count ? (
                  <span className="shrink-0 text-[11px] font-semibold tabular-nums px-2 py-0.5 rounded border border-[#f2caca] bg-[#fdf2f2] text-[var(--nc-accent)]">
                    {n.count} pcs
                  </span>
                ) : null}
              </div>
            ))}
          </div>
          <div className="px-4 py-2.5 border-t border-[#eee] flex items-center justify-between text-[11px] text-[#999]">
            <span className="inline-flex items-center gap-1.5">
              <RefreshCw className="h-3 w-3" /> Auto-refresh · 30s
            </span>
            <span>{updatedAt ? `Updated ${updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}</span>
          </div>
        </Panel>

        {/* ANNOUNCEMENTS */}
        <Panel title="Announcements" icon={<Megaphone className="h-4 w-4" />}>
          <div className="px-5 py-5 space-y-4 max-h-[420px] overflow-y-auto">
            {anns.length === 0 ? (
              <div className="rounded-lg border border-[#eee] bg-[#fafafa] p-5 text-center">
                <h3 className="text-[15px] font-semibold text-[#1a1a1a]">Welcome to NeoCast</h3>
                <p className="mt-1.5 text-[13px] text-[#666] leading-relaxed">
                  Follow the official channel so you never miss a drop or an update.
                </p>
              </div>
            ) : (
              anns.map((a) => (
                <article key={a.id} className="rounded-lg border border-[#eee] bg-white p-4 border-l-[3px] border-l-[var(--nc-accent)]">
                  <h3 className="text-[14px] font-semibold text-[#1a1a1a]">{a.title}</h3>
                  <p className="mt-1.5 text-[13px] text-[#555] leading-[1.75] whitespace-pre-line">{a.body}</p>
                </article>
              ))
            )}
          </div>
        </Panel>
      </div>

      {/* RULES + CONTACT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
        <Panel title="Shop rules" icon={<ShieldCheck className="h-4 w-4" />}>
          <ul className="px-5 py-4 space-y-2.5 text-[13px] text-[#444] leading-[1.7]">
            {[
              "By registering you automatically accept the shop rules.",
              "Rules may change without prior notice.",
              "Found a bug or vulnerability? Report it through tickets.",
              "Intentional abuse of bugs for profit leads to a permanent ban.",
              "After clearing the purchases section, data cannot be restored — keep your own copies.",
              "If you lose access to your account, access is lost forever.",
              "Top up wisely. Balance funds are non-refundable.",
              "The shop is not responsible for how you use information from this resource.",
            ].map((r) => (
              <li key={r} className="flex gap-2.5">
                <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-[var(--nc-accent)] shrink-0" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Contact information" icon={<MessageCircle className="h-4 w-4" />}>
          <div className="px-5 py-4 space-y-4 text-[13px] text-[#444] leading-[1.7]">
            <p className="rounded-lg bg-[#fdf2f2] border border-[#f2caca] px-3.5 py-2.5 text-[var(--nc-accent)]">
              Beware of fake NeoCast support. We never message you first.
            </p>
            <div className="grid gap-2.5">
              <a href="https://t.me/zoru_support" target="_blank" rel="noreferrer"
                className="flex items-center justify-between rounded-lg border border-[#eee] px-3.5 py-3 hover:border-[var(--nc-accent)]/50 hover:bg-[#fafafa] transition group">
                <span className="flex items-center gap-2.5">
                  <span className="h-8 w-8 rounded-md bg-[var(--nc-ink-2)] text-white flex items-center justify-center"><Send className="h-4 w-4" /></span>
                  <span>
                    <span className="block text-[10px] uppercase tracking-[0.18em] text-[#999]">Support</span>
                    <span className="block text-[13px] font-medium text-[#1a1a1a]">@zoru_support</span>
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 text-[#bbb] group-hover:text-[var(--nc-accent)] transition" />
              </a>
              <a href="https://t.me/zoru_shop" target="_blank" rel="noreferrer"
                className="flex items-center justify-between rounded-lg border border-[#eee] px-3.5 py-3 hover:border-[var(--nc-accent)]/50 hover:bg-[#fafafa] transition group">
                <span className="flex items-center gap-2.5">
                  <span className="h-8 w-8 rounded-md bg-[var(--nc-ink-2)] text-white flex items-center justify-center"><Megaphone className="h-4 w-4" /></span>
                  <span>
                    <span className="block text-[10px] uppercase tracking-[0.18em] text-[#999]">Channel</span>
                    <span className="block text-[13px] font-medium text-[#1a1a1a]">t.me/zoru_shop</span>
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 text-[#bbb] group-hover:text-[var(--nc-accent)] transition" />
              </a>
            </div>
            <p className="text-[12.5px] text-[var(--nc-accent)] font-semibold">Sellers are welcome to join the platform.</p>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
};

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#333] bg-[var(--nc-ink-2)] px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[#ef5350]">{icon}</div>
      <div className="mt-1.5 text-[16px] font-bold text-white tabular-nums truncate">{value}</div>
      <div className="text-[9px] uppercase tracking-[0.18em] text-white/40">{label}</div>
    </div>
  );
}

function Panel({ title, icon, right, children }: { title: string; icon?: React.ReactNode; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-[#e6e6e6] rounded-lg overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <header className="px-4 h-11 bg-[var(--nc-ink-2)] border-b-2 border-[var(--nc-accent)] flex items-center justify-between">
        <h2 className="text-[12.5px] font-medium text-white/85 uppercase tracking-[0.14em] flex items-center gap-2">
          <span className="text-[#ef5350]">{icon}</span>{title}
        </h2>
        {right}
      </header>
      <div>{children}</div>
    </section>
  );
}

export default Index;

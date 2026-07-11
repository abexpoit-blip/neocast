import { useEffect, useState, useRef, useCallback } from "react";
import { newsApi, announcementsApi, ordersApi } from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import Seo from "@/components/Seo";

/**
 * Buyer HOME — Scorpion-style layout copy:
 *   - News & Updates (left) + Announcement (right)
 *   - Scorpion Shop Rules + Contact Information
 */

const Index = () => {
  const [news, setNews] = useState<{ id: string; label: string; count: number }[]>([]);
  const [anns, setAnns] = useState<{ id: string; title: string; body: string }[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  return (
    <AppShell>
      <Seo title="Scorpion-Shop — Home" description="Buyer dashboard, live stock feed and announcements." path="/" />

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
            {anns.length === 0 ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#8e24aa] mb-2">
                    Old channel has been banned.<br />follow new channel instead
                  </h3>
                  <a
                    href="https://t.me/scorpionccstore02"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#8e24aa] font-semibold text-lg hover:underline"
                  >
                    https://t.me/scorpionccstore02
                  </a>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#d32f2f] mb-2">Recharge Promotion Notice</h3>
                  <p className="text-[14px] text-[#d32f2f] font-semibold leading-[1.9]">
                    One-time recharge of $500, $35 bonus. One-time recharge of $1000, $100 bonus.
                  </p>
                  <p className="text-[14px] text-[#d32f2f] font-semibold leading-[1.9] mt-2">
                    One-time recharge of $2000, $240 bonus. One-time recharge of $5000, $750 bonus.
                  </p>
                </div>
              </div>
            ) : (
              anns.map((a, i) => (
                <div key={a.id}>
                  <h3 className={`text-lg font-semibold mb-2 ${i === 0 ? "text-[#8e24aa]" : "text-[#d32f2f]"}`}>
                    {a.title}
                  </h3>
                  <p className="text-[14px] text-[#333] leading-[1.75] whitespace-pre-line">
                    {a.body}
                  </p>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>

      {/* SHOP RULES + CONTACT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
        <Panel title="Scorpion Shop Rules">
          <div className="px-6 py-5 text-[13px] text-[#333] border-l-2 border-[#e6e6e6] ml-3 space-y-2 leading-[1.7]">
            <p>By registering, you automatically agree to the rules of the store.</p>
            <p>Rules can be changed without notifying users.</p>
            <p>If you find bugs or vulnerabilities, report them via tickets.</p>
            <p>If you intentionally exploit bugs or vulnerabilities for profit, your account will be permanently banned.</p>
            <p>After cleaning the section of your purchases, the administration will not be able to return the purchased cards to you. Save cards to your devices.</p>
            <p>If you lose access to your account, the administration will not be able to restore your data and access will be lost forever.</p>
            <p>Please recharge your account reasonably. The user balance is not refundable.</p>
            <p>The Owners of this SHOP will take NO responsibility for the way you use the information on this SHOP.</p>
          </div>
        </Panel>

        <Panel title="Contact Information">
          <div className="px-6 py-5 space-y-3 text-[13px] text-[#333] border-l-2 border-[#e6e6e6] ml-3 leading-[1.7]">
            <p>Please be aware from fake Scorpion support , For any suggestion or problems, tell us in TG</p>
            <div>
              <div className="text-[#333] mb-1">Telegram:</div>
              <a href="https://t.me/Scorpion_ccsale" target="_blank" rel="noreferrer" className="block text-[#1976d2] hover:underline">
                @Scorpion_ccsale
              </a>
              <a href="https://t.me/scorpioncc_shop_002" target="_blank" rel="noreferrer" className="block text-[#1976d2] hover:underline">
                @scorpioncc_shop_002
              </a>
            </div>
            <div>
              <div className="text-[#333] mb-1">Telegram channel:</div>
              <a href="https://t.me/scorpionccstore02" target="_blank" rel="noreferrer" className="block text-[#1976d2] hover:underline">
                https://t.me/scorpionccstore02
              </a>
            </div>
            <p className="text-[#d32f2f] font-semibold pt-2">Welcome cvv sellers to join our platform</p>
          </div>
        </Panel>
      </div>
    </AppShell>
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

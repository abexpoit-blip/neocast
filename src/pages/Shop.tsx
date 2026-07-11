import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ScorpionShell } from "@/components/ScorpionShell";
import { cardsApi, cartApi, sellersApi, categoriesApi } from "@/lib/api";
import { Search, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

import Seo from "@/components/Seo";

interface Card {
  id: string; bin: string; brand: string; country: string; state: string | null;
  city: string | null; zip: string | null; exp_month: string | null; exp_year: string | null;
  refundable: boolean; has_phone: boolean; has_email: boolean; email?: string | null; base: string; price: number;
  status: string; seller_id: string; created_at: string;
}
interface Seller {
  id: string; username: string; seller_display_name: string | null; display_name: string | null;
  is_seller_verified: boolean;
}

const Shop = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cards, setCards] = useState<Card[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);
  const [bin, setBin] = useState("");
  const [base, setBase] = useState("all");
  const [country, setCountry] = useState("");
  const [zip, setZip] = useState("");
  const [seller, setSeller] = useState<string>(searchParams.get("seller") ?? "all");
  const [categoryId, setCategoryId] = useState<string>(searchParams.get("category") ?? "all");
  const [cartIds, setCartIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lastBin, setLastBin] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCards, setTotalCards] = useState(0);
  const [bases, setBases] = useState<string[]>([]);

  const sellerMap = useMemo(() => {
    const m = new Map<string, Seller>();
    sellers.forEach((s) => m.set(s.id, s));
    return m;
  }, [sellers]);

  useEffect(() => {
    (async () => {
      try { const r = await sellersApi.visible(); setSellers((r.sellers ?? []) as any); } catch { /* noop */ }
      try { const r = await cardsApi.bases(); setBases(r.bases ?? []); } catch { /* noop */ }
      try { const r = await categoriesApi.list(); setCategories(r.categories ?? []); } catch { /* noop */ }
    })();
  }, []);

  const load = useCallback(async (auto = false, p = page) => {
    setLoading(true);
    try {
      const params: Record<string, string | number | boolean | undefined> = {
        per_page: 25, page: p, sort: "expiry_asc",
      };
      if (bin) params.bin = bin;
      if (base !== "all") params.base = base;
      if (country) params.country = country;
      if (zip) params.zip = zip;
      if (seller !== "all") params.seller_id = seller;
      if (categoryId !== "all") params.category_id = categoryId;
      const res = await cardsApi.browse(params);
      setCards((res.cards ?? []) as Card[]);
      setTotalPages(res.pages ?? 1);
      setTotalCards(res.total ?? 0);
    } catch { setCards([]); }
    setLastBin(bin);
    setLoading(false);
    if (!auto) setSearched(true);
  }, [bin, base, country, zip, seller, categoryId, page]);

  const loadCart = async () => {
    if (!user) return;
    try {
      const { items } = await cartApi.list();
      setCartIds(new Set((items ?? []).map((c) => c.card_id).filter((x): x is string => !!x)));
    } catch { /* ignore */ }
  };

  useEffect(() => { load(true, 1); loadCart(); }, []); // eslint-disable-line

  useEffect(() => {
    if (seller === "all") searchParams.delete("seller"); else searchParams.set("seller", seller);
    if (categoryId === "all") searchParams.delete("category"); else searchParams.set("category", categoryId);
    setSearchParams(searchParams, { replace: true });
    setPage(1); load(true, 1);
  }, [seller, categoryId]); // eslint-disable-line

  useEffect(() => { load(true, page); }, [page]); // eslint-disable-line

  useEffect(() => {
    if (bin.length >= 6) {
      const t = setTimeout(() => { setPage(1); load(false, 1); }, 350);
      return () => clearTimeout(t);
    }
  }, [bin]); // eslint-disable-line

  const addToCart = async (cardId: string) => {
    if (!user) return toast.error("Please log in");
    try {
      await cartApi.add({ card_id: cardId });
      setCartIds((s) => new Set(s).add(cardId));
      window.dispatchEvent(new Event("cart-updated"));
      toast.success("Added to cart");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  const batchAdd = async () => {
    if (!user) return toast.error("Please log in");
    if (selected.size === 0) return toast.error("Select cards first");
    const ids = Array.from(selected).filter((id) => !cartIds.has(id));
    if (!ids.length) return toast.error("Already in cart");
    try {
      await cartApi.addBatch(ids);
      setCartIds((s) => { const n = new Set(s); ids.forEach((id) => n.add(id)); return n; });
      setSelected(new Set());
      window.dispatchEvent(new Event("cart-updated"));
      toast.success(`Added ${ids.length} to cart`);
      nav("/cart");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  const reset = () => {
    setBin(""); setBase("all"); setCountry(""); setZip(""); setSeller("all"); setCategoryId("all");
    setSearched(false); setPage(1); setTimeout(() => load(true, 1), 0);
  };

  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected((s) => s.size === cards.length ? new Set() : new Set(cards.map((c) => c.id)));

  const noResults = !loading && cards.length === 0 && (searched || bin.length >= 6);

  return (
    <></>
    <ScorpionShell>
      <Seo title="Shop — cruzercc.shop" description="Browse live stock. Filter by BIN, base, country, ZIP." path="/shop" />

      {/* FILTER BAR */}
      <div className="bg-white border border-[#e6e6e6] px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px]">
        <Field label="BIN">
          <input
            value={bin}
            onChange={(e) => setBin(e.target.value.replace(/\D/g, "").slice(0, 16))}
            placeholder="Please enter the card number"
            className="h-8 w-[190px] border border-[#dcdcdc] px-2 text-[13px] font-mono outline-none focus:border-[#4fc3f7]"
          />
        </Field>
        <Field label="BASE">
          <select
            value={base}
            onChange={(e) => { setBase(e.target.value); setPage(1); setTimeout(() => load(true, 1), 0); }}
            className="h-8 w-[170px] border border-[#dcdcdc] px-2 text-[13px] outline-none bg-white focus:border-[#4fc3f7]"
          >
            <option value="all">base</option>
            {bases.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="COUNTRY">
          <input
            value={country}
            onChange={(e) => setCountry(e.target.value.toUpperCase())}
            placeholder="Please enter country"
            className="h-8 w-[170px] border border-[#dcdcdc] px-2 text-[13px] outline-none focus:border-[#4fc3f7]"
          />
        </Field>
        <Field label="ZIP">
          <input
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            placeholder="Please enter your zip code"
            className="h-8 w-[170px] border border-[#dcdcdc] px-2 text-[13px] outline-none focus:border-[#4fc3f7]"
          />
        </Field>
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => { setPage(1); load(false, 1); }}
            className="h-8 px-4 bg-[#2196f3] hover:bg-[#1e88e5] text-white text-[13px] inline-flex items-center gap-1.5 transition"
          >
            <Search className="h-3.5 w-3.5" /> search
          </button>
          <button
            onClick={reset}
            className="h-8 px-4 border border-[#dcdcdc] text-[#555] hover:bg-[#f7f7f7] text-[13px] inline-flex items-center gap-1.5 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" /> reset
          </button>
        </div>
        {/* Optional seller filter (compact) */}
        {sellers.length > 0 && (
          <Field label="SELLER">
            <select
              value={seller}
              onChange={(e) => setSeller(e.target.value)}
              className="h-8 w-[190px] border border-[#dcdcdc] px-2 text-[13px] outline-none bg-white focus:border-[#4fc3f7]"
            >
              <option value="all">All sellers</option>
              {sellers.map((s) => (
                <option key={s.id} value={s.id}>
                  {(s.seller_display_name || s.display_name || s.username) + (s.is_seller_verified ? " ✓" : "")}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>

      {/* BATCH ADD BUTTON */}
      <div className="mt-3 flex items-center justify-between">
        <button
          onClick={batchAdd}
          disabled={selected.size === 0}
          className="h-7 px-3 bg-[#e8f5e9] hover:bg-[#dcedc8] border border-[#c8e6c9] text-[#2e7d32] text-[12px] transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Batch add shopping cart{selected.size > 0 ? ` (${selected.size})` : ""}
        </button>
        <div className="text-[12px] text-[#888]">
          {totalCards > 0 ? `${totalCards} results` : ""}
        </div>
      </div>

      {/* TABLE */}
      <div className="mt-3 border border-[#e6e6e6] bg-white overflow-x-auto">
        <table className="w-full text-[13px] border-collapse">
          <thead>
            <tr className="bg-[#fafafa] text-[#555] text-[12px]">
              <th className="p-2 w-8 border-b border-[#eee]">
                <input
                  type="checkbox"
                  checked={cards.length > 0 && selected.size === cards.length}
                  onChange={toggleAll}
                  className="cursor-pointer accent-[#2196f3]"
                />
              </th>
              {["BIN","refund","month","year","city","state","zip","country","tel","email","prices","base","operation"].map((h) => (
                <th key={h} className="p-2 text-center font-normal border-b border-[#eee]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b border-[#f0f0f0]">
                <td colSpan={14} className="p-3">
                  <div className="h-4 bg-[#f5f5f5] animate-pulse" />
                </td>
              </tr>
            ))}
            {!loading && cards.map((c) => (
              <tr key={c.id} className="border-b border-[#f0f0f0] hover:bg-[#fafcff] transition">
                <td className="p-2 text-center">
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    onChange={() => toggle(c.id)}
                    className="cursor-pointer accent-[#2196f3]"
                  />
                </td>
                <td className="p-2 text-center font-mono text-[#333]">
                  {c.bin}<span className="text-[#bbb]">********</span>
                </td>
                <td className="p-2 text-center text-[#2196f3]">{c.refundable ? "YES" : "NO"}</td>
                <td className="p-2 text-center font-mono">{c.exp_month ?? "—"}</td>
                <td className="p-2 text-center font-mono">{c.exp_year ?? "—"}</td>
                <td className="p-2 text-center max-w-[140px] truncate" title={c.city ?? ""}>{c.city ?? "—"}</td>
                <td className="p-2 text-center">{c.state ?? "—"}</td>
                <td className="p-2 text-center font-mono">{c.zip ?? "—"}</td>
                <td className="p-2 text-center">{c.country ?? "—"}</td>
                <td className="p-2 text-center">{c.has_phone ? "yes" : "no"}</td>
                <td className="p-2 text-center">{c.has_email ? "yes" : "no"}</td>
                <td className="p-2 text-center font-mono">{Number(c.price).toFixed(0)}</td>
                <td className="p-2 text-center text-[11px] text-[#666] max-w-[180px]">
                  <span className="whitespace-pre-line break-words">{c.base}</span>
                </td>
                <td className="p-2 text-center">
                  {cartIds.has(c.id) ? (
                    <span className="text-[#4caf50] text-[12px]">In cart</span>
                  ) : (
                    <button
                      onClick={() => addToCart(c.id)}
                      className="text-[#2196f3] hover:underline text-[12px]"
                    >
                      Add to cart
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!loading && noResults && (
              <tr>
                <td colSpan={14} className="p-10 text-center text-[#888] text-[13px]">
                  {lastBin
                    ? <>No cards match BIN prefix <code className="px-1 bg-[#f5f5f5] font-mono">{lastBin}</code>.</>
                    : "No cards match your filters."}
                  <div className="mt-2">
                    <button onClick={reset} className="text-[#2196f3] hover:underline">Clear search</button>
                  </div>
                </td>
              </tr>
            )}
            {!loading && !noResults && cards.length === 0 && (
              <tr>
                <td colSpan={14} className="p-10 text-center text-[#888] text-[13px]">
                  Search for a BIN above to find cards in stock.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-[12px] text-[#666]">
          <p>Page {page} of {totalPages}</p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="h-7 w-7 border border-[#e0e0e0] flex items-center justify-center hover:bg-[#f7f7f7] disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let p: number;
              if (totalPages <= 7) p = i + 1;
              else if (page <= 4) p = i + 1;
              else if (page >= totalPages - 3) p = totalPages - 6 + i;
              else p = page - 3 + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-7 min-w-[28px] px-2 border text-[12px] font-mono transition ${
                    page === p
                      ? "bg-[#2196f3] border-[#2196f3] text-white"
                      : "border-[#e0e0e0] text-[#555] hover:bg-[#f7f7f7]"
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="h-7 w-7 border border-[#e0e0e0] flex items-center justify-center hover:bg-[#f7f7f7] disabled:opacity-40"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* keep Link import used for potential future links */}
      <span className="hidden"><Link to="/">.</Link></span>
    </ScorpionShell>
    </ActivationGate>
  );
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[#888] text-[11px] tracking-wider">{label}</span>
      {children}
    </div>
  );
}

export default Shop;

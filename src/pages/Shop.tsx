import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { cardsApi, cartApi, sellersApi, categoriesApi } from "@/lib/api";
import { toFlag, countryName } from "@/lib/countryFlag";
import { Search, RotateCcw, ChevronLeft, ChevronRight, Filter, X, Folder, MapPin, CreditCard, ShieldCheck } from "lucide-react";
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
interface Category { id: string; name: string; slug?: string; count?: number }

const PAGE_SIZE = 25;

const Shop = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [cards, setCards] = useState<Card[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bases, setBases] = useState<string[]>([]);
  const [countryOptions, setCountryOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);

  const [bin, setBin] = useState(searchParams.get("bin") ?? "");
  const [base, setBase] = useState(searchParams.get("base") ?? "all");
  const [country, setCountry] = useState(searchParams.get("country") ?? "");
  const [zip, setZip] = useState(searchParams.get("zip") ?? "");
  const [seller, setSeller] = useState<string>(searchParams.get("seller") ?? "all");
  const [categoryId, setCategoryId] = useState<string>(searchParams.get("category") ?? "all");
  const [refundOnly, setRefundOnly] = useState(searchParams.get("refund") === "1");
  const [phoneOnly, setPhoneOnly] = useState(searchParams.get("phone") === "1");
  const [emailOnly, setEmailOnly] = useState(searchParams.get("email") === "1");
  const [priceMax, setPriceMax] = useState<number>(Number(searchParams.get("pmax") ?? 50));

  const [cartIds, setCartIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lastBin, setLastBin] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCards, setTotalCards] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer

  const sellerMap = useMemo(() => {
    const m = new Map<string, Seller>();
    sellers.forEach((s) => m.set(s.id, s));
    return m;
  }, [sellers]);

  useEffect(() => {
    (async () => {
      try { const r = await sellersApi.visible(); setSellers((r.sellers ?? []) as unknown as Seller[]); } catch { /* noop */ }
      try { const r = await cardsApi.bases(); setBases(r.bases ?? []); } catch { /* noop */ }
      try { const r = await categoriesApi.list(); setCategories((r.categories ?? []) as unknown as Category[]); } catch { /* noop */ }
    })();
  }, []);

  // Sync URL params when filters change
  const syncParams = useCallback((next: URLSearchParams) => {
    const clean = new URLSearchParams(next);
    // strip empties
    for (const [k, v] of Array.from(clean.entries())) {
      if (!v || v === "all" || v === "0") clean.delete(k);
    }
    setSearchParams(clean, { replace: true });
  }, [setSearchParams]);

  const load = useCallback(async (auto = false, p = page) => {
    setLoading(true);
    try {
      const params: Record<string, string | number | boolean | undefined> = {
        per_page: PAGE_SIZE, page: p, sort: "expiry_asc",
      };
      if (bin) params.bin = bin;
      if (base !== "all") params.base = base;
      if (country) params.country = country;
      if (zip) params.zip = zip;
      if (seller !== "all") params.seller_id = seller;
      if (categoryId !== "all") params.category_id = categoryId;
      const res = await cardsApi.browse(params);
      let list = (res.cards ?? []) as Card[];
      // Client-side finish filters (backend may not support these)
      if (refundOnly) list = list.filter((c) => c.refundable);
      if (phoneOnly) list = list.filter((c) => c.has_phone);
      if (emailOnly) list = list.filter((c) => c.has_email);
      if (priceMax < 50) list = list.filter((c) => Number(c.price) <= priceMax);
      setCards(list);
      setTotalPages(res.pages ?? 1);
      setTotalCards(res.total ?? 0);
      // Build country option list from returned rows
      const cs = new Set(countryOptions);
      list.forEach((c) => c.country && cs.add(c.country.toUpperCase()));
      if (cs.size !== countryOptions.length) setCountryOptions(Array.from(cs).sort());
    } catch { setCards([]); }
    setLastBin(bin);
    setLoading(false);
    if (!auto) setSearched(true);
  }, [bin, base, country, zip, seller, categoryId, page, refundOnly, phoneOnly, emailOnly, priceMax, countryOptions]);

  const loadCart = async () => {
    if (!user) return;
    try {
      const { items } = await cartApi.list();
      setCartIds(new Set((items ?? []).map((c) => c.card_id).filter((x): x is string => !!x)));
    } catch { /* ignore */ }
  };

  useEffect(() => { load(true, 1); loadCart(); }, []); // eslint-disable-line

  // Push filters into URL + reload on major changes
  useEffect(() => {
    const p = new URLSearchParams(searchParams);
    p.set("category", categoryId);
    p.set("seller", seller);
    p.set("base", base);
    if (country) p.set("country", country); else p.delete("country");
    if (bin) p.set("bin", bin); else p.delete("bin");
    if (zip) p.set("zip", zip); else p.delete("zip");
    p.set("refund", refundOnly ? "1" : "0");
    p.set("phone", phoneOnly ? "1" : "0");
    p.set("email", emailOnly ? "1" : "0");
    p.set("pmax", String(priceMax));
    syncParams(p);
    setPage(1);
    const t = setTimeout(() => load(true, 1), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [categoryId, seller, base, country, refundOnly, phoneOnly, emailOnly, priceMax]);

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
    setRefundOnly(false); setPhoneOnly(false); setEmailOnly(false); setPriceMax(50);
    setSearched(false); setPage(1);
    setTimeout(() => load(true, 1), 0);
  };

  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected((s) => s.size === cards.length ? new Set() : new Set(cards.map((c) => c.id)));

  const noResults = !loading && cards.length === 0 && (searched || bin.length >= 6);
  const activeFilterCount =
    (bin ? 1 : 0) + (base !== "all" ? 1 : 0) + (country ? 1 : 0) + (zip ? 1 : 0) +
    (categoryId !== "all" ? 1 : 0) + (seller !== "all" ? 1 : 0) +
    (refundOnly ? 1 : 0) + (phoneOnly ? 1 : 0) + (emailOnly ? 1 : 0) + (priceMax < 50 ? 1 : 0);

  // Common country presets (shown even before any card returns)
  const presetCountries = ["US", "CA", "GB", "AU", "DE", "FR", "IT", "ES", "NL", "MX", "BR", "JP", "SG", "IN"];
  const shownCountries = countryOptions.length > 0
    ? Array.from(new Set([...presetCountries.filter((c) => countryOptions.includes(c)), ...countryOptions]))
    : presetCountries;

  const Sidebar = (
    <aside className="w-full lg:w-[260px] shrink-0 bg-white border border-[#e6e6e6]">
      <header className="px-4 py-3 border-b border-[#eee] flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px] font-medium text-[#1a1a1a]">
          <Filter className="h-3.5 w-3.5 text-[#d32f2f]" /> Filters
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-[#d32f2f] text-white">
              {activeFilterCount}
            </span>
          )}
        </div>
        <button
          onClick={reset}
          className="text-[11px] text-[#666] hover:text-[#d32f2f] flex items-center gap-1"
        >
          <RotateCcw className="h-3 w-3" /> reset
        </button>
      </header>

      {/* CATEGORIES TREE */}
      <FilterGroup icon={<Folder className="h-3.5 w-3.5" />} title="Category">
        <button
          onClick={() => setCategoryId("all")}
          className={`w-full text-left px-2 py-1.5 text-[12px] flex items-center justify-between rounded-sm transition ${
            categoryId === "all" ? "bg-[#fef2f2] text-[#d32f2f] font-medium" : "text-[#555] hover:bg-[#f7f7f7]"
          }`}
        >
          <span>All categories</span>
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategoryId(c.id)}
            className={`w-full text-left px-2 py-1.5 text-[12px] flex items-center justify-between rounded-sm transition ${
              categoryId === c.id ? "bg-[#fef2f2] text-[#d32f2f] font-medium" : "text-[#555] hover:bg-[#f7f7f7]"
            }`}
          >
            <span className="truncate">{c.name}</span>
            {c.count != null && <span className="text-[10px] text-[#999]">{c.count}</span>}
          </button>
        ))}
        {categories.length === 0 && (
          <p className="text-[11px] text-[#888] px-2 py-2">No categories configured yet.</p>
        )}
      </FilterGroup>

      {/* COUNTRY CHIPS */}
      <FilterGroup icon={<MapPin className="h-3.5 w-3.5" />} title="Country">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setCountry("")}
            className={`h-7 px-2 text-[11px] border rounded-sm transition ${
              !country ? "bg-[#d32f2f] border-[#d32f2f] text-white font-medium" : "border-[#e0e0e0] text-[#555] hover:bg-[#f7f7f7]"
            }`}
          >
            All
          </button>
          {shownCountries.map((c) => (
            <button
              key={c}
              onClick={() => setCountry(country === c ? "" : c)}
              title={countryName(c)}
              className={`h-7 px-2 text-[11px] border rounded-sm transition inline-flex items-center gap-1 ${
                country === c ? "bg-[#d32f2f] border-[#d32f2f] text-white font-medium" : "border-[#e0e0e0] text-[#555] hover:bg-[#f7f7f7]"
              }`}
            >
              <span className="text-[13px] leading-none">{toFlag(c)}</span> {c}
            </button>
          ))}
        </div>
        <input
          value={country}
          onChange={(e) => setCountry(e.target.value.toUpperCase().slice(0, 2))}
          placeholder="Or enter code…"
          className="mt-2 h-7 w-full border border-[#dcdcdc] px-2 text-[12px] uppercase outline-none focus:border-[#d32f2f]"
        />
      </FilterGroup>

      {/* BRAND / BASE */}
      <FilterGroup icon={<CreditCard className="h-3.5 w-3.5" />} title="Brand / Base">
        <select
          value={base}
          onChange={(e) => setBase(e.target.value)}
          className="h-8 w-full border border-[#dcdcdc] px-2 text-[12px] outline-none bg-white focus:border-[#d32f2f]"
        >
          <option value="all">All brands / bases</option>
          {bases.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </FilterGroup>

      {/* GUARANTEES */}
      <FilterGroup icon={<ShieldCheck className="h-3.5 w-3.5" />} title="Guarantee & extras">
        <label className="flex items-center gap-2 text-[12px] text-[#333] px-1 py-1 cursor-pointer">
          <input type="checkbox" checked={refundOnly} onChange={(e) => setRefundOnly(e.target.checked)} className="accent-[#d32f2f]" />
          Refundable only
        </label>
        <label className="flex items-center gap-2 text-[12px] text-[#333] px-1 py-1 cursor-pointer">
          <input type="checkbox" checked={phoneOnly} onChange={(e) => setPhoneOnly(e.target.checked)} className="accent-[#d32f2f]" />
          Has phone number
        </label>
        <label className="flex items-center gap-2 text-[12px] text-[#333] px-1 py-1 cursor-pointer">
          <input type="checkbox" checked={emailOnly} onChange={(e) => setEmailOnly(e.target.checked)} className="accent-[#d32f2f]" />
          Has email
        </label>
      </FilterGroup>

      {/* ZIP + PRICE */}
      <FilterGroup title="ZIP code">
        <input
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          placeholder="e.g. 10001"
          className="h-8 w-full border border-[#dcdcdc] px-2 text-[12px] outline-none focus:border-[#d32f2f]"
        />
      </FilterGroup>

      <FilterGroup title={`Max price: $${priceMax}`}>
        <input
          type="range" min={1} max={50} step={1}
          value={priceMax}
          onChange={(e) => setPriceMax(Number(e.target.value))}
          className="w-full accent-[#d32f2f]"
        />
        <div className="flex justify-between text-[10px] text-[#888] mt-1">
          <span>$1</span><span>$50+</span>
        </div>
      </FilterGroup>

      {sellers.length > 0 && (
        <FilterGroup title="Seller">
          <select
            value={seller}
            onChange={(e) => setSeller(e.target.value)}
            className="h-8 w-full border border-[#dcdcdc] px-2 text-[12px] outline-none bg-white focus:border-[#d32f2f]"
          >
            <option value="all">All sellers</option>
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>
                {(s.seller_display_name || s.display_name || s.username) + (s.is_seller_verified ? " ✓" : "")}
              </option>
            ))}
          </select>
        </FilterGroup>
      )}
    </aside>
  );

  return (
    <AppShell>
      <Seo title="Shop — Scorpion-Shop" description="Browse live stock. Filter by BIN, base, country, ZIP, category." path="/shop" />

      {/* HEADER STRIP — BIN search + result count */}
      <div className="bg-gradient-to-r from-[#1a1a1a] via-[#2a1414] to-[#1a1a1a] text-white border border-[#3a2020] px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-[14px] font-medium text-[#ffb300]">
          <Search className="h-4 w-4" /> BIN lookup
        </div>
        <input
          value={bin}
          onChange={(e) => setBin(e.target.value.replace(/\D/g, "").slice(0, 16))}
          placeholder="Enter first 6+ digits of card number"
          className="h-9 flex-1 min-w-[220px] max-w-[420px] bg-black/40 border border-[#5a3030] text-white placeholder-white/40 px-3 text-[13px] font-mono outline-none focus:border-[#ffb300] focus:shadow-[0_0_0_2px_rgba(255,179,0,0.15)]"
        />
        <button
          onClick={() => { setPage(1); load(false, 1); }}
          className="h-9 px-5 bg-gradient-to-r from-[#ff2d2d] via-[#ff6b1a] to-[#ffb300] text-white text-[13px] font-semibold inline-flex items-center gap-1.5 hover:opacity-90 transition shadow-[0_4px_12px_-2px_rgba(255,45,45,0.4)]"
        >
          <Search className="h-3.5 w-3.5" /> Search
        </button>
        <div className="ml-auto text-[12px] text-white/70">
          {totalCards > 0 ? <><span className="text-[#ffb300] font-semibold">{totalCards.toLocaleString()}</span> live cards</> : "Ready"}
        </div>
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="lg:hidden h-9 px-3 border border-white/20 text-white text-[12px] inline-flex items-center gap-1.5"
        >
          <Filter className="h-3.5 w-3.5" /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
        </button>
      </div>

      <div className="mt-4 flex flex-col lg:flex-row gap-4">
        {/* Sidebar — desktop */}
        <div className="hidden lg:block">{Sidebar}</div>

        {/* Sidebar — mobile drawer */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/60" onClick={() => setSidebarOpen(false)}>
            <div className="absolute left-0 top-0 h-full w-[280px] bg-white overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-3 border-b flex items-center justify-between">
                <span className="text-[13px] font-medium">Filters</span>
                <button onClick={() => setSidebarOpen(false)}><X className="h-4 w-4" /></button>
              </div>
              {Sidebar}
            </div>
          </div>
        )}

        {/* MAIN CONTENT */}
        <div className="flex-1 min-w-0">
          {/* Batch bar */}
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <button
              onClick={batchAdd}
              disabled={selected.size === 0}
              className="h-8 px-3 bg-[#e8f5e9] hover:bg-[#dcedc8] border border-[#c8e6c9] text-[#2e7d32] text-[12px] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Batch add to cart{selected.size > 0 ? ` (${selected.size})` : ""}
            </button>
            <div className="text-[12px] text-[#888] flex items-center gap-3">
              {activeFilterCount > 0 && (
                <button onClick={reset} className="text-[#d32f2f] hover:underline inline-flex items-center gap-1">
                  <X className="h-3 w-3" /> Clear {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
                </button>
              )}
              <span>{loading ? "Loading…" : `Showing ${cards.length} of ${totalCards.toLocaleString()}`}</span>
            </div>
          </div>

          {/* CARD ROWS TABLE */}
          <div className="border border-[#e6e6e6] bg-white overflow-x-auto">
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr className="bg-[#fafafa] text-[#555] text-[11px] uppercase tracking-wider">
                  <th className="p-2 w-8 border-b border-[#eee]">
                    <input
                      type="checkbox"
                      checked={cards.length > 0 && selected.size === cards.length}
                      onChange={toggleAll}
                      className="cursor-pointer accent-[#d32f2f]"
                    />
                  </th>
                  {["BIN","refund","exp","location","country","tel","email","price","base","action"].map((h) => (
                    <th key={h} className="p-2 text-center font-medium border-b border-[#eee]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#f0f0f0]">
                    <td colSpan={11} className="p-3">
                      <div className="h-4 bg-[#f5f5f5] animate-pulse" />
                    </td>
                  </tr>
                ))}
                {!loading && cards.map((c) => (
                  <tr key={c.id} className="border-b border-[#f0f0f0] hover:bg-[#fff8f0] transition group">
                    <td className="p-2 text-center">
                      <input
                        type="checkbox"
                        checked={selected.has(c.id)}
                        onChange={() => toggle(c.id)}
                        className="cursor-pointer accent-[#d32f2f]"
                      />
                    </td>
                    <td className="p-2 text-center font-mono text-[#1a1a1a] font-semibold">
                      {c.bin}<span className="text-[#ccc]">********</span>
                    </td>
                    <td className="p-2 text-center">
                      {c.refundable ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm text-[10px] font-semibold bg-[#e8f5e9] text-[#2e7d32]">
                          <ShieldCheck className="h-2.5 w-2.5" /> YES
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#999]">no</span>
                      )}
                    </td>
                    <td className="p-2 text-center font-mono text-[12px] text-[#666]">
                      {c.exp_month ?? "--"}/{c.exp_year ?? "--"}
                    </td>
                    <td className="p-2 text-[12px] max-w-[160px]">
                      <div className="truncate text-[#333]" title={`${c.city ?? ""} ${c.state ?? ""} ${c.zip ?? ""}`}>
                        {[c.city, c.state].filter(Boolean).join(", ") || "—"}
                      </div>
                      <div className="text-[10px] text-[#999] font-mono">{c.zip ?? "—"}</div>
                    </td>
                    <td className="p-2 text-center">
                      <span
                        title={countryName(c.country)}
                        className="inline-flex items-center gap-1 text-[12px]"
                      >
                        <span className="text-[15px] leading-none">{toFlag(c.country)}</span>
                        <span className="font-mono text-[11px] text-[#666]">{c.country ?? "—"}</span>
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      {c.has_phone ? <span className="text-[#2e7d32] text-[11px]">✓</span> : <span className="text-[#ccc] text-[11px]">—</span>}
                    </td>
                    <td className="p-2 text-center">
                      {c.has_email ? <span className="text-[#2e7d32] text-[11px]">✓</span> : <span className="text-[#ccc] text-[11px]">—</span>}
                    </td>
                    <td className="p-2 text-center">
                      <span className="font-mono font-bold text-[13px] bg-gradient-to-r from-[#d32f2f] to-[#ff6b1a] bg-clip-text text-transparent">
                        ${Number(c.price).toFixed(2)}
                      </span>
                    </td>
                    <td className="p-2 text-[10px] text-[#666] max-w-[180px]">
                      <span className="whitespace-pre-line break-words">{c.base}</span>
                    </td>
                    <td className="p-2 text-center">
                      {cartIds.has(c.id) ? (
                        <span className="inline-flex items-center gap-1 text-[#2e7d32] text-[11px] font-semibold">
                          <ShieldCheck className="h-3 w-3" /> In cart
                        </span>
                      ) : (
                        <button
                          onClick={() => addToCart(c.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-gradient-to-r from-[#d32f2f] to-[#ff6b1a] text-white rounded-sm hover:opacity-90 transition"
                        >
                          Buy
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {!loading && noResults && (
                  <tr>
                    <td colSpan={11} className="p-10 text-center text-[#888] text-[13px]">
                      {lastBin
                        ? <>No cards match BIN <code className="px-1 bg-[#f5f5f5] font-mono">{lastBin}</code>.</>
                        : "No cards match your filters."}
                      <div className="mt-2">
                        <button onClick={reset} className="text-[#d32f2f] hover:underline">Clear all filters</button>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && !noResults && cards.length === 0 && (
                  <tr>
                    <td colSpan={11} className="p-10 text-center text-[#888] text-[13px]">
                      Search by BIN or pick a country/category from the sidebar.
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
                  className="h-7 w-7 border border-[#e0e0e0] flex items-center justify-center hover:bg-[#fff0f0] disabled:opacity-40"
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
                          ? "bg-gradient-to-r from-[#d32f2f] to-[#ff6b1a] border-[#d32f2f] text-white"
                          : "border-[#e0e0e0] text-[#555] hover:bg-[#fff0f0]"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="h-7 w-7 border border-[#e0e0e0] flex items-center justify-center hover:bg-[#fff0f0] disabled:opacity-40"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <span className="hidden"><Link to="/">.</Link></span>
      {/* silence unused var lints */}
      <span className="hidden">{sellerMap.size}</span>
    </AppShell>
  );
};

function FilterGroup({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3 border-b border-[#f0f0f0] last:border-b-0">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#333] uppercase tracking-wider mb-2">
        {icon} {title}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export default Shop;

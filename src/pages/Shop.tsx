import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import Seo from "@/components/Seo";
import { toast } from "sonner";
import { Loader2, RefreshCw, Copy, CheckCircle2, X } from "lucide-react";
import { listCategories, listProducts, purchaseProduct, type Category, type Product } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";

const money = (n: number) => `$${Number(n || 0).toFixed(2)}`;

const Shop = () => {
  const { profile } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [catId, setCatId] = useState("");
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [delivered, setDelivered] = useState<{ title: string; content: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [cats, prods] = await Promise.all([listCategories(), listProducts({ categoryId: catId || null })]);
      setCategories(cats);
      setProducts(prods);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, [catId]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const lo = minPrice ? Number(minPrice) : null;
    const hi = maxPrice ? Number(maxPrice) : null;
    return products.filter((p) => {
      if (q && !`${p.title} ${p.short_description ?? ""}`.toLowerCase().includes(q)) return false;
      if (lo !== null && p.price < lo) return false;
      if (hi !== null && p.price > hi) return false;
      if (inStockOnly && p.delivery_type === "key" && p.stock <= 0) return false;
      return true;
    });
  }, [products, search, minPrice, maxPrice, inStockOnly]);

  const catName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? "—";

  const buy = async (p: Product) => {
    if (Number(profile?.balance ?? 0) < p.price) {
      toast.error("Недостаточно средств. Пополните баланс.");
      return;
    }
    setBuying(p.id);
    try {
      const content = await purchaseProduct(p.id, 1);
      setDelivered({ title: p.title, content: content || "Заказ оформлен. Смотрите раздел «Заказы»." });
      toast.success("Покупка выполнена");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка покупки");
    } finally {
      setBuying(null);
    }
  };

  const reset = () => { setCatId(""); setSearch(""); setMinPrice(""); setMaxPrice(""); setInStockOnly(false); };

  const inputCls = "h-9 border border-[#dcdfe6] px-2 text-[13px] text-[#303133] bg-white focus:border-[#2196f3] outline-none";

  return (
    <AppShell>
      <Seo
        title="Магазин подарочных карт | Zoru Shop"
        description="Подарочные и предоплаченные карты Walmart, Visa, Vanilla по оптовым ценам с мгновенной выдачей."
        path="/shop"
      />

      <div className="bg-white border border-[#e6e6e6] mb-4">
        <div className="px-4 py-3 border-b border-[#f0f0f0] flex items-center justify-between gap-3">
          <h1 className="text-[15px] font-semibold text-[#303133]">Магазин · Подарочные и предоплаченные карты</h1>
          <button onClick={() => void load()} className="inline-flex items-center gap-1.5 text-[12px] text-[#2196f3] hover:underline">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Обновить
          </button>
        </div>

        <div className="p-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-[#909399]">Категория</span>
            <select value={catId} onChange={(e) => setCatId(e.target.value)} className={`${inputCls} min-w-[180px]`}>
              <option value="">Все категории</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-[#909399]">Бренд / номинал</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Walmart, Visa…" className={`${inputCls} min-w-[190px]`} />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-[#909399]">Цена от</span>
            <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} inputMode="decimal" placeholder="0" className={`${inputCls} w-[100px]`} />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-[#909399]">Цена до</span>
            <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} inputMode="decimal" placeholder="500" className={`${inputCls} w-[100px]`} />
          </div>

          <label className="flex items-center gap-2 h-9 text-[13px] text-[#606266] cursor-pointer">
            <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="accent-[#2196f3]" />
            Только в наличии
          </label>

          <button onClick={reset} className="h-9 px-4 border border-[#dcdfe6] text-[13px] text-[#606266] hover:border-[#2196f3] hover:text-[#2196f3] transition">
            Сбросить
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#e6e6e6]">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] min-w-[860px]">
            <thead>
              <tr className="bg-[#fafafa] text-[#909399] text-left">
                <th className="px-4 py-3 font-medium">Товар</th>
                <th className="px-4 py-3 font-medium">Категория</th>
                <th className="px-4 py-3 font-medium">Номинал / описание</th>
                <th className="px-4 py-3 font-medium">Наличие</th>
                <th className="px-4 py-3 font-medium text-right">Цена</th>
                <th className="px-4 py-3 font-medium text-right">Действие</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-[#909399]">
                  <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Загрузка…
                </td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-[#909399]">Товары не найдены</td></tr>
              )}
              {!loading && rows.map((p) => {
                const unlimited = p.delivery_type !== "key";
                const out = !unlimited && p.stock <= 0;
                return (
                  <tr key={p.id} className="border-t border-[#f0f0f0] hover:bg-[#fafcff]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.title} className="h-9 w-14 object-cover border border-[#eee]" loading="lazy" />
                        ) : (
                          <div className="h-9 w-14 bg-[#304156] text-white text-[10px] flex items-center justify-center">CARD</div>
                        )}
                        <div>
                          <div className="text-[#303133] font-medium">{p.title}</div>
                          {p.featured && <span className="text-[10px] text-[#e6a23c]">ХИТ ПРОДАЖ</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#606266]">{catName(p.category_id)}</td>
                    <td className="px-4 py-3 text-[#606266] max-w-[280px] truncate">{p.short_description ?? "—"}</td>
                    <td className="px-4 py-3">
                      {unlimited
                        ? <span className="text-[#2fb344]">∞</span>
                        : <span className={out ? "text-[#f56c6c]" : "text-[#2fb344]"}>{out ? "Нет" : p.stock}</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-[#303133] font-semibold">{money(p.price)}</span>
                      {p.compare_at_price && p.compare_at_price > p.price && (
                        <span className="ml-2 text-[11px] text-[#c0c4cc] line-through">{money(p.compare_at_price)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        disabled={out || buying === p.id}
                        onClick={() => void buy(p)}
                        className="h-8 px-4 text-[12px] text-white bg-[#2fb344] hover:bg-[#28a03c] disabled:opacity-40 disabled:cursor-not-allowed transition"
                      >
                        {buying === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Купить"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-[#f0f0f0] text-[12px] text-[#909399]">
          Показано {rows.length} из {products.length} позиций
        </div>
      </div>

      {delivered && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setDelivered(null)}>
          <div className="bg-white w-full max-w-lg border border-[#e6e6e6]" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-[#f0f0f0] flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#2fb344] text-[14px] font-semibold">
                <CheckCircle2 className="h-4 w-4" /> Заказ выполнен
              </div>
              <button onClick={() => setDelivered(null)} className="text-[#909399] hover:text-[#303133]"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="text-[13px] text-[#606266]">{delivered.title}</div>
              <pre className="bg-[#fafafa] border border-[#eee] p-3 text-[13px] text-[#303133] whitespace-pre-wrap break-all">{delivered.content}</pre>
              <button
                onClick={() => { void navigator.clipboard.writeText(delivered.content); toast.success("Скопировано"); }}
                className="inline-flex items-center gap-1.5 h-9 px-4 text-[13px] text-white bg-[#2196f3] hover:bg-[#1e88e5] transition"
              >
                <Copy className="h-3.5 w-3.5" /> Копировать
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default Shop;

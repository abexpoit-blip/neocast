import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import Seo from "@/components/Seo";
import { toast } from "sonner";
import { Loader2, Search, RefreshCw, ShoppingCart, Copy, CheckCircle2 } from "lucide-react";
import {
  listCategories,
  listProducts,
  purchaseProduct,
  type Category,
  type Product,
} from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

const money = (n: number) => `$${Number(n || 0).toFixed(2)}`;

const Shop = () => {
  const { profile } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [catId, setCatId] = useState<string>("");
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
      const [cats, prods] = await Promise.all([
        listCategories(),
        listProducts({ categoryId: catId || null }),
      ]);
      setCategories(cats);
      setProducts(prods);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [catId]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const lo = minPrice ? Number(minPrice) : null;
    const hi = maxPrice ? Number(maxPrice) : null;
    return products.filter((p) => {
      if (q && !`${p.title} ${p.short_description ?? ""}`.toLowerCase().includes(q)) return false;
      if (lo !== null && p.price < lo) return false;
      if (hi !== null && p.price > hi) return false;
      if (inStockOnly && p.stock <= 0 && p.delivery_type === "key") return false;
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

  const reset = () => {
    setCatId(""); setSearch(""); setMinPrice(""); setMaxPrice(""); setInStockOnly(false);
  };

  return (
    <AppShell>
      <Seo
        title="Магазин подарочных карт | Zoru Shop"
        description="Подарочные и предоплаченные карты Walmart, Visa, Vanilla — оптовые цены, мгновенная выдача."
        path="/shop"
      />

      {/* FILTER BAR */}
      <div className="bg-white border border-[#e6e6e6] mb-4">
        <div className="px-4 py-3 border-b border-[#f0f0f0] flex items-center justify-between">
          <h1 className="text-[15px] font-semibold text-[#303133]">Магазин · Подарочные и предоплаченные карты</h1>
          <button
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 text-[12px] text-[#2196f3] hover:underline"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Обновить
          </button>
        </div>

        <div className="p-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-[#909399]">Категория</label>
            <select
              value={catId}
              onChange={(e) => setCatId(e.target.value)}
              className="h-9 min-w-[180px] border border-[#dcdfe6] px-2 text-[13px] text-[#303133] bg-white focus:border-[#2196f3] outline-none"
            >
              <option value="">Все категории</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-[#909399]">Поиск (бренд /
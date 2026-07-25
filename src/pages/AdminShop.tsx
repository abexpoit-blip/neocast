import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Edit2, Save, X, Layers, CreditCard, RefreshCw } from "lucide-react";
import {
  listCategories, listProducts, adminSaveProduct, adminDeleteProduct,
  adminSaveCategory, adminDeleteCategory, adminAddKeys, adminSyncStock,
  parseBulkCards, adminBulkCreateCards,
  slugify, type Category, type Product, type ProductInput, type DeliveryType,
} from "@/lib/store";
import { BrandLogo, detectBrandFromBin, COUNTRIES } from "@/lib/brands";
import { toFlag } from "@/lib/countryFlag";
import { lookupBin, type BinInfo } from "@/lib/bin";

const BRANDS = ["VISA", "MASTERCARD", "AMEX", "DISCOVER", "JCB", "DINERS"];

const emptyForm = (): ProductInput & { keys: string } => ({
  category_id: null,
  title: "",
  slug: "",
  short_description: "",
  price: 0,
  compare_at_price: null,
  delivery_type: "key" as DeliveryType,
  instant_content: "",
  download_url: "",
  image_url: "",
  featured: false,
  active: true,
  bin: "",
  brand: "",
  country: "",
  base: "",
  keys: "",
});

const inputCls =
  "h-9 w-full rounded-md border border-border/60 bg-input/40 px-3 text-sm text-foreground outline-none focus:border-primary/60";
const labelCls = "text-[10px] uppercase tracking-widest text-muted-foreground";

const AdminShop = () => {
  const [tab, setTab] = useState<"cards" | "cats">("cards");
  const [cats, setCats] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [binInfo, setBinInfo] = useState<BinInfo | null>(null);
  const [binLoading, setBinLoading] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkCat, setBulkCat] = useState<string>("");
  const [bulkBusy, setBulkBusy] = useState(false);

  const bulkPreview = useMemo(() => parseBulkCards(bulkText), [bulkText]);

  const runBulkUpload = async () => {
    const { rows, errors } = bulkPreview;
    if (!rows.length) { toast.error("Нет корректных строк"); return; }
    setBulkBusy(true);
    try {
      const n = await adminBulkCreateCards(rows, bulkCat || null);
      toast.success(`Загружено позиций: ${n}${errors.length ? ` · пропущено: ${errors.length}` : ""}`);
      setBulkText("");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setBulkBusy(false);
    }
  };



  const [catForm, setCatForm] = useState<{ id?: string; name: string; slug: string; icon: string; sort_order: number; active: boolean }>({
    name: "", slug: "", icon: "", sort_order: 0, active: true,
  });

  const load = async () => {
    setLoading(true);
    try {
      const [c, p] = await Promise.all([listCategories(true), listProducts({ includeInactive: true })]);
      setCats(c);
      setProducts(p);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const resetForm = () => { setForm(emptyForm()); setEditingId(null); };

  const edit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      id: p.id,
      category_id: p.category_id,
      title: p.title,
      slug: p.slug,
      short_description: p.short_description ?? "",
      price: p.price,
      compare_at_price: p.compare_at_price,
      delivery_type: p.delivery_type,
      instant_content: p.instant_content ?? "",
      download_url: p.download_url ?? "",
      image_url: p.image_url ?? "",
      featured: p.featured,
      active: p.active,
      bin: p.bin ?? "",
      brand: p.brand ?? "",
      country: p.country ?? "",
      base: p.base ?? "",
      keys: "",
    });
    setTab("cards");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async () => {
    if (!form.title.trim()) { toast.error("Введите название"); return; }
    setSaving(true);
    try {
      const { keys, ...rest } = form;
      const payload: ProductInput = {
        ...rest,
        slug: (rest.slug || slugify(rest.title)),
        price: Number(rest.price) || 0,
        compare_at_price: rest.compare_at_price ? Number(rest.compare_at_price) : null,
        bin: rest.bin?.trim() || null,
        brand: rest.brand?.trim() || (rest.bin ? detectBrandFromBin(rest.bin) : null),
        country: rest.country?.trim().toUpperCase() || null,
        base: rest.base?.trim() || null,
      };
      const id = await adminSaveProduct(payload);
      const lines = keys.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length) {
        const n = await adminAddKeys(id, lines);
        toast.success(`Сохранено. Добавлено карт: ${n}`);
      } else {
        if (payload.delivery_type === "key") await adminSyncStock(id);
        toast.success("Сохранено");
      }
      resetForm();
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: Product) => {
    if (!confirm(`Удалить «${p.title}»?`)) return;
    try { await adminDeleteProduct(p.id); toast.success("Удалено"); void load(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Ошибка"); }
  };

  const saveCat = async () => {
    if (!catForm.name.trim()) { toast.error("Введите название категории"); return; }
    try {
      await adminSaveCategory({
        id: catForm.id,
        name: catForm.name.trim(),
        slug: catForm.slug.trim() || slugify(catForm.name),
        icon: catForm.icon || null,
        sort_order: Number(catForm.sort_order) || 0,
        active: catForm.active,
      });
      toast.success("Категория сохранена");
      setCatForm({ name: "", slug: "", icon: "", sort_order: 0, active: true });
      void load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Ошибка"); }
  };

  const removeCat = async (c: Category) => {
    if (!confirm(`Удалить категорию «${c.name}»?`)) return;
    try { await adminDeleteCategory(c.id); toast.success("Удалено"); void load(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Ошибка"); }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      `${p.title} ${p.bin ?? ""} ${p.base ?? ""} ${p.brand ?? ""} ${p.country ?? ""}`.toLowerCase().includes(q));
  }, [products, search]);

  const catName = (id: string | null) => cats.find((c) => c.id === id)?.name ?? "—";

  return (
    <AdminLayout title="Магазин · карты и категории">
      <div className="flex gap-2">
        {(["cards", "cats"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition ${
              tab === t ? "border-primary/50 bg-primary/10 text-foreground" : "border-border/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "cards" ? <CreditCard className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
            {t === "cards" ? "Карты / товары" : "Категории"}
          </button>
        ))}
        <button onClick={() => void load()} className="ml-auto inline-flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Обновить
        </button>
      </div>

      {tab === "cards" && (
        <>
          <div className="glass rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">{editingId ? "Редактировать позицию" : "Новая позиция"}</h2>
              {editingId && (
                <button onClick={resetForm} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" /> Отмена
                </button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <div className={labelCls}>Название</div>
                <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Walmart Gift Card $100" />
              </div>
              <div className="space-y-1.5">
                <div className={labelCls}>Категория</div>
                <select className={inputCls} value={form.category_id ?? ""} onChange={(e) => setForm({ ...form, category_id: e.target.value || null })}>
                  <option value="">Без категории</option>
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <div className={labelCls}>Цена ($)</div>
                <input className={inputCls} type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              </div>

              <div className="space-y-1.5">
                <div className={labelCls}>BIN (первые 6 цифр)</div>
                <input
                  className={inputCls}
                  value={form.bin ?? ""}
                  maxLength={8}
                  onChange={(e) => {
                    const bin = e.target.value.replace(/\D/g, "");
                    setForm((f) => ({ ...f, bin, brand: bin.length >= 2 ? detectBrandFromBin(bin) : f.brand }));
                    if (bin.length >= 6) {
                      setBinLoading(true);
                      void lookupBin(bin).then((info) => {
                        setBinLoading(false);
                        if (!info) return;
                        setBinInfo(info);
                        setForm((f) =>
                          f.bin === bin
                            ? {
                                ...f,
                                brand: info.brand ?? f.brand,
                                country: info.country ?? f.country,
                              }
                            : f,
                        );
                      });
                    } else {
                      setBinInfo(null);
                    }
                  }}
                  placeholder="414720"
                />
                <div className="text-[11px] text-muted-foreground min-h-[16px]">
                  {binLoading && "Проверка BIN…"}
                  {!binLoading && binInfo && [binInfo.brand, binInfo.type, binInfo.level, binInfo.bank, binInfo.countryName]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </div>
              <div className="space-y-1.5">
                <div className={labelCls}>Бренд</div>
                <select className={inputCls} value={form.brand ?? ""} onChange={(e) => setForm({ ...form, brand: e.target.value })}>
                  <option value="">—</option>
                  {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <div className={labelCls}>Страна</div>
                <select className={inputCls} value={form.country ?? ""} onChange={(e) => setForm({ ...form, country: e.target.value })}>
                  <option value="">—</option>
                  {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <div className={labelCls}>BASE (качество / название базы)</div>
                <input className={inputCls} value={form.base ?? ""} onChange={(e) => setForm({ ...form, base: e.target.value })} placeholder="BASE: PREMIUM-WM-2026 / 98% валидность" />
              </div>
              <div className="space-y-1.5">
                <div className={labelCls}>Тип выдачи</div>
                <select className={inputCls} value={form.delivery_type} onChange={(e) => setForm({ ...form, delivery_type: e.target.value as DeliveryType })}>
                  <option value="key">Карты из склада (key)</option>
                  <option value="instant">Мгновенный текст</option>
                  <option value="download">Ссылка на скачивание</option>
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <div className={labelCls}>Краткое описание</div>
                <input className={inputCls} value={form.short_description ?? ""} onChange={(e) => setForm({ ...form, short_description: e.target.value })} placeholder="Номинал $100 · мгновенная выдача" />
              </div>

              {form.delivery_type === "key" && (
                <div className="space-y-1.5 md:col-span-3">
                  <div className={labelCls}>Загрузка карт — по одной в строке (CC|MM|YY|CVV|Name|Address|ZIP)</div>
                  <textarea
                    className="min-h-[120px] w-full rounded-md border border-border/60 bg-input/40 p-3 font-mono text-xs text-foreground outline-none focus:border-primary/60"
                    value={form.keys}
                    onChange={(e) => setForm({ ...form, keys: e.target.value })}
                    placeholder={"4147201234567890|09|29|123|John Doe|US|10001\n4147201234567891|10|28|456|Jane Doe|US|33101"}
                  />
                </div>
              )}
              {form.delivery_type === "instant" && (
                <div className="space-y-1.5 md:col-span-3">
                  <div className={labelCls}>Контент выдачи</div>
                  <textarea className="min-h-[90px] w-full rounded-md border border-border/60 bg-input/40 p-3 font-mono text-xs" value={form.instant_content ?? ""} onChange={(e) => setForm({ ...form, instant_content: e.target.value })} />
                </div>
              )}
              {form.delivery_type === "download" && (
                <div className="space-y-1.5 md:col-span-3">
                  <div className={labelCls}>Ссылка</div>
                  <input className={inputCls} value={form.download_url ?? ""} onChange={(e) => setForm({ ...form, download_url: e.target.value })} placeholder="https://…" />
                </div>
              )}

              <div className="flex items-center gap-5 md:col-span-3">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" checked={!!form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Активно
                </label>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" checked={!!form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Хит продаж
                </label>
                <button onClick={() => void save()} disabled={saving} className="ml-auto inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {editingId ? "Обновить" : "Создать"}
                </button>
              </div>
            </div>
          </div>

          {/* BULK UPLOAD (CSV) */}
          <div className="glass rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-sm font-semibold">BULK UPLOAD (CSV)</h2>
              <code className="text-[11px] text-muted-foreground">
                bin,brand,country,state,city,zip,exp_month,exp_year,price
              </code>
            </div>
            <textarea
              className="min-h-[140px] w-full rounded-md border border-border/60 bg-input/40 p-3 font-mono text-xs text-foreground outline-none focus:border-primary/60"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={"541865,MASTERCARD,US,PA,Philipsburg,16866,7,26,0.20\n448473,VISA,US,MA,Dorchester,02121,7,26,0.20"}
            />
            <div className="flex items-center gap-3 flex-wrap">
              <select className={`${inputCls} max-w-[220px]`} value={bulkCat} onChange={(e) => setBulkCat(e.target.value)}>
                <option value="">Без категории</option>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <span className="text-xs text-muted-foreground">
                Готово к загрузке: <b className="text-foreground">{bulkPreview.rows.length}</b>
                {bulkPreview.errors.length > 0 && <span className="text-destructive"> · ошибок: {bulkPreview.errors.length}</span>}
              </span>
              <button
                onClick={() => void runBulkUpload()}
                disabled={bulkBusy || bulkPreview.rows.length === 0}
                className="ml-auto inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {bulkBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Загрузить
              </button>
            </div>
            {bulkPreview.errors.length > 0 && (
              <ul className="text-[11px] text-destructive space-y-0.5 max-h-24 overflow-auto">
                {bulkPreview.errors.slice(0, 20).map((er) => <li key={er}>{er}</li>)}
              </ul>
            )}
            {bulkPreview.rows.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    <tr>
                      {["BIN", "Бренд", "Страна", "State", "City", "ZIP", "MM", "YY", "Цена"].map((h) => (
                        <th key={h} className="p-2 text-left font-normal">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {bulkPreview.rows.slice(0, 8).map((r, i) => (
                      <tr key={`${r.bin}-${i}`}>
                        <td className="p-2 font-mono">
                          <span className="inline-flex items-center gap-2">
                            <BrandLogo brand={r.brand || detectBrandFromBin(r.bin)} className="h-5 w-8" />
                            {r.bin}
                          </span>
                        </td>
                        <td className="p-2">{r.brand || detectBrandFromBin(r.bin)}</td>
                        <td className="p-2">{toFlag(r.country)} {r.country}</td>
                        <td className="p-2">{r.state}</td>
                        <td className="p-2">{r.city}</td>
                        <td className="p-2 font-mono">{r.zip}</td>
                        <td className="p-2 font-mono">{r.exp_month}</td>
                        <td className="p-2 font-mono">{r.exp_year}</td>
                        <td className="p-2">${r.price.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>



          <div className="glass rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border/30">
              <input className={`${inputCls} max-w-sm`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск: BIN, база, бренд…" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead className="bg-secondary/50 text-[10px] uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="p-3 text-left">Бренд</th>
                    <th className="p-3 text-left">BIN</th>
                    <th className="p-3 text-left">Позиция</th>
                    <th className="p-3 text-left">BASE</th>
                    <th className="p-3 text-left">Страна</th>
                    <th className="p-3 text-left">Категория</th>
                    <th className="p-3 text-center">Склад</th>
                    <th className="p-3 text-right">Цена</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-secondary/20">
                      <td className="p-3">{p.brand ? <BrandLogo brand={p.brand} className="h-6" /> : "—"}</td>
                      <td className="p-3 font-mono text-xs">{p.bin ?? "—"}</td>
                      <td className="p-3">
                        <div className="font-medium">{p.title}</div>
                        {!p.active && <span className="text-[10px] uppercase text-destructive">скрыто</span>}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{p.base ?? "—"}</td>
                      <td className="p-3">{p.country ? `${toFlag(p.country)} ${p.country}` : "—"}</td>
                      <td className="p-3 text-muted-foreground">{catName(p.category_id)}</td>
                      <td className="p-3 text-center">{p.delivery_type === "key" ? p.stock : "∞"}</td>
                      <td className="p-3 text-right font-semibold">${p.price.toFixed(2)}</td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <button onClick={() => edit(p)} className="p-2 text-muted-foreground hover:text-primary"><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => void remove(p)} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                  {!loading && filtered.length === 0 && (
                    <tr><td colSpan={9} className="p-10 text-center text-muted-foreground">Позиции не найдены</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "cats" && (
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="glass rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-semibold">{catForm.id ? "Редактировать категорию" : "Новая категория"}</h2>
            <div className="space-y-1.5"><div className={labelCls}>Название</div>
              <input className={inputCls} value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} placeholder="Prepaid Cards" /></div>
            <div className="space-y-1.5"><div className={labelCls}>Slug</div>
              <input className={inputCls} value={catForm.slug} onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })} placeholder="prepaid-cards" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><div className={labelCls}>Иконка (emoji)</div>
                <input className={inputCls} value={catForm.icon} onChange={(e) => setCatForm({ ...catForm, icon: e.target.value })} placeholder="💳" /></div>
              <div className="space-y-1.5"><div className={labelCls}>Порядок</div>
                <input className={inputCls} type="number" value={catForm.sort_order} onChange={(e) => setCatForm({ ...catForm, sort_order: Number(e.target.value) })} /></div>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={catForm.active} onChange={(e) => setCatForm({ ...catForm, active: e.target.checked })} /> Активна
            </label>
            <div className="flex gap-2">
              <button onClick={() => void saveCat()} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">
                <Plus className="h-4 w-4" /> {catForm.id ? "Обновить" : "Добавить"}
              </button>
              {catForm.id && (
                <button onClick={() => setCatForm({ name: "", slug: "", icon: "", sort_order: 0, active: true })} className="rounded-lg border border-border/60 px-4 py-2 text-sm text-muted-foreground">Отмена</button>
              )}
            </div>
          </div>

          <div className="glass rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-[10px] uppercase tracking-widest text-muted-foreground">
                <tr><th className="p-3 text-left">Категория</th><th className="p-3 text-left">Slug</th><th className="p-3 text-center">Порядок</th><th className="p-3 text-center">Статус</th><th className="p-3"></th></tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {cats.map((c) => (
                  <tr key={c.id} className="hover:bg-secondary/20">
                    <td className="p-3">{c.icon} {c.name}</td>
                    <td className="p-3 text-muted-foreground">{c.slug}</td>
                    <td className="p-3 text-center">{c.sort_order}</td>
                    <td className="p-3 text-center">{c.active ? "✅" : "—"}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button onClick={() => setCatForm({ id: c.id, name: c.name, slug: c.slug, icon: c.icon ?? "", sort_order: c.sort_order, active: c.active })} className="p-2 text-muted-foreground hover:text-primary"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => void removeCat(c)} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
                {cats.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">Категорий нет</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminShop;

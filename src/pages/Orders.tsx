import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { listMyOrders } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";
import { Search, RotateCcw, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface OrderItem {
  id?: string;
  price: number;
  card_snapshot?: Record<string, unknown>;
  digital_product_id?: string;
  product_title?: string;
  product_type?: string;
  product_text_content?: string;
}
interface Order { id: string; total: number; status: string; created_at: string; order_items?: OrderItem[]; }

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const data = await listMyOrders();
        setOrders(
          data.map((o) => ({
            id: o.id,
            total: Number(o.total ?? 0),
            status: o.status,
            created_at: o.created_at,
            order_items: (o.order_items ?? []).map((it) => ({
              id: it.id,
              price: Number(it.unit_price ?? 0) * Number(it.quantity ?? 1),
              digital_product_id: it.product_id ?? it.id,
              product_title: it.title,
              product_type: "DIGITAL",
              product_text_content: it.delivered_content ?? undefined,
            })),
          })),
        );
      } catch { setOrders([]); }
    })();
  }, [user]);

  const buildLines = (o: Order) => {
    const items = o.order_items ?? [];
    const lines: string[] = [];
    for (const it of items) {
      const c = (it.card_snapshot ?? {}) as Record<string, any>;
      if (it.product_text_content) {
        lines.push(...String(it.product_text_content).split("\n").filter(Boolean));
      } else if (c.cc_number || c.cc_data) {
        const month = c.exp_month != null ? String(c.exp_month).padStart(2, "0") : "null";
        const year = c.exp_year != null ? String(c.exp_year) : "null";
        lines.push(
          [c.base ?? "N/A", c.cc_number ?? c.cc_data, `${month}/${year}`, c.cvv ?? "null",
           c.holder_name ?? "null", c.address ?? "null", c.city ?? "null", c.state ?? "null",
           c.zip ?? "null", c.country ?? "null", c.phone ?? "null", c.email ?? "null",
           `$${Number(it.price).toFixed(2)}`].join("|"),
        );
      } else if (it.product_title) {
        lines.push(`${it.product_title} | $${Number(it.price).toFixed(2)}`);
      }
    }
    return lines;
  };

  const downloadTxt = (name: string, lines: string[]) => {
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  };

  const download = (o: Order) => {
    setDownloading(o.id);
    try {
      const lines = buildLines(o);
      if (!lines.length) { toast.error("Нет данных для скачивания"); return; }
      downloadTxt(`${o.id.slice(0, 12)}.txt`, lines);
      toast.success("Скачано");
    } finally { setDownloading(null); }
  };

  const downloadSelected = () => {
    const chosen = orders.filter((o) => selected[o.id]);
    if (!chosen.length) { toast.error("Выберите заказы"); return; }
    const lines = chosen.flatMap((o) => buildLines(o));
    if (!lines.length) { toast.error("Нет данных для скачивания"); return; }
    downloadTxt(`orders-${Date.now()}.txt`, lines);
    toast.success("Скачано");
  };

  const filtered = useMemo(
    () => orders.filter((o) => o.id.toLowerCase().includes(query.toLowerCase())),
    [orders, query],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * perPage, current * perPage);
  const allChecked = rows.length > 0 && rows.every((o) => selected[o.id]);

  const fmtTime = (s: string) => {
    const d = new Date(s);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  };

  const pageNumbers = () => {
    const out: (number | "…")[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i <= 6 || i === totalPages) out.push(i);
      else if (out[out.length - 1] !== "…") out.push("…");
    }
    return out;
  };

  return (
    <AppShell>
      <div className="text-[13px] text-[#333]">
        {/* Search bar */}
        <div className="bg-white border border-[#e6e6e6] px-4 py-3 flex flex-wrap items-center gap-3">
          <label className="font-medium text-[#333]">Номер заказа</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { setQuery(q); setPage(1); } }}
            placeholder="Введите номер заказа"
            className="h-8 w-[230px] border border-[#dcdcdc] px-2 text-[13px] font-mono outline-none focus:border-[#4fc3f7]"
          />
          <button
            onClick={() => { setQuery(q); setPage(1); }}
            className="h-8 px-4 bg-[#409eff] hover:bg-[#3a8ee6] text-white text-[13px] inline-flex items-center gap-1.5 transition"
          >
            <Search className="h-3.5 w-3.5" /> Поиск
          </button>
          <button
            onClick={() => { setQ(""); setQuery(""); setPage(1); }}
            className="h-8 px-4 border border-[#dcdcdc] text-[#555] hover:bg-[#f7f7f7] text-[13px] inline-flex items-center gap-1.5 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Сброс
          </button>
          <button
            onClick={downloadSelected}
            className="h-8 px-4 ml-auto bg-[#e8f5e9] hover:bg-[#dcedc8] border border-[#c8e6c9] text-[#2e7d32] text-[13px] transition"
          >
            Скачать выбранные
          </button>
        </div>

        {/* Notice */}
        <div className="mt-3 bg-[#fdf6ec] border border-[#faecd8] text-[#e6a23c] px-4 py-2.5 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-[1px] shrink-0" />
          <span>
            Внимание: последние заказы могут появиться не сразу. Если ваш заказ не отображается, подождите
            несколько секунд, обновите страницу и попробуйте скачать снова.
          </span>
        </div>

        {/* Table */}
        <div className="mt-3 border border-[#e6e6e6] bg-white overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[#fafafa] text-[#606266]">
              <tr>
                <th className="p-3 w-10 border-b border-[#eee]">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={(e) => {
                      const next = { ...selected };
                      rows.forEach((o) => { next[o.id] = e.target.checked; });
                      setSelected(next);
                    }}
                  />
                </th>
                <th className="p-3 text-center font-normal border-b border-[#eee]">Номер заказа</th>
                <th className="p-3 text-center font-normal border-b border-[#eee] w-[280px]">Время оплаты</th>
                <th className="p-3 text-center font-normal border-b border-[#eee] w-[160px]">Операция</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id} className="border-b border-[#f0f0f0] hover:bg-[#fafcff] transition">
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={!!selected[o.id]}
                      onChange={(e) => setSelected({ ...selected, [o.id]: e.target.checked })}
                    />
                  </td>
                  <td className="p-3 text-center font-mono text-[#333]">{o.id.replace(/-/g, "")}</td>
                  <td className="p-3 text-center text-[#606266]">{fmtTime(o.created_at)}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => download(o)}
                      disabled={downloading === o.id}
                      className="text-[#409eff] hover:underline disabled:opacity-60"
                    >
                      {downloading === o.id ? "Загрузка…" : "Скачать"}
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={4} className="p-12 text-center text-[#909399]">Нет заказов</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2 text-[13px] text-[#606266]">
          <span>Всего {filtered.length}</span>
          <select
            value={perPage}
            onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
            className="h-7 border border-[#dcdcdc] px-2 bg-white outline-none"
          >
            {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n} / стр.</option>)}
          </select>
          <button
            onClick={() => setPage(Math.max(1, current - 1))}
            disabled={current === 1}
            className="h-7 w-7 border border-[#dcdcdc] bg-white inline-flex items-center justify-center disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          {pageNumbers().map((p, i) =>
            p === "…" ? (
              <span key={`e${i}`} className="px-1">…</span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`h-7 min-w-7 px-2 border text-[13px] ${p === current ? "bg-[#409eff] border-[#409eff] text-white" : "bg-white border-[#dcdcdc] hover:text-[#409eff]"}`}
              >
                {p}
              </button>
            ),
          )}
          <button
            onClick={() => setPage(Math.min(totalPages, current + 1))}
            disabled={current === totalPages}
            className="h-7 w-7 border border-[#dcdcdc] bg-white inline-flex items-center justify-center disabled:opacity-40"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <span className="ml-2">Перейти</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            defaultValue={current}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const v = Number((e.target as HTMLInputElement).value);
                if (v >= 1 && v <= totalPages) setPage(v);
              }
            }}
            className="h-7 w-14 border border-[#dcdcdc] px-2 outline-none focus:border-[#4fc3f7]"
          />
        </div>
      </div>
    </AppShell>
  );
};

export default Orders;

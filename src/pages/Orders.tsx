import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { listMyOrders } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";
import { Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface OrderItem { 
  id?: string; price: number; 
  card_snapshot?: Record<string, unknown>; card_id?: string; 
  brand?: string; bin?: string; country?: string; last4?: string; city?: string; state?: string; zip?: string; base?: string; exp_month?: string; exp_year?: string;
  digital_product_id?: string; product_title?: string; product_type?: string; product_video_url?: string; product_download_url?: string; product_text_content?: string; product_guidelines?: string;
}
interface Order { id: string; total: number; status: string; created_at: string; order_items?: OrderItem[]; items?: OrderItem[]; }

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ExternalLink, Video, FileText, Wrench, UserCircle, CreditCard, PackageX } from "lucide-react";

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [q, setQ] = useState("");
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

  const getItems = (o: Order) => o.order_items ?? o.items ?? [];

  const download = async (o: Order) => {
    const items = getItems(o);
    const date = new Date(o.created_at);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    setDownloading(o.id);
    try {
      // Fetch full card data for each item via reveal endpoint
      const revealedCards = items.map((it) => ({ ...it, revealed: null as Record<string, unknown> | null }));

      const lines = [
        `Order: ${o.id}`,
        `Date: ${date.toLocaleString()}`,
        `Total: $${Number(o.total).toFixed(2)}`,
        `Items: ${items.length}`,
        `Format: base|cc|month/year|cvv|name|address|city|state|zip|country|phonenumber|email|price`,
        `---`,
      ];

      for (const it of revealedCards) {
        if (it.digital_product_id) {
          lines.push(`Product: ${it.product_title}`);
          lines.push(`Type: ${it.product_type}`);
          if (it.product_video_url) lines.push(`Video: ${it.product_video_url}`);
          if (it.product_download_url) lines.push(`Download: ${it.product_download_url}`);
          if (it.product_text_content) lines.push(`Data: ${it.product_text_content}`);
          if (it.product_guidelines) lines.push(`Guidelines: ${it.product_guidelines}`);
          lines.push(`Price: $${Number(it.price).toFixed(2)}`);
          lines.push(`---`);
        } else {
          const c = (it.revealed ?? it.card_snapshot ?? it) as Record<string, any>;
          const base = c.base ?? "N/A";
          const cc = c.cc_number ?? c.cc_data ?? "N/A";
          const month = c.exp_month != null ? String(c.exp_month).padStart(2, "0") : "null";
          const year = c.exp_year != null ? String(c.exp_year) : "null";
          const expiry = `${month}/${year}`;
          const cvv = c.cvv ?? "null";
          const name = c.holder_name ?? c.name ?? "null";
          const addr = c.address ?? c.addr ?? "null";
          const city = c.city ?? "null";
          const state = c.state ?? "null";
          const zip = c.zip ?? "null";
          const country = c.country ?? "null";
          const tel = c.phone ?? c.tel ?? "null";
          const email = c.email ?? "null";
          const price = `$${Number(it.price).toFixed(2)}`;
          lines.push(`${base}|${cc}|${expiry}|${cvv}|${name}|${addr}|${city}|${state}|${zip}|${country}|${tel}|${email}|${price}`);
        }
      }

      const blob = new Blob([lines.join("\n")], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `order-${dateStr}-${o.id.slice(0, 8)}.txt`; a.click();
      URL.revokeObjectURL(url);
      toast.success("Downloaded");
    } catch (e) {
      toast.error("Download failed");
    } finally {
      setDownloading(null);
    }
  };

  const filtered = orders.filter((o) => o.id.toLowerCase().includes(q.toLowerCase()));

  return (
    <AppShell>
      <div className="space-y-5">
        <h1 className="font-display text-3xl font-black neon-text">ORDERS</h1>

        <div className="glass rounded-2xl p-4 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by order id" className="pl-10 bg-input/60" />
          </div>
        </div>

        <div className="glass rounded-2xl p-4 text-sm text-warning bg-warning/5 border-warning/20 border">
          ⚠️ Notice: Once cleared, orders cannot be recovered. Save your downloads to a safe place.
        </div>

        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Order</th>
                <th className="p-3 text-left">Items</th>
                <th className="p-3 text-left">Total</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-t border-border/40 hover:bg-secondary/30 transition">
                  <td className="p-3 font-mono text-xs">{o.id.slice(0, 16)}…</td>
                  <td className="p-3">{getItems(o).length}</td>
                  <td className="p-3 font-display text-primary-glow">${Number(o.total).toFixed(2)}</td>
                  <td className="p-3 text-muted-foreground">{new Date(o.created_at).toLocaleString()}</td>
                  <td className="p-3 text-right space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-primary">
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl bg-background/95 backdrop-blur-xl border-border/40 max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Order Details - {o.id.slice(0, 8)}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          {getItems(o).map((it, idx) => (
                            <div key={idx} className="glass p-4 rounded-xl border border-border/40 space-y-3">
                              {it.digital_product_id ? (
                                <>
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-primary-glow">{it.product_title}</h4>
                                    <span className="text-[10px] uppercase font-bold tracking-widest bg-primary/20 px-2 py-0.5 rounded">
                                      {it.product_type}
                                    </span>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                    {it.product_video_url && (
                                      <a href={it.product_video_url} target="_blank" rel="noreferrer" 
                                        className="flex items-center gap-2 p-2 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition">
                                        <Video className="h-4 w-4" /> Watch Video
                                      </a>
                                    )}
                                    {it.product_download_url && (
                                      <a href={it.product_download_url} target="_blank" rel="noreferrer"
                                        className="flex items-center gap-2 p-2 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 transition">
                                        <Download className="h-4 w-4" /> Download Files
                                      </a>
                                    )}
                                  </div>

                                  {it.product_text_content && (
                                    <div className="space-y-1">
                                      <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Product Data</label>
                                      <pre className="bg-black/40 p-3 rounded font-mono text-xs whitespace-pre-wrap break-all border border-border/20">
                                        {it.product_text_content}
                                      </pre>
                                    </div>
                                  )}

                                  {it.product_guidelines && (
                                    <div className="space-y-1">
                                      <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Guidelines</label>
                                      <p className="text-xs text-muted-foreground">{it.product_guidelines}</p>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-primary-glow">Card - {it.bin}</h4>
                                    <span className="text-[10px] uppercase font-bold tracking-widest bg-secondary px-2 py-0.5 rounded">
                                      {it.brand}
                                    </span>
                                  </div>
                                  <p className="text-xs font-mono bg-black/40 p-2 rounded border border-border/20">
                                    {(it.card_snapshot?.cc_number as string) || (it.card_snapshot?.cc_data as string) || "Reveal via download"}
                                  </p>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button size="sm" variant="outline" onClick={() => download(o)} disabled={downloading === o.id} className="border-primary/40 text-primary-glow">
                      <Download className="h-3 w-3 mr-1" /> {downloading === o.id ? "Loading…" : "Download"}
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">No orders yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
};

export default Orders;

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { cartApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Trash2, ShoppingBag, CreditCard } from "lucide-react";
import { BrandLogo, countryFlag } from "@/lib/brands";
import { toast } from "sonner";

interface Card { id: string; bin: string; brand: string; country: string; price: number; base: string; exp_month: string | null; exp_year: string | null; }
interface DigitalProduct { id: string; title: string; price: number; type: string; }
interface Item { 
  id: string; 
  card?: Card; 
  digital_product_id?: string;
  product?: DigitalProduct;
}

const Cart = () => {
  const { user, profile, refresh } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!user) return;
    try {
      const { items: raw } = await cartApi.list();
      const list: Item[] = (raw ?? []).map((r) => ({ 
        id: r.id, 
        card: r.card as unknown as Card,
        digital_product_id: r.digital_product_id,
        product: r.product as unknown as DigitalProduct
      }));
      setItems(list);
      setSelected(new Set(list.map((i) => i.id)));
    } catch { setItems([]); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const remove = async (id: string) => {
    try { await cartApi.remove(id); } catch { /* ignore */ }
    setItems((arr) => arr.filter((i) => i.id !== id));
    setSelected((s) => { const n = new Set(s); n.delete(id); return n; });
    window.dispatchEvent(new Event("cart-updated"));
  };

  const toggle = (id: string) =>
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const selectedItems = items.filter((i) => selected.has(i.id));
  const total = selectedItems.reduce((s, i) => s + Number(i.card?.price ?? i.product?.price ?? 0), 0);

  const checkout = async () => {
    if (!user || !profile) return;
    if (selectedItems.length === 0) return toast.error("Select at least one item");
    if (Number(profile.balance) < total) return toast.error("Insufficient balance — please recharge");
    setBusy(true);
    try {
      const card_ids = selectedItems.filter(i => i.card).map((i) => i.card!.id);
      const digital_product_ids = selectedItems.filter(i => i.product).map(i => i.product!.id);
      
      await cartApi.checkout({ card_ids, digital_product_ids });
      toast.success(`Order placed — $${total.toFixed(2)}`);
      window.dispatchEvent(new Event("cart-updated"));
      await refresh();
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Checkout failed");
    } finally { setBusy(false); }
  };

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-3xl font-black neon-text">CART</h1>
            <p className="text-sm text-muted-foreground mt-1">{items.length} item(s) · {selectedItems.length} selected</p>
          </div>
          <div className="glass-neon rounded-xl px-4 py-3 flex items-center gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Selected total</p>
              <p className="font-display text-2xl font-bold neon-text">${total.toFixed(2)}</p>
            </div>
            <Button onClick={checkout} disabled={busy || total === 0} className="bg-gradient-primary shadow-neon">
              <CreditCard className="h-4 w-4 mr-2" />Pay all
            </Button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Your cart is empty. Browse the Shop to add cards.</p>
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3 w-10"></th>
                  <th className="p-3 text-left">Item</th>
                  <th className="p-3 text-left">Details</th>
                  <th className="p-3 text-right">Price</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-t border-border/40 hover:bg-secondary/30 transition">
                    <td className="p-3">
                      <input type="checkbox" checked={selected.has(it.id)} onChange={() => toggle(it.id)}
                        className="accent-primary h-4 w-4" />
                    </td>
                    <td className="p-3">
                      {it.card ? (
                        <div className="flex items-center gap-2">
                          <BrandLogo brand={it.card.brand} />
                          <span className="font-mono">{it.card.bin}••••</span>
                        </div>
                      ) : (
                        <div className="font-semibold">{it.product?.title}</div>
                      )}
                    </td>
                    <td className="p-3">
                      {it.card ? (
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>{countryFlag(it.card.country)} {it.card.country}</span>
                          <span>{it.card.exp_month}/{it.card.exp_year}</span>
                        </div>
                      ) : (
                        <span className="text-xs uppercase tracking-wider bg-primary/20 text-primary-glow px-2 py-0.5 rounded">
                          {it.product?.type}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right font-display font-bold text-primary-glow">
                      ${Number(it.card?.price ?? it.product?.price ?? 0).toFixed(2)}
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={() => remove(it.id)} className="text-muted-foreground hover:text-destructive transition">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default Cart;

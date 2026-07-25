import { supabase } from "@/integrations/supabase/client";

export type DeliveryType = "key" | "download" | "instant";

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number;
  active: boolean;
}

export interface Product {
  id: string;
  category_id: string | null;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  image_url: string | null;
  price: number;
  compare_at_price: number | null;
  delivery_type: DeliveryType;
  download_url: string | null;
  instant_content: string | null;
  featured: boolean;
  active: boolean;
  sold_count: number;
  stock: number;
  created_at: string;
  bin: string | null;
  brand: string | null;
  country: string | null;
  base: string | null;
  exp_month: string | null;
  exp_year: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  has_phone: boolean;
  has_email: boolean;
  refundable: boolean;
}


export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  title: string;
  unit_price: number;
  quantity: number;
  delivered_content: string | null;
}

export interface Order {
  id: string;
  user_id: string;
  order_no: string;
  status: string;
  total: number;
  created_at: string;
  order_items?: OrderItem[];
}

export interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  method: string;
  status: string;
  reference: string | null;
  admin_note: string | null;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  instructions: string | null;
  address: string | null;
  active: boolean;
  sort_order: number;
}

export interface AdminUserRow {
  id: string;
  username: string;
  email: string | null;
  balance: number;
  blocked: boolean;
  created_at: string;
  roles: string[];
}

const num = (v: unknown) => Number(v ?? 0);

/* ---------------- catalog ---------------- */

export const listCategories = async (includeInactive = false): Promise<Category[]> => {
  let q = supabase.from("categories").select("*").order("sort_order");
  if (!includeInactive) q = q.eq("active", true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Category[];
};

export const listProducts = async (opts: { categoryId?: string | null; search?: string; includeInactive?: boolean } = {}) => {
  let q = supabase.from("products").select("*").order("created_at", { ascending: false });
  if (!opts.includeInactive) q = q.eq("active", true);
  if (opts.categoryId) q = q.eq("category_id", opts.categoryId);
  if (opts.search?.trim()) q = q.ilike("title", `%${opts.search.trim()}%`);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((p) => ({ ...p, price: num(p.price), compare_at_price: p.compare_at_price == null ? null : num(p.compare_at_price) })) as Product[];
};

export const purchaseProduct = async (productId: string, quantity: number) => {
  const { data, error } = await supabase.rpc("purchase_product", { _product_id: productId, _quantity: quantity });
  if (error) throw new Error(translatePurchaseError(error.message));
  return data as string;
};

/** Purchase then return the actually delivered content (keys / link / text). */
export const purchaseAndDeliver = async (
  productId: string,
  quantity = 1,
): Promise<{ orderId: string; content: string }> => {
  const orderId = await purchaseProduct(productId, quantity);
  const { data, error } = await supabase
    .from("order_items")
    .select("delivered_content, title")
    .eq("order_id", orderId);
  if (error) throw error;
  const content = (data ?? [])
    .map((i) => (i.delivered_content ?? "").trim())
    .filter(Boolean)
    .join("\n");
  return { orderId, content };
};


export const translatePurchaseError = (msg: string) => {
  if (msg.includes("insufficient_balance")) return "Недостаточно средств на балансе.";
  if (msg.includes("out_of_stock")) return "Товар закончился.";
  if (msg.includes("product_unavailable")) return "Товар недоступен.";
  if (msg.includes("invalid_quantity")) return "Некорректное количество.";
  if (msg.includes("not_authenticated")) return "Войдите в аккаунт.";
  return msg;
};

/* ---------------- orders ---------------- */

export const listMyOrders = async (): Promise<Order[]> => {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Order[];
};

/* ---------------- deposits ---------------- */

export const listPaymentMethods = async (includeInactive = false): Promise<PaymentMethod[]> => {
  let q = supabase.from("payment_methods").select("*").order("sort_order");
  if (!includeInactive) q = q.eq("active", true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as PaymentMethod[];
};

export const listMyDeposits = async (): Promise<Deposit[]> => {
  const { data, error } = await supabase.from("deposits").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Deposit[];
};

export const createDeposit = async (input: { amount: number; method: string; reference: string }) => {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Войдите в аккаунт.");
  const { error } = await supabase.from("deposits").insert({
    user_id: auth.user.id,
    amount: input.amount,
    method: input.method,
    reference: input.reference,
    status: "pending",
  });
  if (error) throw error;
};

/* ---------------- admin ---------------- */

export const adminListUsers = async (): Promise<AdminUserRow[]> => {
  const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
    supabase.from("profiles").select("id, username, email, balance, blocked, created_at").order("created_at", { ascending: false }),
    supabase.from("user_roles").select("user_id, role"),
  ]);
  if (pErr) throw pErr;
  if (rErr) throw rErr;
  const byUser = new Map<string, string[]>();
  (roles ?? []).forEach((r) => {
    const list = byUser.get(r.user_id) ?? [];
    list.push(r.role as string);
    byUser.set(r.user_id, list);
  });
  return (profiles ?? []).map((p) => ({
    id: p.id,
    username: p.username,
    email: p.email,
    balance: num(p.balance),
    blocked: Boolean(p.blocked),
    created_at: p.created_at,
    roles: byUser.get(p.id) ?? [],
  }));
};

export const adminAdjustBalance = async (userId: string, amount: number, description: string) => {
  const { error } = await supabase.rpc("admin_adjust_balance", { _user_id: userId, _amount: amount, _description: description });
  if (error) throw error;
};

export const adminSetRole = async (userId: string, role: "admin" | "seller" | "buyer", grant: boolean) => {
  const { error } = await supabase.rpc("admin_set_role", { _user_id: userId, _role: role, _grant: grant });
  if (error) throw error;
};

export const adminSetBlocked = async (userId: string, blocked: boolean) => {
  const { error } = await supabase.from("profiles").update({ blocked }).eq("id", userId);
  if (error) throw error;
};

export const adminListDeposits = async (): Promise<(Deposit & { username?: string })[]> => {
  const { data, error } = await supabase.from("deposits").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  const ids = [...new Set((data ?? []).map((d) => d.user_id))];
  if (ids.length === 0) return [];
  const { data: profs } = await supabase.from("profiles").select("id, username").in("id", ids);
  const nameById = new Map((profs ?? []).map((p) => [p.id, p.username]));
  return (data ?? []).map((d) => ({ ...d, amount: num(d.amount), username: nameById.get(d.user_id) })) as (Deposit & { username?: string })[];
};

export const adminSetDepositStatus = async (id: string, status: string, note?: string) => {
  const { error } = await supabase.rpc("admin_set_deposit_status", { _deposit_id: id, _status: status, _note: note });
  if (error) throw error;
};

export const adminListOrders = async (): Promise<(Order & { username?: string })[]> => {
  const { data, error } = await supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(300);
  if (error) throw error;
  const ids = [...new Set((data ?? []).map((o) => o.user_id))];
  if (ids.length === 0) return [];
  const { data: profs } = await supabase.from("profiles").select("id, username").in("id", ids);
  const nameById = new Map((profs ?? []).map((p) => [p.id, p.username]));
  return (data ?? []).map((o) => ({ ...o, username: nameById.get(o.user_id) })) as unknown as (Order & { username?: string })[];
};

export const adminStats = async () => {
  const [users, products, orders, deposits] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("total"),
    supabase.from("deposits").select("amount, status"),
  ]);
  const revenue = (orders.data ?? []).reduce((s, o) => s + num(o.total), 0);
  const pendingDeposits = (deposits.data ?? []).filter((d) => d.status === "pending").length;
  return {
    users: users.count ?? 0,
    products: products.count ?? 0,
    orders: (orders.data ?? []).length,
    revenue,
    pendingDeposits,
  };
};

/* ---------------- site settings ---------------- */

export const readSiteSettings = async (): Promise<Record<string, string>> => {
  const { data, error } = await supabase.from("site_settings").select("key, value");
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value ?? ""]));
};

export const writeSiteSetting = async (key: string, value: string) => {
  const { error } = await supabase.from("site_settings").upsert({ key, value }, { onConflict: "key" });
  if (error) throw error;
};

/* ---------------- admin: catalog ---------------- */

export interface ProductInput {
  id?: string;
  category_id: string | null;
  title: string;
  slug: string;
  short_description?: string | null;
  description?: string | null;
  image_url?: string | null;
  price: number;
  compare_at_price?: number | null;
  delivery_type: DeliveryType;
  download_url?: string | null;
  instant_content?: string | null;
  featured?: boolean;
  active?: boolean;
  bin?: string | null;
  brand?: string | null;
  country?: string | null;
  base?: string | null;
  exp_month?: string | null;
  exp_year?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  has_phone?: boolean;
  has_email?: boolean;
  refundable?: boolean;
}

export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || `item-${Date.now()}`;

export const adminSaveProduct = async (input: ProductInput): Promise<string> => {
  if (input.id) {
    const { id, ...rest } = input;
    const { error } = await supabase.from("products").update(rest).eq("id", id);
    if (error) throw error;
    return id;
  }
  const { data, error } = await supabase.from("products").insert(input).select("id").single();
  if (error) throw error;
  return data.id as string;
};

export const adminDeleteProduct = async (id: string) => {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
};

export const adminSaveCategory = async (input: { id?: string; name: string; slug: string; icon?: string | null; sort_order?: number; active?: boolean }) => {
  if (input.id) {
    const { id, ...rest } = input;
    const { error } = await supabase.from("categories").update(rest).eq("id", id);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from("categories").insert(input);
  if (error) throw error;
};

export const adminDeleteCategory = async (id: string) => {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
};

/** Bulk-add card/key lines to a product and re-sync its stock. */
export const adminAddKeys = async (productId: string, lines: string[]) => {
  const rows = lines.map((l) => l.trim()).filter(Boolean).map((content) => ({ product_id: productId, content }));
  if (rows.length === 0) return 0;
  const { error } = await supabase.from("product_keys").insert(rows);
  if (error) throw error;
  await adminSyncStock(productId);
  return rows.length;
};

export const adminSyncStock = async (productId: string) => {
  const { count, error } = await supabase
    .from("product_keys")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId)
    .eq("is_sold", false);
  if (error) throw error;
  await supabase.from("products").update({ stock: count ?? 0 }).eq("id", productId);
  return count ?? 0;
};

/* ---------------- admin: bulk CSV upload ----------------
   Format: bin,brand,country,state,city,zip,exp_month,exp_year,price
--------------------------------------------------------- */

export interface BulkCardRow {
  bin: string;
  brand: string;
  country: string;
  state: string;
  city: string;
  zip: string;
  exp_month: string;
  exp_year: string;
  price: number;
}

export const parseBulkCards = (text: string): { rows: BulkCardRow[]; errors: string[] } => {
  const rows: BulkCardRow[] = [];
  const errors: string[] = [];
  text.split(/\r?\n/).forEach((line, i) => {
    const raw = line.trim();
    if (!raw) return;
    if (/^bin\s*,/i.test(raw)) return; // header
    const parts = raw.split(",").map((p) => p.trim());
    if (parts.length < 9) { errors.push(`Строка ${i + 1}: нужно 9 полей`); return; }
    const [bin, brand, country, state, city, zip, m, y, price] = parts;
    if (!/^\d{6,8}$/.test(bin)) { errors.push(`Строка ${i + 1}: неверный BIN «${bin}»`); return; }
    const p = Number(price);
    if (!Number.isFinite(p) || p < 0) { errors.push(`Строка ${i + 1}: неверная цена «${price}»`); return; }
    rows.push({
      bin,
      brand: (brand || "").toUpperCase(),
      country: (country || "").toUpperCase(),
      state: state || "",
      city: city || "",
      zip: zip || "",
      exp_month: String(Number(m) || m).padStart(2, "0").slice(0, 2),
      exp_year: (y || "").slice(-2),
      price: p,
    });
  });
  return { rows, errors };
};

export const adminBulkCreateCards = async (rows: BulkCardRow[], categoryId: string | null = null) => {
  if (!rows.length) return 0;
  const payload = rows.map((r) => ({
    category_id: categoryId,
    title: `${r.brand || "CARD"} ${r.bin} · ${r.city || r.state || r.country}`,
    slug: `${r.bin}-${r.zip || "x"}-${Math.random().toString(36).slice(2, 8)}`,
    price: r.price,
    delivery_type: "instant" as DeliveryType,
    instant_content: `${r.bin} | ${r.exp_month}/${r.exp_year} | ${r.city} ${r.state} ${r.zip} | ${r.country}`,
    active: true,
    bin: r.bin,
    brand: r.brand || null,
    country: r.country || null,
    state: r.state || null,
    city: r.city || null,
    zip: r.zip || null,
    exp_month: r.exp_month || null,
    exp_year: r.exp_year || null,
  }));
  const { error } = await supabase.from("products").insert(payload);
  if (error) throw error;
  return payload.length;
};


/* -------- admin: publish full cards (Admin → Card Upload tab) --------
   Each parsed card becomes its own product with one product_key holding
   the full pipe-delimited line that the buyer downloads as .txt.
--------------------------------------------------------------------- */

export interface FullCardInput {
  cc: string;
  month: string;
  year: string;
  cvv: string;
  name: string;
  addr: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  tel: string;
  email: string;
  brand: string;
  bin: string;
  base: string;
  price: number;
  refundable: boolean;
  category_id?: string | null;
}

export const adminPublishFullCards = async (cards: FullCardInput[]) => {
  if (!cards.length) return 0;
  const clean = (s: string) => (!s || s.toLowerCase() === "null" ? "" : s);

  const products = cards.map((c) => ({
    category_id: c.category_id ?? null,
    title: `${c.brand} ${c.bin} · ${clean(c.city) || clean(c.state) || clean(c.country) || "—"}`,
    slug: `${c.bin}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    price: c.price,
    delivery_type: "key" as DeliveryType,
    active: true,
    bin: c.bin,
    brand: c.brand || null,
    country: clean(c.country) || null,
    state: clean(c.state) || null,
    city: clean(c.city) || null,
    zip: clean(c.zip) || null,
    exp_month: clean(c.month) || null,
    exp_year: clean(c.year) || null,
    base: c.base,
    refundable: c.refundable,
    has_phone: !!clean(c.tel),
    has_email: !!clean(c.email),
  }));

  const { data, error } = await supabase.from("products").insert(products).select("id");
  if (error) throw error;
  const ids = (data ?? []).map((r) => r.id as string);

  const keys = ids.map((id, i) => {
    const c = cards[i];
    const line = [
      c.base, c.price, c.cc, clean(c.month), clean(c.year), clean(c.cvv),
      clean(c.name), clean(c.addr), clean(c.city), clean(c.state), clean(c.zip),
      clean(c.country), clean(c.tel), clean(c.email), "", "",
    ].join("|");
    return { product_id: id, content: line };
  });

  if (keys.length) {
    const { error: kerr } = await supabase.from("product_keys").insert(keys);
    if (kerr) throw kerr;
    await Promise.all(ids.map((id) => adminSyncStock(id)));
  }
  return ids.length;
};

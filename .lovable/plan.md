# Full Backend Port to Lovable Cloud

Goal: vendor repo (`cruzercc.shop/api`) এর সব feature Lovable Cloud (Supabase-based) এ rebuild করা। Frontend already ported; শুধু API layer replace হবে। এখন `src/lib/api.ts` external VPS-এ call করে — সেটা replace হয়ে Supabase-এ যাবে।

---

## Phase 1 — Auth + Roles + Profiles (foundation)

**Tables (migration):**
- `profiles` — id (auth.users FK), username unique, email, avatar_url, telegram, created_at
- `user_roles` — id, user_id, role (enum: `buyer` | `seller` | `admin`)
- `app_role` enum + `has_role(uuid, app_role)` security-definer function
- Auto-create profile + default `buyer` role trigger on signup

**Auth setup:**
- Email/password (Lovable Cloud default) — Google/Apple বাদ (vendor username-based)
- Auth redirect: existing `/auth` page-এ Supabase call wiring
- Reset password flow → `/reset-password` route

**Rewrite:**
- `src/hooks/useAuth.tsx` → Supabase session
- `src/lib/api.ts` authApi block → Supabase calls
- `src/pages/Auth.tsx` (login/signup submit)
- `src/pages/ResetPassword.tsx`
- `src/components/ForgotPasswordDialog.tsx`
- Seller/Admin login routes → same auth + role check

---

## Phase 2 — Catalog (categories, cards, digital products)

**Tables:**
- `categories` — id, name, slug, icon, order, is_active
- `cards` — id, base, brand, country, price, stock/quantity, expire_at, seller_id, status
- `digital_products` — id, title, description, price, image_url, type, stock, seller_id
- Storage bucket for product images

**Server fns:**
- Public list (anon SELECT policy): categories, cards (list/bases/recent-stock), digital-products
- Authenticated: card reveal, my cards
- Admin: CRUD on all

**Frontend rewire:**
- `Shop.tsx`, `SuperShop.tsx`, `Index.tsx`
- Admin: `AdminCategories`, `AdminCards`, `AdminDigitalProducts`, `AdminStockReview`

---

## Phase 3 — Commerce (cart, orders, wallet, deposits)

**Tables:**
- `cart_items` — user_id, card_id / digital_product_id, added_at
- `orders` — user_id, total, status, created_at
- `order_items` — order_id, card_id/product_id, price
- `wallet_balances` — user_id, balance
- `wallet_transactions` — user_id, amount, type, ref, created_at
- `deposits` — user_id, amount, method, address, status, tx_hash
- `deposit_addresses` — admin-managed crypto addresses

**Server fns:**
- Cart: list/add/batch/remove/checkout
- Orders: mine/all
- Wallet: balance/transactions
- Deposits: create/list/confirm

**Frontend:** `Cart.tsx`, `Orders.tsx`, `Recharge.tsx`, `Dashboard.tsx`, `AdminPayments.tsx`, `AdminDepositAddresses.tsx`

---

## Phase 4 — Seller System

**Tables:**
- `seller_applications` — user_id, status, notes, applied_at
- `price_rules` — seller_id, base/brand pattern, markup %
- `seller_profiles` — payout_address, telegram, format prefs

**Server fns + admin approval flow**

**Frontend:** `SellerApply`, `SellerPanel`, `SellerUpload`, `SellerPriceRules`, `SellerProfile`, `SellerFormat`, `AdminApplications`, `AdminPayouts`

---

## Phase 5 — Support & Extras

**Tables:**
- `tickets` + `ticket_messages`
- `refunds` — order_id, reason, status
- `news` — title, body, published_at
- `site_settings` — key/value (single-row JSON)
- `boost_orders` — user_id, target, boost_type, expires_at

**Frontend:** `Tickets.tsx`, `BuyerRefunds.tsx`, `AdminRefunds.tsx`, `News.tsx`, `AdminSettings.tsx`, `AdminSiteSettings.tsx`, `AdminBoost.tsx`, `BoostTool.tsx`, `AdminPaymentGateway.tsx`

---

## Phase 6 — Route Gates + Cleanup

- Move all authenticated routes under `_authenticated/` layout
- Role-gate admin/seller paths via `has_role`
- Remove `src/lib/api.ts` external VPS calls entirely
- Remove old `getToken`/`localStorage` token system
- Remove `ClientApp` react-router-dom wrapper → move all pages to native TanStack routes (optional, can stay for now)

---

## Approach per phase

Each phase = 1 migration + N server functions + rewire N pages. আমি এক turn-এ **এক phase** shesh করবো, তারপর তুমি test করে বলবে next phase-এ যাবে কিনা।

## Excluded (until you ask)

- Real crypto payment gateway integration (BTC/USDT verify) — data model থাকবে, external verifier লাগবে
- Email templates customization
- Realtime updates (subscribe patterns)
- CSV bulk card import parsing
- CAPTCHA server-side verify (client-only stays)

## Order of execution

Phase 1 → 2 → 3 → 4 → 5 → 6

## First actionable step

**Phase 1 শুরু করবো।** এটার শেষে login/signup/logout সম্পূর্ণ Lovable Cloud-এ চলবে, তবে shop/cart/admin এখনও VPS-এ থাকবে (ভাঙবে না — parallel চলবে যতক্ষণ replace না হয়)।

তুমি এই plan approve করলে Phase 1 শুরু করি।

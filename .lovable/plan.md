# Magic-shop Design → এই TanStack Start প্রজেক্টে Port

সোর্স: `abexpoit-blip/magic-shop-design-6bed9c33` (Vite + react-router-dom + Supabase)।  
টার্গেট: এই TanStack Start প্রজেক্ট। **শুধু design/UI**, কোনো real backend/auth নেই — সব dummy in-memory data।

## যা করব

### 1. Theme + স্টাইল (foundation)
- `src/index.css`-এর royal-gold theme (pure black + 24k gold, gradients, glass, shadows) Tailwind v4 format-এ `src/styles.css`-এ port করব — `@theme inline` + `:root` HSL tokens।
- Google Fonts (Space Grotesk, Manrope, Instrument Serif, JetBrains Mono) `__root.tsx`-এ `<link>` দিয়ে load করব (Tailwind v4 rule — CSS `@import url` দিয়ে নয়)।
- `tailwind.config.ts`-এর কাস্টম colors/gradients/shadows/animations সব `@theme`-এ map করব।
- Custom utility classes (`glass`, `gold-text`, `neon-text`, `grid-bg`, ইত্যাদি) `@utility` block-এ port করব।

### 2. Router শিম
- সোর্স `react-router-dom` ব্যবহার করে। প্রতি ফাইলে rewrite এড়াতে `src/lib/router-compat.ts` বানাব যেটা TanStack Router-এর `Link`, `useNavigate`, `useParams`, `useLocation`, `Navigate`, `Outlet` re-export করে `react-router-dom`-compatible API-সহ।
- বাল্ক codemod: সব ported ফাইলে `from "react-router-dom"` → `from "@/lib/router-compat"`।

### 3. Dummy data layer
- `src/lib/api.ts`-এ সোর্সের সব API method (`newsApi`, `ordersApi`, `cardsApi`, `categoriesApi`, `announcementsApi`, seller/admin APIs, ইত্যাদি) হুবহু signature-এ থাকবে, কিন্তু hardcoded mock data return করবে।
- `src/hooks/useAuth.tsx` → static mock profile (buyer/seller/admin toggle dev-এর জন্য), `AuthProvider` no-op।
- `src/hooks/useSiteSettings.ts` → static settings object।
- `ProtectedRoute` / `AdminRoute` → শুধু children render, কোনো redirect না।

### 4. Components + Pages copy
- সব `src/components/ui/*` (মিসিং থাকলে যোগ)।
- `AppShell`, `AdminLayout`, `Seo`, `ScrollToTop`, `Captcha`, `TrustBadge`, `ForgotPasswordDialog`, `BuildBadge`, `RoleBadge`, ইত্যাদি port।
- সব ৪০+ পেজ কপি — imports fix + Seo/API calls dummy-এ পাস।

### 5. Routes wiring (TanStack file-based)
সোর্সের `App.tsx`-এর প্রতি path-এর জন্য `src/routes/`-এ একটা করে file তৈরি করব যেটা শুধু ported page component রেন্ডার করে:

```
routes/
  index.tsx              → Index
  auth.tsx               → Auth
  seller-login.tsx       → SellerLogin
  reset-password.tsx     → ResetPassword
  shop.tsx, super-shop.tsx, cart.tsx, orders.tsx, recharge.tsx,
  tickets.tsx, settings.tsx, news.tsx, refunds.tsx, dashboard.tsx,
  boost.tsx
  seller.tsx (+ index, apply, upload, format, price-rules, $id)
  admin.tsx (+ settings, site, applications, payouts, cards, refunds,
             deposit-addresses, payments, payment-gateway, stock-review,
             digital-products, boost, categories)
  crzr-x9k2-panel.tsx    → AdminLogin
```

- `__root.tsx`-এর title/description/og সবগুলা "cruzercc.shop" branding-এ update করব।
- Toaster + Sonner (dark) + TooltipProvider root-এ যোগ করব।

### 6. Dependencies
`bun add react-helmet-async qrcode.react next-themes vaul cmdk embla-carousel-react input-otp react-day-picker react-resizable-panels recharts date-fns react-hook-form @hookform/resolvers zod @tailwindcss/typography` (যেগুলো মিসিং)।

## যা করব না
- Supabase, real auth, RLS, edge functions — কিছুই না।
- Cart persistence, real orders/payments, stock refresh।
- Tests, playwright, color-audit scripts।
- `deploy.sh`, `vps-setup.sh`, nginx।

## সীমাবদ্ধতা (আগে থেকে জানিয়ে রাখছি)
- অনেক পেজে dynamic data-dependent UI আছে; dummy data দিয়ে দেখতে সঠিক হলেও কিছু edge state (empty, error) placeholder থাকবে।
- Auth flow visual-only — সব "login" ক্লিক করলেই dashboard-এ পাঠাবে।
- Admin CRUD forms দেখাবে কিন্তু submit no-op।

## Technical execution order
1. `bun add` মিসিং deps
2. Theme + fonts + utilities → `src/styles.css`, `__root.tsx`
3. `router-compat.ts` + dummy `api.ts` + stub hooks
4. `components/` bulk copy (sed করে imports fix)
5. `pages/` bulk copy (sed করে imports fix)
6. `routes/*.tsx` thin wrappers তৈরি
7. `bun run build` → typecheck errors ব্যাচে ফিক্স

কনফার্ম করলে শুরু করব। এটা কয়েক turn নেবে।
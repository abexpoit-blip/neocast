
## Scorpion-Shop style e sompurno redesign plan

Ami scorpionshopcc.su er login page dekhechi (reCAPTCHA thakay internal pages access hoyni). Style ta clear: **dark red background + giant scorpion mascot + translucent dark form + blue accent buttons + white text**.

Ager kaje **Home (`/`)** ar **Shop (`/shop`)** already Scorpion-style (dark navy nav #1f2d3d, teal active #4fc3f7, white content panels) e ache. Ekhon baki page gulao ei aesthetic e ante hobe.

---

### 1. Global theme layer
- Ekta `ScorpionAuthShell` component banabo — dark red radial bg + Scorpion logo/mascot + centered dark translucent card
- `ScorpionShell` (already exists) ke shob buyer page (Cart, Orders, Recharge, Tickets, Settings, News, Refunds, SuperShop, BoostTool) e apply korbo
- Semantic tokens use korbo (koi hardcode color na)

### 2. Auth pages (dark red + scorpion aesthetic)
- `src/pages/Auth.tsx` — Scorpion login layout (mascot bg, "Scorpion-Shop" title, Telegram line, username/password/captcha/reCAPTCHA-free math captcha/remember/Log in/Sign up)
- `src/pages/SellerLogin.tsx` — same shell, seller variant
- `src/pages/AdminLogin.tsx` — same shell, red admin variant (already close, polish)
- `src/pages/ResetPassword.tsx` — same shell

### 3. Buyer pages (ScorpionShell + white content)
Ei page gula ScorpionShell e wrap kore clean white-panel content:
- `Cart.tsx` — table + checkout summary
- `Orders.tsx` — order list table
- `Recharge.tsx` — recharge form + history
- `Tickets.tsx` — ticket list + new ticket
- `Settings.tsx` — profile/password/telegram tabs
- `News.tsx` — news feed
- `BuyerRefunds.tsx` — refund requests
- `SuperShop.tsx`, `BoostTool.tsx` — inventory tools

### 4. Seller pages (ScorpionShell variant with seller sub-nav)
- `SellerPanel`, `SellerApply`, `SellerUpload`, `SellerFormat`, `SellerPriceRules`, `SellerProfile`

### 5. Admin pages
- Admin er alada `AdminLayout` already ache — dark red accent e polish, but structure rakhbo

### Technical
- Colors: `--bg` dark red (`oklch(...)`), `--panel` white, `--nav` navy `#1f2d3d`, `--accent` blue `#2196f3`, `--accent-teal` `#4fc3f7`
- `src/styles.css` e Scorpion tokens add korbo
- Existing API calls, routing, auth logic **kono change na** — sudhu presentation

### Scope order (approve korle ei sequence e korbo)
1. **Auth + SellerLogin + AdminLogin + ResetPassword** (highest impact, first entry point)
2. **Cart, Orders, Recharge** (core buyer flow)
3. **Tickets, Settings, News, Refunds**
4. **Seller pages**
5. **Admin polish**

---

**Question:** ei plan approve korle full 5 steps ekbare korbo, naki step 1 (auth pages) age kore dekhaite chai? Sob ekbare korle onek boro change hobe.

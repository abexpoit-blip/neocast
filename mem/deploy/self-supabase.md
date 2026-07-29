---
name: Self-hosted Supabase for NeoCast
description: NeoCast uses its own self-hosted Supabase at supabase.neocast.cc on the VPS, not Lovable Cloud
type: feature
---

## Decision
NeoCast runs a **self-hosted Supabase** on the same VPS (157.173.117.34).
Lovable Cloud backend is only used inside the Lovable preview/editor.

## Endpoints
- **API / Auth / REST:** `https://supabase.neocast.cc`
- **Studio UI:** `http://157.173.117.34:8000` (basic auth — see credentials file)
- **Postgres:** `postgresql://postgres:<POSTGRES_PASSWORD>@127.0.0.1:5432/postgres`
- **Credentials file on VPS:** `/opt/supabase/credentials.json` (chmod 600)

## DNS (Namecheap)
| Type | Host | Value |
|---|---|---|
| A | `supabase` | 157.173.117.34 |

## Installer
`selfhost/setup-supabase.sh` — rebranded to NeoCast. Defaults:
- `DOMAIN_API=supabase.neocast.cc`
- `APP_DIR=/var/www/neocast-cc`
- `SITE_URL=https://neocast.cc`
It installs Docker, pulls the Supabase stack to `/opt/supabase`, generates keys,
applies `selfhost/schema.sql`, sets up nginx + SSL for the API domain, and
**overwrites `/var/www/neocast-cc/.env`** with the self-hosted keys plus `PORT=3002`.

## Seed users
`selfhost/create-users.mjs` creates `admin@neocast.cc` / `user@neocast.cc`
(passwords overridable via `ADMIN_PASS` / `USER_PASS`).

## Important
- Do NOT commit `/opt/supabase/credentials.json` values into the repo.
- After the installer runs, always `bun run build && pm2 restart neocast-cc --update-env`
  because `VITE_*` values are baked into the build.

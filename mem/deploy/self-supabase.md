---
name: Self-hosted Supabase for NeoCast
description: NeoCast runs its OWN isolated self-hosted Supabase stack at supabase.neocast.cc, separate from the zoru.cc stack on the same VPS
type: feature
---

## Decision
NeoCast runs a **dedicated self-hosted Supabase stack** on VPS 157.173.117.34,
completely separate from the existing zoru.cc Supabase at `/opt/supabase`.
Lovable Cloud backend is only used inside the Lovable preview/editor.

## Isolation (do not mix with zoru)
| Item | zoru.cc (do not touch) | NeoCast |
|---|---|---|
| Install dir | `/opt/supabase` | `/opt/supabase-neocast` |
| Compose project | default | `neocast` |
| Container prefix | `supabase-*` | `neocast-*` |
| Kong/API port | 8000 | **8001** |
| Postgres (pooler) | 5432 | **5433** |
| Transaction pooler | 6543 | **6544** |
| App port (pm2) | 3002 (`zoru-cc`) | **3003** (`neocast-cc`) |
| Domain | zoru.cc / api.zoru.cc | neocast.cc / supabase.neocast.cc |

## Endpoints
- API / Auth / REST: `https://supabase.neocast.cc` → `172.17.0.1:8001`
- Studio UI: `http://157.173.117.34:8001` (basic auth from credentials file)
- Postgres: `postgresql://postgres:<POSTGRES_PASSWORD>@127.0.0.1:5433/postgres`
- Credentials file: `/opt/supabase-neocast/credentials.json` (chmod 600)

## Installer
`selfhost/setup-supabase.sh` — all paths/ports overridable via env
(`BASE_DIR`, `STACK_NAME`, `KONG_PORT`, `PG_PORT`, `POOLER_PORT`, `APP_PORT`).
It writes a `docker-compose.override.yml` that renames containers and remaps
host ports, then overwrites `/var/www/neocast-cc/.env` with the self-hosted keys
and `PORT=3003`.

## Seed users
`selfhost/create-users.mjs` → `admin@neocast.cc` / `user@neocast.cc`
(passwords overridable via `ADMIN_PASS` / `USER_PASS`).

## Edge proxy
Host nginx is disabled; `nexus_nginx` (Docker) owns 80/443. NeoCast vhost lives at
`/opt/nexus/deployment/nginx/conf.d/neocast.cc.conf`. Reload with
`docker exec nexus_nginx nginx -t && docker exec nexus_nginx nginx -s reload`.

## Important
- Never commit credentials.json values, service_role keys or JWT secrets.
- After any `.env` change: `bun run build && pm2 restart neocast-cc --update-env`
  (VITE_* values are baked into the build).

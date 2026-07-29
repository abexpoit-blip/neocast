---
name: VPS deploy layout for neocast.cc
description: New target domain and planned deployment paths on the same VPS, separate from the existing zoru.cc setup
type: feature
---

## Target domain
- **Domain:** neocast.cc (purchased on Namecheap)
- **VPS:** same Ubuntu 24.04 box — 157.173.117.34
- **Planned app folder:** `/var/www/neocast-cc/`
- **Planned web root (inside nexus_nginx):** `/opt/nexus/deployment/certbot/www/neocast-cc/`
- **Planned nginx config:** `/opt/nexus/deployment/nginx/conf.d/neocast.cc.conf`
- **Planned Node port:** 3002 (3001 and 3010 already taken)
- **SSL cert path:** `/etc/letsencrypt/live/neocast.cc/`

## DNS records needed on Namecheap
| Type | Host | Value |
|---|---|---|
| A | `@` | 157.173.117.34 |
| A | `www` | 157.173.117.34 |

## Backend decision
Default plan: keep using the existing Lovable Cloud backend (current `.env` values). Only the frontend is self-hosted on the VPS. If a self-hosted Supabase is required later, use a separate install dir (`/opt/supabase-neocast`) and `api.neocast.cc`.

## Safe boundaries (same as zoru.cc)
- Do NOT touch `/opt/nexus-v2/` or the nexus_* containers.
- Only add a new vhost in `/opt/nexus/deployment/nginx/conf.d/`.
- Reload nginx with `docker exec nexus_nginx nginx -t && docker exec nexus_nginx nginx -s reload`.

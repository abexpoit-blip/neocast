---
name: VPS deploy layout for zoru.cc
description: Where the app lives on VPS 157.173.117.34, nginx config, and safe boundaries around the existing Nexus stack
type: feature
---

## VPS: 157.173.117.34 (Ubuntu 24.04)
User: root. SSH: `ssh root@157.173.117.34`.

## Existing (DO NOT TOUCH)
- ACTIVE Nexus stack lives in `/opt/nexus-v2/` (docker compose). `/opt/nexus/` has no compose file — do not use it.
- Containers: nexus_nginx, nexus_v2_app, nexus_frontend, nexus_api, nexus_bot, nexus_db, nexus_certbot
- nexus_nginx binds host ports 80/443
- Other sites in nginx conf.d: `ai.nexus-x.cloud.conf`, `default.conf`, `mithitrader.com.conf`
- Node apps on port 3010, 3001 (`/var/www/nexus-x-ai`, `/var/www/signal-landing`)

## Our zoru.cc setup
- Source/build folder: `/var/www/zoru-cc/` (git clone here)
- Web root (served by container): `/var/www/certbot/zoru-cc/` — this path is inside nexus_nginx container because `/opt/nexus/deployment/certbot/www` is mounted to `/var/www/certbot`. So host path = `/opt/nexus/deployment/certbot/www/zoru-cc/`.
- Nginx config: `/opt/nexus/deployment/nginx/conf.d/zoru.cc.conf` (backup at `.bak`)
- SSL cert: `/etc/letsencrypt/live/zoru.cc/` (auto-renew via nexus_certbot)
- GitHub repo: https://github.com/abexpoit-blip/the-happy-storefront

## Reload commands
```bash
docker exec nexus_nginx nginx -t && docker exec nexus_nginx nginx -s reload
```

## Ports available for Node process
3002 or higher (3001, 3010 taken).

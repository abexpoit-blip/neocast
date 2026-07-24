# Project Memory

## Core
Domain: zoru.cc (SSL live via nexus_certbot on VPS 157.173.117.34).
VPS project folder: `/var/www/zoru-cc/` (source/build). Web root served by nexus_nginx: `/var/www/certbot/zoru-cc/` (mounted in container).
Nginx config file: `/opt/nexus/deployment/nginx/conf.d/zoru.cc.conf` — DO NOT touch other nexus files.
GitHub repo: https://github.com/abexpoit-blip/the-happy-storefront (public).
Never touch Nexus stack (`/opt/nexus/`, nexus_* containers, other .conf files).
User prefers Bangla, beginner-friendly, step-by-step deploy commands with log-check.

## Memories
- [Deploy setup](mem://deploy/vps) — VPS layout, nginx config path, safe folders

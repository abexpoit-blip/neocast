#!/usr/bin/env bash
# Zoru Shop — Self-hosted Supabase installer for Ubuntu VPS (157.173.117.34 / zoru.cc)
# Run as root:  bash setup-supabase.sh
set -euo pipefail

# Resolve script dir BEFORE any cd
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

DOMAIN_API="${DOMAIN_API:-api.zoru.cc}"
BASE_DIR="/opt/supabase"
APP_DIR="/var/www/zoru-cc"

echo "==> 1/8 Installing Docker + tools"
apt-get update -y
apt-get install -y ca-certificates curl git jq nginx
install -m 0755 -d /etc/apt/keyrings
[ -f /etc/apt/keyrings/docker.asc ] || curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" > /etc/apt/sources.list.d/docker.list
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl enable --now docker 2>/dev/null || service docker start || true
docker info >/dev/null 2>&1 || { echo '!! Docker daemon start hoyni — run: systemctl start docker'; exit 1; }

echo "==> 2/8 Fetching Supabase docker stack"
mkdir -p "$BASE_DIR"
if [ ! -d "$BASE_DIR/docker" ]; then
  rm -rf /tmp/supabase-src
  git clone --depth 1 https://github.com/supabase/supabase /tmp/supabase-src
  cp -r /tmp/supabase-src/docker "$BASE_DIR/docker"
  cp "$BASE_DIR/docker/.env.example" "$BASE_DIR/docker/.env"
fi
cd "$BASE_DIR/docker"

echo "==> 3/8 Generating keys"
KEYS_FILE="$BASE_DIR/credentials.json"
if [ ! -f "$KEYS_FILE" ]; then
  node "$SCRIPT_DIR/gen-keys.mjs" > "$KEYS_FILE"
fi
chmod 600 "$KEYS_FILE"

get() { jq -r ".$1" "$KEYS_FILE"; }
JWT_SECRET=$(get JWT_SECRET)
ANON_KEY=$(get ANON_KEY)
SERVICE_ROLE_KEY=$(get SERVICE_ROLE_KEY)
POSTGRES_PASSWORD=$(get POSTGRES_PASSWORD)
DASHBOARD_USERNAME=$(get DASHBOARD_USERNAME)
DASHBOARD_PASSWORD=$(get DASHBOARD_PASSWORD)
SECRET_KEY_BASE=$(get SECRET_KEY_BASE)
VAULT_ENC_KEY=$(get VAULT_ENC_KEY)
LOGFLARE_KEY=$(get LOGFLARE_KEY)

echo "==> 4/8 Writing $BASE_DIR/docker/.env"
setenv() { # key value
  if grep -q "^$1=" .env; then
    sed -i "s|^$1=.*|$1=$2|" .env
  else
    echo "$1=$2" >> .env
  fi
}
setenv POSTGRES_PASSWORD "$POSTGRES_PASSWORD"
setenv JWT_SECRET "$JWT_SECRET"
setenv ANON_KEY "$ANON_KEY"
setenv SERVICE_ROLE_KEY "$SERVICE_ROLE_KEY"
setenv DASHBOARD_USERNAME "$DASHBOARD_USERNAME"
setenv DASHBOARD_PASSWORD "$DASHBOARD_PASSWORD"
setenv SECRET_KEY_BASE "$SECRET_KEY_BASE"
setenv VAULT_ENC_KEY "$VAULT_ENC_KEY"
setenv LOGFLARE_PUBLIC_ACCESS_TOKEN "$LOGFLARE_KEY"
setenv LOGFLARE_PRIVATE_ACCESS_TOKEN "$LOGFLARE_KEY"
setenv SITE_URL "https://zoru.cc"
setenv API_EXTERNAL_URL "https://$DOMAIN_API"
setenv SUPABASE_PUBLIC_URL "https://$DOMAIN_API"
setenv ADDITIONAL_REDIRECT_URLS "https://zoru.cc,https://zoru.cc/auth"
setenv DISABLE_SIGNUP "false"
setenv ENABLE_EMAIL_AUTOCONFIRM "true"
setenv ENABLE_EMAIL_SIGNUP "true"
setenv ENABLE_ANONYMOUS_USERS "false"
setenv JWT_EXPIRY "3600"
setenv KONG_HTTP_PORT "8000"
setenv KONG_HTTPS_PORT "8443"

echo "==> 5/8 Starting Supabase containers"
docker compose pull
docker compose up -d
sleep 25

echo "==> 6/8 Applying Zoru Shop schema"
SCHEMA="$SCRIPT_DIR/schema.sql"
docker compose exec -T db psql -U postgres -d postgres < "$SCHEMA" || echo "!! schema had warnings, check output above"

echo "==> 7/8 Nginx reverse proxy for $DOMAIN_API"
cat > /etc/nginx/sites-available/supabase.conf <<NGINX
server {
    listen 80;
    server_name $DOMAIN_API;
    client_max_body_size 50m;
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX
ln -sf /etc/nginx/sites-available/supabase.conf /etc/nginx/sites-enabled/supabase.conf
nginx -t && systemctl reload nginx
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d "$DOMAIN_API" --non-interactive --agree-tos -m admin@zoru.cc --redirect || echo "!! certbot failed — DNS A record for $DOMAIN_API -> this VPS lagbe"

echo "==> 8/8 Writing app env at $APP_DIR/.env"
if [ -d "$APP_DIR" ]; then
  cat > "$APP_DIR/.env" <<APPENV
VITE_SUPABASE_URL=https://$DOMAIN_API
VITE_SUPABASE_PUBLISHABLE_KEY=$ANON_KEY
VITE_SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_URL=https://$DOMAIN_API
SUPABASE_PUBLISHABLE_KEY=$ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
SUPABASE_DB_URL=postgresql://postgres:$POSTGRES_PASSWORD@127.0.0.1:5432/postgres
APPENV
  chmod 600 "$APP_DIR/.env"
fi

echo
echo "==================== SAVE THESE DETAILS ===================="
cat "$KEYS_FILE"
echo
echo "API URL      : https://$DOMAIN_API"
echo "Studio (UI)  : http://$(curl -s ifconfig.me):8000  (login: $DASHBOARD_USERNAME / $DASHBOARD_PASSWORD)"
echo "Postgres     : postgresql://postgres:$POSTGRES_PASSWORD@127.0.0.1:5432/postgres"
echo "Credentials file: $KEYS_FILE"
echo "============================================================"

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
if [ -f "$KEYS_FILE" ] && ! jq -e type "$KEYS_FILE" >/dev/null 2>&1; then
  BROKEN_KEYS_FILE="$KEYS_FILE.broken-$(date +%Y%m%d%H%M%S)"
  echo "!! Existing credentials.json is empty/corrupt — backing up to $BROKEN_KEYS_FILE and regenerating"
  mv "$KEYS_FILE" "$BROKEN_KEYS_FILE"
fi
if [ ! -s "$KEYS_FILE" ]; then
  node "$SCRIPT_DIR/gen-keys.mjs" > "$KEYS_FILE"
fi
chmod 600 "$KEYS_FILE"

# Older installs may have a credentials file generated before new Supabase
# Docker variables were required. Fill only missing values; never rotate keys.
node - "$KEYS_FILE" <<'NODE'
const fs = require('node:fs');
const crypto = require('node:crypto');
const file = process.argv[2];
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const rand = (n) => crypto.randomBytes(n).toString('hex');
const ensure = (key, value) => {
  if (!data[key] || data[key] === 'null') data[key] = typeof value === 'function' ? value() : value;
};
ensure('DASHBOARD_USERNAME', 'zoru');
ensure('SECRET_KEY_BASE', () => rand(32));
ensure('VAULT_ENC_KEY', () => rand(16));
ensure('REALTIME_DB_ENC_KEY', () => rand(8));
ensure('PG_META_CRYPTO_KEY', () => rand(16));
ensure('LOGFLARE_KEY', () => rand(16));
ensure('S3_PROTOCOL_ACCESS_KEY_ID', () => rand(16));
ensure('S3_PROTOCOL_ACCESS_KEY_SECRET', () => rand(32));
ensure('POOLER_TENANT_ID', () => `zoru${rand(6)}`);
fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
NODE

get() { jq -r ".$1" "$KEYS_FILE"; }
JWT_SECRET=$(get JWT_SECRET)
ANON_KEY=$(get ANON_KEY)
SERVICE_ROLE_KEY=$(get SERVICE_ROLE_KEY)
POSTGRES_PASSWORD=$(get POSTGRES_PASSWORD)
DASHBOARD_USERNAME=$(get DASHBOARD_USERNAME)
DASHBOARD_PASSWORD=$(get DASHBOARD_PASSWORD)
SECRET_KEY_BASE=$(get SECRET_KEY_BASE)
VAULT_ENC_KEY=$(get VAULT_ENC_KEY)
REALTIME_DB_ENC_KEY=$(get REALTIME_DB_ENC_KEY)
PG_META_CRYPTO_KEY=$(get PG_META_CRYPTO_KEY)
LOGFLARE_KEY=$(get LOGFLARE_KEY)
S3_PROTOCOL_ACCESS_KEY_ID=$(get S3_PROTOCOL_ACCESS_KEY_ID)
S3_PROTOCOL_ACCESS_KEY_SECRET=$(get S3_PROTOCOL_ACCESS_KEY_SECRET)
POOLER_TENANT_ID=$(get POOLER_TENANT_ID)

print_db_help() {
  echo
  echo "!! Supabase DB container healthy hoyni. Nicher log dekho:"
  docker compose ps || true
  docker compose logs --tail=120 db || true
  echo
  echo "!! Eta first install hole / Ctrl+C diye majhpothe stop kore thakle safe reset:"
  echo "cd $BASE_DIR/docker && docker compose down -v --remove-orphans && rm -rf volumes/db/data && cd $SCRIPT_DIR && bash setup-supabase.sh"
  echo "!! WARNING: ei reset existing self-host DB data delete kore. Data thakle age backup nao."
}

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
setenv REALTIME_DB_ENC_KEY "$REALTIME_DB_ENC_KEY"
setenv PG_META_CRYPTO_KEY "$PG_META_CRYPTO_KEY"
setenv LOGFLARE_PUBLIC_ACCESS_TOKEN "$LOGFLARE_KEY"
setenv LOGFLARE_PRIVATE_ACCESS_TOKEN "$LOGFLARE_KEY"
setenv S3_PROTOCOL_ACCESS_KEY_ID "$S3_PROTOCOL_ACCESS_KEY_ID"
setenv S3_PROTOCOL_ACCESS_KEY_SECRET "$S3_PROTOCOL_ACCESS_KEY_SECRET"
setenv SITE_URL "https://zoru.cc"
setenv API_EXTERNAL_URL "https://$DOMAIN_API/auth/v1"
setenv SUPABASE_PUBLIC_URL "https://$DOMAIN_API"
setenv ADDITIONAL_REDIRECT_URLS "https://zoru.cc,https://zoru.cc/auth"
setenv DISABLE_SIGNUP "false"
setenv ENABLE_EMAIL_AUTOCONFIRM "true"
setenv ENABLE_EMAIL_SIGNUP "true"
setenv ENABLE_ANONYMOUS_USERS "false"
setenv JWT_EXPIRY "3600"
setenv POSTGRES_HOST "db"
setenv POSTGRES_DB "postgres"
setenv POSTGRES_PORT "5432"
setenv KONG_HTTP_PORT "8000"
setenv KONG_HTTPS_PORT "8443"
setenv POOLER_PROXY_PORT_TRANSACTION "6543"
setenv POOLER_DEFAULT_POOL_SIZE "20"
setenv POOLER_MAX_CLIENT_CONN "100"
setenv POOLER_DB_POOL_SIZE "5"
setenv POOLER_TENANT_ID "$POOLER_TENANT_ID"
setenv PGRST_DB_SCHEMAS "public,graphql_public"
setenv PGRST_DB_MAX_ROWS "1000"
setenv PGRST_DB_EXTRA_SEARCH_PATH "public,extensions"
setenv STUDIO_DEFAULT_ORGANIZATION "Zoru Shop"
setenv STUDIO_DEFAULT_PROJECT "Zoru Shop"
setenv FUNCTIONS_VERIFY_JWT "false"

echo "==> 5/8 Starting Supabase containers"
docker compose pull
docker compose up -d || { print_db_help; exit 1; }
sleep 25
docker compose ps db | grep -q "healthy" || { print_db_help; exit 1; }

echo "==> 6/8 Applying Zoru Shop schema"
SCHEMA="$SCRIPT_DIR/schema.sql"
docker compose exec -T db psql -U postgres -d postgres < "$SCHEMA" || echo "!! schema had warnings, check output above"

echo "==> 7/8 Reverse proxy for $DOMAIN_API"
HOST_IP="$(hostname -I | awk '{print $1}')"

# Auto-detect the running nginx container that owns host ports 80/443 and read
# its real bind-mount host paths (may live in /opt/nexus, /opt/nexus-v2/deployment, ...).
NGINX_CT="$(docker ps --format '{{.Names}}' | grep -E 'nginx' | head -1 || true)"
NEXUS_CONF_DIR=""
NEXUS_WEBROOT=""
if [ -n "$NGINX_CT" ]; then
  NEXUS_CONF_DIR="$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/etc/nginx/conf.d"}}{{.Source}}{{end}}{{end}}' "$NGINX_CT" 2>/dev/null || true)"
  NEXUS_WEBROOT="$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/var/www/certbot"}}{{.Source}}{{end}}{{end}}' "$NGINX_CT" 2>/dev/null || true)"
  [ -z "$NEXUS_WEBROOT" ] && NEXUS_WEBROOT="$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/var/www/html"}}{{.Source}}{{end}}{{end}}' "$NGINX_CT" 2>/dev/null || true)"
fi


setup_nexus_nginx() {
  # Existing nginx container owns host ports 80/443 -> add our vhost there.
  ACME_LOC="location /.well-known/acme-challenge/ { proxy_pass http://$HOST_IP:8899; }"
  if [ -n "$NEXUS_WEBROOT" ]; then
    mkdir -p "$NEXUS_WEBROOT/.well-known/acme-challenge"
    ACME_LOC="location /.well-known/acme-challenge/ { root /var/www/certbot; }"
  fi
  cat > "$NEXUS_CONF_DIR/$DOMAIN_API.conf" <<NGINX
server {
    listen 80;
    server_name $DOMAIN_API;
    client_max_body_size 50m;
    $ACME_LOC
    location / {
        proxy_pass http://$HOST_IP:8000;
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
  docker exec "$NGINX_CT" nginx -t && docker exec "$NGINX_CT" nginx -s reload

  if [ ! -f "/etc/letsencrypt/live/$DOMAIN_API/fullchain.pem" ]; then
    apt-get install -y certbot
    if [ -n "$NEXUS_WEBROOT" ]; then
      certbot certonly --webroot -w "$NEXUS_WEBROOT" -d "$DOMAIN_API" \
        --non-interactive --agree-tos -m admin@zoru.cc \
        || echo "!! certbot failed — DNS A record $DOMAIN_API -> this VPS lagbe"
    else
      # No shared webroot mount: serve ACME from a temp local http server on 8899
      certbot certonly --standalone --http-01-port 8899 -d "$DOMAIN_API" \
        --non-interactive --agree-tos -m admin@zoru.cc \
        || echo "!! certbot failed — DNS A record $DOMAIN_API -> this VPS lagbe"
    fi
  fi


  if [ -f "/etc/letsencrypt/live/$DOMAIN_API/fullchain.pem" ]; then
    cat >> "$NEXUS_CONF_DIR/$DOMAIN_API.conf" <<NGINX

server {
    listen 443 ssl;
    http2 on;
    server_name $DOMAIN_API;
    client_max_body_size 50m;
    ssl_certificate     /etc/letsencrypt/live/$DOMAIN_API/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN_API/privkey.pem;
    location / {
        proxy_pass http://$HOST_IP:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
    }
}
NGINX
    docker exec nexus_nginx nginx -t && docker exec nexus_nginx nginx -s reload
  fi
}

setup_host_nginx() {
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
  nginx -t && (systemctl reload nginx || systemctl restart nginx)
  apt-get install -y certbot python3-certbot-nginx
  certbot --nginx -d "$DOMAIN_API" --non-interactive --agree-tos -m admin@zoru.cc --redirect \
    || echo "!! certbot failed — DNS A record $DOMAIN_API -> this VPS lagbe"
}

if docker ps --format '{{.Names}}' | grep -q '^nexus_nginx$' && [ -d "$NEXUS_CONF_DIR" ]; then
  echo "-- nexus_nginx detected (owns ports 80/443) -> adding vhost there"
  setup_nexus_nginx || echo "!! nexus_nginx vhost setup had errors, check above"
else
  setup_host_nginx || echo "!! host nginx setup had errors, check above"
fi


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

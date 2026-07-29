#!/usr/bin/env bash
# NeoCast — Self-hosted Supabase installer for Ubuntu VPS (157.173.117.34 / neocast.cc)
# Run as root:  bash setup-supabase.sh
set -euo pipefail

# Resolve script dir BEFORE any cd
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

DOMAIN_API="${DOMAIN_API:-supabase.neocast.cc}"
BASE_DIR="${BASE_DIR:-/opt/supabase-neocast}"
APP_DIR="${APP_DIR:-/var/www/neocast-cc}"
STACK_NAME="${STACK_NAME:-neocast}"      # docker compose project name (keeps it separate from other stacks)
KONG_PORT="${KONG_PORT:-8001}"           # host port for the Supabase API gateway
KONG_HTTPS_PORT_H="${KONG_HTTPS_PORT_H:-8444}"
PG_PORT="${PG_PORT:-5433}"               # host port for Postgres (pooler)
POOLER_PORT="${POOLER_PORT:-6544}"       # host port for the transaction pooler
APP_PORT="${APP_PORT:-3003}"

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

# Docker Compose only auto-merges an override whose name matches the base file
# family (compose.yaml -> compose.override.yaml, docker-compose.yml -> docker-compose.override.yml).
# Detect the base file and write the matching override name, otherwise the
# stack would fall back to upstream's hardcoded "supabase-*" container names
# and collide with another Supabase stack on this VPS.
if [ -f "$BASE_DIR/docker/compose.yaml" ]; then
  BASE_COMPOSE="$BASE_DIR/docker/compose.yaml"; OVERRIDE_FILE="$BASE_DIR/docker/compose.override.yaml"
elif [ -f "$BASE_DIR/docker/compose.yml" ]; then
  BASE_COMPOSE="$BASE_DIR/docker/compose.yml"; OVERRIDE_FILE="$BASE_DIR/docker/compose.override.yml"
elif [ -f "$BASE_DIR/docker/docker-compose.yaml" ]; then
  BASE_COMPOSE="$BASE_DIR/docker/docker-compose.yaml"; OVERRIDE_FILE="$BASE_DIR/docker/docker-compose.override.yaml"
else
  BASE_COMPOSE="$BASE_DIR/docker/docker-compose.yml"; OVERRIDE_FILE="$BASE_DIR/docker/docker-compose.override.yml"
fi

# Only override services that actually exist in the upstream compose file.
# Upstream removes/renames services over time (e.g. vector); overriding a
# missing one makes Compose fail with "has neither an image nor a build context".
BASE_SERVICES="$(awk '
  /^services:[[:space:]]*$/ {in_s=1; next}
  in_s && /^[^[:space:]#]/ {in_s=0}
  in_s && /^  [a-zA-Z0-9_-]+:[[:space:]]*$/ {gsub(/[: ]/,"",$0); print}
' "$BASE_COMPOSE")"

has_svc() { echo "$BASE_SERVICES" | grep -qx "$1"; }

# Isolate this stack: unique container names + unique host ports so it can run
# side by side with any other Supabase stack already on this VPS.
{
  echo "services:"
  for svc in studio kong auth rest realtime storage imgproxy meta analytics db vector; do
    has_svc "$svc" && echo "  $svc: { container_name: ${STACK_NAME}-$svc }"
  done
  has_svc functions && echo "  functions: { container_name: ${STACK_NAME}-edge-functions }"
  for pool in supavisor pooler; do
    if has_svc "$pool"; then
      echo "  $pool:"
      echo "    container_name: ${STACK_NAME}-pooler"
      # !override replaces the upstream ports list entirely, otherwise compose
      # merges them and we'd re-bind the other stack's 5432/6543.
      echo "    ports: !override"
      echo "      - \"127.0.0.1:${PG_PORT}:5432\""
      echo "      - \"127.0.0.1:${POOLER_PORT}:6543\""
    fi
  done

} > "$OVERRIDE_FILE"
echo "    override written: $OVERRIDE_FILE"
echo "    services detected: $(echo $BASE_SERVICES | tr '\n' ' ')"


# Safety: never touch containers that belong to another stack.
docker compose config --format json 2>/dev/null \
  | jq -r '.services | to_entries[] | .value.container_name // empty' 2>/dev/null \
  | grep -E '^supabase-' >/dev/null 2>&1 && {
    echo "!! Container names still resolve to upstream 'supabase-*' — override not merged. Aborting to avoid clashing with the other stack."
    exit 1
  }


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
ensure('DASHBOARD_USERNAME', 'neocast');
ensure('SECRET_KEY_BASE', () => rand(32));
ensure('VAULT_ENC_KEY', () => rand(16));
ensure('REALTIME_DB_ENC_KEY', () => rand(8));
ensure('PG_META_CRYPTO_KEY', () => rand(16));
ensure('LOGFLARE_KEY', () => rand(16));
ensure('S3_PROTOCOL_ACCESS_KEY_ID', () => rand(16));
ensure('S3_PROTOCOL_ACCESS_KEY_SECRET', () => rand(32));
ensure('POOLER_TENANT_ID', () => `neocast${rand(6)}`);
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
setenv SITE_URL "https://neocast.cc"
setenv API_EXTERNAL_URL "https://$DOMAIN_API/auth/v1"
setenv SUPABASE_PUBLIC_URL "https://$DOMAIN_API"
setenv ADDITIONAL_REDIRECT_URLS "https://neocast.cc,https://neocast.cc/auth"
setenv DISABLE_SIGNUP "false"
setenv ENABLE_EMAIL_AUTOCONFIRM "true"
setenv ENABLE_EMAIL_SIGNUP "true"
setenv ENABLE_ANONYMOUS_USERS "false"
setenv JWT_EXPIRY "3600"
setenv POSTGRES_HOST "db"
setenv POSTGRES_DB "postgres"
setenv POSTGRES_PORT "5432"
setenv COMPOSE_PROJECT_NAME "$STACK_NAME"
setenv KONG_HTTP_PORT "$KONG_PORT"
setenv KONG_HTTPS_PORT "$KONG_HTTPS_PORT_H"
setenv POOLER_PROXY_PORT_TRANSACTION "$POOLER_PORT"
setenv POOLER_DEFAULT_POOL_SIZE "20"
setenv POOLER_MAX_CLIENT_CONN "100"
setenv POOLER_DB_POOL_SIZE "5"
setenv POOLER_TENANT_ID "$POOLER_TENANT_ID"
setenv PGRST_DB_SCHEMAS "public,graphql_public"
setenv PGRST_DB_MAX_ROWS "1000"
setenv PGRST_DB_EXTRA_SEARCH_PATH "public,extensions"
setenv STUDIO_DEFAULT_ORGANIZATION "NeoCast"
setenv STUDIO_DEFAULT_PROJECT "NeoCast"
setenv FUNCTIONS_VERIFY_JWT "false"

echo "==> 5/8 Starting Supabase containers"
docker compose pull
docker compose up -d || { print_db_help; exit 1; }
sleep 25
docker compose ps db | grep -q "healthy" || { print_db_help; exit 1; }

echo "==> 6/8 Applying NeoCast schema"
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
        proxy_pass http://$HOST_IP:$KONG_PORT;
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
        --non-interactive --agree-tos -m admin@neocast.cc \
        || echo "!! certbot failed — DNS A record $DOMAIN_API -> this VPS lagbe"
    else
      # No shared webroot mount: serve ACME from a temp local http server on 8899
      certbot certonly --standalone --http-01-port 8899 -d "$DOMAIN_API" \
        --non-interactive --agree-tos -m admin@neocast.cc \
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
        proxy_pass http://$HOST_IP:$KONG_PORT;
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
    docker exec "$NGINX_CT" nginx -t && docker exec "$NGINX_CT" nginx -s reload
  fi
}

setup_host_nginx() {
  cat > /etc/nginx/sites-available/supabase.conf <<NGINX
server {
    listen 80;
    server_name $DOMAIN_API;
    client_max_body_size 50m;
    location / {
        proxy_pass http://127.0.0.1:$KONG_PORT;
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
  systemctl enable --now nginx 2>/dev/null || true
  nginx -t && (systemctl reload nginx || systemctl restart nginx) || {
    echo "!! host nginx start failed (port 80 probably taken by a container)"; return 1; }
  apt-get install -y certbot python3-certbot-nginx
  certbot --nginx -d "$DOMAIN_API" --non-interactive --agree-tos -m admin@neocast.cc --redirect \
    || echo "!! certbot failed — DNS A record $DOMAIN_API -> this VPS lagbe"
}

if [ -n "$NGINX_CT" ] && [ -n "$NEXUS_CONF_DIR" ] && [ -d "$NEXUS_CONF_DIR" ]; then
  echo "-- nginx container '$NGINX_CT' owns ports 80/443 -> adding vhost in $NEXUS_CONF_DIR"
  setup_nexus_nginx || echo "!! container nginx vhost setup had errors, check above"
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
SUPABASE_DB_URL=postgresql://postgres:$POSTGRES_PASSWORD@127.0.0.1:$PG_PORT/postgres
PORT=$APP_PORT
APPENV
  chmod 600 "$APP_DIR/.env"
fi

echo
echo "==================== SAVE THESE DETAILS ===================="
cat "$KEYS_FILE"
echo
echo "API URL      : https://$DOMAIN_API"
echo "Studio (UI)  : http://$(curl -s ifconfig.me):$KONG_PORT  (login: $DASHBOARD_USERNAME / $DASHBOARD_PASSWORD)"
echo "Postgres     : postgresql://postgres:$POSTGRES_PASSWORD@127.0.0.1:$PG_PORT/postgres"
echo "Credentials file: $KEYS_FILE"
echo "============================================================"

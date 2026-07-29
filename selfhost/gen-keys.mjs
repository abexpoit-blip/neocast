// Generates Supabase self-host secrets (JWT secret + anon/service_role keys)
// Usage: node gen-keys.mjs
import crypto from 'node:crypto';

const b64url = (buf) =>
  Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const sign = (payload, secret) => {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify(payload));
  const data = `${header}.${body}`;
  const sig = b64url(crypto.createHmac('sha256', secret).update(data).digest());
  return `${data}.${sig}`;
};

const rand = (n) => crypto.randomBytes(n).toString('hex');

const iat = Math.floor(Date.now() / 1000);
const exp = iat + 60 * 60 * 24 * 365 * 10; // 10 years

const JWT_SECRET = rand(32); // 64 chars
const POSTGRES_PASSWORD = rand(24);
const DASHBOARD_PASSWORD = rand(12);
const SECRET_KEY_BASE = rand(32);
const VAULT_ENC_KEY = rand(16);
const REALTIME_DB_ENC_KEY = rand(8); // exactly 16 chars
const PG_META_CRYPTO_KEY = rand(16); // 32 chars
const LOGFLARE_KEY = rand(16);
const S3_PROTOCOL_ACCESS_KEY_ID = rand(16);
const S3_PROTOCOL_ACCESS_KEY_SECRET = rand(32);
const POOLER_TENANT_ID = `neocast${rand(6)}`;

const ANON_KEY = sign({ role: 'anon', iss: 'supabase', iat, exp }, JWT_SECRET);
const SERVICE_ROLE_KEY = sign({ role: 'service_role', iss: 'supabase', iat, exp }, JWT_SECRET);

console.log(
  JSON.stringify(
    {
      JWT_SECRET,
      ANON_KEY,
      SERVICE_ROLE_KEY,
      POSTGRES_PASSWORD,
      DASHBOARD_USERNAME: 'neocast',
      DASHBOARD_PASSWORD,
      SECRET_KEY_BASE,
      VAULT_ENC_KEY,
      REALTIME_DB_ENC_KEY,
      PG_META_CRYPTO_KEY,
      LOGFLARE_KEY,
      S3_PROTOCOL_ACCESS_KEY_ID,
      S3_PROTOCOL_ACCESS_KEY_SECRET,
      POOLER_TENANT_ID,
    },
    null,
    2,
  ),
);

---
name: Self-hosted Supabase (NeoCast) — isolated from Zoru
description: NeoCast uses its own self-hosted Supabase at supabase.neocast.cc; must never share DB/keys/ports with the Zoru project on the same VPS
type: feature
---

VPS 157.173.117.34 হোস্ট করে দুইটি সম্পূর্ণ আলাদা প্রজেক্ট। কখনো মেশানো যাবে না — আলাদা DB, আলাদা keys, আলাদা পোর্ট।

| | NeoCast | Zoru |
|---|---|---|
| Supabase install dir | `/opt/supabase-neocast` | `/opt/supabase` |
| Kong/API port | 8001 | 8000 |
| Postgres port | 5433 | 5432 |
| App port / PM2 name | 3003 / `neocast-cc` | 3002 / `zoru-cc` |
| Domains | neocast.cc, supabase.neocast.cc | zoru.cc |
| App dir | /var/www/neocast-cc | Zoru-র নিজের dir |

Edge proxy: `nexus_nginx` কন্টেইনার (host nginx disabled), host-এ পৌঁছায় `172.17.0.1:<port>` দিয়ে।

নিয়ম:
- ANON_KEY / SERVICE_ROLE_KEY / JWT_SECRET / POSTGRES_PASSWORD প্রতিটি ইনস্ট্যান্সের আলাদা; কপি করা নিষেধ।
- NeoCast-এর `.env` শুধু `https://supabase.neocast.cc` এবং তার নিজের keys ব্যবহার করবে।
- Zoru-র কন্টেইনার/DB/nginx কনফিগ কখনো পরিবর্তন করা যাবে না (লাইভ সাইট)।

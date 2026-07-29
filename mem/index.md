# Project Memory

## Core
Brand is NeoCast (renamed from Zoru Shop). Never use the old name.
Site language is English by default; RU/EN toggle stays but starts on EN.
Palette: midnight indigo #0b1230 base, indigo #4f46e5 → cyan #22d3ee accents. No red/gold dragon theme.
Redesign work is visual only — backend, APIs and business logic must stay unchanged.
Target domain: neocast.cc (Namecheap). Existing VPS: 157.173.117.34 (also hosts zoru.cc).
Production backend is SELF-HOSTED Supabase at https://supabase.neocast.cc — not Lovable Cloud.

## Memories
- [Deploy setup (zoru.cc)](mem://deploy/vps) — existing VPS layout, nginx config path, safe boundaries around the Nexus stack
- [Deploy setup (neocast.cc)](mem://deploy/neocast-cc) — new domain, DNS records, planned paths on the same VPS
- [Self-hosted Supabase](mem://deploy/self-supabase) — supabase.neocast.cc stack, installer, credentials location, seed users

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/deposit-callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const fields: Record<string, string> = {};
        for (const [k, v] of new URLSearchParams(raw).entries()) fields[k] = v;

        const { verifyCallback, mapStatus } = await import("@/lib/plisio.server");
        if (!verifyCallback(fields)) return new Response("Invalid signature", { status: 401 });

        const invoiceId = fields.txn_id;
        if (!invoiceId) return new Response("Bad request", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin.rpc("settle_crypto_deposit", {
          _invoice_id: invoiceId,
          _status: mapStatus(fields.status ?? ""),
          _confirmations: Number(fields.confirmations ?? 0) || 0,
          _txid: fields.tx_url || undefined,
        });

        return new Response("ok");
      },
    },
  },
});

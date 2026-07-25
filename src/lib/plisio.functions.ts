import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequestUrl } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Create an LTC top-up invoice for the signed-in user. */
export const createCryptoInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ amount: z.number().min(1).max(100000) }).parse(input))
  .handler(async ({ data, context }) => {
    const { createLtcInvoice } = await import("@/lib/plisio.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const amount = Math.round(data.amount * 100) / 100;
    const origin = getRequestUrl().origin;

    const { data: dep, error } = await supabaseAdmin
      .from("deposits")
      .insert({ user_id: context.userId, amount, method: "crypto", status: "pending", crypto_currency: "LTC" })
      .select("id")
      .single();
    if (error || !dep) throw new Error("deposit_create_failed");

    let inv;
    try {
      inv = await createLtcInvoice({
        usdAmount: amount,
        orderNumber: dep.id,
        callbackUrl: `${origin}/api/public/deposit-callback`,
      });
    } catch (e) {
      await supabaseAdmin.from("deposits").update({ status: "rejected" }).eq("id", dep.id);
      throw e;
    }

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    await supabaseAdmin
      .from("deposits")
      .update({
        invoice_id: inv.txn_id,
        wallet_address: inv.wallet_hash,
        crypto_amount: String(inv.amount),
        reference: inv.txn_id,
        expires_at: expiresAt,
      })
      .eq("id", dep.id);

    return {
      deposit_id: dep.id,
      wallet_address: inv.wallet_hash,
      crypto_amount: String(inv.amount),
      currency: "LTC",
      usd_amount: amount,
      expires_ms: Date.parse(expiresAt),
      status: "pending" as const,
      confirmations: 0,
    };
  });

/** Poll the provider for a deposit and credit the balance when confirmed. */
export const checkDepositStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ deposit_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { getOperation, mapStatus } = await import("@/lib/plisio.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: dep } = await supabaseAdmin
      .from("deposits")
      .select("id, user_id, amount, status, invoice_id, confirmations, expires_at")
      .eq("id", data.deposit_id)
      .maybeSingle();
    if (!dep || dep.user_id !== context.userId) throw new Error("not_found");
    if (dep.status !== "pending" || !dep.invoice_id) {
      return { status: dep?.status ?? "rejected", confirmations: dep?.confirmations ?? 0, amount: dep?.amount ?? 0 };
    }

    let status = "pending";
    let confirmations = dep.confirmations ?? 0;
    let txid: string | null = null;
    try {
      const op = await getOperation(dep.invoice_id);
      status = mapStatus(op.status);
      confirmations = Number(op.confirmations ?? confirmations) || confirmations;
      txid = op.tx_url ?? null;
    } catch {
      return { status: "pending", confirmations, amount: dep.amount };
    }

    if (status === "pending" && dep.expires_at && Date.parse(dep.expires_at) < Date.now()) {
      status = "rejected";
    }

    const { data: settled } = await supabaseAdmin.rpc("settle_crypto_deposit", {
      _invoice_id: dep.invoice_id,
      _status: status,
      _confirmations: confirmations,
      _txid: txid,
    });

    return { status: (settled as string) ?? status, confirmations, amount: dep.amount };
  });

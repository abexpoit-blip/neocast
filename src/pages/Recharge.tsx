import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { depositsApi, plisioApi, walletApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import {
  CheckCircle2, Copy, Clock, XCircle, Loader2,
  AlertCircle, ArrowDownLeft, ArrowUpRight, TimerReset, Receipt
} from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

interface Deposit { id: string; amount: number; method: string; txid: string | null; status: string; created_at: string; crypto_currency?: string; plisio_wallet?: string; confirmations?: number; }
interface Transaction { id: string; type: string; amount: number; note?: string; method?: string; ref_id?: string; meta?: string; created_at: string; }

const CRYPTO_URI_PREFIX: Record<string, string> = {
  BTC: "bitcoin", LTC: "litecoin", ETH: "ethereum", USDT: "tether",
  TRX: "tron", DOGE: "dogecoin", BCH: "bitcoincash",
};

const formatCountdown = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const Recharge = () => {
  const { profile } = useAuth();
  const settings = useSiteSettings();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isActivation = searchParams.get("activate") === "1";
  const urlAmount = searchParams.get("amount");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState<null | "USDT" | "BTC" | "LTC">(null);
  const [showBtcLtcPicker, setShowBtcLtcPicker] = useState(false);
  const [history, setHistory] = useState<Deposit[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [activeInvoice, setActiveInvoiceRaw] = useState<{
    deposit_id: string; wallet_address: string; crypto_amount: string;
    currency: string; invoice_url: string; qr_data: string; status: string;
    confirmations: number; usd_amount: number; expires_at: string | null;
  } | null>(() => {
    try {
      const saved = localStorage.getItem("cruzercc.activeInvoice");
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (parsed.expires_at) {
        const expMs = Number(parsed.expires_at) > 1e12 ? Number(parsed.expires_at) : Number(parsed.expires_at) > 1e9 ? Number(parsed.expires_at) * 1000 : new Date(parsed.expires_at).getTime();
        if (expMs && Date.now() > expMs) return null;
      }
      return parsed;
    } catch { return null; }
  });

  const setActiveInvoice = useCallback((val: typeof activeInvoice | ((prev: typeof activeInvoice) => typeof activeInvoice)) => {
    setActiveInvoiceRaw((prev) => {
      const next = typeof val === "function" ? (val as any)(prev) : val;
      if (next) localStorage.setItem("cruzercc.activeInvoice", JSON.stringify(next));
      else localStorage.removeItem("cruzercc.activeInvoice");
      return next;
    });
  }, []);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [countdown, setCountdown] = useState<number>(-1);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadHistory = async () => {
    try { const d = await depositsApi.mine(); setHistory((d.deposits ?? []) as unknown as Deposit[]); } catch { /* ignore */ }
  };
  const loadTransactions = async () => {
    try { const t = await walletApi.transactions(); setTransactions((t.transactions ?? []) as unknown as Transaction[]); } catch { /* ignore */ }
  };

  useEffect(() => {
    loadHistory(); loadTransactions();
    if (activeInvoice?.deposit_id && activeInvoice.status === "pending") startPolling(activeInvoice.deposit_id);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (amount) return;
    if (urlAmount && Number(urlAmount) > 0) setAmount(String(Number(urlAmount)));
    else if (isActivation) {
      const min = Number(settings.min_deposit ?? 20);
      if (min > 0) setAmount(String(min));
    }
    // eslint-disable-next-line
  }, [settings.min_deposit, urlAmount, isActivation]);

  useEffect(() => {
    if (!activeInvoice?.expires_at) {
      if (activeInvoice?.status === "pending") {
        setCountdown(30 * 60);
        countdownRef.current = setInterval(() => {
          setCountdown((prev) => {
            const next = prev - 1;
            if (next <= 0) {
              if (countdownRef.current) clearInterval(countdownRef.current);
              localStorage.removeItem("cruzercc.activeInvoice");
              return 0;
            }
            return next;
          });
        }, 1000);
        return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
      }
      return;
    }
    const parseExpiry = (val: string) => {
      const n = Number(val);
      if (!isNaN(n) && n > 1e9 && n < 1e13) return n * 1000;
      if (!isNaN(n) && n > 1e12) return n;
      const d = new Date(val).getTime();
      return isNaN(d) ? 0 : d;
    };
    const expMs = parseExpiry(activeInvoice.expires_at);
    if (!expMs) { setCountdown(30 * 60); return; }
    const calcRemaining = () => Math.max(0, Math.floor((expMs - Date.now()) / 1000));
    setCountdown(calcRemaining());
    countdownRef.current = setInterval(() => {
      const remaining = calcRemaining();
      setCountdown(remaining);
      if (remaining <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
        localStorage.removeItem("cruzercc.activeInvoice");
      }
    }, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [activeInvoice?.expires_at, activeInvoice?.status]);

  const isExpired = countdown === 0 && activeInvoice?.expires_at;

  const startPolling = useCallback((depositId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const s = await plisioApi.status(depositId);
        setActiveInvoice(prev => prev ? { ...prev, status: s.status, confirmations: s.confirmations ?? 0 } : prev);
        if (s.status === "approved") {
          toast.success(`$${s.amount} credited to your balance!`);
          setActiveInvoice(null);
          if (pollRef.current) clearInterval(pollRef.current);
          loadHistory(); loadTransactions();
          if (isActivation) {
            toast.success("🎉 Account activated! Redirecting to the marketplace…");
            setTimeout(() => navigate("/shop"), 1500);
          }
        } else if (s.status === "rejected") {
          toast.error("Deposit expired or cancelled.");
          setActiveInvoice(null);
          if (pollRef.current) clearInterval(pollRef.current);
          loadHistory();
        }
      } catch { /* continue polling */ }
    }, 10_000);
    // eslint-disable-next-line
  }, []);

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  const MIN_DEPOSIT = Math.max(20, settings.min_deposit || 20);
  const amtNum = Number(amount) || 0;

  const createInvoice = async (currency: "USDT" | "BTC" | "LTC") => {
    if (!amtNum || amtNum < MIN_DEPOSIT) return toast.error(`The minimum recharge amount is $${MIN_DEPOSIT}.`);
    setBusy(currency);
    try {
      const inv = await plisioApi.createInvoice({ amount: amtNum, currency });
      setActiveInvoice({
        deposit_id: inv.deposit_id,
        wallet_address: inv.wallet_address || inv.qr_data || "",
        crypto_amount: inv.crypto_amount,
        currency: inv.currency || currency,
        invoice_url: inv.invoice_url,
        qr_data: inv.qr_data || inv.wallet_address || "",
        status: "pending",
        confirmations: 0,
        usd_amount: amtNum,
        expires_at: inv.expires_at || null,
      });
      startPolling(inv.deposit_id);
      setShowBtcLtcPicker(false);
      toast.success("Invoice created! Send crypto to the address below.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create invoice");
    } finally { setBusy(null); }
  };

  const copyField = async (txt: string, field: string) => {
    if (isExpired) return;
    try {
      await navigator.clipboard.writeText(txt);
      setCopiedField(field);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedField(null), 2000);
    } catch { toast.error("Failed to copy — please copy manually"); }
  };

  const buildQrValue = () => {
    if (!activeInvoice) return "";
    const prefix = CRYPTO_URI_PREFIX[activeInvoice.currency.toUpperCase()] || "";
    const addr = activeInvoice.qr_data || activeInvoice.wallet_address;
    if (prefix && activeInvoice.crypto_amount) return `${prefix}:${addr}?amount=${activeInvoice.crypto_amount}`;
    return addr;
  };

  const txnIcon = (type: string) => {
    if (type === "deposit") return <ArrowDownLeft className="h-4 w-4 text-[#2fb344]" />;
    if (type === "purchase") return <ArrowUpRight className="h-4 w-4 text-[#c0392b]" />;
    if (type === "refund") return <ArrowDownLeft className="h-4 w-4 text-[#2196f3]" />;
    if (type === "payout") return <ArrowUpRight className="h-4 w-4 text-[#b26a00]" />;
    return <Receipt className="h-4 w-4 text-[#888]" />;
  };

  const cancelInvoice = () => {
    setActiveInvoice(null);
    setCountdown(-1);
    if (pollRef.current) clearInterval(pollRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  return (
    <AppShell>
      <div className="space-y-4 max-w-6xl">
        {isActivation && (
          <div className="bg-white border border-[#e6e6e6] px-4 py-3 flex items-start gap-3 text-[13px]">
            <div className="shrink-0 h-8 w-8 bg-[#2196f3] text-white flex items-center justify-center text-sm font-bold">$</div>
            <div>
              <div className="text-[12px] font-semibold text-[#2196f3] uppercase tracking-wider">Account Activation</div>
              <div className="text-[#333] mt-0.5">
                Complete a one-time deposit of ${Number(settings.min_deposit ?? MIN_DEPOSIT).toFixed(2)} to unlock the marketplace.
              </div>
            </div>
          </div>
        )}

        {activeInvoice ? (
          // ---- ACTIVE INVOICE VIEW ----
          <section className="bg-white border border-[#e6e6e6]">
            <div className="px-4 h-10 flex items-center border-b border-[#eee] text-[13px] text-[#555] uppercase tracking-wider">
              Send Payment
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3">
                {activeInvoice.expires_at && countdown >= 0 && (
                  <div className={`flex items-center justify-center gap-2 h-10 border text-[13px] ${
                    isExpired ? "bg-[#fdecea] border-[#f5c6cb] text-[#c0392b]"
                      : countdown <= 120 ? "bg-[#fff8e1] border-[#ffe0a0] text-[#b26a00]"
                      : "bg-[#e8f4ff] border-[#bcdcfa] text-[#1976d2]"
                  }`}>
                    <TimerReset className="h-4 w-4" />
                    <span className="font-mono font-semibold">{isExpired ? "EXPIRED" : formatCountdown(countdown)}</span>
                    <span className="text-[11px] opacity-80">{isExpired ? "— generate a new invoice" : "remaining"}</span>
                  </div>
                )}

                <div className="text-center border border-[#e6e6e6] bg-[#fafafa] p-3">
                  <p className="text-[11px] uppercase tracking-wider text-[#888]">You are depositing</p>
                  <p className="text-[22px] font-semibold text-[#2196f3] font-mono">${activeInvoice.usd_amount.toFixed(2)}</p>
                  <div className="inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 border border-[#bcdcfa] bg-white text-[11px] text-[#1976d2]">
                    {activeInvoice.currency} Network
                  </div>
                </div>

                <div className={`flex justify-center ${isExpired ? "opacity-30 pointer-events-none" : ""}`}>
                  <div className="p-3 bg-white border border-[#e6e6e6]">
                    <QRCodeSVG value={buildQrValue()} size={180} level="M" includeMargin={false} />
                  </div>
                </div>
                <p className="text-[11px] text-center text-[#888]">
                  {isExpired ? "Invoice expired — QR no longer valid" : `Scan with your ${activeInvoice.currency} wallet app`}
                </p>
              </div>

              <div className="space-y-3">
                <div className={`border border-[#e6e6e6] bg-[#fafafa] p-3 ${isExpired ? "opacity-40" : ""}`}>
                  <p className="text-[10px] uppercase tracking-wider text-[#888]">Send exactly</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-[15px] font-semibold text-[#1f2d3d] flex-1 break-all">
                      {activeInvoice.crypto_amount} {activeInvoice.currency}
                    </span>
                    <button onClick={() => copyField(activeInvoice.crypto_amount, "amount")} disabled={!!isExpired}
                      className="shrink-0 h-7 w-7 border border-[#dcdcdc] bg-white hover:bg-[#f5faff] text-[#2196f3] flex items-center justify-center disabled:opacity-30">
                      {copiedField === "amount" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div className={`border border-[#e6e6e6] bg-[#fafafa] p-3 ${isExpired ? "opacity-40" : ""}`}>
                  <p className="text-[10px] uppercase tracking-wider text-[#888]">To this {activeInvoice.currency} address</p>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-[11px] text-[#333] break-all flex-1 font-mono leading-relaxed">
                      {activeInvoice.wallet_address}
                    </code>
                    <button onClick={() => copyField(activeInvoice.wallet_address, "address")} disabled={!!isExpired}
                      className="shrink-0 h-7 w-7 border border-[#dcdcdc] bg-white hover:bg-[#f5faff] text-[#2196f3] flex items-center justify-center disabled:opacity-30">
                      {copiedField === "address" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 border border-[#ffe0a0] bg-[#fff8e1] text-[12px] text-[#b26a00]">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>Send <strong>only {activeInvoice.currency}</strong> to this address. Sending any other coin will result in permanent loss.</p>
                </div>

                {!isExpired && (
                  <div className="border border-[#e6e6e6] bg-white p-3 space-y-2 text-[12px]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[#333]">
                        <Loader2 className="h-4 w-4 animate-spin text-[#2196f3]" />
                        <span className="uppercase tracking-wider">
                          {activeInvoice.status === "pending" ? "Waiting for payment" :
                           activeInvoice.status === "approved" ? "Approved ✓" : `Status: ${activeInvoice.status}`}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-[#2196f3]">
                        {activeInvoice.confirmations ?? 0}/2 confirmations
                      </span>
                    </div>
                    <p className="text-[11px] text-center text-[#888] pt-1">
                      Auto-checking every 10 seconds — keep this tab open.
                    </p>
                  </div>
                )}

                <button onClick={cancelInvoice}
                  className={`w-full h-9 text-[13px] transition ${
                    isExpired ? "bg-[#2196f3] hover:bg-[#1e88e5] text-white"
                      : "border border-[#dcdcdc] text-[#555] hover:bg-[#f7f7f7]"
                  }`}>
                  {isExpired ? "Generate New Invoice" : "Cancel"}
                </button>
              </div>
            </div>
          </section>
        ) : (
          // ---- SCORPION-STYLE FORM VIEW ----
          <section className="bg-white border border-[#e6e6e6] p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* LEFT column — notes */}
              <div className="space-y-3 text-[13px] leading-[1.7]">
                <p className="text-[#333]">
                  The minimum recharge amount for USDT is ${MIN_DEPOSIT}.
                </p>
                <p className="text-[#d32f2f]">
                  The amount credited to the store's wallet must match the order amount exactly for a successful recharge.
                  The store is not responsible for any discrepancies in the credited amount due to payment issues on your end.
                  Please verify before making the payment.
                </p>
                <p className="text-[#333]">
                  The minimum recharge amount for BTC and LTC is ${MIN_DEPOSIT}.
                </p>
                <p className="text-[#d32f2f]">
                  After deducting network fees, the amount will be credited to your account. Once your wallet confirms the transaction status,
                  please manually refresh the webpage to view your updated balance.
                </p>
                <p className="text-[#333] font-semibold pt-2">Top up promotion:</p>
                <ul className="list-disc pl-5 text-[#d32f2f] font-mono text-[13px] space-y-1">
                  <li>One-time recharge of $500, $35 bonus.</li>
                  <li>One-time recharge of $1000, $100 bonus.</li>
                  <li>One-time recharge of $2000, $240 bonus.</li>
                  <li>One-time recharge of $5000, $750 bonus.</li>
                </ul>
                <p className="text-[#d32f2f] font-semibold pt-2">
                  Please send proof of recharge record and storage user name to customer service
                </p>
                <p className="text-[#d32f2f] font-semibold">
                  We will increase your account balance after confirmation.
                </p>
              </div>

              {/* RIGHT column — wallet lists */}
              <div className="text-[13px] text-[#333] border-l border-[#e6e6e6] pl-6 leading-[1.7]">
                <p className="mb-1">Supported BTC and LTC wallets:</p>
                <ul className="list-disc pl-5 mb-4">
                  <li>Electrum</li><li>BlueWallet</li><li>Mycelium</li>
                  <li>Samourai Wallet</li><li>Wasabi Wallet</li><li>Exodus</li>
                </ul>
                <p className="mb-1">Lightning Network supported wallets:</p>
                <ul className="list-disc pl-5 mb-4">
                  <li>Phoenix Wallet</li><li>Breez Wallet</li><li>Wallet of Satoshi</li>
                  <li>Zap Wallet</li><li>BLW (Bitcoin Lightning Wallet)</li>
                </ul>
                <p className="mb-1">Other multi-currency wallets:</p>
                <ul className="list-disc pl-5">
                  <li>Trust Wallet</li><li>Atomic Wallet</li><li>Coinomi</li><li>Edge</li>
                </ul>
              </div>
            </div>

            {/* Amount + Actions */}
            <div className="mt-8 pt-6 border-t border-[#eee] max-w-[720px]">
              <div className="flex items-center gap-3 mb-4">
                <label className="w-20 text-right text-[13px] text-[#333]">
                  <span className="text-[#d32f2f]">*</span> Amount
                </label>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  min={MIN_DEPOSIT}
                  placeholder="Please enter the amount"
                  className="flex-1 max-w-[280px] h-9 px-3 border border-[#dcdcdc] text-[13px] outline-none focus:border-[#2196f3]"
                />
                <span className="text-[12px] text-[#888]">Balance: ${Number(profile?.balance ?? 0).toFixed(2)}</span>
              </div>

              <p className="text-[13px] text-[#d32f2f] mb-1">
                If the payment page cannot be opened or the recharge fails, please contact customer service
              </p>
              <p className="text-[13px] text-[#d32f2f] mb-5">
                Telegram: <a href="https://t.me/Scorpion_ccsale" className="text-[#1976d2] hover:underline" target="_blank" rel="noreferrer">@Scorpion_ccsale</a>
                <span className="mx-1">/</span>
                <a href="https://t.me/scorpioncc_shop_002" className="text-[#1976d2] hover:underline" target="_blank" rel="noreferrer">@scorpioncc_shop_002</a>
              </p>

              {showBtcLtcPicker ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] text-[#555] mr-2">Choose network:</span>
                  <button onClick={() => createInvoice("BTC")} disabled={!!busy}
                    className="px-5 h-9 bg-[#2196f3] hover:bg-[#1e88e5] text-white text-[13px] inline-flex items-center gap-2 disabled:opacity-60">
                    {busy === "BTC" && <Loader2 className="h-3.5 w-3.5 animate-spin" />} BTC
                  </button>
                  <button onClick={() => createInvoice("LTC")} disabled={!!busy}
                    className="px-5 h-9 bg-[#2196f3] hover:bg-[#1e88e5] text-white text-[13px] inline-flex items-center gap-2 disabled:opacity-60">
                    {busy === "LTC" && <Loader2 className="h-3.5 w-3.5 animate-spin" />} LTC
                  </button>
                  <button onClick={() => setShowBtcLtcPicker(false)} className="px-4 h-9 border border-[#dcdcdc] text-[#555] text-[13px] hover:bg-[#f7f7f7]">Back</button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => createInvoice("USDT")} disabled={!!busy}
                    className="px-5 h-9 bg-[#2196f3] hover:bg-[#1e88e5] text-white text-[13px] inline-flex items-center gap-2 disabled:opacity-60">
                    {busy === "USDT" && <Loader2 className="h-3.5 w-3.5 animate-spin" />} USDT PAY
                  </button>
                  <button onClick={() => setShowBtcLtcPicker(true)} disabled={!!busy}
                    className="px-5 h-9 bg-[#2196f3] hover:bg-[#1e88e5] text-white text-[13px] inline-flex items-center gap-2 disabled:opacity-60">
                    BTC OR LTC PAY
                  </button>
                  <button onClick={() => { setAmount(""); }} className="px-5 h-9 bg-[#f56c6c] hover:bg-[#e75c5c] text-white text-[13px]">
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Transactions */}
        {transactions.length > 0 && (
          <section className="bg-white border border-[#e6e6e6]">
            <div className="px-4 h-10 flex items-center border-b border-[#eee] text-[13px] text-[#555] uppercase tracking-wider">
              <Receipt className="h-4 w-4 mr-2 text-[#2196f3]" /> Transaction History
            </div>
            <div className="p-3">
              <div className="divide-y divide-[#eee]">
                {transactions.slice(0, 20).map((t) => (
                  <div key={t.id} className="flex items-center justify-between px-2 py-2 text-[13px]">
                    <div className="flex items-center gap-3">
                      {txnIcon(t.type)}
                      <div>
                        <p className="capitalize text-[#333]">{t.type}</p>
                        <p className="text-[11px] text-[#888]">
                          {new Date(t.created_at).toLocaleDateString()} {new Date(t.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          {t.method ? ` · ${t.method}` : ""}
                        </p>
                      </div>
                    </div>
                    <span className={`font-mono font-semibold ${Number(t.amount) >= 0 ? "text-[#2fb344]" : "text-[#c0392b]"}`}>
                      {Number(t.amount) >= 0 ? "+" : ""}${Math.abs(Number(t.amount)).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Recent deposits */}
        {history.length > 0 && (
          <section className="bg-white border border-[#e6e6e6]">
            <div className="px-4 h-10 flex items-center border-b border-[#eee] text-[13px] text-[#555] uppercase tracking-wider">
              Recent Deposits
            </div>
            <div className="p-3">
              <div className="divide-y divide-[#eee]">
                {history.map((d) => {
                  const isDepositExpired = d.status === "pending" && (Date.now() - new Date(d.created_at).getTime() > 30 * 60 * 1000);
                  const displayStatus = isDepositExpired ? "failed" : d.status;
                  return (
                    <div key={d.id} className="flex items-center justify-between px-2 py-2 text-[13px]">
                      <div>
                        <p className="text-[#333]">
                          <span className="font-mono font-semibold">${Number(d.amount).toFixed(2)}</span>
                          <span className="text-[11px] text-[#888] ml-2">· {d.crypto_currency || d.method}</span>
                        </p>
                        {d.txid && <p className="text-[10px] font-mono text-[#888] truncate max-w-[260px] sm:max-w-md">{d.txid}</p>}
                        <p className="text-[11px] text-[#888] mt-0.5">
                          {new Date(d.created_at).toLocaleDateString()} {new Date(d.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <span className={`text-[11px] px-2 py-0.5 border inline-flex items-center gap-1 ${
                        displayStatus === "approved" ? "bg-[#e8f5e9] border-[#c8e6c9] text-[#2e7d32]" :
                        displayStatus === "rejected" || displayStatus === "failed" ? "bg-[#fdecea] border-[#f5c6cb] text-[#c0392b]" :
                        "bg-[#fff8e1] border-[#ffe0a0] text-[#b26a00]"
                      }`}>
                        {displayStatus === "approved" ? <CheckCircle2 className="h-3 w-3" /> :
                         displayStatus === "rejected" || displayStatus === "failed" ? <XCircle className="h-3 w-3" /> :
                         <Clock className="h-3 w-3" />}
                        {displayStatus}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
};

export default Recharge;

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { depositsApi, plisioApi, walletApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Bitcoin, Wallet, CheckCircle2, Copy, Clock, XCircle, Loader2,
  QrCode, AlertCircle, ArrowDownLeft, ArrowUpRight, TimerReset, Receipt
} from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

interface Deposit { id: string; amount: number; method: string; txid: string | null; status: string; created_at: string; crypto_currency?: string; plisio_wallet?: string; confirmations?: number; }
interface Transaction { id: string; type: string; amount: number; note?: string; method?: string; ref_id?: string; meta?: string; created_at: string; }
interface PlisioCurrency { id: string; name: string; icon: string; min: string; }

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
  const [currency, setCurrency] = useState("LTC");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<Deposit[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currencies, setCurrencies] = useState<PlisioCurrency[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Active invoice state — persisted in localStorage to survive reloads
  const [activeInvoice, setActiveInvoiceRaw] = useState<{
    deposit_id: string; wallet_address: string; crypto_amount: string;
    currency: string; invoice_url: string; qr_data: string; status: string;
    confirmations: number; usd_amount: number; expires_at: string | null;
  } | null>(() => {
    try {
      const saved = localStorage.getItem("cruzercc.activeInvoice");
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      // Check if expired
      if (parsed.expires_at) {
        const expMs = Number(parsed.expires_at) > 1e12 ? Number(parsed.expires_at) : Number(parsed.expires_at) > 1e9 ? Number(parsed.expires_at) * 1000 : new Date(parsed.expires_at).getTime();
        if (expMs && Date.now() > expMs) return null; // already expired, don't restore
      }
      return parsed;
    } catch { return null; }
  });

  const setActiveInvoice = useCallback((val: typeof activeInvoice | ((prev: typeof activeInvoice) => typeof activeInvoice)) => {
    setActiveInvoiceRaw((prev) => {
      const next = typeof val === "function" ? (val as any)(prev) : val;
      if (next) {
        localStorage.setItem("cruzercc.activeInvoice", JSON.stringify(next));
      } else {
        localStorage.removeItem("cruzercc.activeInvoice");
      }
      return next;
    });
  }, []);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [countdown, setCountdown] = useState<number>(-1);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadHistory = async () => {
    try {
      const d = await depositsApi.mine();
      setHistory((d.deposits ?? []) as unknown as Deposit[]);
    } catch { /* ignore */ }
  };

  const loadTransactions = async () => {
    try {
      const t = await walletApi.transactions();
      setTransactions((t.transactions ?? []) as unknown as Transaction[]);
    } catch { /* ignore */ }
  };

  const loadCurrencies = async () => {
    try {
      const c = await plisioApi.currencies();
      if (c.currencies?.length) setCurrencies(c.currencies);
      else setCurrencies([
        { id: "LTC", name: "Litecoin", icon: "", min: "0" },
        { id: "BTC", name: "Bitcoin", icon: "", min: "0" },
        { id: "USDT", name: "Tether", icon: "", min: "0" },
        { id: "TRX", name: "Tron", icon: "", min: "0" },
      ]);
    } catch {
      setCurrencies([
        { id: "LTC", name: "Litecoin", icon: "", min: "0" },
        { id: "BTC", name: "Bitcoin", icon: "", min: "0" },
        { id: "USDT", name: "Tether", icon: "", min: "0" },
      ]);
    }
  };

  useEffect(() => {
    loadHistory(); loadCurrencies(); loadTransactions();
    // Resume polling if we restored an active invoice from localStorage
    if (activeInvoice?.deposit_id && activeInvoice.status === "pending") {
      startPolling(activeInvoice.deposit_id);
    }
    // eslint-disable-next-line
  }, []);

  // Pre-fill amount from URL (?amount=...) or activation flow (?activate=1 → min_deposit)
  useEffect(() => {
    if (amount) return;
    if (urlAmount && Number(urlAmount) > 0) {
      setAmount(String(Number(urlAmount)));
    } else if (isActivation) {
      const min = Number(settings.min_deposit ?? 5);
      if (min > 0) setAmount(String(min));
    }
    // eslint-disable-next-line
  }, [settings.min_deposit, urlAmount, isActivation]);

  // Countdown timer
  useEffect(() => {
    if (!activeInvoice?.expires_at) {
      // If no expires_at, use 30 min from now as fallback
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
    if (!expMs) {
      setCountdown(30 * 60); // fallback
      return;
    }
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

  // Poll for active invoice status
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
          loadHistory();
          loadTransactions();
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
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // Fee calculation — user pays deposit + fee on top
  const feePercent = settings.deposit_fee_percent ?? 0;
  const feeFlat = settings.deposit_fee_flat || 0;
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const computeFee = (amt: number) => round2((amt * feePercent / 100) + feeFlat);
  const amtNum = Number(amount) || 0;
  const fee = computeFee(amtNum);
  const totalToPay = round2(amtNum + fee); // user pays this amount (deposit + fee)
  const MIN_DEPOSIT = settings.min_deposit || 5;

  const createInvoice = async () => {
    if (!amtNum || amtNum < MIN_DEPOSIT) return toast.error(`Minimum deposit is $${MIN_DEPOSIT}`);
    setBusy(true);
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
      toast.success("Invoice created! Send crypto to the address below.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create invoice");
    } finally {
      setBusy(false);
    }
  };

  const copyField = async (txt: string, field: string) => {
    if (isExpired) return;
    try {
      await navigator.clipboard.writeText(txt);
      setCopiedField(field);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("Failed to copy — please copy manually");
    }
  };

  const buildQrValue = () => {
    if (!activeInvoice) return "";
    const prefix = CRYPTO_URI_PREFIX[activeInvoice.currency.toUpperCase()] || "";
    const addr = activeInvoice.qr_data || activeInvoice.wallet_address;
    if (prefix && activeInvoice.crypto_amount) {
      return `${prefix}:${addr}?amount=${activeInvoice.crypto_amount}`;
    }
    return addr;
  };

  const txnIcon = (type: string) => {
    if (type === "deposit") return <ArrowDownLeft className="h-4 w-4 text-success" />;
    if (type === "purchase") return <ArrowUpRight className="h-4 w-4 text-destructive" />;
    if (type === "refund") return <ArrowDownLeft className="h-4 w-4 text-primary-glow" />;
    if (type === "payout") return <ArrowUpRight className="h-4 w-4 text-warning" />;
    return <Receipt className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <AppShell>
      <div className="space-y-4 max-w-6xl">
        <h1 className="text-[18px] font-semibold text-[#1f2d3d]">Recharge Center</h1>

        {isActivation && (
          <div className="bg-white border border-[#e6e6e6] px-4 py-3 flex items-start gap-3 text-[13px]">
            <div className="shrink-0 h-8 w-8 bg-[#2196f3] text-white flex items-center justify-center text-sm font-bold">$</div>
            <div>
              <div className="text-[12px] font-semibold text-[#2196f3] uppercase tracking-wider">Account Activation</div>
              <div className="text-[#333] mt-0.5">
                Complete a one-time deposit of ${Number(settings.min_deposit ?? 5).toFixed(2)} to unlock the marketplace.
              </div>
              <div className="text-[11px] text-[#888] mt-0.5">Amount pre-filled below. You will be redirected once approved.</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: form / active invoice */}
          <section className="bg-white border border-[#e6e6e6]">
            <div className="px-4 h-10 flex items-center border-b border-[#eee] text-[13px] text-[#555] uppercase tracking-wider">
              <Wallet className="h-4 w-4 mr-2 text-[#2196f3]" /> Your Balance
            </div>
            <div className="p-4">
              <p className="text-[28px] font-semibold text-[#2fb344] font-mono mb-4">
                ${Number(profile?.balance ?? 0).toFixed(2)}
              </p>

              {activeInvoice ? (
                <div className="space-y-4">
                  {/* Countdown */}
                  {activeInvoice.expires_at && countdown >= 0 && (
                    <div className={`flex items-center justify-center gap-2 h-10 border text-[13px] ${
                      isExpired
                        ? "bg-[#fdecea] border-[#f5c6cb] text-[#c0392b]"
                        : countdown <= 120
                          ? "bg-[#fff8e1] border-[#ffe0a0] text-[#b26a00]"
                          : "bg-[#e8f4ff] border-[#bcdcfa] text-[#1976d2]"
                    }`}>
                      <TimerReset className="h-4 w-4" />
                      <span className="font-mono font-semibold">
                        {isExpired ? "EXPIRED" : formatCountdown(countdown)}
                      </span>
                      <span className="text-[11px] opacity-80">{isExpired ? "— generate a new invoice" : "remaining"}</span>
                    </div>
                  )}

                  {/* Amount summary */}
                  <div className="text-center border border-[#e6e6e6] bg-[#fafafa] p-3">
                    <p className="text-[11px] uppercase tracking-wider text-[#888]">You are depositing</p>
                    <p className="text-[22px] font-semibold text-[#2196f3] font-mono">${activeInvoice.usd_amount.toFixed(2)}</p>
                    {(feePercent > 0 || feeFlat > 0) && (
                      <div className="text-[11px] text-[#666] mt-1 space-y-0.5">
                        <p>Fee: +${computeFee(activeInvoice.usd_amount).toFixed(2)}</p>
                        <p>Total to pay: ${round2(activeInvoice.usd_amount + computeFee(activeInvoice.usd_amount)).toFixed(2)}</p>
                        <p className="text-[#2fb344] font-semibold">You receive: ${activeInvoice.usd_amount.toFixed(2)}</p>
                      </div>
                    )}
                    <div className="inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 border border-[#bcdcfa] bg-white text-[11px] text-[#1976d2]">
                      <Bitcoin className="h-3 w-3" /> {activeInvoice.currency} Network
                    </div>
                  </div>

                  {/* QR */}
                  <div className={`flex justify-center ${isExpired ? "opacity-30 pointer-events-none" : ""}`}>
                    <div className="p-3 bg-white border border-[#e6e6e6]">
                      <QRCodeSVG value={buildQrValue()} size={180} level="M" includeMargin={false} />
                    </div>
                  </div>
                  <p className="text-[11px] text-center text-[#888]">
                    {isExpired ? "Invoice expired — QR no longer valid" : `Scan with your ${activeInvoice.currency} wallet app`}
                  </p>

                  {/* Crypto amount */}
                  <div className={`border border-[#e6e6e6] bg-[#fafafa] p-3 ${isExpired ? "opacity-40" : ""}`}>
                    <p className="text-[10px] uppercase tracking-wider text-[#888]">Send exactly</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-[15px] font-semibold text-[#1f2d3d] flex-1 break-all">
                        {activeInvoice.crypto_amount} {activeInvoice.currency}
                      </span>
                      <button
                        onClick={() => copyField(activeInvoice.crypto_amount, "amount")}
                        disabled={!!isExpired}
                        className="shrink-0 h-7 w-7 border border-[#dcdcdc] bg-white hover:bg-[#f5faff] text-[#2196f3] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        {copiedField === "amount" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Wallet address */}
                  <div className={`border border-[#e6e6e6] bg-[#fafafa] p-3 ${isExpired ? "opacity-40" : ""}`}>
                    <p className="text-[10px] uppercase tracking-wider text-[#888]">To this {activeInvoice.currency} address</p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-[11px] text-[#333] break-all flex-1 font-mono leading-relaxed">
                        {activeInvoice.wallet_address}
                      </code>
                      <button
                        onClick={() => copyField(activeInvoice.wallet_address, "address")}
                        disabled={!!isExpired}
                        className="shrink-0 h-7 w-7 border border-[#dcdcdc] bg-white hover:bg-[#f5faff] text-[#2196f3] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        {copiedField === "address" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Warning */}
                  <div className="flex items-start gap-2 p-3 border border-[#ffe0a0] bg-[#fff8e1] text-[12px] text-[#b26a00]">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>Send <strong>only {activeInvoice.currency}</strong> to this address. Sending any other coin will result in permanent loss.</p>
                  </div>

                  {/* Status */}
                  {!isExpired && (
                    <div className="border border-[#e6e6e6] bg-white p-3 space-y-2 text-[12px]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[#333]">
                          <Loader2 className="h-4 w-4 animate-spin text-[#2196f3]" />
                          <span className="uppercase tracking-wider">
                            {activeInvoice.status === "pending" ? "Waiting for payment" :
                             activeInvoice.status === "approved" ? "Approved ✓" :
                             `Status: ${activeInvoice.status}`}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-[#2196f3]">
                          {activeInvoice.confirmations ?? 0}/2 confirmations
                        </span>
                      </div>
                      <div className="relative h-1.5 w-full overflow-hidden bg-[#eee] border border-[#e6e6e6]">
                        <div
                          className="h-full bg-[#2196f3] transition-all duration-500"
                          style={{
                            width: `${activeInvoice.status === "approved" ? 100 :
                              Math.min(95, 15 + ((activeInvoice.confirmations ?? 0) * 40))}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-[#888] uppercase tracking-wider">
                        <span>● Detecting</span><span>● Confirming</span><span>● Credited</span>
                      </div>
                      <p className="text-[11px] text-center text-[#888] pt-1">
                        Auto-checking every 10 seconds — keep this tab open.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setActiveInvoice(null);
                      setCountdown(-1);
                      if (pollRef.current) clearInterval(pollRef.current);
                      if (countdownRef.current) clearInterval(countdownRef.current);
                    }}
                    className={`w-full h-9 text-[13px] transition ${
                      isExpired
                        ? "bg-[#2196f3] hover:bg-[#1e88e5] text-white"
                        : "border border-[#dcdcdc] text-[#555] hover:bg-[#f7f7f7]"
                    }`}
                  >
                    {isExpired ? "Generate New Invoice" : "Cancel"}
                  </button>

                  {!isExpired && (
                    <p className="text-[11px] text-[#888] text-center">
                      Your balance is credited automatically once payment is confirmed on the blockchain (~2-10 min).
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-[#888]">Currency</label>
                    <div className="mt-1.5 grid grid-cols-4 gap-2">
                      {(currencies.length ? currencies : [{ id: "LTC" }, { id: "BTC" }, { id: "USDT" }, { id: "TRX" }]).map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setCurrency(c.id)}
                          className={`h-9 border text-[12px] font-medium tracking-wider transition ${
                            currency === c.id
                              ? "bg-[#2196f3] border-[#2196f3] text-white"
                              : "bg-white border-[#dcdcdc] text-[#555] hover:border-[#4fc3f7]"
                          }`}
                        >
                          {c.id}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-[#888]">Amount (USD)</label>
                    <input
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      type="number"
                      min={MIN_DEPOSIT}
                      placeholder="50"
                      className="mt-1.5 h-11 w-full border border-[#dcdcdc] px-3 text-[16px] font-mono outline-none focus:border-[#4fc3f7]"
                    />
                    <p className="text-[11px] text-[#888] mt-1">Minimum deposit: ${MIN_DEPOSIT}</p>
                  </div>

                  {amtNum > 0 && (
                    <div className="border border-[#e6e6e6] bg-[#fafafa] p-3 space-y-1 text-[12px]">
                      <div className="flex justify-between text-[#666]">
                        <span>Deposit amount</span><span className="font-mono">${amtNum.toFixed(2)}</span>
                      </div>
                      {(feePercent > 0 || feeFlat > 0) && (
                        <>
                          {feePercent > 0 && (
                            <div className="flex justify-between text-[#666]">
                              <span>Fee ({feePercent}%)</span><span className="font-mono">+${(amtNum * feePercent / 100).toFixed(2)}</span>
                            </div>
                          )}
                          {feeFlat > 0 && (
                            <div className="flex justify-between text-[#666]">
                              <span>Flat fee</span><span className="font-mono">+${feeFlat.toFixed(2)}</span>
                            </div>
                          )}
                        </>
                      )}
                      <div className="border-t border-[#e6e6e6] pt-1.5 flex justify-between font-semibold text-[#2196f3]">
                        <span>Total to pay</span><span className="font-mono">${totalToPay.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[#2fb344]">
                        <span>You receive</span><span className="font-mono">${amtNum.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={createInvoice}
                    disabled={busy}
                    className="w-full h-10 bg-[#2196f3] hover:bg-[#1e88e5] text-white text-[13px] inline-flex items-center justify-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bitcoin className="h-4 w-4" />}
                    Generate Payment Address
                  </button>
                  <p className="text-[11px] text-[#888]">
                    A unique {currency} address will be generated. Send crypto → balance credited automatically after blockchain confirmation.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Right: Bonus + How it works */}
          <section className="bg-white border border-[#e6e6e6]">
            <div className="px-4 h-10 flex items-center border-b border-[#eee] text-[13px] text-[#555] uppercase tracking-wider">
              Top-up Bonus
            </div>
            <div className="p-4">
              <ul className="divide-y divide-[#eee] border border-[#e6e6e6]">
                {[["$50", "$2 bonus"], ["$100", "$5 bonus"], ["$500", "$35 bonus"], ["$1,000", "$100 bonus"], ["$2,000", "$240 bonus"], ["$5,000", "$750 bonus"]].map(([a, b]) => (
                  <li key={a} className="flex items-center justify-between px-3 py-2 text-[13px]">
                    <span className="font-mono text-[#333]">{a}</span>
                    <span className="text-[#2fb344] flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />{b}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-[#888] mt-3">Bonus credited automatically after deposit confirmation.</p>

              <div className="mt-4 border border-[#e6e6e6] bg-[#fafafa] p-3">
                <h3 className="text-[12px] uppercase tracking-wider text-[#555] mb-2 flex items-center gap-1.5">
                  <QrCode className="h-3.5 w-3.5 text-[#2196f3]" /> How it works
                </h3>
                <ol className="text-[12px] text-[#666] space-y-1 list-decimal list-inside">
                  <li>Enter USD amount and choose crypto</li>
                  <li>Click "Generate Payment Address"</li>
                  <li>Send the exact crypto amount shown</li>
                  <li>Wait for blockchain confirmation (~2-10 min)</li>
                  <li>Balance credited automatically</li>
                </ol>
              </div>
            </div>
          </section>
        </div>

        {/* Transactions */}
        <section className="bg-white border border-[#e6e6e6]">
          <div className="px-4 h-10 flex items-center border-b border-[#eee] text-[13px] text-[#555] uppercase tracking-wider">
            <Receipt className="h-4 w-4 mr-2 text-[#2196f3]" /> Transaction History
          </div>
          <div className="p-3">
            {transactions.length === 0 && <p className="text-[13px] text-[#888] px-1 py-2">No transactions yet.</p>}
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

        {/* Recent deposits */}
        <section className="bg-white border border-[#e6e6e6]">
          <div className="px-4 h-10 flex items-center border-b border-[#eee] text-[13px] text-[#555] uppercase tracking-wider">
            Recent Deposits
          </div>
          <div className="p-3">
            {history.length === 0 && <p className="text-[13px] text-[#888] px-1 py-2">No deposits yet.</p>}
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
                        {d.status === "pending" && !isDepositExpired && (
                          <span className="ml-2">· expires in {Math.max(0, Math.ceil((30 * 60 * 1000 - (Date.now() - new Date(d.created_at).getTime())) / 60000))} min</span>
                        )}
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
      </div>
    </AppShell>
  );
};

export default Recharge;

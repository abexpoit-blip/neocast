import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authApi, setToken, ApiError } from "@/lib/api";
import { BuildBadge } from "@/components/BuildBadge";
import { toast } from "sonner";
import { RefreshCw, X, Loader2 } from "lucide-react";
import { getSavedAccounts, removeSavedAccount, type SavedAccount } from "@/lib/accountSwitcher";
import { ForgotPasswordDialog } from "@/components/ForgotPasswordDialog";
import Seo from "@/components/Seo";
import { useAuth } from "@/hooks/useAuth";

const Auth = () => {
  const nav = useNavigate();
  const loc = useLocation();
  const { refresh } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [captchaSeed, setCaptchaSeed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{ title: string; hint?: string } | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const fromPath = (loc.state as { from?: { pathname?: string } } | null)?.from?.pathname;
  const safeFrom = fromPath && fromPath !== "/auth" ? fromPath : null;

  const { a, b, op, expected } = useMemo(() => {
    const ops = ["+", "-", "*"] as const;
    const ai = Math.floor(Math.random() * 9) + 1;
    const bi = Math.floor(Math.random() * 9) + 1;
    const oi = ops[Math.floor(Math.random() * 3)];
    const ex = oi === "+" ? ai + bi : oi === "-" ? ai - bi : ai * bi;
    return { a: ai, b: bi, op: oi, expected: ex };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captchaSeed]);
  const captchaOk = captcha.trim() !== "" && Number(captcha) === expected;

  useEffect(() => {
    setSavedAccounts(getSavedAccounts());
    const prefill = sessionStorage.getItem("cruzercc.prefillEmail");
    if (prefill) {
      setUsername(prefill);
      sessionStorage.removeItem("cruzercc.prefillEmail");
    }
  }, []);

  const pickAccount = (acc: SavedAccount) => {
    setUsername(acc.email);
    setMode("login");
    setTimeout(() => document.getElementById("auth-password")?.focus(), 50);
  };

  const removeAccount = (e: React.MouseEvent, mail: string) => {
    e.stopPropagation();
    removeSavedAccount(mail);
    setSavedAccounts(getSavedAccounts());
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusBanner(null);
    if (!captchaOk) {
      setStatusBanner({ title: "Verification code is incorrect", hint: "Re-enter the answer shown." });
      return toast.error("Verification code is incorrect");
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const fakeEmail = email || `${username.toLowerCase()}@cruzercc.shop`;
        const result = await authApi.signup({ email: fakeEmail, username, password });
        setToken(result.token);
        await refresh();
        toast.success("Account created");
        nav("/shop", { replace: true });
      } else {
        const result = await authApi.login({ identifier: username.trim(), password });
        setToken(result.token);
        await refresh();
        const destination = safeFrom
          ?? (result.user.role === "seller" || result.user.role === "admin" ? "/seller" : "/shop");
        toast.success("Welcome back");
        nav(destination, { replace: true });
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 403 && err.message === "Use admin login") {
          sessionStorage.setItem("cruzercc.prefillAdminEmail", username.trim());
          toast.error("Admin-only account. Redirecting…");
          nav("/crzr-x9k2-panel", { replace: true });
          return;
        }
        setStatusBanner({ title: err.message, hint: `HTTP ${err.status}` });
        toast.error(err.message);
      } else {
        const msg = err instanceof Error ? err.message : "Login failed";
        setStatusBanner({ title: msg });
        toast.error(msg);
      }
    } finally { setLoading(false); }
  };

  return (
    <main
      className="min-h-screen w-full flex items-center justify-center bg-[#fafaf7] p-6"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <Seo title="Sign In or Create Account | cruzercc.shop" description="Buyer sign in and registration for cruzercc.shop — verified Gift Card and CC marketplace." path="/auth" />
      <BuildBadge />

      <div className="w-full max-w-[440px] bg-white border border-[#e8e4dd] p-10 md:p-12 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
        {/* Brand mark */}
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 bg-[#0a0a0a] rounded-full flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" strokeWidth={2} />
            </svg>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <h1
            className="text-[32px] leading-tight font-normal text-[#0a0a0a] mb-2"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-sm text-[#717171]">
            {mode === "login" ? "Enter your credentials to continue" : "Join cruzercc.shop in a moment"}
          </p>
          <p className="text-[12px] text-[#a1a1a1] mt-3">
            Telegram: <a href="https://t.me/cruzercc_shop" className="text-[#0a0a0a] font-medium hover:underline">@cruzercc_shop</a>
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#e8e4dd] mb-8">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
                mode === m
                  ? "border-[#0a0a0a] text-[#0a0a0a]"
                  : "border-transparent text-[#a1a1a1] hover:text-[#0a0a0a]"
              }`}
            >
              {m === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        {/* Saved accounts */}
        {savedAccounts.length > 0 && mode === "login" && (
          <div className="mb-6">
            <div className="text-[11px] uppercase tracking-widest text-[#a1a1a1] font-medium mb-2">Switch account</div>
            <div className="space-y-1.5">
              {savedAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => pickAccount(acc)}
                  className="w-full flex items-center gap-3 px-3 py-2 border border-[#e8e4dd] bg-[#fafaf7] hover:border-[#0a0a0a] transition-colors group text-left"
                >
                  <div className="h-8 w-8 rounded-full bg-[#0a0a0a] text-white flex items-center justify-center text-xs font-semibold shrink-0">
                    {acc.username[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#0a0a0a] truncate">{acc.username}</div>
                    <div className="text-[11px] text-[#a1a1a1] truncate">{acc.role} · {acc.email}</div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => removeAccount(e, acc.email)}
                    className="opacity-0 group-hover:opacity-100 text-[#a1a1a1] hover:text-[#0a0a0a] p-1 transition"
                    aria-label="Remove saved account"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </button>
              ))}
            </div>
          </div>
        )}

        {statusBanner && (
          <div className="mb-6 border border-[#e8b4b4] bg-[#fdf4f4] px-3 py-2.5 text-xs text-[#8a2a2a]" role="alert">
            <div className="font-semibold">{statusBanner.title}</div>
            {statusBanner.hint && <div className="opacity-80 mt-0.5">{statusBanner.hint}</div>}
          </div>
        )}

        {/* Form */}
        <form onSubmit={submit} className="space-y-6">
          <div>
            <label className="block text-[13px] font-medium text-[#0a0a0a] uppercase tracking-wider mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter username"
              className="w-full px-4 py-3 bg-[#fafaf7] border border-[#e8e4dd] text-[#0a0a0a] text-sm focus:outline-none focus:border-[#0a0a0a] transition-colors placeholder-[#a1a1a1]"
            />
          </div>

          {mode === "signup" && (
            <div>
              <label className="block text-[13px] font-medium text-[#0a0a0a] uppercase tracking-wider mb-2">Email (optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-[#fafaf7] border border-[#e8e4dd] text-[#0a0a0a] text-sm focus:outline-none focus:border-[#0a0a0a] transition-colors placeholder-[#a1a1a1]"
              />
            </div>
          )}

          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="block text-[13px] font-medium text-[#0a0a0a] uppercase tracking-wider">Password</label>
              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-[12px] text-[#717171] hover:text-[#0a0a0a] underline underline-offset-4"
                >
                  Forgot?
                </button>
              )}
            </div>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-[#fafaf7] border border-[#e8e4dd] text-[#0a0a0a] text-sm focus:outline-none focus:border-[#0a0a0a] transition-colors placeholder-[#a1a1a1]"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#0a0a0a] uppercase tracking-wider mb-2">Verification</label>
            <div className="flex gap-3">
              <input
                type="text"
                inputMode="numeric"
                value={captcha}
                onChange={(e) => setCaptcha(e.target.value)}
                placeholder="Answer"
                className="flex-1 px-4 py-3 bg-[#fafaf7] border border-[#e8e4dd] text-[#0a0a0a] text-sm focus:outline-none focus:border-[#0a0a0a] transition-colors placeholder-[#a1a1a1]"
              />
              <button
                type="button"
                onClick={() => { setCaptcha(""); setCaptchaSeed((s) => s + 1); }}
                className="w-32 bg-[#f0eee9] border border-[#e8e4dd] flex items-center justify-center gap-2 hover:bg-[#e8e4dd] transition-colors"
                aria-label="Refresh challenge"
              >
                <span
                  className="text-lg font-bold tracking-widest text-[#0a0a0a] select-none"
                  style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }}
                >
                  {a}{op}{b}=?
                </span>
                <RefreshCw className="h-3 w-3 text-[#717171]" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#0a0a0a] text-white text-sm font-medium tracking-wide hover:bg-[#262626] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "SIGNING IN…" : mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-10 pt-8 border-t border-[#e8e4dd] text-center">
          <p className="text-[12px] text-[#717171]">
            Need assistance? Reach us at{" "}
            <a href="https://t.me/cruzercc_shop" className="text-[#0a0a0a] font-medium hover:underline">
              @cruzercc_shop
            </a>
          </p>
        </div>
      </div>

      <ForgotPasswordDialog
        open={forgotOpen}
        onOpenChange={setForgotOpen}
        defaultEmail={username.includes("@") ? username : ""}
        redirectPath="/reset-password"
      />
    </main>
  );
};

export default Auth;

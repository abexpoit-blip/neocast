import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authApi, setToken, ApiError } from "@/lib/api";
import { BuildBadge } from "@/components/BuildBadge";
import { toast } from "sonner";
import { RefreshCw, X, Loader2, User as UserIcon, Lock, ShieldCheck } from "lucide-react";
import { getSavedAccounts, removeSavedAccount, type SavedAccount } from "@/lib/accountSwitcher";
import { ForgotPasswordDialog } from "@/components/ForgotPasswordDialog";
import Seo from "@/components/Seo";
import { useAuth } from "@/hooks/useAuth";
import { ScorpionAuthShell } from "@/components/ScorpionAuthShell";

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
  const [remember, setRemember] = useState(true);
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
    <>
      <Seo title="Sign In or Create Account | Scorpion-Shop" description="Buyer sign in and registration for Scorpion-Shop — verified marketplace." path="/auth" />
      <BuildBadge />
      <ScorpionAuthShell
        tagline={
          <>
            Connect to our Telegram channel tg:{" "}
            <a href="https://t.me/scorpionccstore02" className="text-[#ffd54f] font-semibold hover:underline">
              @scorpionccstore02
            </a>
          </>
        }
      >
        {/* Tabs */}
        <div className="flex mb-6 rounded-sm overflow-hidden border border-white/15">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 py-2 text-[13px] font-medium tracking-wide transition-colors ${
                mode === m ? "bg-[#2196f3] text-white" : "bg-transparent text-white/70 hover:text-white"
              }`}
            >
              {m === "login" ? "Log in" : "Sign up"}
            </button>
          ))}
        </div>

        {savedAccounts.length > 0 && mode === "login" && (
          <div className="mb-5">
            <div className="text-[10px] uppercase tracking-widest text-white/50 font-medium mb-2">
              Switch account
            </div>
            <div className="space-y-1.5">
              {savedAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => pickAccount(acc)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-sm bg-white/5 border border-white/10 hover:border-[#2196f3] transition-colors group text-left"
                >
                  <div className="h-8 w-8 rounded-full bg-[#2196f3] text-white flex items-center justify-center text-xs font-semibold shrink-0">
                    {acc.username[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{acc.username}</div>
                    <div className="text-[11px] text-white/50 truncate">{acc.role} · {acc.email}</div>
                  </div>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => removeAccount(e, acc.email)}
                    onKeyDown={(e) => { if (e.key === "Enter") removeAccount(e as unknown as React.MouseEvent, acc.email); }}
                    className="opacity-0 group-hover:opacity-100 text-white/60 hover:text-white p-1 transition"
                    aria-label="Remove saved account"
                  >
                    <X className="h-3.5 w-3.5" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {statusBanner && (
          <div className="mb-5 rounded-sm border border-red-400/50 bg-red-500/10 px-3 py-2.5 text-xs text-red-200" role="alert">
            <div className="font-semibold">{statusBanner.title}</div>
            {statusBanner.hint && <div className="opacity-80 mt-0.5">{statusBanner.hint}</div>}
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="username"
              className="w-full pl-10 pr-3 py-3 rounded-sm bg-white/5 border border-white/15 text-white text-sm placeholder-white/40 focus:outline-none focus:border-[#4fc3f7] transition-colors"
            />
          </div>

          {mode === "signup" && (
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email (optional)"
                className="w-full pl-10 pr-3 py-3 rounded-sm bg-white/5 border border-white/15 text-white text-sm placeholder-white/40 focus:outline-none focus:border-[#4fc3f7] transition-colors"
              />
            </div>
          )}

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="password"
              className="w-full pl-10 pr-3 py-3 rounded-sm bg-white/5 border border-white/15 text-white text-sm placeholder-white/40 focus:outline-none focus:border-[#4fc3f7] transition-colors"
            />
          </div>

          <div className="flex gap-2 items-stretch">
            <div className="relative flex-1">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
              <input
                type="text"
                inputMode="numeric"
                value={captcha}
                onChange={(e) => setCaptcha(e.target.value)}
                placeholder="verification code"
                className="w-full pl-10 pr-3 py-3 rounded-sm bg-white/5 border border-white/15 text-white text-sm placeholder-white/40 focus:outline-none focus:border-[#4fc3f7] transition-colors"
              />
            </div>
            <button
              type="button"
              onClick={() => { setCaptcha(""); setCaptchaSeed((s) => s + 1); }}
              className="min-w-[110px] px-3 rounded-sm bg-white/10 border border-white/15 flex items-center justify-center gap-2 hover:bg-white/15 transition-colors"
              aria-label="Refresh challenge"
            >
              <span
                className="text-base font-bold tracking-wider text-[#ffd54f] select-none"
                style={{ fontFamily: '"Space Grotesk", serif', fontStyle: "italic" }}
              >
                {a}{op}{b}=?
              </span>
              <RefreshCw className="h-3 w-3 text-white/60" />
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-[12px] text-white/70 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-3.5 w-3.5 accent-[#2196f3]"
              />
              Remember the password
            </label>
            {mode === "login" && (
              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="text-[12px] text-white/70 hover:text-[#4fc3f7] transition"
              >
                Forgot?
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 rounded-sm bg-[#2196f3] hover:bg-[#1976d2] text-white text-sm font-semibold tracking-wide transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Signing in…" : mode === "login" ? "Log in" : "Sign up"}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-[13px] text-[#4fc3f7] hover:text-[#81d4fa] transition"
          >
            {mode === "login" ? "Sign up" : "Have an account? Log in"}
          </button>
        </div>
      </ScorpionAuthShell>

      <ForgotPasswordDialog
        open={forgotOpen}
        onOpenChange={setForgotOpen}
        defaultEmail={username.includes("@") ? username : ""}
        redirectPath="/reset-password"
      />
    </>
  );
};

export default Auth;

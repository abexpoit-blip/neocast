import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, setToken, ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Lock, User as UserIcon, Loader2, ShieldCheck, RefreshCw, Package } from "lucide-react";
import Seo from "@/components/Seo";
import { ScorpionAuthShell } from "@/components/ScorpionAuthShell";

const SellerLogin = () => {
  const nav = useNavigate();
  const { profile, user, loading: authLoading, refresh } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [seed, setSeed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ title: string; detail?: string } | null>(null);

  const a = ((seed * 7 + 3) % 9) + 1;
  const b = ((seed * 5 + 2) % 9) + 1;
  const expected = a + b;
  const captchaOk = captcha.trim() !== "" && Number(captcha) === expected;

  useEffect(() => {
    if (!authLoading && user && (profile?.role === "seller" || profile?.role === "admin")) {
      nav("/seller", { replace: true });
    }
  }, [authLoading, user, profile]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!captchaOk) return toast.error("Verification code is incorrect");
    setLoading(true);
    try {
      const result = await authApi.sellerLogin({ identifier: username.trim(), password });
      if (result.user.role !== "seller" && result.user.role !== "admin") {
        throw new Error("This account does not have seller privileges.");
      }
      setToken(result.token);
      await refresh();
      toast.success("Welcome back, seller");
      nav("/seller", { replace: true });
    } catch (err: unknown) {
      let title = "Login failed"; let detail: string | undefined;
      if (err instanceof ApiError) {
        if (err.status === 401) { title = "Invalid credentials"; detail = "Check your username and password."; }
        else if (err.status === 403) { title = "Not a seller account"; detail = "Apply first on the buyer portal."; }
        else title = err.message;
      } else if (err instanceof Error) title = err.message;
      setError({ title, detail });
      toast.error(title);
    } finally { setLoading(false); }
  };

  return (
    <>
      <Seo title="Seller Sign In | Scorpion-Shop" description="Approved sellers sign in to manage stock, payouts and orders." path="/seller-login" />
      <ScorpionAuthShell
        title="Seller Portal"
        accent="gold"
        tagline={
          <span className="inline-flex items-center gap-2 text-white/85">
            <Package className="h-4 w-4 text-[#ffd54f]" />
            Approved sellers only
          </span>
        }
      >
        {error && (
          <div className="mb-4 rounded-sm border border-red-400/50 bg-red-500/10 px-3 py-2.5 text-xs text-red-200" role="alert">
            <div className="font-semibold">{error.title}</div>
            {error.detail && <div className="opacity-80 mt-0.5">{error.detail}</div>}
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
            <input value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="seller username"
              className="w-full pl-10 pr-3 py-3 rounded-sm bg-white/5 border border-white/15 text-white text-sm placeholder-white/40 focus:outline-none focus:border-[#ffd54f] transition-colors" />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
              placeholder="password"
              className="w-full pl-10 pr-3 py-3 rounded-sm bg-white/5 border border-white/15 text-white text-sm placeholder-white/40 focus:outline-none focus:border-[#ffd54f] transition-colors" />
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
              <input type="text" inputMode="numeric" value={captcha} onChange={(e) => setCaptcha(e.target.value)}
                placeholder="verification code"
                className="w-full pl-10 pr-3 py-3 rounded-sm bg-white/5 border border-white/15 text-white text-sm placeholder-white/40 focus:outline-none focus:border-[#ffd54f] transition-colors" />
            </div>
            <button type="button" onClick={() => { setCaptcha(""); setSeed((s) => s + 1); }}
              className="min-w-[110px] px-3 rounded-sm bg-white/10 border border-white/15 flex items-center justify-center gap-2 hover:bg-white/15 transition"
              aria-label="Refresh">
              <span className="text-base font-bold text-[#ffd54f] italic tracking-wider">{a}+{b}=?</span>
              <RefreshCw className="h-3 w-3 text-white/60" />
            </button>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 mt-3 rounded-sm bg-gradient-to-r from-[#ffb300] to-[#ff8f00] text-black text-sm font-bold tracking-wide hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Signing in…" : "Sign in as Seller"}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button onClick={() => nav("/auth")} className="text-[12px] text-white/70 hover:text-[#4fc3f7] transition">
            ← Back to buyer login
          </button>
        </div>
      </ScorpionAuthShell>
    </>
  );
};

export default SellerLogin;

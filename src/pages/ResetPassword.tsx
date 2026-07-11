import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lock, Loader2, ShieldCheck } from "lucide-react";
import { BuildBadge } from "@/components/BuildBadge";
import { ScorpionAuthShell } from "@/components/ScorpionAuthShell";

const ResetPassword = () => {
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirm) return toast.error("Passwords don't match");
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await supabase.auth.signOut();
      toast.success("Password updated — please sign in with your new password");
      nav("/auth");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reset failed");
    } finally { setLoading(false); }
  };

  return (
    <>
      <BuildBadge />
      <ScorpionAuthShell
        title="Reset Password"
        tagline={<span className="inline-flex items-center gap-2 text-white/85"><ShieldCheck className="h-4 w-4 text-[#4fc3f7]" /> Choose a new password</span>}
      >
        {!ready ? (
          <div className="text-center text-sm text-white/70 py-6">
            Waiting for reset link… If you didn't arrive here from an email link, request a new one from the sign-in page.
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                required minLength={8} placeholder="new password"
                className="w-full pl-10 pr-3 py-3 rounded-sm bg-white/5 border border-white/15 text-white text-sm placeholder-white/40 focus:outline-none focus:border-[#4fc3f7] transition-colors" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                required minLength={8} placeholder="confirm password"
                className="w-full pl-10 pr-3 py-3 rounded-sm bg-white/5 border border-white/15 text-white text-sm placeholder-white/40 focus:outline-none focus:border-[#4fc3f7] transition-colors" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 mt-3 rounded-sm bg-[#2196f3] hover:bg-[#1976d2] text-white text-sm font-semibold tracking-wide transition disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </ScorpionAuthShell>
    </>
  );
};

export default ResetPassword;

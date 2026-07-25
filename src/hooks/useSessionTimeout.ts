import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export const SESSION_START_KEY = "zoru.session.start";
export const SESSION_MINUTES = 30;

export function markSessionStart() {
  try { localStorage.setItem(SESSION_START_KEY, String(Date.now())); } catch { /* ignore */ }
}
export function clearSessionStart() {
  try { localStorage.removeItem(SESSION_START_KEY); } catch { /* ignore */ }
}

/**
 * 30-minute session limit for regular users (admins are exempt).
 * Counts from login time; on expiry the user is signed out and sent to /auth.
 */
export function useSessionTimeout(enabled: boolean) {
  const { signOut } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!enabled) return;
    let raw = localStorage.getItem(SESSION_START_KEY);
    if (!raw) { markSessionStart(); raw = String(Date.now()); }

    const limitMs = SESSION_MINUTES * 60 * 1000;

    const check = async () => {
      const start = Number(localStorage.getItem(SESSION_START_KEY) ?? raw);
      if (!Number.isFinite(start)) return;
      if (Date.now() - start >= limitMs) {
        clearSessionStart();
        await signOut();
        toast.info(`Сессия истекла (${SESSION_MINUTES} минут). Войдите снова.`);
        nav("/auth", { replace: true });
      }
    };

    void check();
    const id = window.setInterval(check, 15_000);
    const onFocus = () => { void check(); };
    window.addEventListener("focus", onFocus);
    return () => { window.clearInterval(id); window.removeEventListener("focus", onFocus); };
  }, [enabled, signOut, nav]);
}

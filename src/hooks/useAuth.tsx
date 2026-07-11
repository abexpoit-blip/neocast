import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { profileApi } from "@/lib/api";

export interface AppUser {
  id: string;
  email: string;
  username: string;
  role: string;
}

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  balance: number;
  role: string;
  is_seller: boolean;
  banned: boolean;
}

interface AuthCtx {
  user: AppUser | null;
  profile: Profile | null;
  loading: boolean;
  profileError: string | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const loadedForUid = useRef<string | null>(null);

  const loadProfile = useCallback(async (uid: string | null) => {
    if (!uid) {
      setUser(null);
      setProfile(null);
      loadedForUid.current = null;
      setProfileError(null);
      setLoading(false);
      return;
    }

    if (loadedForUid.current === uid) return;
    loadedForUid.current = uid;

    setLoading(true);
    setProfileError(null);
    try {
      const { profile: p } = await profileApi.get();
      const appUser: AppUser = { id: p.id, email: p.email, username: p.username, role: p.role };
      const prof: Profile = {
        id: p.id,
        username: p.username,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
        balance: Number(p.balance ?? 0),
        role: p.role,
        is_seller: p.role === "seller" || p.role === "admin",
        banned: false,
      };
      setUser(appUser);
      setProfile(prof);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Couldn't load profile";
      setProfileError(msg);
      setProfile(null);
      loadedForUid.current = null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Subscribe first, then check the current session so we never miss events.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null;
      // Never call async work synchronously inside the callback — defer it.
      setTimeout(() => { void loadProfile(uid); }, 0);
    });

    supabase.auth.getSession().then(({ data }) => {
      void loadProfile(data.session?.user?.id ?? null);
    });

    return () => { sub.subscription.unsubscribe(); };
  }, [loadProfile]);

  const refresh = async () => {
    loadedForUid.current = null;
    const { data } = await supabase.auth.getSession();
    await loadProfile(data.session?.user?.id ?? null);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    loadedForUid.current = null;
  };

  return (
    <Ctx.Provider value={{ user, profile, loading, profileError, refresh, signOut }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

// Holds the signed-in user for the whole app. On load it attempts a silent refresh
// (using the httpOnly cookie) so a page reload keeps you logged in without storing
// anything sensitive in the browser.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, setAccessToken, tryRefresh } from '../lib/api';

export type Role = 'super_admin' | 'org_admin' | 'security_analyst';

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
  orgId: string;
  totpEnabled: boolean;
};

type Status = 'loading' | 'authenticated' | 'anonymous';

type AuthContextValue = {
  status: Status;
  user: AuthUser | null;
  applySession: (session: { accessToken: string; user: AuthUser }) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (await tryRefresh()) {
        try {
          const me = await api.get<{ user: AuthUser }>('/auth/me');
          if (active) {
            setUser(me.user);
            setStatus('authenticated');
            return;
          }
        } catch {
          // fall through to anonymous
        }
      }
      if (active) setStatus('anonymous');
    })();
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      applySession: ({ accessToken, user: u }) => {
        setAccessToken(accessToken);
        setUser(u);
        setStatus('authenticated');
      },
      signOut: async () => {
        try {
          await api.post('/auth/logout');
        } finally {
          setAccessToken(null);
          setUser(null);
          setStatus('anonymous');
        }
      },
    }),
    [status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

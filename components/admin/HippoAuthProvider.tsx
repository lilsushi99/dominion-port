'use client';

// components/admin/HippoAuthProvider.tsx — Admin Auth Context
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface AdminUser {
  id: number;
  email: string;
  username: string;
  created_at: string;
  last_login_at: string | null;
}

interface AuthContextType {
  user: AdminUser | null;
  csrfToken: string;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  csrfToken: '',
  loading: true,
  login: async () => ({ success: false }),
  logout: async () => {},
  refreshAuth: async () => {},
});

export function HippoAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/admin/auth/me');
      if (res.ok) {
        const json = await res.json();
        setUser(json.data.user);
        setCsrfToken(json.data.csrfToken);
      } else {
        setUser(null);
        setCsrfToken('');
      }
    } catch {
      setUser(null);
      setCsrfToken('');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/v1/admin/auth/me');
        if (!mounted) return;
        if (res.ok) {
          const json = await res.json();
          setUser(json.data.user);
          setCsrfToken(json.data.csrfToken);
        } else {
          setUser(null);
          setCsrfToken('');
        }
      } catch {
        if (mounted) {
          setUser(null);
          setCsrfToken('');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!loading) {
      const isLoginPage = pathname === '/hippo/login';
      if (!user && !isLoginPage) {
        router.push('/hippo/login');
      } else if (user && isLoginPage) {
        router.push('/hippo');
      }
    }
  }, [user, loading, pathname, router]);

  const login = async (identifier: string, password: string) => {
    try {
      const res = await fetch('/api/v1/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error?.message || "Those details don't match." };
      }

      setUser(json.data.user);
      setCsrfToken(json.data.csrfToken);
      router.push('/hippo');
      return { success: true };
    } catch {
      return { success: false, error: 'Connection error. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/v1/admin/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      setCsrfToken('');
      router.push('/hippo/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, csrfToken, loading, login, logout, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useHippoAuth() {
  return useContext(AuthContext);
}

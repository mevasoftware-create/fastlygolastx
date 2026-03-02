import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo, useState } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = '/login' } =
    options ?? {};
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  // localStorage'dan user bilgisini oku (admin login için)
  const [localUser, setLocalUser] = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      return JSON.parse(localStorage.getItem('manus-runtime-user-info') || 'null');
    } catch {
      return null;
    }
  });

  // localStorage değişikliklerini dinle
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const stored = localStorage.getItem('manus-runtime-user-info');
        setLocalUser(stored ? JSON.parse(stored) : null);
      } catch {}
    };

    window.addEventListener('storage', handleStorageChange);
    // Manuel kontrol (aynı tab içinde değişiklikler için)
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    console.log('useAuth logout called');
    try {
      console.log('Calling logoutMutation.mutateAsync()...');
      await logoutMutation.mutateAsync();
      console.log('logoutMutation successful');
    } catch (error: unknown) {
      console.error('logoutMutation error:', error);
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        // Already logged out on server
      } else {
        throw error;
      }
    } finally {
      console.log('Clearing localStorage...');
      // Clear all auth-related data
      localStorage.removeItem('authToken');
      localStorage.removeItem('manus-runtime-user-info');
      setLocalUser(null);
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
      console.log('localStorage cleared');
    }
  }, [logoutMutation, utils]);

  // Sync user data to localStorage when meQuery succeeds
  useEffect(() => {
    if (meQuery.data) {
      // Mevcut localStorage'daki token'ı koru
      const existing = localStorage.getItem('manus-runtime-user-info');
      let token = null;
      if (existing) {
        try {
          const parsed = JSON.parse(existing);
          token = parsed.token;
        } catch {}
      }
      // Token varsa koru, yoksa user data'yı olduğu gibi kaydet
      localStorage.setItem(
        "manus-runtime-user-info",
        JSON.stringify(token ? { ...meQuery.data, token } : meQuery.data)
      );
    }
  }, [meQuery.data]);

  const state = useMemo(() => {
    // If localUser has admin role (token-based login), prioritize it over OAuth session
    // This handles the case where a regular user is logged in via Manus OAuth but admin
    // has logged in via token - admin token should take precedence
    const user = (localUser?.role === 'admin' && localUser?.token)
      ? localUser
      : (meQuery.data || localUser);
    // Consider loading if: initial load (only when no localUser), refetching without existing data, or logout pending
    // If localUser exists (e.g. admin login via token), don't block on meQuery.isLoading
    const isLoading = (meQuery.isLoading && !localUser) || logoutMutation.isPending ||
      (meQuery.isFetching && !meQuery.data && !localUser);
    return {
      user: user ?? null,
      loading: isLoading,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(user),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    meQuery.isFetching,
    logoutMutation.error,
    logoutMutation.isPending,
    localUser,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}

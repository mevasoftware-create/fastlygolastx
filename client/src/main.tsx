import React from "react";
import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";
import "./lib/i18n";
// SocketProvider moved to specific pages that need real-time features
import { HelmetProvider } from "react-helmet-async";


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  // Public pages that should not redirect to login
  const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/how-it-works', '/services', '/about-us', '/terms-of-service', '/privacy-policy', '/track-order', '/categories', '/areas', '/courier/register', '/business/register', '/api-docs'];
  const currentPath = window.location.pathname;
  
  // Don't redirect if we're on a public page
  if (publicPaths.some(path => currentPath === path || currentPath.startsWith(path))) {
    return;
  }

  window.location.href = '/login';
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${import.meta.env.VITE_API_URL || ''}/api/trpc`,
      transformer: superjson,
      fetch(input, init) {
        // localStorage'dan token oku (admin login için)
        const userInfo = localStorage.getItem('manus-runtime-user-info');
        let token = null;
        if (userInfo) {
          try {
            const parsed = JSON.parse(userInfo);
            token = parsed.token;
          } catch {}
        }

        const headers = new Headers(init?.headers);
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }

        // Add timeout to fetch requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        return globalThis.fetch(input, {
          ...(init ?? {}),
          headers,
          credentials: "include",
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));
      },
    }),
  ],
});

// Service Worker registration moved to index.html for better performance
// (loaded after page content to avoid blocking initial render)

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </trpc.Provider>
  </HelmetProvider>
);

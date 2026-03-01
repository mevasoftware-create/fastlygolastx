import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";

const plugins = [
  react(),
  tailwindcss(),
  jsxLocPlugin(),
  vitePluginManusRuntime(),
];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
    // Ensure only one copy of React is used (prevents "Invalid hook call" errors)
    dedupe: ["react", "react-dom", "react-dom/client", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  optimizeDeps: {
    // Force Vite to pre-bundle a single copy of React and all React-dependent libs
    // This prevents the "Invalid hook call" error caused by multiple React instances
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "@tanstack/react-query",
      "@trpc/react-query",
      "@trpc/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
    ],
    // Force ESM for packages that have both CJS and ESM exports
    // This ensures a single React instance is used
    esbuildOptions: {
      resolveExtensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json"],
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('@radix-ui')) {
              return 'vendor-ui';
            }
            if (id.includes('@trpc') || id.includes('@tanstack/react-query')) {
              return 'vendor-trpc';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-animation';
            }
            return 'vendor-other';
          }
        },
      },
    },
    chunkSizeWarningLimit: 500,
    sourcemap: false,
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    target: 'es2020',
    reportCompressedSize: true,
  },
  server: {
    host: true,
    port: parseInt(process.env.PORT || "3000"),
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".us1.manus.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    // HMR: Manus proxy does not support WebSocket upgrade (returns 200 instead of 101)
    // Completely disable HMR to prevent WebSocket connection errors in the console
    hmr: false,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});

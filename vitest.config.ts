import { defineConfig } from "vitest/config";
import path from "path";
// React plugin for JSX support in tests
// import react from "@vitejs/plugin-react";

export default defineConfig({
  // plugins: [react()],  // Enable if JSX support needed in tests
  root: path.resolve(import.meta.dirname),
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./client/src"),
      "@shared": path.resolve(import.meta.dirname, "./shared"),
    },
  },
  test: {
    environment: "node",
    include: [
      "server/**/*.test.ts",
      "server/**/*.spec.ts",
      "client/src/**/*.test.ts",
      "client/src/**/*.spec.ts"
    ],
  },
});

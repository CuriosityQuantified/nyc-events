import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  server: {
    host: "127.0.0.1",
    port: 3100,
    strictPort: true,
  },
  resolve: {
    alias: [
      {
        find: "next/navigation",
        replacement: path.resolve("e2e/harness/next-navigation.ts"),
      },
      {
        find: "next/link",
        replacement: path.resolve("e2e/harness/next-link.tsx"),
      },
      { find: "@", replacement: path.resolve(".") },
    ],
  },
});

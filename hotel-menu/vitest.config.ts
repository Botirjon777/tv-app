import { defineConfig } from "vitest/config";
import path from "node:path";

// Unit tests cover the pure logic in src/lib (no DB / no React). Node env is
// enough; the `@/` path alias mirrors the one in tsconfig.json.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});

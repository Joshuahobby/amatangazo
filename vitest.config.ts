import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Loads .env so the DB integration suite sees DATABASE_URL. Must run
    // before any test file imports @/lib/prisma (which reads it at import).
    setupFiles: ["./test/setup.ts"],
    include: ["test/**/*.test.ts"],
  },
});

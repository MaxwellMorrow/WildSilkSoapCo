import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    globalSetup: "./src/tests/setup/global-setup.ts",
    setupFiles: ["./src/tests/setup/test-setup.ts"],
    pool: "forks",
    poolOptions: {
      forks: {
        isolate: true,
      },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/app/api/**", "src/lib/**"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

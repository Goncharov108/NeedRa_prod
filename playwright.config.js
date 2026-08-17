import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  timeout: 120_000,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:5173",
    headless: true,
    viewport: { width: 1440, height: 900 },
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});

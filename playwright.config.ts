import fs from "node:fs";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

// Prefer an env-provided Chromium build over Playwright's pinned download.
// Falls back to Playwright's default resolution (the exact revision it
// downloads via `playwright install`) when neither is set, so normal
// dev/CI setups are unaffected.
function findFallbackChromium(): string | undefined {
  const browsersPath = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!browsersPath) return undefined;
  const candidate = path.join(browsersPath, "chromium");
  return fs.existsSync(candidate) ? candidate : undefined;
}

const chromiumExecutablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ?? findFallbackChromium();

export default defineConfig({
  testDir: "e2e",
  timeout: 120_000,
  use: {
    baseURL: "http://localhost:3000",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(chromiumExecutablePath ? { launchOptions: { executablePath: chromiumExecutablePath } } : {}),
      },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

import { expect, test } from "@playwright/test";

// Vite's HMR WebSocket tries to connect on the same port during dev mode.
// In headless Playwright runs the connection reliably fails (net::ERR_CONNECTION_REFUSED
// in console and "WebSocket closed without opened." as an uncaught exception).
// These are infrastructure noise, not game errors.
function isViteHmrNoise(msg: string): boolean {
  return (
    msg.includes("[vite]") ||
    msg.includes("WebSocket") ||
    msg.includes("ws://localhost") ||
    msg === "WebSocket closed without opened."
  );
}

test("bots play a full round to completion", async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: Error[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error" && !isViteHmrNoise(msg.text())) {
      consoleErrors.push(msg.text());
    }
  });

  page.on("pageerror", (err) => {
    if (!isViteHmrNoise(err.message)) {
      pageErrors.push(err);
    }
  });

  // Use a unique room per run so parallel or repeated runs don't collide.
  const room = `e2e-${Date.now()}`;
  await page.goto(`/?test=1&room=${room}`);

  // Wait for the game-over overlay — rendered when winningTeam !== null.
  await expect(page.getByText(/TEAM WINS|WASH · TIE/)).toBeVisible({ timeout: 110_000 });

  // No console errors or uncaught exceptions.
  expect(consoleErrors, `Console errors:\n${consoleErrors.join("\n")}`).toHaveLength(0);
  expect(
    pageErrors.map((e) => e.message),
    `Page errors:\n${pageErrors.map((e) => e.message).join("\n")}`,
  ).toHaveLength(0);
});

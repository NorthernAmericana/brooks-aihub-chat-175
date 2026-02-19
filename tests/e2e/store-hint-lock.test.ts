import { expect, test } from "@playwright/test";

test.describe("Store hint lock", () => {
  test("does not show Northern Americana hint when an external hint lock is active", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.sessionStorage.setItem(
        "brooks-active-hint",
        JSON.stringify({ owner: "brooks-ai-hub-edge-hint", claimedAt: Date.now() }),
      );
    });

    await page.goto("/store");

    const hintPanel = page.getByTestId("northern-americana-hint");
    await expect(hintPanel).toHaveClass(/translate-x-full/);
  });

  test("swipe-left opens NAMC web app without mutating install-gate state", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    const installGateWrites: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/namc/install-gate-state")) {
        installGateWrites.push(request.method());
      }
    });

    await page.goto("/store");

    await expect(page.getByTestId("northern-americana-hint")).toContainText(
      "Swipe left to open the NAMC web app. Install state only updates in /namc/install."
    );

    await page.mouse.move(1278, 360);
    await page.mouse.down();
    await page.mouse.move(1080, 360);

    await expect.poll(() => page.url()).toContain("https://www.northernamericana.media");

    expect(installGateWrites).toEqual([]);
  });
});

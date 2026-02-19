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
});

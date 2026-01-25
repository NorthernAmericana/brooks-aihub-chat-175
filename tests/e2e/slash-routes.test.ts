import { expect, test } from "@playwright/test";

test.describe("Slash Route Parsing", () => {
  test("preserves spaces in Brooks AI HUB slash route", async ({ page }) => {
    await page.goto("/");

    // Type a slash to trigger slash suggestions
    const input = page.getByTestId("multimodal-input");
    await input.fill("/");

    // Wait for slash suggestions to appear
    const slashSuggestions = page.locator("text=/Brooks AI HUB/");
    await expect(slashSuggestions).toBeVisible({ timeout: 5000 });

    // Verify the slash is rendered with spaces (not "/brooks/ aihub/")
    const slashText = await slashSuggestions.textContent();
    expect(slashText).toContain("Brooks AI HUB");
    expect(slashText).not.toContain("brooks/ aihub");
  });

  test("parses Brooks AI HUB slash route correctly", async ({ page }) => {
    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill("/Brooks AI HUB/ hello");
    await page.getByTestId("send-button").click();

    // URL should change to chat and message should be sent
    await expect(page).toHaveURL(/\/chat\/[\w-]+/, { timeout: 10_000 });

    // User message should be visible
    const userMessage = page.locator("[data-role='user']").first();
    await expect(userMessage).toBeVisible({ timeout: 5000 });
  });
});

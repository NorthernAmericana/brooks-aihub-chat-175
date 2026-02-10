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

  test("shows route suggestions when unknown route resolves with alternatives", async ({ page }) => {
    await page.route("**/api/routes/resolve**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "unknown",
          suggestions: [
            {
              id: "brooks-ai-hub",
              label: "Brooks AI HUB",
              slash: "Brooks AI HUB",
              route: "/brooks-ai-hub",
              kind: "official",
            },
          ],
        }),
      });
    });

    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    await input.fill("/unknown route/ help me");
    await page.getByTestId("send-button").click();

    await expect(
      page.getByText("Unknown route: /unknown route/. Try one of these:")
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Brooks AI HUB/i })).toBeVisible();
  });

  test("shows fallback feedback when unknown route has no suggestions", async ({ page }) => {
    await page.route("**/api/routes/resolve**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "unknown",
          suggestions: [],
        }),
      });
    });

    await page.goto("/");

    const input = page.getByTestId("multimodal-input");
    const draft = "/totallyunknown/ keep this";
    await input.fill(draft);
    await page.getByTestId("send-button").click();

    await expect(
      page.getByText("Route not found. Try typing `/` to browse available routes.")
    ).toBeVisible();
    await expect(page.getByTestId("unknown-route-helper")).toContainText(
      "Route not found. Try typing `/` to browse available routes."
    );
    await expect(input).toHaveValue(draft);
  });

  test("shows NAMC/Reader as founders-only in greeting", async ({ page }) => {
    await page.goto("/");

    const namcReader = page.getByRole("button", { name: /NAMC\/Reader/i });
    await expect(namcReader).toBeVisible({ timeout: 5000 });
    await expect(namcReader).toContainText("Founders only");
    await expect(namcReader).toContainText("💎");
  });
});

import { expect, test } from "@playwright/test";

test.describe("Secret Commands", () => {
  test("movie player appears when typing secret command", async ({ page }) => {
    await page.goto("/");

    // Type the secret command
    const input = page.getByTestId("multimodal-input");
    await input.fill("/NAMC/ let me watch a movie");

    // Click send
    await page.getByTestId("send-button").click();

    // Wait a moment for the video player to appear
    await page.waitForTimeout(500);

    // Check that video element exists
    const video = page.locator("video");
    await expect(video).toBeVisible();

    // Check that close button exists
    const closeButton = page.locator('button:has-text(""), button:has(svg)').first();
    await expect(closeButton).toBeVisible();
  });

  test("video player closes when X button is clicked", async ({ page }) => {
    await page.goto("/");

    // Type the secret command
    const input = page.getByTestId("multimodal-input");
    await input.fill("/NAMC/ let me watch a movie");

    // Click send
    await page.getByTestId("send-button").click();

    // Wait for video player to appear
    await page.waitForTimeout(500);

    // Find and click the close button (button with X icon in top-right corner)
    const closeButton = page.locator("button").filter({ 
      has: page.locator("svg") 
    }).first();
    await closeButton.click();

    // Wait a moment for the player to disappear
    await page.waitForTimeout(500);

    // Video should no longer be visible
    const video = page.locator("video");
    await expect(video).not.toBeVisible();
  });

  test("video player closes when Escape key is pressed", async ({ page }) => {
    await page.goto("/");

    // Type the secret command
    const input = page.getByTestId("multimodal-input");
    await input.fill("/NAMC/ let me watch a movie");

    // Click send
    await page.getByTestId("send-button").click();

    // Wait for video player to appear
    await page.waitForTimeout(500);
    
    const video = page.locator("video");
    await expect(video).toBeVisible();

    // Press Escape key
    await page.keyboard.press("Escape");

    // Wait a moment for the player to disappear
    await page.waitForTimeout(500);

    // Video should no longer be visible
    await expect(video).not.toBeVisible();
  });

  test("message is not sent to chat when using secret command", async ({ page }) => {
    await page.goto("/");

    // Type the secret command
    const input = page.getByTestId("multimodal-input");
    await input.fill("/NAMC/ let me watch a movie");

    // Click send
    await page.getByTestId("send-button").click();

    // Wait for any processing
    await page.waitForTimeout(1000);

    // Close the video player
    await page.keyboard.press("Escape");

    // Wait for video player to close
    await page.waitForTimeout(500);

    // The secret command should not appear as a message in the chat
    // Check that there are no user messages with this text
    const messageWithSecretCommand = page.locator(
      '[role="article"]:has-text("/NAMC/ let me watch a movie")'
    );
    await expect(messageWithSecretCommand).not.toBeVisible();
  });
});

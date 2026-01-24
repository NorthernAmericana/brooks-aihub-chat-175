import { expect, test } from "@playwright/test";

test.describe("Custom ATO Creation", () => {
  test.skip("shows Make your own ATO button in sidebar", async ({ page }) => {
    await page.goto("/");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Look for the "Make your own ATO" button
    const makeAtoButton = page.locator("text=Make your own ATO /../");
    await expect(makeAtoButton).toBeVisible({ timeout: 5000 });
  });

  test.skip("opens create custom ATO dialog", async ({ page }) => {
    await page.goto("/");

    // Click the "Make your own ATO" button
    const makeAtoButton = page.locator("text=Make your own ATO /../");
    await makeAtoButton.click();

    // Dialog should appear
    const dialog = page.locator("text=Create Custom ATO");
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Check for required form fields
    const nameInput = page.locator("label:text('ATO Name') + input");
    const slashInput = page.locator("label:text('Slash Command') + input");
    const voiceSelect = page.locator("label:text('Default Voice') ~ button");
    const instructionsTextarea = page.locator(
      "label:text('Prompt Instructions') + textarea"
    );
    const memoryScopeSelect = page.locator("label:text('Memory Scope') ~ button");

    await expect(nameInput).toBeVisible();
    await expect(slashInput).toBeVisible();
    await expect(voiceSelect).toBeVisible();
    await expect(instructionsTextarea).toBeVisible();
    await expect(memoryScopeSelect).toBeVisible();
  });
});

test.describe("Custom ATO Folder Panel", () => {
  test.skip("shows folder icon in chat header", async ({ page }) => {
    await page.goto("/");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Look for the folder icon button
    const folderIcon = page.locator("button[aria-label='ATO Slashes']");
    await expect(folderIcon).toBeVisible({ timeout: 5000 });

    // Check if it has 50% opacity (no custom ATOs yet)
    const opacity = await folderIcon.evaluate((el) => {
      return window.getComputedStyle(el).opacity;
    });
    expect(opacity).toBe("0.5");
  });

  test.skip("opens ATO list panel", async ({ page }) => {
    await page.goto("/");

    // Click the folder icon
    const folderIcon = page.locator("button[aria-label='ATO Slashes']");
    await folderIcon.click();

    // Panel should appear
    const panel = page.locator("text=ATO Slashes");
    await expect(panel).toBeVisible({ timeout: 5000 });

    // Check for sections
    const officialSection = page.locator("text=Official ATO slashes");
    const unofficialSection = page.locator("text=Unofficial ATO slashes");
    const searchBar = page.locator("input[placeholder='Search ATOs...']");

    await expect(officialSection).toBeVisible();
    await expect(unofficialSection).toBeVisible();
    await expect(searchBar).toBeVisible();
  });
});

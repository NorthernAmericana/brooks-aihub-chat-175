import { expect, test } from "@playwright/test";
import { createUser, deleteUser, loginAsUser } from "../helpers";

const testUser = {
  email: "customato-test@example.com",
  password: "test123456",
};

test.describe("Custom ATO", () => {
  test.beforeEach(async () => {
    await createUser(testUser.email, testUser.password);
  });

  test.afterEach(async () => {
    await deleteUser(testUser.email);
  });

  test("should display Make your own ATO button in sidebar", async ({
    page,
  }) => {
    await loginAsUser(page, testUser.email, testUser.password);
    await page.goto("/brooks-ai-hub/");

    // Wait for page to load
    await page.waitForSelector('[data-testid="sidebar"]', { timeout: 10000 });

    // Check for "Make your own ATO" button
    const atoButton = page.getByRole("button", {
      name: /make your own ato/i,
    });
    await expect(atoButton).toBeVisible();
  });

  test("should open custom ATO dialog when button is clicked", async ({
    page,
  }) => {
    await loginAsUser(page, testUser.email, testUser.password);
    await page.goto("/brooks-ai-hub/");

    // Wait for page to load
    await page.waitForSelector('[data-testid="sidebar"]', { timeout: 10000 });

    // Click "Make your own ATO" button
    const atoButton = page.getByRole("button", {
      name: /make your own ato/i,
    });
    await atoButton.click();

    // Check that dialog is visible
    await expect(
      page.getByRole("heading", { name: /make your own ato/i })
    ).toBeVisible();

    // Check form fields are present
    await expect(page.getByLabel(/ato name/i)).toBeVisible();
    await expect(page.getByLabel(/slash route/i)).toBeVisible();
    await expect(page.getByLabel(/default voice/i)).toBeVisible();
    await expect(page.getByLabel(/prompt instructions/i)).toBeVisible();
    await expect(page.getByLabel(/memory scope/i)).toBeVisible();
  });

  test("should show ATO browser button in chat header", async ({ page }) => {
    await loginAsUser(page, testUser.email, testUser.password);
    await page.goto("/brooks-ai-hub/");

    // Wait for chat to load
    await page.waitForSelector("header", { timeout: 10000 });

    // Check for folder/files icon button
    const browserButton = page.getByRole("button", {
      name: /browse ato slashes/i,
    });
    await expect(browserButton).toBeVisible();
  });

  test("should open ATO browser when folder icon is clicked", async ({
    page,
  }) => {
    await loginAsUser(page, testUser.email, testUser.password);
    await page.goto("/brooks-ai-hub/");

    // Wait for chat to load
    await page.waitForSelector("header", { timeout: 10000 });

    // Click folder/files icon
    const browserButton = page.getByRole("button", {
      name: /browse ato slashes/i,
    });
    await browserButton.click();

    // Check that sheet is visible with ATO lists
    await expect(
      page.getByRole("heading", { name: /ato slashes/i })
    ).toBeVisible();
    await expect(page.getByText(/official ato slashes/i)).toBeVisible();
    await expect(page.getByText(/unofficial ato slashes/i)).toBeVisible();
  });
});

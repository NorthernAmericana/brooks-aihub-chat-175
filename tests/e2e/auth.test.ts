import { expect, test } from "@playwright/test";

test.describe("Authentication Pages", () => {
  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByPlaceholder("user@acme.com")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Forgot password?" })
    ).toBeVisible();
    await expect(page.getByText("Don't have an account?")).toBeVisible();
  });

  test("register page renders correctly", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByPlaceholder("user@acme.com")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByLabel("Confirm Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign Up" })).toBeVisible();
    await expect(page.getByText("Already have an account?")).toBeVisible();
  });

  test("forgot password page renders request form", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByLabel("Email Address")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send reset link" })
    ).toBeVisible();
  });

  test("reset password page renders reset form with token", async ({
    page,
  }) => {
    await page.goto("/reset-password?token=test-token");
    await expect(page.getByLabel("New password")).toBeVisible();
    await expect(page.getByLabel("Confirm new password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Update password" })
    ).toBeVisible();
  });

  test("can navigate from login to register", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Sign up" }).click();
    await expect(page).toHaveURL("/register");
  });

  test("can navigate from register to login", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/login");
  });

  test("signed-in user can update password and sees validation failures", async ({
    page,
  }) => {
    const initialPassword = "Start123!";
    const nextPassword = "Updated123!";
    const email = `password-change-${Date.now()}@example.com`;

    await page.goto("/register");
    await page.getByLabel("Email Address").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(initialPassword);
    await page.getByLabel("Confirm Password").fill(initialPassword);
    await page.getByRole("button", { name: "Sign Up" }).click();

    await page.goto("/settings");

    await page.getByLabel("Current password").fill("Wrong123!");
    await page.getByLabel("New password").fill(nextPassword);
    await page.getByLabel("Confirm new password").fill(nextPassword);
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(
      page.getByText("Current password is incorrect.")
    ).toBeVisible();

    await page.getByLabel("Current password").fill(initialPassword);
    await page.getByLabel("New password").fill(nextPassword);
    await page.getByLabel("Confirm new password").fill(nextPassword);
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(page.getByText("Password updated.")).toBeVisible();
  });
});

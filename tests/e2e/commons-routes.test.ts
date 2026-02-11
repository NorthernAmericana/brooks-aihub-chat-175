import { expect, test } from "@playwright/test";

test.describe("Commons route tree", () => {
  test("resolves campfire feed route", async ({ page }) => {
    await page.goto("/commons/community/builders-circle");

    await expect(page.getByText("Commons · Campfire Feed")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "/commons/community/builders-circle"
    );
  });

  test("resolves post detail route", async ({ page }) => {
    const postId = "550e8400-e29b-41d4-a716-446655440000";
    await page.goto(`/commons/community/builders-circle/posts/${postId}`);

    await expect(page.getByText("Commons · Post Detail")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      `Post ${postId}`
    );
  });

  test("resolves submit route", async ({ page }) => {
    await page.goto("/commons/community/builders-circle/submit");

    await expect(page.getByText("Commons · Submit Post")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "New post in community/builders-circle"
    );
  });

  test("returns 404 for invalid campfire segments", async ({ page }) => {
    await page.goto("/commons/community/invalid_segment");

    await expect(page.getByText("This page could not be found.")).toBeVisible();
  });

  test("returns 404 for invalid post id", async ({ page }) => {
    await page.goto("/commons/community/builders-circle/posts/not-a-uuid");

    await expect(page.getByText("This page could not be found.")).toBeVisible();
  });
});

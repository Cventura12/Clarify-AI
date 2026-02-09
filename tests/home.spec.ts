import { test, expect } from "@playwright/test";

test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Clarify")).toBeVisible();
  await expect(page.getByText("Run pipeline")).toBeVisible();
});

import { test, expect } from '@playwright/test';

test.describe('Chess (canvas) UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Canvas is visible and draws something non-blank', async ({ page }) => {
    const canvas = page.locator('#board');
    await expect(canvas).toBeVisible();

    const img = await canvas.screenshot({ type: 'png' });
    expect(img.byteLength).toBeGreaterThan(1000);
  });

  test('Clicking a piece then a target square makes a move', async ({ page }) => {
    const status = page.locator('#status');
    await expect(status).toContainText(/White to move/);

    const canvas = page.locator('#board');
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();

    const sq = (file, rank) => {
      const c = file.charCodeAt(0) - 97;
      const r = 8 - rank;
      return {
        x: box.x + (c + 0.5) * (box.width / 8),
        y: box.y + (r + 0.5) * (box.height / 8)
      };
    };

    await page.mouse.click(sq('e', 2).x, sq('e', 2).y);
    await page.mouse.click(sq('e', 4).x, sq('e', 4).y);

    await expect(status).toContainText(/Black to move/);
  });

  test('New Game resets the game state', async ({ page }) => {
    await page.locator('#reset').click();
    await expect(page.locator('#status')).toContainText(/White to move/);
  });
});

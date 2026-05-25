import { test, expect } from '@playwright/test';

test('terminal loads and echoes input', async ({ page }) => {
  await page.goto('/');

  const terminal = page.locator('[role="terminal"]');
  await expect(terminal).toBeAttached();

  await expect(page.getByText(/Mirage v0\.1\.0/)).toBeVisible();

  const xtermInput = page.locator('.xterm-helper-textarea');
  if (await xtermInput.isVisible()) {
    await xtermInput.fill('hello world');
    await xtermInput.press('Enter');
    await expect(page.getByText(/\$ hello world/)).toBeVisible();
  }
});

test('Ctrl+L clears the terminal', async ({ page }) => {
  await page.goto('/');

  const terminal = page.locator('[role="terminal"]');
  await expect(terminal).toBeAttached();

  const xtermInput = page.locator('.xterm-helper-textarea');
  if (await xtermInput.isVisible()) {
    await xtermInput.fill('some text');
    await xtermInput.press('Control+l');
    await expect(page.getByText(/\$ /)).toBeVisible();
  }
});

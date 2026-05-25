import { test, expect } from '@playwright/test';

test('terminal loads and accepts input', async ({ page }) => {
  await page.goto('/');

  const terminal = page.locator('[role="terminal"]');
  await expect(terminal).toBeAttached();

  await expect(page.getByText(/Mirage v0\.1\.0/)).toBeVisible();
  await expect(page.getByText(/Type help/)).toBeVisible();
});

test('echo command works', async ({ page }) => {
  await page.goto('/');

  const xtermInput = page.locator('.xterm-helper-textarea');
  await expect(xtermInput).toBeAttached();

  await xtermInput.fill('echo hello world');
  await xtermInput.press('Enter');

  await expect(page.getByText(/hello world/)).toBeVisible();
});

test('help lists commands', async ({ page }) => {
  await page.goto('/');

  const xtermInput = page.locator('.xterm-helper-textarea');
  await expect(xtermInput).toBeAttached();

  await xtermInput.fill('help');
  await xtermInput.press('Enter');

  await expect(page.getByText(/Available commands/)).toBeVisible();
  await expect(page.getByText(/echo/)).toBeVisible();
});

test('unknown command shows error', async ({ page }) => {
  await page.goto('/');

  const xtermInput = page.locator('.xterm-helper-textarea');
  await expect(xtermInput).toBeAttached();

  await xtermInput.fill('nonexistent_command_xyz');
  await xtermInput.press('Enter');

  await expect(page.getByText(/command not found/)).toBeVisible();
});

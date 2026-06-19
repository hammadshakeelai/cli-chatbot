import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/** Read the active terminal buffer as plain text via the dev hook. */
async function bufferText(page: Page): Promise<string> {
  return page.evaluate(() => {
    const hook = (window as unknown as {
      __mirage?: { activeBuffer(): string };
    }).__mirage;
    return hook ? hook.activeBuffer() : '';
  });
}

async function typeInTerminal(page: Page, text: string): Promise<void> {
  await page.evaluate((t) => {
    const hook = (window as unknown as {
      __mirage?: { feed(data: string): void };
    }).__mirage;
    hook?.feed(t);
  }, text);
}

test('boots into PowerShell with the authentic banner', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.titlebar')).toBeVisible();
  await expect(page.locator('.tab')).toHaveCount(1);
  await expect.poll(() => bufferText(page), { timeout: 10000 })
    .toContain('Windows PowerShell');
  await expect.poll(() => bufferText(page)).toContain('PS C:\\Users\\user>');
});

test('runs dir and shows a PowerShell listing', async ({ page }) => {
  await page.goto('/');
  await expect.poll(() => bufferText(page), { timeout: 10000 }).toContain('PS C:');
  await typeInTerminal(page, 'dir\r');
  await expect.poll(() => bufferText(page), { timeout: 5000 }).toContain('Directory: C:\\Users\\user');
  await expect.poll(() => bufferText(page)).toContain('notes.txt');
});

test('unknown commands produce the PowerShell error', async ({ page }) => {
  await page.goto('/');
  await expect.poll(() => bufferText(page), { timeout: 10000 }).toContain('PS C:');
  await typeInTerminal(page, 'frobnicate\r');
  await expect.poll(() => bufferText(page), { timeout: 5000 })
    .toContain("The term 'frobnicate' is not recognized");
});

test('claude launches the Claude Code banner', async ({ page }) => {
  await page.goto('/');
  await expect.poll(() => bufferText(page), { timeout: 10000 }).toContain('PS C:');
  await typeInTerminal(page, 'claude\r');
  await expect.poll(() => bufferText(page), { timeout: 5000 }).toContain('Welcome to Claude Code!');
});

test('new tab dropdown opens agent profiles', async ({ page }) => {
  await page.goto('/');
  await page.locator('.titlebar-btn[aria-label="Profile menu"]').click();
  await expect(page.locator('.menu')).toBeVisible();
  await page.getByText('Antigravity', { exact: false }).first().click();
  await expect(page.locator('.tab')).toHaveCount(2);
});

test('settings dialog opens and changes the scheme', async ({ page }) => {
  await page.goto('/');
  await page.locator('.status-btn[title="Settings (Ctrl+,)"]').click();
  await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();
  await page.locator('.scheme-card', { hasText: 'Dracula' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-scheme', 'dracula');
});

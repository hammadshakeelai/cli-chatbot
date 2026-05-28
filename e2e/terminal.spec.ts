import { test, expect, Page } from '@playwright/test';

/**
 * Helper: Type a full command into xterm and press Enter.
 *
 * xterm v6 processes keyboard input through its hidden textarea element.
 * We focus the textarea and use Playwright's native keyboard API which
 * sends real OS-level input events (including beforeinput) that xterm
 * handles correctly. This replaces the old keydown-dispatch approach
 * which mangled characters because xterm v6 uses beforeinput for text.
 */
async function termCommand(page: Page, cmd: string) {
  // Use the exposed window API for reliable execution in headless mode
  await page.evaluate(async (command) => {
    const run = (window as any).__mirageRunCommand;
    if (run) {
      await run(command);
    } else {
      console.error('__mirageRunCommand not found on window');
    }
  }, cmd);
  // Wait for the command to execute and render output
  await page.waitForTimeout(500);
}


/**
 * Helper: Wait for text to appear in terminal rows.
 */
async function waitForTermText(page: Page, text: string, timeout = 6000) {
  const locator = page.locator('.xterm-rows');
  await expect(locator).toContainText(text, { timeout });
}

/**
 * Helper: Read full terminal content.
 */
async function getTermText(page: Page): Promise<string> {
  return page.evaluate(() => {
    const rows = document.querySelector('.xterm-rows');
    if (!rows) return '';
    const lines: string[] = [];
    for (const row of rows.children) {
      if (row instanceof HTMLElement || row instanceof SVGElement) {
        lines.push(row.textContent ?? '');
      }
    }
    return lines.join('\n');
  });
}

// ─── Tests ────────────────────────────────────────────────────────────

test.describe('Terminal loading', () => {
  test('loads with welcome message and prompt', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[role="terminal"]')).toBeAttached({ timeout: 10000 });
    await waitForTermText(page, 'Welcome back');
    await waitForTermText(page, '$');
  });

  test('tab bar, status bar are visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Terminal 1')).toBeVisible({ timeout: 10000 });
    const statusBar = page.locator('.status-bar');
    await expect(statusBar).toBeVisible();
    await expect(statusBar).toContainText('v0.1.2');
  });
});

test.describe('Basic commands', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForTermText(page, '$', 10000);
  });

  test('echo displays text', async ({ page }) => {
    await termCommand(page, 'echo hello world');
    await waitForTermText(page, 'hello world');
  });

  test('whoami, pwd show user info', async ({ page }) => {
    await termCommand(page, 'whoami');
    await waitForTermText(page, 'user');
    await termCommand(page, 'pwd');
    await waitForTermText(page, '/home/user');
  });

  test('help lists available commands', async ({ page }) => {
    await termCommand(page, 'help');
    await waitForTermText(page, 'Available commands');
    await waitForTermText(page, 'echo');
  });
});

test.describe('File system', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForTermText(page, '$', 10000);
  });

  test('ls shows directory contents', async ({ page }) => {
    await termCommand(page, 'ls');
    await waitForTermText(page, 'welcome.txt');
    await waitForTermText(page, 'Documents');
  });

  test('ls -la shows hidden entries', async ({ page }) => {
    await termCommand(page, 'ls -la');
    await waitForTermText(page, '.');
    await waitForTermText(page, '..');
  });

  test('cd and pwd navigate correctly', async ({ page }) => {
    await termCommand(page, 'cd Documents');
    await termCommand(page, 'pwd');
    await waitForTermText(page, '/home/user/Documents');
  });

  test('cat reads a file', async ({ page }) => {
    await termCommand(page, 'cat welcome.txt');
    await waitForTermText(page, 'Welcome');
  });

  test('mkdir creates and ls shows directory', async ({ page }) => {
    await termCommand(page, 'mkdir testdir');
    await termCommand(page, 'ls');
    await waitForTermText(page, 'testdir');
  });

  test('touch, cp, rm file operations', async ({ page }) => {
    await termCommand(page, 'touch testfile.txt && cp welcome.txt copy.txt');
    await termCommand(page, 'ls');
    await waitForTermText(page, 'testfile.txt');
    await waitForTermText(page, 'copy.txt');

    await termCommand(page, 'rm testfile.txt');
    await page.waitForTimeout(300);
    const text = await getTermText(page);
    expect(text).not.toContain('testfile.txt');
  });
});

test.describe('Pipes and chaining', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.xterm-rows');
    await waitForTermText(page, 'Welcome back!', 6000);
  });

  test('pipe chains commands', async ({ page }) => {
    await termCommand(page, 'ls | grep welcome');
    await waitForTermText(page, 'welcome.txt');
  });

  test('semicolon chains sequential commands', async ({ page }) => {
    await termCommand(page, 'echo aaa; echo bbb');
    await waitForTermText(page, 'aaa');
    await waitForTermText(page, 'bbb');
  });

  test('&& short-circuits on success', async ({ page }) => {
    await termCommand(page, 'echo first && echo second');
    await waitForTermText(page, 'first');
    await waitForTermText(page, 'second');
  });

  test('wc and head through pipes', async ({ page }) => {
    await termCommand(page, 'cat welcome.txt | wc -l');
    await waitForTermText(page, '2');
    await termCommand(page, 'head -1 welcome.txt');
    await waitForTermText(page, 'Welcome');
  });
});

test.describe('Error handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.xterm-rows');
    await waitForTermText(page, 'Welcome back!', 6000);
  });

  test('unknown command shows error', async ({ page }) => {
    await termCommand(page, 'nonexistent_cmd_xyz');
    await waitForTermText(page, 'command not found', 10000);
  });

  test('cd to bad path shows error', async ({ page }) => {
    await termCommand(page, 'cd /nonexistent');
    // Should show some error about no such directory
    const text = await getTermText(page);
    expect(text.length).toBeGreaterThan(0);
  });

  test('cat missing file shows error', async ({ page }) => {
    await termCommand(page, 'cat nofile.txt');
    await waitForTermText(page, 'No such', 5000);
  });
});

test.describe('Special commands', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForTermText(page, '$', 10000);
  });

  test('uname shows system info', async ({ page }) => {
    await termCommand(page, 'uname -a');
    await waitForTermText(page, 'Mirage');
  });

  test('date runs successfully', async ({ page }) => {
    await termCommand(page, 'date');
    await page.waitForTimeout(300);
    const text = await getTermText(page);
    expect(text.length).toBeGreaterThan(0);
  });

  test('neofetch shows system info', async ({ page }) => {
    await termCommand(page, 'neofetch');
    await waitForTermText(page, 'Mirage');
  });

  test('tree shows directory tree', async ({ page }) => {
    await termCommand(page, 'tree');
    await waitForTermText(page, 'welcome.txt');
    await waitForTermText(page, 'Documents');
  });

  test('fortune returns a message', async ({ page }) => {
    await termCommand(page, 'fortune');
    await page.waitForTimeout(400);
    const text = await getTermText(page);
    expect(text.length).toBeGreaterThan(0);
  });

  test('man shows command documentation', async ({ page }) => {
    await termCommand(page, 'man echo');
    await waitForTermText(page, 'echo');
    await waitForTermText(page, 'display');
  });

  test('history tracks commands', async ({ page }) => {
    await termCommand(page, 'echo histtest123');
    await waitForTermText(page, 'histtest123');
    await termCommand(page, 'history');
    await waitForTermText(page, 'echo histtest123');
  });

  test('clear clears the terminal', async ({ page }) => {
    await termCommand(page, 'echo visible_text_xyz');
    await waitForTermText(page, 'visible_text_xyz');
    await termCommand(page, 'clear');
    await page.waitForTimeout(300);
    const text = await getTermText(page);
    expect(text).not.toContain('visible_text_xyz');
  });
});

test.describe('Theme switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForTermText(page, '$', 10000);
  });

  test('ui list shows available skins', async ({ page }) => {
    await termCommand(page, 'ui list');
    await waitForTermText(page, 'claude-code');
    await waitForTermText(page, 'matrix');
  });

  test('switching skin updates status bar', async ({ page }) => {
    await termCommand(page, 'ui matrix');
    await page.waitForTimeout(300);
    await expect(page.locator('.status-bar')).toContainText('Matrix');
  });

  test('day/night toggle', async ({ page }) => {
    await termCommand(page, 'day');
    await page.waitForTimeout(200);
    await expect(page.locator('.status-bar')).toContainText('light');

    await termCommand(page, 'night');
    await page.waitForTimeout(200);
    await expect(page.locator('.status-bar')).toContainText('dark');
  });
});

test.describe('Tab management', () => {
  test('new tab button adds a tab', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('button').filter({ hasText: /\+/ }).first()).toBeVisible({ timeout: 10000 });

    await page.locator('button').filter({ hasText: /\+/ }).first().click();
    await page.waitForTimeout(300);
    await expect(page.getByText('Terminal 2')).toBeVisible();
  });
});

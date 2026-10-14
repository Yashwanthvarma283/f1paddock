import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function captureBatch12() {
  const dir = path.resolve('reviews/batch12');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });

  // 1. Desktop Dark
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      colorScheme: 'dark',
    });
    const page = await context.newPage();
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Capture initial hero
    const hero = page.locator('#next-race');
    await hero.screenshot({ path: path.join(dir, 'hero-desktop-dark.png') });

    // Wait until car passes Turn 1 to capture the enlarged corner badge on top of track
    await page.waitForTimeout(1500);
    await hero.screenshot({ path: path.join(dir, 'corner-top-track-dark.png') });
    await context.close();
  }

  // 2. Desktop Light
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      colorScheme: 'light',
    });
    const page = await context.newPage();
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Switch to light mode via theme toggle button if needed
    const themeBtn = page.locator('button[aria-label*="theme" i], button:has-svg, [data-theme-toggle]');
    const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    if (isDark) {
      const toggle = page.locator('button').filter({ hasText: /theme/i }).or(page.locator('header button').last());
      if (await toggle.count() > 0) {
        await toggle.first().click();
        await page.waitForTimeout(300);
      }
    }

    const hero = page.locator('#next-race');
    await hero.screenshot({ path: path.join(dir, 'hero-desktop-light.png') });

    await page.waitForTimeout(1500);
    await hero.screenshot({ path: path.join(dir, 'corner-top-track-light.png') });
    await context.close();
  }

  // 3. Mobile Dark & Light
  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      colorScheme: 'dark',
      isMobile: true,
    });
    const page = await context.newPage();
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const hero = page.locator('#next-race');
    await hero.screenshot({ path: path.join(dir, 'hero-mobile-dark.png') });
    await context.close();
  }

  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      colorScheme: 'light',
      isMobile: true,
    });
    const page = await context.newPage();
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const hero = page.locator('#next-race');
    await hero.screenshot({ path: path.join(dir, 'hero-mobile-light.png') });
    await context.close();
  }

  console.log('Batch 12 screenshots captured successfully into reviews/batch12/');
  await browser.close();
}

captureBatch12();

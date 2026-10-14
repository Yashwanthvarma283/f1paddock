import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const outDir = path.resolve(__dirname, '../reviews/batch14');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  
  // 1. Desktop Dark
  const pageDark = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await pageDark.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await pageDark.evaluate(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  });
  await pageDark.waitForTimeout(1500);
  
  const heroEl = await pageDark.$('[data-testid="dashboard-hero"]') || await pageDark.$('section');
  if (heroEl) {
    await heroEl.screenshot({ path: path.join(outDir, 'hero-desktop-dark.png') });
  }

  // 2. Desktop Light
  await pageDark.evaluate(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  });
  await pageDark.waitForTimeout(1000);
  if (heroEl) {
    await heroEl.screenshot({ path: path.join(outDir, 'hero-desktop-light.png') });
  }

  // 3. Mobile Dark & Light
  const pageMobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await pageMobile.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await pageMobile.evaluate(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  });
  await pageMobile.waitForTimeout(1200);
  const heroMob = await pageMobile.$('[data-testid="dashboard-hero"]') || await pageMobile.$('section');
  if (heroMob) {
    await heroMob.screenshot({ path: path.join(outDir, 'hero-mobile-dark.png') });
  }

  await pageMobile.evaluate(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  });
  await pageMobile.waitForTimeout(1000);
  if (heroMob) {
    await heroMob.screenshot({ path: path.join(outDir, 'hero-mobile-light.png') });
  }

  // 4. Corner active capture
  const pageCorner = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await pageCorner.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await pageCorner.evaluate(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  });
  await pageCorner.waitForTimeout(3000);
  const cornerHero = await pageCorner.$('[data-testid="dashboard-hero"]') || await pageCorner.$('section');
  if (cornerHero) {
    await cornerHero.screenshot({ path: path.join(outDir, 'corner-active-dark.png') });
  }

  await pageCorner.evaluate(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  });
  await pageCorner.waitForTimeout(1000);
  if (cornerHero) {
    await cornerHero.screenshot({ path: path.join(outDir, 'corner-active-light.png') });
  }

  await browser.close();
  console.log('Batch 14 screenshots verified at ' + outDir);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

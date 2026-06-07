import puppeteer from 'puppeteer';
import { mkdir } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '../public/assets/screenshots');
const BASE = 'https://thinking-cards.web.app';

const EMAIL = process.env.TC_EMAIL;
const PASSWORD = process.env.TC_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error('Set TC_EMAIL and TC_PASSWORD environment variables');
  process.exit(1);
}

const VIEWPORT = { width: 390, height: 844, deviceScaleFactor: 2 };

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function login(page) {
  console.log('Logging in...');
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
  await delay(1500);

  const inputs = await page.$$('input');
  await inputs[0].click({ clickCount: 3 });
  await inputs[0].type(EMAIL, { delay: 30 });
  await inputs[1].click({ clickCount: 3 });
  await inputs[1].type(PASSWORD, { delay: 30 });

  const signInBtn = await page.$('button.btn-primary');
  await signInBtn.click();

  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
  await delay(4000);
  console.log('Logged in!\n');
}

async function shot(page, name) {
  await page.screenshot({
    path: resolve(OUT_DIR, `${name}.png`),
    clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
  });
  console.log(`  ✓ ${name}.png`);
}

async function clickNav(page, label) {
  await page.evaluate((text) => {
    const spans = [...document.querySelectorAll('app-bottom-bar span')];
    const target = spans.find((s) => s.textContent?.trim() === text);
    if (target) target.closest('a')?.click();
  }, label);
}

// Click the "Start puzzles" / "Back to puzzle" button to dismiss instructions
async function dismissInstructions(page) {
  await delay(3000);
  const clicked = await page.evaluate(() => {
    const btn = document.querySelector('.start-btn');
    if (btn) { btn.click(); return true; }
    return false;
  });
  if (clicked) {
    console.log('  Dismissed instructions');
    await delay(3000);
  }
}

async function run() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: VIEWPORT,
    args: [`--window-size=${VIEWPORT.width},${VIEWPORT.height + 100}`],
  });

  const page = await browser.newPage();
  await login(page);

  // 1. Home
  console.log('Capturing home...');
  await shot(page, 'home');

  // 2. Card — click Socratic Sparks (second category card; first is Favorites)
  console.log('Capturing card...');
  await page.evaluate(() => {
    const cards = [...document.querySelectorAll('app-category-card')];
    if (cards.length > 1) cards[1].click();
    else if (cards[0]) cards[0].click();
  });
  await delay(5000);
  await shot(page, 'card');

  // Back to home
  await page.goBack();
  await delay(2000);

  // 3. Quizzes
  console.log('Capturing quizzes...');
  await clickNav(page, 'Quizzes');
  await delay(3000);
  await shot(page, 'quizzes');

  // 4. Puzzles
  console.log('Capturing puzzles...');
  await clickNav(page, 'Puzzles');
  await delay(3000);
  await shot(page, 'puzzles');

  // 5. Logic Matrix — click first puzzle card, dismiss instructions
  console.log('Capturing matrix...');
  await page.evaluate(() => {
    const cards = [...document.querySelectorAll('app-category-card')];
    if (cards[0]) cards[0].click();
  });
  await dismissInstructions(page);
  await shot(page, 'matrix');

  // Back to puzzles
  await page.goBack();
  await delay(2000);

  // 6. Cryptogram — click second puzzle card, dismiss instructions
  console.log('Capturing cryptogram...');
  await page.evaluate(() => {
    const cards = [...document.querySelectorAll('app-category-card')];
    if (cards[1]) cards[1].click();
  });
  await dismissInstructions(page);
  await shot(page, 'cryptogram');

  // Back to puzzles
  await page.goBack();
  await delay(2000);

  // 7. Nonogram — click third puzzle card, dismiss instructions
  console.log('Capturing nonogram...');
  await page.evaluate(() => {
    const cards = [...document.querySelectorAll('app-category-card')];
    if (cards[2]) cards[2].click();
  });
  await dismissInstructions(page);
  await shot(page, 'nonogram');

  // 8. Badges
  console.log('Capturing badges...');
  await page.goto(`${BASE}/badges`, { waitUntil: 'networkidle2' });
  await delay(6000);
  await shot(page, 'badges');

  await browser.close();
  console.log(`\nDone! Screenshots saved to ${OUT_DIR}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

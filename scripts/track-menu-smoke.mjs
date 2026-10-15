import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';

const origin = process.env.AUDIT_URL || 'http://127.0.0.1:5173';
const published = process.env.AUDIT_PUBLISHED === '1' && origin === 'https://dz6rec.vercel.app';
if (!published && !['localhost', '127.0.0.1'].includes(new URL(origin).hostname)) throw new Error('Synthetic data only.');
const bundle = published ? await build({ stdin: { contents: 'export { mockRequest } from "./src/api/mockData.js";', resolveDir: process.cwd() }, bundle: true, write: false, format: 'iife', globalName: 'QAMock' }) : null;
await mkdir('artifacts/visual-audit/track-menu', { recursive: true });
const browser = await chromium.launch();
try {
  for (const width of [360, 390, 768, 1024, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: width === 768 ? 500 : 844 }, reducedMotion: 'reduce' });
    if (published) await context.addInitScript({ content: bundle.outputFiles[0].text + '\nglobalThis.QAMock = QAMock;' });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    if (published) await page.route('**/api/**', async route => {
      try {
        const req = route.request();
        const data = await page.evaluate(({ url, method, body }) => QAMock.mockRequest(url, { method, body }), { url: req.url(), method: req.method(), body: req.postData() || undefined });
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
      } catch { await route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"Synthetic test failed"}' }); }
    });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin + '/projetos/project-1');
    await page.locator('h1').waitFor();
    await page.getByTitle('Single Piloto (Demo 01)', { exact: true }).waitFor();
    const trigger = page.getByRole('button', { name: 'Opções da faixa Single Piloto', exact: true });
    const menu = page.getByRole('menu');
    const check = async () => {
      await menu.waitFor();
      await page.waitForTimeout(180);
      assert.ok(await menu.evaluate(el => { const r = el.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight; }), 'menu remains inside viewport');
      assert.ok(await menu.evaluate(el => !el.closest('main')), 'portal escapes card clipping');
    };
    await trigger.click();
    await check();
    await page.screenshot({ path: `artifacts/visual-audit/track-menu/${width}-open.png` });
    await page.keyboard.press('Escape');
    await menu.waitFor({ state: 'hidden' });
    assert.ok(await trigger.evaluate(el => el === document.activeElement), 'Escape restores focus');
    await trigger.press('Enter');
    await check();
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('menuitem', { name: 'Nova versão', exact: true }).click()]);
    assert.equal(chooser.isMultiple(), false);
    await menu.waitFor({ state: 'hidden' });
    await page.evaluate(() => {
      const store = JSON.parse(localStorage.getItem('dz6_mock_store_v1'));
      store.TrackVersion = Array.from({ length: 40 }, (_, index) => ({ id: `qa-${index}`, track_id: store.Track[0].id, name: `Mix ${index + 1}`, audio_url: `/synthetic-mix-${index + 1}.mp3` }));
      localStorage.setItem('dz6_mock_store_v1', JSON.stringify(store));
    });
    await page.reload();
    await trigger.click();
    await check();
    assert.ok(await menu.evaluate(el => el.scrollHeight > el.clientHeight), 'long menu scrolls');
    await page.getByRole('menuitem', { name: 'Mix 40', exact: true }).click();
    await menu.waitFor({ state: 'hidden' });
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('dz6_mock_store_v1')).Track[0].audio_url), '/synthetic-mix-40.mp3');
    await page.getByTitle('Single Piloto (Mix 40)', { exact: true }).waitFor();
    await page.reload();
    await page.getByTitle('Single Piloto (Mix 40)', { exact: true }).waitFor();
    assert.deepEqual(errors, []);
    console.log(`${width}px: portal, viewport, Escape, keyboard, file picker, scrolling and version selection passed`);
    await context.close();
  }
} finally { await browser.close(); }

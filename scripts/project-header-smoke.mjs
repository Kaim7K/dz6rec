import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';

const origin = process.env.AUDIT_URL || 'http://127.0.0.1:5173';
const published = process.env.AUDIT_PUBLISHED === '1' && origin === 'https://dz6rec.vercel.app';
if (!published && !['localhost', '127.0.0.1'].includes(new URL(origin).hostname)) throw new Error('Synthetic data only.');
const bundle = published ? await build({ stdin: { contents: 'export { mockRequest } from "./src/api/mockData.js";', resolveDir: process.cwd() }, bundle: true, write: false, format: 'iife', globalName: 'QAMock' }) : null;
await mkdir('artifacts/visual-audit/project-header', { recursive: true });
const browser = await chromium.launch();
try {
  for (const width of [360, 390, 768, 938, 1024, 1100, 1280, 1440, 1600, 1920]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
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
    const check = async () => {
      const bounds = await page.locator('.dz-project-hero').evaluate(el => {
        const cover = el.querySelector('.dz-project-cover').getBoundingClientRect();
        const summary = el.querySelector('.dz-project-summary').getBoundingClientRect();
        const progress = el.querySelector('.dz-project-hero-progress').getBoundingClientRect();
        return {
          width: el.getBoundingClientRect().width,
          cover: { width: cover.width, height: cover.height, top: cover.top, right: cover.right, bottom: cover.bottom },
          summaryTop: summary.top,
          summaryBottom: summary.bottom,
          progress: { left: progress.left, top: progress.top, bottom: progress.bottom },
          overflow: document.documentElement.scrollWidth > innerWidth,
          childrenFit: [...el.querySelectorAll('.dz-project-progress-categories > div')].every(item => item.scrollWidth <= item.clientWidth + 1),
        };
      });
      assert.equal(bounds.overflow, false, 'no page overflow');
      assert.equal(bounds.childrenFit, true, 'progress categories fit their own container');
      assert.ok(Math.abs(bounds.cover.width - bounds.cover.height) < 2, 'cover remains square at every width');
      assert.ok(bounds.progress.top >= bounds.summaryBottom, 'progress follows the project information');
      if (bounds.width >= 672) {
        assert.ok(bounds.progress.left > bounds.cover.right, 'desktop progress shares the information column beside the cover');
        assert.ok(Math.abs((bounds.progress.bottom + bounds.summaryTop) / 2 - (bounds.cover.bottom + bounds.cover.top) / 2) < 2, 'desktop summary and progress form a centered group beside the cover');
        assert.ok(bounds.progress.top - bounds.summaryBottom <= 41, 'desktop information and progress stay together without a large empty gap');
      } else assert.ok(bounds.progress.top >= bounds.cover.bottom, 'stacked layout keeps progress after the square cover');
      if (bounds.width >= 672) assert.ok(bounds.cover.width <= 449, 'large cover remains bounded beside the summary');
      if (bounds.width >= 896) assert.ok(bounds.cover.width >= 320, 'cover is a prominent feature on desktop');
    };
    await page.goto(origin + '/projetos/project-1');
    await page.locator('h1').waitFor();
    await check();
    await page.screenshot({ path: `artifacts/visual-audit/project-header/${width}.png` });
    await page.evaluate(() => {
      const store = JSON.parse(localStorage.getItem('dz6_mock_store_v1'));
      store.Project[0].name = 'Ben\u00e7\u00e3o';
      store.Project[0].main_artist_name = 'ZW';
      store.Project[0].description = '';
      localStorage.setItem('dz6_mock_store_v1', JSON.stringify(store));
    });
    await page.reload();
    await page.locator('h1').waitFor();
    await check();
    await page.screenshot({ path: `artifacts/visual-audit/project-header/${width}-short.png` });
    await page.evaluate(() => {
      const store = JSON.parse(localStorage.getItem('dz6_mock_store_v1'));
      store.Project[0].name = 'Um projeto com nome longo para verificar a adaptacao do cabecalho';
      store.Project[0].description = 'Descricao extensa para avaliar o conteudo e os alinhamentos em telas intermediarias. '.repeat(4);
      localStorage.setItem('dz6_mock_store_v1', JSON.stringify(store));
    });
    await page.reload();
    await page.locator('h1').waitFor();
    await check();
    await page.setViewportSize({ width: width + 17, height: 1000 });
    await check();
    assert.deepEqual(errors, []);
    console.log(`${width}px: normal content, short title without description, long content and live resize passed`);
    await context.close();
  }
} finally { await browser.close(); }

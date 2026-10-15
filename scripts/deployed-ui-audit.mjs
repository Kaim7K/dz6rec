import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const origin = 'https://dz6rec.vercel.app';
const bundle = await build({ stdin: { contents: 'export { mockRequest } from "./src/api/mockData.js";', resolveDir: process.cwd() }, bundle: true, write: false, format: 'iife', globalName: 'QAMock' });
const browser = await chromium.launch();
const checks = [];
try {
  for (const width of [390, 938, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    await context.addInitScript({ content: bundle.outputFiles[0].text + '\nglobalThis.QAMock = QAMock;' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    // Exercise the published assets with synthetic responses. Never call real data APIs.
    await page.route('**/api/**', async route => {
      const req = route.request();
      try {
        const data = await page.evaluate(({ url, method, body }) => QAMock.mockRequest(url, { method, body }), { url: req.url(), method: req.method(), body: req.postData() || undefined });
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
      } catch (error) {
        console.log('Synthetic API interception:', new URL(req.url()).pathname, error.message);
        await route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"Synthetic QA request failed"}' });
      }
    });
    for (const path of ['/', '/projetos', '/artistas', '/minhas-tarefas', '/templates', '/usuarios', '/configuracoes', '/projetos/project-1']) {
      await page.goto(origin + path);
      await page.locator('h1').first().waitFor();
      console.log(width, path, page.url(), await page.locator('h1').first().textContent());
      assert.equal(await page.locator('main').evaluate(el => getComputedStyle(el).containerName), 'workspace');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      checks.push({ width, path, status: 'passed' });
    }
    await page.getByRole('button', { name: 'Reproduzir Single Piloto' }).click();
    assert.ok(await page.locator('.player-titles').evaluate(el => el.getBoundingClientRect().width >= 120));
    await page.getByRole('button', { name: 'Editar projeto', exact: true }).click();
    await page.waitForTimeout(200);
    assert.ok(await page.getByRole('dialog').evaluate(el => { const r = el.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight; }));
    assert.deepEqual(errors, []);
    await page.screenshot({ path: `artifacts/visual-audit/${width}-deployed-modal.png` });
    await context.close();
  }
  await writeFile('artifacts/visual-audit/deployed-results.json', JSON.stringify(checks, null, 2));
  console.log(JSON.stringify({ publishedAssetChecks: checks.length, api: 'intercepted with synthetic responses; no real data changed', failures: [] }));
} finally { await browser.close(); }

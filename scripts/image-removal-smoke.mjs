import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { build } from 'esbuild';

const origin = process.env.AUDIT_URL || 'http://127.0.0.1:5173';
const published = process.env.AUDIT_PUBLISHED === '1' && origin === 'https://dz6rec.vercel.app';
if (!published && !['localhost', '127.0.0.1'].includes(new URL(origin).hostname)) throw new Error('Use local mock data or explicitly opt into synthetic published-asset verification.');
const browser = await chromium.launch();
const image = await readFile('src/assets/dz6-profile.png');
const mockBundle = published ? await build({ stdin: { contents: 'export { mockRequest } from "./src/api/mockData.js";', resolveDir: process.cwd() }, bundle: true, write: false, format: 'iife', globalName: 'QAMock' }) : null;
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    if (published) await context.addInitScript({ content: mockBundle.outputFiles[0].text + '\nglobalThis.QAMock = QAMock;' });
    const page = await context.newPage();
    if (published) await page.route('**/api/**', async route => {
      const req = route.request();
      try {
        const data = await page.evaluate(({ url, method, body }) => QAMock.mockRequest(url, { method, body }), { url: req.url(), method: req.method(), body: req.postData() || undefined });
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
      } catch {
        // Never fall through to a real data API during this UI verification.
        await route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"Synthetic QA request failed"}' });
      }
    });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin + '/artistas');
    await page.locator('h1').waitFor();
    await page.evaluate((imageUrl) => {
      const store = JSON.parse(localStorage.getItem('dz6_mock_store_v1'));
      store.Artist[0].photo_url = imageUrl;
      store.Project[0].cover_url = imageUrl;
      store.User[0].photo_url = imageUrl;
      localStorage.setItem('dz6_mock_store_v1', JSON.stringify(store));
    }, `data:image/png;base64,${image.toString('base64')}`);
    const cases = [
      { route: '/artistas', edit: 'Editar Artista Demo', remove: 'Remover foto', entity: 'Artist', field: 'photo_url', save: 'Salvar' },
      { route: '/projetos/project-1', edit: 'Editar projeto', remove: 'Remover capa', entity: 'Project', field: 'cover_url', save: 'Salvar alterações' },
      { route: '/usuarios', edit: 'Editar usuário', remove: 'Remover foto', entity: 'User', field: 'photo_url', save: 'Salvar' },
    ];
    for (const item of cases) {
      const readImage = () => page.evaluate(({ entity, field }) => JSON.parse(localStorage.getItem('dz6_mock_store_v1'))[entity][0][field], item);
      const open = async () => {
        await page.goto(origin + item.route);
        await page.getByRole('button', { name: item.edit, exact: true }).first().click();
        await page.getByRole('button', { name: item.remove, exact: true }).waitFor();
      };
      await open();
      const dialog = page.getByRole('dialog');
      await dialog.locator('input[type="file"]').setInputFiles({ name: 'replacement.png', mimeType: 'image/png', buffer: image });
      await dialog.getByRole('button', { name: 'Remover arquivo', exact: true }).click();
      await dialog.getByRole('button', { name: item.remove, exact: true }).waitFor();
      assert.ok(await readImage(), 'discarding a replacement preserves the saved image');
      await dialog.getByRole('button', { name: item.remove, exact: true }).click();
      assert.ok(await readImage(), 'removal is not persisted before Save');
      await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
      assert.ok(await readImage(), 'Cancel preserves the saved image');
      await open();
      await dialog.getByRole('button', { name: item.remove, exact: true }).click();
      await dialog.getByRole('status').waitFor();
      await dialog.getByRole('button', { name: item.save, exact: true }).click();
      await dialog.waitFor({ state: 'hidden' });
      assert.equal(await readImage(), '', 'Save clears the persisted image URL');
      await page.reload();
      await page.getByRole('button', { name: item.edit, exact: true }).first().click();
      assert.equal(await dialog.getByRole('button', { name: item.remove, exact: true }).count(), 0);
      await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
      console.log(`${width}px ${item.entity}: replacement discard, removal, cancel, save and reload passed`);
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
} finally { await browser.close(); }

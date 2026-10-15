import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';

const origin = process.env.AUDIT_URL || 'http://127.0.0.1:5173';
const published = process.env.AUDIT_PUBLISHED === '1' && origin === 'https://dz6rec.vercel.app';
const serverMode = published || origin === 'http://qa.localhost:5173';
if (!serverMode && !['localhost', '127.0.0.1'].includes(new URL(origin).hostname)) throw new Error('Synthetic data only.');
const bundle = serverMode ? await build({ stdin: { contents: 'export { mockRequest } from "./src/api/mockData.js";', resolveDir: process.cwd() }, bundle: true, write: false, format: 'iife', globalName: 'QAMock' }) : null;
await mkdir('artifacts/visual-audit/artist-assignment', { recursive: true });
const browser = await chromium.launch();
try {
  for (const width of [360, 768, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: width === 768 ? 500 : 1000 }, reducedMotion: 'reduce' });
    if (serverMode) await context.addInitScript({ content: bundle.outputFiles[0].text + '\nglobalThis.QAMock = QAMock;' });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    if (serverMode) await page.route(url => url.pathname.startsWith('/api/'), async route => {
      try {
        const req = route.request();
        if (req.method() === 'GET' && new URL(req.url()).pathname === '/api/entities/User') await new Promise(resolve => setTimeout(resolve, 250));
        const data = await page.evaluate(({ url, method, body }) => QAMock.mockRequest(url, { method, body }), { url: req.url(), method: req.method(), body: req.postData() || undefined });
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
      } catch { await route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"Falha simulada"}' }); }
    });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const store = () => page.evaluate(() => JSON.parse(localStorage.getItem('dz6_mock_store_v1')));
    const linkUser = async name => {
      await page.getByRole('combobox', { name: 'Usuário vinculado', exact: true }).click();
      await page.getByRole('option', { name, exact: true }).click();
    };
    const checkDialog = async name => {
      const dialog = page.getByRole('dialog');
      await dialog.waitFor();
      await page.waitForTimeout(180);
      const bounds = await dialog.evaluate(el => { const r = el.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: innerWidth, height: innerHeight }; });
      assert.ok(bounds.left >= 0 && bounds.right <= bounds.width && bounds.top >= 0 && bounds.bottom <= bounds.height, JSON.stringify(bounds));
      await page.screenshot({ path: `artifacts/visual-audit/artist-assignment/${width}-${name}.png` });
      const report = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      assert.deepEqual(report.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })), []);
    };
    await page.goto(origin + '/artistas');
    await page.getByRole('button', { name: 'Novo artista', exact: true }).click();
    await page.getByRole('textbox', { name: 'Nome', exact: true }).fill('Artista QA');
    await linkUser('Artista Demo · artista@dz6.local');
    await checkDialog('new-artist');
    await page.getByRole('button', { name: 'Criar artista', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    assert.equal((await store()).Artist.find(a => a.name === 'Artista QA').user_id, 'user-artista');
    await page.getByRole('button', { name: 'Editar Artista Demo', exact: true }).click();
    await linkUser('Artista Demo · artista@dz6.local');
    await page.getByRole('button', { name: 'Salvar', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    assert.equal((await store()).Artist.find(a => a.id === 'artist-1').user_id, 'user-artista');
    await page.reload();
    await page.getByRole('button', { name: 'Editar Artista Demo', exact: true }).click();
    try { await page.getByRole('combobox', { name: 'Usuário vinculado', exact: true }).filter({ hasText: 'artista@dz6.local' }).waitFor(); }
    catch (error) {
      console.log('Synthetic reload diagnostics', { artist: (await store()).Artist.find(a => a.id === 'artist-1'), selected: await page.getByRole('combobox', { name: 'Usuário vinculado', exact: true }).textContent(), alerts: await page.getByRole('alert').allTextContents() });
      throw error;
    }
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await page.evaluate(() => {
      const data = JSON.parse(localStorage.getItem('dz6_mock_store_v1'));
      data.Artist.find(a => a.id === 'artist-2').user_id = 'user-designer';
      data.ChecklistItem = data.ChecklistItem.map(item => ({ ...item, due_date: '' }));
      Object.assign(data.ChecklistItem.find(item => item.id === 'item-1'), { responsible_id: '', responsible_name: '', responsible_ids: [], responsible_names: [] });
      localStorage.setItem('dz6_mock_store_v1', JSON.stringify(data));
    });
    await page.goto(origin + '/projetos/project-1');
    await page.getByRole('tab', { name: 'Operação', exact: true }).click();
    const owner = page.locator('[data-project-owner]');
    await owner.filter({ hasText: 'artista@dz6.local' }).waitFor();
    assert.ok((await owner.textContent()).includes('Artista Demo'));
    await page.evaluate(() => {
      window.__qaNavigation = 'unchanged';
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key, value) {
        if (key === 'dz6_mock_store_v1') {
          const data = JSON.parse(value);
          if (window.__qaFailAssign && data.ChecklistItem.some(item => item.id === 'item-1' && item.responsible_ids?.includes('user-artista'))) throw new Error('Falha simulada');
          if (window.__qaFailNotify && data.Notification.some(item => item.project_id === 'project-1' && item.user_id === 'user-artista')) throw new Error('Falha simulada');
        }
        return original.call(this, key, value);
      };
    });
    await page.getByRole('button', { name: 'Atribuir', exact: true }).click();
    await checkDialog('assign');
    assert.equal(await page.evaluate(() => window.__qaNavigation), 'unchanged');
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
    assert.equal((await store()).ChecklistItem.find(item => item.id === 'item-1').responsible_id, '');
    await page.getByRole('button', { name: 'Atribuir', exact: true }).click();
    await page.getByRole('combobox', { name: 'Responsável pela tarefa', exact: true }).click();
    await page.getByRole('option', { name: 'Artista Demo · artista@dz6.local', exact: true }).click();
    await page.evaluate(() => { window.__qaFailAssign = true; });
    await page.getByRole('dialog').getByRole('button', { name: 'Atribuir', exact: true }).click();
    await page.getByRole('dialog').getByRole('alert').waitFor();
    assert.equal((await store()).ChecklistItem.find(item => item.id === 'item-1').responsible_id, '');
    await page.evaluate(() => { window.__qaFailAssign = false; window.__qaFailNotify = true; });
    await page.getByRole('dialog').getByRole('button', { name: 'Atribuir', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    assert.deepEqual((await store()).ChecklistItem.find(item => item.id === 'item-1').responsible_ids, ['user-artista']);
    assert.equal(await page.evaluate(() => window.__qaNavigation), 'unchanged');
    await owner.getByRole('button', { name: 'Editar vínculo', exact: true }).click();
    await linkUser('Sem usuário vinculado');
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
    assert.equal((await store()).Artist.find(a => a.id === 'artist-1').user_id, 'user-artista');
    await page.evaluate(() => {
      const data = JSON.parse(localStorage.getItem('dz6_mock_store_v1'));
      Object.assign(data.ChecklistItem.find(item => item.id === 'item-1'), { responsible_id: '', responsible_name: '' });
      localStorage.setItem('dz6_mock_store_v1', JSON.stringify(data));
    });
    await page.reload();
    await page.getByRole('tab', { name: 'Operação', exact: true }).click();
    await page.getByRole('button', { name: 'Revisar', exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Atribuir', exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Editar projeto', exact: true }).click();
    await page.getByRole('combobox', { name: 'Artista principal', exact: true }).click();
    await page.getByRole('option', { name: 'MC Exemplo', exact: true }).click();
    await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await owner.filter({ hasText: 'designer@dz6.local' }).waitFor();
    assert.ok((await owner.textContent()).includes('MC Exemplo'));
    await owner.getByRole('button', { name: 'Editar vínculo', exact: true }).click();
    await linkUser('Sem usuário vinculado');
    await page.getByRole('button', { name: 'Salvar', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await owner.filter({ hasText: 'Sem usuário vinculado' }).waitFor();
    assert.ok((await owner.textContent()).includes('MC Exemplo'));
    await page.getByRole('button', { name: 'Revisar', exact: true }).click();
    await page.getByRole('tab', { name: 'Tarefas', selected: true }).waitFor();
    await page.locator('[data-task-id="item-3"]').getByRole('button', { name: 'Recolher tarefa', exact: true }).waitFor();
    assert.deepEqual(errors, []);
    console.log(`${width}px: artist link create/edit/persistence, derived owner, no reload, cancel, failed assignment, retry, notification failure and task navigation passed`);
    await context.close();
  }
} finally { await browser.close(); }

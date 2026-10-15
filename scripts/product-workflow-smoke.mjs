import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';

const origin = process.env.AUDIT_URL || 'http://127.0.0.1:5173';
const remote = process.env.AUDIT_PUBLISHED === '1' && origin === 'https://dz6rec.vercel.app';
const serverMode = remote || origin === 'http://qa.localhost:5173';
if (!serverMode && !['localhost', '127.0.0.1'].includes(new URL(origin).hostname)) throw new Error('Synthetic data only.');
const bundle = serverMode ? await build({ stdin: { contents: 'export { mockRequest } from "./src/api/mockData.js";', resolveDir: process.cwd() }, bundle: true, write: false, format: 'iife', globalName: 'QAMock' }) : null;
const output = 'artifacts/visual-audit/product-workflow';
await mkdir(output, { recursive: true });
const svg = (w, h) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#171010"/><circle cx="${w / 2}" cy="${h / 2}" r="${w / 4}" fill="#c20000"/></svg>`);
const browser = await chromium.launch();
try {
  for (const width of [360, 768, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: width === 768 ? 600 : 900 }, reducedMotion: 'reduce' });
    if (bundle) await context.addInitScript({ content: bundle.outputFiles[0].text + '\nglobalThis.QAMock = QAMock;' });
    const page = await context.newPage(); page.setDefaultTimeout(15000);
    if (serverMode) await page.route(url => url.pathname.startsWith('/api/'), async route => {
      try {
        const req = route.request();
        if (new URL(req.url()).pathname === '/api/entities/User') await new Promise(resolve => setTimeout(resolve, 150));
        const data = await page.evaluate(({ url, method, body }) => QAMock.mockRequest(url, { method, body }), { url: req.url(), method: req.method(), body: req.postData() || undefined });
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
      } catch { await route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"Falha simulada no teste"}' }); }
    });
    await page.route('**/qa-cover.svg', route => route.fulfill({ contentType: 'image/svg+xml', body: svg(512, 512) }));
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    const store = () => page.evaluate(() => JSON.parse(localStorage.getItem('dz6_mock_store_v1')));
    const choose = async (label, name) => { await page.getByRole('combobox', { name: label, exact: true }).click(); await page.getByRole('option', { name, exact: true }).click(); };
    const close = async () => { await page.getByRole('button', { name: 'Fechar', exact: true }).click(); };
    const checkDialog = async name => {
      const dialog = page.getByRole('dialog'); await dialog.waitFor(); await page.waitForTimeout(180);
      assert.ok(await dialog.evaluate(el => { const r = el.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight && el.scrollWidth <= el.clientWidth + 1; }));
      assert.ok(await dialog.evaluate(el => { const footer = el.querySelector('.dz-dialog-footer'); if (!footer) return true; const bounds = el.getBoundingClientRect(); return [...footer.querySelectorAll('button')].every(button => { const r = button.getBoundingClientRect(); return r.top >= bounds.top && r.bottom <= bounds.bottom + 1; }); }), 'review actions remain inside the modal');
      const report = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      assert.deepEqual(report.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })), []);
      await page.screenshot({ path: `${output}/${width}-${name}.png` });
    };
    const versions = async () => { await page.getByRole('tab', { name: 'Faixas', exact: true }).click(); await page.getByRole('button', { name: 'Opções da faixa Single Piloto', exact: true }).click(); await page.getByRole('menuitem', { name: 'Gerenciar versões', exact: true }).click(); await page.getByRole('heading', { name: 'Versões da faixa', exact: true }).waitFor(); };
    const gotoReview = async (profile, entity, id) => { await page.evaluate(profile => localStorage.setItem('dz6_mock_profile_id', profile), profile); await page.goto(`${origin}/projetos/project-1?tab=${entity === 'TrackVersion' ? 'faixas' : 'operacao'}&review=${entity}&record=${id}`); await page.getByRole('heading', { name: 'Revisão do arquivo', exact: true }).waitFor(); };
    const requestReview = async () => { await choose('Revisor do arquivo', 'Artista Demo · artista@dz6.local'); await page.getByRole('textbox', { name: 'Comentário (opcional)', exact: true }).fill('Verificar a entrega final.'); await page.getByRole('button', { name: 'Solicitar revisão', exact: true }).click(); await page.getByRole('heading', { name: 'Revisão do arquivo', exact: true }).waitFor({ state: 'hidden' }); };

    await page.goto(origin + '/projetos/project-1'); await page.locator('h1').waitFor();
    await page.evaluate(origin => {
      const data = JSON.parse(localStorage.getItem('dz6_mock_store_v1'));
      data.Project[0].cover_url = origin + '/qa-cover.svg';
      data.Artist[0].user_id = 'user-artista';
      data.ChecklistItem.forEach(item => { item.due_date = ''; });
      data.TrackVersion = [{ id: 'qa-v1', track_id: 'track-1', name: 'Demo 01', audio_url: origin + '/qa-audio.wav', created_date: '2026-10-15T10:00:00Z' }, { id: 'qa-v2', track_id: 'track-1', name: 'Mix 2', audio_url: origin + '/qa-audio-2.wav', created_date: '2026-10-15T11:00:00Z' }];
      Object.assign(data.Track[0], { audio_url: origin + '/qa-audio.wav', current_version_id: 'qa-v1' });
      Object.assign(data.ProjectFile[0], { name: 'Capa QA', category: 'capa', file_url: origin + '/qa-cover.svg', status: 'recebido' });
      localStorage.setItem('dz6_mock_store_v1', JSON.stringify(data));
    }, origin);
    await page.reload(); await page.locator('h1').waitFor();
    assert.ok(await page.locator('.dz-project-cover').evaluate(el => Math.abs(el.clientWidth - el.clientHeight) < 2));
    await page.getByRole('button', { name: 'Editar projeto', exact: true }).click();
    await page.getByRole('dialog').locator('input[type=file]').setInputFiles({ name: 'retangular.svg', mimeType: 'image/svg+xml', buffer: svg(400, 200) });
    await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
    await page.getByRole('dialog').getByRole('alert').filter({ hasText: '1:1' }).waitFor();
    assert.ok(await page.getByRole('button', { name: 'Salvar alterações', exact: true }).isEnabled());
    assert.equal((await store()).Project[0].cover_url, origin + '/qa-cover.svg');
    await close();
    await versions(); await checkDialog('versions');
    const first = page.getByRole('article').filter({ hasText: 'Demo 01' });
    await first.getByRole('button', { name: 'Renomear Demo 01', exact: true }).click();
    await page.getByRole('textbox', { name: 'Nome da versão', exact: true }).fill('Demo final');
    await page.getByRole('button', { name: 'Salvar nome', exact: true }).click();
    await page.getByRole('button', { name: 'Renomear Demo final', exact: true }).waitFor();
    assert.equal((await store()).Track[0].version_label, 'Demo final');
    const mix = page.getByRole('article').filter({ hasText: 'Mix 2' });
    await mix.getByRole('button', { name: 'Usar versão', exact: true }).click();
    await mix.getByRole('button', { name: 'Atual', exact: true }).waitFor();
    assert.equal((await store()).Track[0].current_version_id, 'qa-v2');
    await mix.getByRole('button', { name: 'Revisar versão', exact: true }).click();
    await checkDialog('audio-review'); await requestReview(); await close();
    await gotoReview('user-designer', 'TrackVersion', 'qa-v2');
    assert.equal(await page.getByRole('button', { name: 'Aprovar', exact: true }).count(), 0);
    assert.ok(await page.getByRole('button', { name: 'Solicitar revisão', exact: true }).isDisabled());
    await close();
    await gotoReview('user-artista', 'TrackVersion', 'qa-v2');
    await choose('Ação de revisão', 'Solicitar ajustes');
    await page.getByRole('textbox', { name: 'Ajustes necessários', exact: true }).fill('Reduzir o volume da voz.');
    await page.getByRole('button', { name: 'Solicitar ajustes', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    assert.equal((await store()).TrackVersion.find(v => v.id === 'qa-v2').review_status, 'ajuste');
    await gotoReview('user-admin', 'TrackVersion', 'qa-v2'); await requestReview();
    await gotoReview('user-artista', 'TrackVersion', 'qa-v2');
    await page.getByRole('button', { name: 'Aprovar', exact: true }).click(); await page.getByRole('dialog').waitFor({ state: 'hidden' });
    assert.equal((await store()).TrackVersion.find(v => v.id === 'qa-v2').review_status, 'aprovado');
    assert.equal((await store()).ActivityLog.filter(log => log.artifact_id === 'qa-v2').length, 4);
    await versions();
    await page.getByRole('article').filter({ hasText: 'Demo final' }).getByRole('button', { name: 'Usar versão', exact: true }).click();
    await close(); await page.getByTitle('Single Piloto (Demo final)', { exact: true }).waitFor();
    assert.equal(await page.locator('.dz-track-title').getByText('Aprovado', { exact: true }).count(), 0, 'approval belongs to the reviewed version');
    await gotoReview('user-admin', 'ProjectFile', 'file-1');
    await checkDialog('cover-review');
    const cover = page.getByRole('img', { name: 'Capa: Capa QA', exact: true });
    assert.ok(await cover.evaluate(el => { const r = el.getBoundingClientRect(); return Math.abs(r.width - r.height) < 2; }));
    await requestReview();
    await gotoReview('user-artista', 'ProjectFile', 'file-1');
    await page.getByRole('button', { name: 'Aprovar', exact: true }).click(); await page.getByRole('dialog').waitFor({ state: 'hidden' });
    assert.equal((await store()).ProjectFile[0].status, 'aprovado');
    await page.evaluate(() => localStorage.setItem('dz6_mock_profile_id', 'user-admin'));
    await page.goto(origin + '/projetos/project-1'); await page.locator('h1').waitFor();
    await versions();
    await page.getByRole('textbox', { name: 'Nome da nova versão', exact: true }).fill('Master final');
    await page.getByRole('dialog').locator('input[type=file]').setInputFiles({ name: 'master.wav', mimeType: 'audio/wav', buffer: Buffer.from('QA audio fixture') });
    await page.getByRole('button', { name: 'Enviar versão', exact: true }).click();
    if (serverMode) {
      await page.getByRole('dialog').getByRole('alert').waitFor();
      assert.equal(await page.getByRole('textbox', { name: 'Nome da nova versão', exact: true }).inputValue(), 'Master final');
      assert.equal((await store()).TrackVersion.length, 2, 'failed upload creates no duplicate version');
    } else {
      await page.getByRole('button', { name: 'Renomear Master final', exact: true }).waitFor();
      assert.equal((await store()).TrackVersion.length, 3);
      assert.equal((await store()).Track[0].version_label, 'Master final');
    }
    await close();
    await page.goto(origin + '/projetos/project-1?tab=checklist&task=item-3');
    await page.getByRole('tab', { name: 'Tarefas', selected: true }).waitFor();
    await page.locator('[data-task-id="item-3"]').getByRole('button', { name: 'Recolher tarefa', exact: true }).waitFor();
    assert.deepEqual(errors, []);
    console.log(`${width}px: square covers, invalid cover recovery, version rename/select, reviewer permissions, changes/approval/history, exact links and upload feedback passed`);
    await context.close();
  }
} finally { await browser.close(); }

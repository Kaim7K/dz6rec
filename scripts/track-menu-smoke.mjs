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

    if (!published && (width === 390 || width === 1440)) {
      const type = width === 390 ? 'ep' : 'album';
      const wav = Buffer.alloc(44 + 8000 * 2 * 10);
      wav.write('RIFF', 0);
      wav.writeUInt32LE(wav.length - 8, 4);
      wav.write('WAVEfmt ', 8);
      wav.writeUInt32LE(16, 16);
      wav.writeUInt16LE(1, 20);
      wav.writeUInt16LE(1, 22);
      wav.writeUInt32LE(8000, 24);
      wav.writeUInt32LE(16000, 28);
      wav.writeUInt16LE(2, 32);
      wav.writeUInt16LE(16, 34);
      wav.write('data', 36);
      wav.writeUInt32LE(wav.length - 44, 40);
      await page.route('**/qa-*.wav', route => route.fulfill({ contentType: 'audio/wav', body: wav }));
      await page.evaluate(type => {
        const store = JSON.parse(localStorage.getItem('dz6_mock_store_v1'));
        store.Project.find(project => project.id === 'project-1').type = type;
        const track = store.Track.find(track => track.project_id === 'project-1');
        Object.assign(track, { current_version_id: 'qa-main', version_label: 'Original', audio_url: '/qa-main.wav' });
        store.Track = [track, ...Array.from({ length: 7 }, (_, index) => ({
          ...track, id: `other-${index}`, name: `Faixa ${index + 2}`, track_number: index + 2, current_version_id: '',
        }))];
        store.TrackVersion = [
          { id: 'qa-main', track_id: track.id, name: 'Original', audio_url: '/qa-main.wav' },
          { id: 'qa-preview', track_id: track.id, name: 'Prévia QA', audio_url: '/qa-preview.wav' },
          { id: 'qa-unrelated', track_id: 'other-0', name: 'Versão de outra faixa', audio_url: '/qa-other.wav' },
        ];
        localStorage.setItem('dz6_mock_store_v1', JSON.stringify(store));
      }, type);
      const mainVersion = () => page.evaluate(() => JSON.parse(localStorage.getItem('dz6_mock_store_v1')).Track[0].current_version_id);
      await page.reload();
      const trackButton = page.getByRole('button', { name: 'Versões de Single Piloto', exact: true });
      await trackButton.click();
      const dialog = page.getByRole('dialog');
      assert.equal(await page.locator('.dz-track-row').count(), 8);
      assert.equal(await dialog.getByText('Versão de outra faixa', { exact: true }).count(), 0);
      await dialog.getByRole('button', { name: 'Ouvir Prévia QA', exact: true }).click();
      const pause = dialog.getByRole('button', { name: 'Pausar Prévia QA', exact: true });
      await pause.waitFor();
      assert.equal(await mainVersion(), 'qa-main');
      await pause.click();
      await dialog.getByRole('textbox', { name: 'Nome da nova versão', exact: true }).fill('Novo mix');
      await dialog.locator('input[type=file]').setInputFiles({ name: 'novo.wav', mimeType: 'audio/wav', buffer: wav });
      await dialog.getByRole('button', { name: 'Enviar versão', exact: true }).click();
      await dialog.getByRole('button', { name: 'Ouvir Novo mix', exact: true }).waitFor();
      assert.equal(await mainVersion(), 'qa-main');
      await dialog.getByRole('article').filter({ hasText: 'Prévia QA' }).getByRole('button', { name: 'Definir como principal', exact: true }).click();
      await dialog.getByRole('article').filter({ hasText: 'Prévia QA' }).getByText('Versão principal', { exact: true }).waitFor();
      assert.equal(await mainVersion(), 'qa-preview');
      await dialog.getByRole('button', { name: 'Fechar', exact: true }).click();
      await page.reload();
      await page.getByTitle('Single Piloto (Prévia QA)', { exact: true }).waitFor();
      assert.equal(await page.locator('.dz-track-row').count(), 8);
      assert.equal(await page.getByText('Novo mix', { exact: true }).count(), 0);
      console.log(`${type}: scoped versions, playback, upload without promotion and persisted main version passed`);
    }
    assert.deepEqual(errors, []);
    console.log(`${width}px: portal, viewport, Escape, keyboard, file picker, scrolling and version selection passed`);
    await context.close();
  }
} finally { await browser.close(); }

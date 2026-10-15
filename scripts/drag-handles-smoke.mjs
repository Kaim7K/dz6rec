import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

const origin = process.env.AUDIT_URL || 'http://127.0.0.1:5173';
if (!['localhost', '127.0.0.1'].includes(new URL(origin).hostname)) throw new Error('Disposable local mock data only.');
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const move = async (handle, arrow) => {
  await handle.focus();
  for (const key of ['Space', arrow, 'Space']) {
    await page.keyboard.press(key);
    await page.waitForTimeout(300);
  }
};
try {
  await page.goto(origin + '/minhas-tarefas');
  const taskHandle = page.locator('button[aria-label^="Mover "]').first();
  await taskHandle.waitFor();
  const taskName = (await taskHandle.getAttribute('aria-label')).slice(6);
  await move(taskHandle, 'ArrowRight');
  await page.waitForFunction(text => JSON.parse(localStorage.getItem('dz6_mock_store_v1')).ChecklistItem.some(task => task.text === text && task.task_status === 'em_progresso'), taskName);
  assert.equal(await page.locator('.dz-kanban-column').nth(1).locator('article').count(), 1);

  await page.goto(origin + '/projetos/project-1');
  await page.locator('.dz-track-row').first().waitFor();
  const firstId = await page.evaluate(() => {
    const store = JSON.parse(localStorage.getItem('dz6_mock_store_v1'));
    const first = store.Track.find(track => track.project_id === 'project-1');
    first.track_number = 1;
    store.Track.push({ ...first, id: 'drag-second', name: 'Segunda faixa QA', track_number: 2 });
    localStorage.setItem('dz6_mock_store_v1', JSON.stringify(store));
    return first.id;
  });
  await page.reload();
  await page.waitForFunction(() => document.querySelectorAll('.dz-track-row').length === 2);
  await move(page.getByRole('button', { name: 'Mover faixa', exact: true }).first(), 'ArrowDown');
  await page.waitForFunction(id => {
    const tracks = JSON.parse(localStorage.getItem('dz6_mock_store_v1')).Track;
    return tracks.find(track => track.id === id)?.track_number === 2 && tracks.find(track => track.id === 'drag-second')?.track_number === 1;
  }, firstId);
  assert.ok((await page.locator('.dz-track-row').first().textContent()).includes('Segunda faixa QA'));
  assert.deepEqual(errors, []);
  console.log('Keyboard drag passed: task stage and track order persist; no browser errors.');
} finally { await browser.close(); }

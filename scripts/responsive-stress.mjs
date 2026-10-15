import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const origin = 'http://127.0.0.1:5173';
const output = 'artifacts/visual-audit/responsive-stress';
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const results = [];
try {
  for (const [width, height] of [[360, 844], [390, 844], [640, 800], [768, 1000], [938, 1000], [1024, 1000], [1280, 1000], [1440, 1000], [1920, 1080], [844, 390]]) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin);
    await page.locator('h1').waitFor();
    await page.evaluate(() => {
      const store = JSON.parse(localStorage.getItem('dz6_mock_store_v1'));
      const token = 'NomeSemEspacosParaVerificarQuebraResponsiva'.repeat(4);
      store.Project = [...store.Project, ...Array.from({ length: 7 }, (_, i) => ({ ...store.Project[0], id: `qa-project-${i}` }))].map(p => ({ ...p, name: token, description: 'Descricao de projeto extensa para testar organizacao adaptativa. '.repeat(6), main_artist_name: token }));
      store.Artist = [...store.Artist, ...Array.from({ length: 7 }, (_, i) => ({ ...store.Artist[0], id: `qa-artist-${i}` }))].map(a => ({ ...a, name: token, handle: token }));
      store.User = store.User.map(u => ({ ...u, full_name: token, email: token + '@teste.local' }));
      store.Cargo = store.Cargo.map(c => ({ ...c, name: token }));
      store.Track = store.Track.map(t => ({ ...t, name: token, version_label: token, main_artist_name: token }));
      store.ChecklistItem = store.ChecklistItem.map(t => ({ ...t, text: token }));
      store.ProjectMessage = store.ProjectMessage.map(m => ({ ...m, text: token }));
      store.ActivityLog = store.ActivityLog.map(l => ({ ...l, text: token, user_name: token }));
      store.ProjectFile = store.ProjectFile.map(f => ({ ...f, name: token }));
      localStorage.setItem('dz6_mock_store_v1', JSON.stringify(store));
    });
    const check = async name => {
      await page.waitForTimeout(120);
      const issues = await page.evaluate(() => {
        const issues = [];
        if (document.documentElement.scrollWidth > innerWidth + 1) issues.push('page overflow');
        for (const el of document.querySelectorAll('main h1, main h2, main h3, main p, main button, main input, main textarea')) {
          const r = el.getBoundingClientRect();
          if (!r.height || el.closest('.sr-only')) continue;
          const style = getComputedStyle(el);
          if (style.visibility === 'hidden') continue;
          if (r.right > innerWidth + 1 || r.left < -1) {
            let parent = el.parentElement;
            while (parent && !['auto', 'scroll'].includes(getComputedStyle(parent).overflowX)) parent = parent.parentElement;
            if (!parent) issues.push('outside viewport: ' + el.tagName + '.' + el.className.slice(0, 70));
          }
          if (['P', 'H1', 'H2', 'H3'].includes(el.tagName) && style.overflowX === 'visible' && el.scrollWidth > el.clientWidth + 2) issues.push('text overflow: ' + el.tagName + '.' + el.className.slice(0, 70));
        }
        return [...new Set(issues)];
      });
      results.push({ width, height, name, issues: [...issues, ...errors.splice(0)] });
      if (issues.length) await page.screenshot({ path: `${output}/${width}-${height}-${name}.png`, fullPage: true });
    };
    for (const route of ['/', '/projetos', '/artistas', '/usuarios', '/templates', '/configuracoes', '/minhas-tarefas', '/projetos/project-1']) {
      await page.goto(origin + route);
      await page.locator('h1').waitFor();
      await check(route.replaceAll('/', '_') || 'home');
    }
    for (const name of ['Tarefas', 'Opera\u00e7\u00e3o', 'Hist\u00f3rico', 'Conversa']) {
      await page.getByRole('tab', { name, exact: true }).click();
      await check(name);
    }
    await context.close();
    console.log(`Stress reviewed ${width}x${height}`);
  }
} finally { await browser.close(); }
await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
const failures = results.filter(result => result.issues.length);
console.log(JSON.stringify({ checks: results.length, failures }, null, 2));
assert.equal(failures.length, 0);

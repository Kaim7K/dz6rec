import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';

const origin = process.env.AUDIT_URL || 'http://127.0.0.1:5173';
const published = process.env.AUDIT_PUBLISHED === '1' && origin === 'https://dz6rec.vercel.app';
if (!published && origin !== 'http://qa.localhost:4173' && !['localhost', '127.0.0.1'].includes(new URL(origin).hostname)) throw new Error('Synthetic data only.');
const serverMode = published || origin === 'http://qa.localhost:4173';
const bundle = serverMode ? await build({ stdin: { contents: 'export { mockRequest } from "./src/api/mockData.js";', resolveDir: process.cwd() }, bundle: true, write: false, format: 'iife', globalName: 'QAMock' }) : null;
const output = path.resolve(process.env.DESIGN_CAPTURE_DIR || 'artifacts/visual-audit/refinement');
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const results = [];
try {
  for (const width of (process.env.DESIGN_WIDTHS || '360,390,768,1024,1440').split(',').map(Number)) {
    const context = await browser.newContext({ viewport: { width, height: Number(process.env.DESIGN_HEIGHT) || (width < 640 ? 844 : 1000) }, reducedMotion: 'reduce' });
    if (serverMode) await context.addInitScript({ content: bundle.outputFiles[0].text + '\nglobalThis.QAMock = QAMock;' });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    if (serverMode) await page.route('**/api/**', async route => {
      try {
        const req = route.request();
        const data = await page.evaluate(({ url, method, body }) => QAMock.mockRequest(url, { method, body }), { url: req.url(), method: req.method(), body: req.postData() || undefined });
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
      } catch { await route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"Synthetic test failed"}' }); }
    });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const capture = async name => {
      await page.waitForTimeout(await page.locator('[data-vaul-drawer]').count() ? 550 : 160);
      const issues = await page.evaluate(() => {
        const found = [];
        if (document.documentElement.scrollWidth > innerWidth + 1) found.push('page overflow');
        for (const el of document.querySelectorAll('main h1, main h2, main h3, main p')) {
          const rect = el.getBoundingClientRect();
          if (el.textContent.trim() && rect.height > 2 && rect.width < 4 && !el.closest('.sr-only')) found.push('collapsed text: ' + el.textContent.slice(0, 45));
        }
        for (const grid of document.querySelectorAll('.dz-catalog-grid')) {
          const min = Math.min(grid.clientWidth, 240);
          if ([...grid.children].some(card => card.getBoundingClientRect().width < min - 1)) found.push('catalog cards too narrow');
        }
        for (const popup of document.querySelectorAll('[data-radix-popper-content-wrapper]')) {
          const r = popup.getBoundingClientRect();
          if (r.width && (r.left < -1 || r.right > innerWidth + 1 || r.top < -1 || r.bottom > innerHeight + 1)) found.push('floating content outside viewport');
        }
        const player = document.querySelector('.dz-player');
        if (player) {
          const r = player.getBoundingClientRect();
          if (r.left < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1 || player.scrollWidth > player.clientWidth + 1) found.push('player overflow');
          if (parseFloat(getComputedStyle(document.querySelector('main')).paddingBottom) < r.height) found.push('player covers end of page');
        }
        const dialog = document.querySelector('[role="dialog"], [role="alertdialog"]');
        if (dialog) {
          const r = dialog.getBoundingClientRect();
          if (r.left < -1 || r.right > innerWidth + 1 || r.top < -1 || r.bottom > innerHeight + 1) found.push('dialog outside viewport');
          if (dialog.scrollWidth > dialog.clientWidth + 1) found.push('dialog overflow');
          const scroller = dialog.querySelector('.dz-dialog-scroll');
          if (scroller && scroller.scrollWidth > scroller.clientWidth + 1) found.push('dialog body overflow');
          const footer = dialog.querySelector('.dz-dialog-footer');
          if (footer) {
            const f = footer.getBoundingClientRect();
            if (f.top < r.top || f.bottom > r.bottom + 1) found.push('dialog actions outside frame');
          }
          for (const label of dialog.querySelectorAll('label[for]')) if (!label.control) found.push('unlinked form label');
        }
        return found;
      });
      results.push({ width, name, issues: [...issues, ...errors.splice(0)] });
      await page.screenshot({ path: path.join(output, `${width}-${name}.png`), fullPage: !(await page.locator('[role="dialog"], [role="alertdialog"]').count()) });
    };
    const visit = async route => { await page.goto(origin + route); await page.locator('h1, main h2').first().waitFor(); };
    for (const [name, route] of Object.entries({ home: '/', projects: '/projetos', artists: '/artistas', tasks: '/minhas-tarefas', templates: '/templates', users: '/usuarios', settings: '/configuracoes', project: '/projetos/project-1', login: '/login', register: '/register', forgot: '/forgot-password', reset: '/reset-password?token=qa', missing: '/inexistente' })) {
      await visit(route); await capture(name);
    }
    for (const [name, route, button] of [
      ['new-artist', '/artistas', 'Novo artista'], ['edit-artist', '/artistas', 'Editar Artista Demo'],
      ['new-project', '/projetos', 'Novo projeto'], ['edit-project', '/projetos/project-1', 'Editar projeto'],
      ['add-track', '/projetos/project-1', 'Adicionar faixa'], ['edit-user', '/usuarios', 'Editar usuário'],
      ['edit-cargo', '/configuracoes', 'Editar cargo'], ['new-template', '/templates', 'Novo template'],
      ['edit-template', '/templates', 'Editar template Lançamento completo'], ['manage-cargos', '/usuarios', 'Gerenciar Cargos'],
      ['delete-project', '/projetos/project-1', 'Excluir Single Piloto'],
    ]) {
      await visit(route);
      await page.getByRole('button', { name: button, exact: true }).first().click();
      await page.locator('[role="dialog"], [role="alertdialog"]').waitFor();
      await capture(name);
      await page.keyboard.press('Escape');
    }
    await visit('/projetos');
    await page.getByRole('button', { name: 'Novo projeto', exact: true }).click();
    await page.getByRole('combobox', { name: 'Status', exact: true }).click();
    await capture('status-select');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Lançamento previsto', exact: true }).click();
    await capture('calendar');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Fechar', exact: true }).click();
    await visit('/');
    await page.getByRole('button', { name: 'Notificações', exact: true }).click();
    await capture('notifications');
    await page.getByRole('button', { name: 'Menu da conta', exact: true }).click();
    await capture('account-menu');
    await page.getByRole('button', { name: 'Menu da conta', exact: true }).click();
    if (width < 1024) {
      await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
      await capture('navigation');
      await page.getByRole('complementary').getByRole('button', { name: 'Fechar menu', exact: true }).click();
    }
    await visit('/projetos/project-1');
    for (const [tab, name] of [['Tarefas', 'checklist'], ['Operação', 'workspace'], ['Histórico', 'history'], ['Conversa', 'chat']]) {
      await page.getByRole('tab', { name: tab, exact: true }).click();
      await capture(name);
    }
    await page.getByRole('tab', { name: 'Tarefas', exact: true }).click();
    await page.getByRole('button', { name: 'Expandir tarefa', exact: true }).first().click();
    await capture('expanded-task');
    await page.getByRole('combobox', { name: 'Prioridade da tarefa', exact: true }).first().click();
    await capture('task-priority');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Notas da seção' }).first().click();
    await capture('notes');
    await page.keyboard.press('Escape');
    await page.getByRole('tab', { name: 'Faixas', exact: true }).click();
    await page.getByRole('button', { name: 'Reproduzir', exact: true }).click();
    await page.getByRole('region', { name: 'Player de áudio', exact: true }).waitFor();
    await capture('player');
    await context.close();
    console.log(`Reviewed ${width}px`);
  }
} finally { await browser.close(); }
await writeFile(path.join(output, 'results.json'), JSON.stringify(results, null, 2));
const failures = results.filter(result => result.issues.length);
console.log(JSON.stringify({ captures: results.length, failures }));
if (failures.length) process.exitCode = 1;

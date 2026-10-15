import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const origin = 'http://127.0.0.1:5173';
const output = path.resolve(process.env.DESIGN_CAPTURE_DIR || 'artifacts/visual-audit/refinement');
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const results = [];
try {
  for (const width of (process.env.DESIGN_WIDTHS || '360,390,768,1024,1440').split(',').map(Number)) {
    const context = await browser.newContext({ viewport: { width, height: width < 640 ? 844 : 1000 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const capture = async name => {
      await page.waitForTimeout(await page.locator('[data-vaul-drawer]').count() ? 550 : 160);
      const issues = await page.evaluate(() => {
        const found = [];
        if (document.documentElement.scrollWidth > innerWidth + 1) found.push('page overflow');
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
    await visit('/projetos/project-1');
    for (const [tab, name] of [['Tarefas', 'checklist'], ['Operação', 'workspace'], ['Histórico', 'history'], ['Conversa', 'chat']]) {
      await page.getByRole('tab', { name: tab, exact: true }).click();
      await capture(name);
    }
    await page.getByRole('tab', { name: 'Tarefas', exact: true }).click();
    await page.getByRole('button', { name: 'Notas da seção' }).first().click();
    await capture('notes');
    await context.close();
    console.log(`Reviewed ${width}px`);
  }
} finally { await browser.close(); }
await writeFile(path.join(output, 'results.json'), JSON.stringify(results, null, 2));
const failures = results.filter(result => result.issues.length);
console.log(JSON.stringify({ captures: results.length, failures }));
if (failures.length) process.exitCode = 1;

// Browser -> actual frontend API client -> isolated fixtures. No production data.
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { build } from 'esbuild';
import AxeBuilder from '@axe-core/playwright';

const origin = 'http://qa.localhost:5173';
const bundle = await build({ stdin: { contents: 'export { mockRequest } from "./src/api/mockData.js";', resolveDir: process.cwd() }, bundle: true, write: false, format: 'iife', globalName: 'QAMock' });
const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await context.addInitScript({ content: bundle.outputFiles[0].text + '\nglobalThis.QAMock = QAMock;' });
  // Shorten only the new request deadline to verify timeout recovery without waiting 30s.
  await context.addInitScript(() => { const timeout = AbortSignal.timeout.bind(AbortSignal); AbortSignal.timeout = ms => timeout(ms === 30000 ? 1000 : ms); });
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  let failure = null;
  await page.route(url => url.pathname.startsWith('/api/'), async route => {
    const request = route.request(); const path = new URL(request.url()).pathname;
    try {
      if (failure && path === failure.path && request.method() === (failure.method || 'GET')) {
        const injected = failure;
        if (injected.mode === 'timeout') await new Promise(resolve => setTimeout(resolve, 1400));
        await route.fulfill(injected.mode === 'html' ? { status: 200, contentType: 'text/html', body: '<html>Unexpected response</html>' } : { status: 503, contentType: 'application/json', body: '{"error":"Falha temporária de teste"}' });
        return;
      }
      const data = await page.evaluate(({ url, method, body }) => QAMock.mockRequest(url, { method, body }), { url: request.url(), method: request.method(), body: request.postData() || undefined });
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
    } catch (error) { if (!page.isClosed() && !/disposed|closed|interrupted|destroyed/i.test(error.message)) throw error; }
  });
  for (const [route, entity, title] of [['/', 'Project', 'Visão geral'], ['/projetos', 'Project', 'Projetos'], ['/artistas', 'Artist', 'Artistas'], ['/templates', 'ChecklistTemplate', 'Templates'], ['/usuarios', 'User', 'Usuários'], ['/configuracoes', 'Cargo', 'Configurações']]) {
    failure = { path: '/api/entities/' + entity };
    await page.goto(origin + route);
    await page.getByRole('heading', { name: 'Não foi possível carregar esta página', exact: true }).waitFor();
    assert.equal(await page.getByRole('heading', { name: 'Área restrita', exact: true }).count(), 0);
    failure = null; await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
    await page.getByRole('heading', { name: title, exact: true }).waitFor();
    console.log(route + ': load failure and retry passed');
  }
  for (const mode of ['html', 'timeout']) {
    failure = { path: '/api/entities/Project', mode }; await page.goto(origin + '/projetos');
    await page.getByRole('alert').getByText(mode === 'html' ? 'O servidor retornou uma resposta inválida. Tente novamente.' : 'O servidor demorou para responder. Tente novamente.', { exact: true }).waitFor();
    failure = null; await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
    await page.getByRole('heading', { name: 'Projetos', exact: true }).waitFor();
    console.log(mode + ': request recovery passed');
  }
  await page.goto(origin + '/templates'); await page.getByRole('button', { name: 'Novo template', exact: true }).click();
  await page.getByRole('textbox', { name: 'Nome', exact: true }).fill('Template preservado após erro');
  failure = { path: '/api/entities/ChecklistTemplate', method: 'POST' };
  await page.getByRole('button', { name: 'Criar', exact: true }).click();
  await page.getByRole('dialog').getByRole('alert').waitFor();
  assert.equal(await page.getByRole('textbox', { name: 'Nome', exact: true }).inputValue(), 'Template preservado após erro');
  assert.ok(await page.getByRole('button', { name: 'Criar', exact: true }).isEnabled());
  failure = null; await page.getByRole('button', { name: 'Criar', exact: true }).click();
  await page.getByText('Template preservado após erro', { exact: true }).waitFor();
  const count = await page.evaluate(() => JSON.parse(localStorage.getItem('dz6_mock_store_v1')).ChecklistTemplate.filter(row => row.name === 'Template preservado após erro').length);
  assert.equal(count, 1);
  await page.getByRole('button', { name: 'Excluir template Template preservado após erro', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancelar', exact: true }).click();
  await page.getByRole('alertdialog').waitFor({ state: 'hidden' });
  assert.equal(await page.getByRole('button', { name: 'Excluir template Template preservado após erro', exact: true }).count(), 1, 'cancel must preserve the template');
  const templateId = await page.evaluate(() => JSON.parse(localStorage.getItem('dz6_mock_store_v1')).ChecklistTemplate.find(row => row.name === 'Template preservado após erro').id);
  for (const [route, trigger, path, method] of [
    ['/templates', 'Excluir template Template preservado após erro', '/api/entities/ChecklistTemplate/' + templateId, 'DELETE'],
    ['/usuarios', 'Excluir usuário', '/api/entities/User/user-produtor', 'DELETE'],
    ['/projetos/project-1', 'Excluir Single Piloto', '/api/entities/Project/project-1', 'DELETE'],
  ]) {
    await page.goto(origin + route); await page.getByRole('button', { name: trigger, exact: true }).first().click();
    failure = { path, method }; await page.getByRole('alertdialog').getByRole('button', { name: 'Excluir', exact: true }).click();
    await page.getByRole('alertdialog').getByRole('alert').waitFor();
    assert.ok(await page.getByRole('alertdialog').getByRole('button', { name: 'Excluir', exact: true }).isEnabled());
    await page.getByRole('alertdialog').getByRole('button', { name: 'Cancelar', exact: true }).click(); failure = null;
    console.log(route + ': deletion failure remains visible and unlocked');
  }
  await page.goto(origin + '/templates'); await page.getByRole('button', { name: 'Excluir template Template preservado após erro', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Excluir', exact: true }).click();
  await page.getByRole('alertdialog').waitFor({ state: 'hidden' });
  await page.getByRole('button', { name: 'Excluir template Template preservado após erro', exact: true }).waitFor({ state: 'hidden' });
  const report = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  assert.deepEqual(report.violations.map(row => row.id), []); assert.deepEqual(errors, []);
  console.log('Template retry saved once; offline opacity remains accessible.');
} finally { await browser.close(); }

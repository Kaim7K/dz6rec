import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { build } from 'esbuild';
import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';

const browser=await chromium.launch();
const bundle=await build({stdin:{contents:'export { apiClient } from "./src/api/appClient.js";',resolveDir:process.cwd()},bundle:true,write:false,format:'iife',globalName:'QAClient'});
try {
  const context=await browser.newContext();const page=await context.newPage();let reads=0,fail=false;const tokens=[];
  await page.route('**/__api_probe',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><body>Isolated API client probe</body></html>'}));
  await page.route(url=>url.pathname.startsWith('/api/'),async route=>{
    const request=route.request();if(request.method()==='GET'){reads++;tokens.push(request.headers().authorization);await new Promise(resolve=>setTimeout(resolve,80));}
    await route.fulfill({status:fail?503:200,contentType:'application/json',body:JSON.stringify(fail?{error:'Simulated read failure'}:request.method()==='GET'?[{id:'p1',name:'Project'}]:{id:'new'})});
  });
  await page.goto('http://qa.localhost:5173/__api_probe');await page.addScriptTag({content:bundle.outputFiles[0].text});
  const result=await page.evaluate(async()=>{const [a,b]=await Promise.all([QAClient.apiClient.entities.Project.list(),QAClient.apiClient.entities.Project.list()]);b[0].name='Changed in second consumer';return {separate:a!==b&&a[0]!==b[0],first:a[0].name};});
  assert.deepEqual(result,{separate:true,first:'Project'});assert.equal(reads,1);
  await page.evaluate(()=>QAClient.apiClient.entities.Project.list());assert.equal(reads,2,'completed GET must not be cached');
  fail=true;const failed=await page.evaluate(async()=>{const result=await Promise.allSettled([QAClient.apiClient.entities.Project.list(),QAClient.apiClient.entities.Project.list()]);return result.map(row=>row.status);});assert.deepEqual(failed,['rejected','rejected']);assert.equal(reads,3);
  fail=false;await page.evaluate(()=>QAClient.apiClient.entities.Project.list());assert.equal(reads,4,'a failed shared read must allow retry');
  await page.evaluate(async()=>{localStorage.setItem('dz6_access_token','test-account-a');const a=QAClient.apiClient.entities.Project.list();localStorage.setItem('dz6_access_token','test-account-b');await Promise.all([a,QAClient.apiClient.entities.Project.list()]);});assert.equal(reads,6);assert.deepEqual(tokens.slice(-2),['Bearer test-account-a','Bearer test-account-b']);
  console.log('HTTP GET deduplication passed: overlapping reads, independent results, no stale cache, error retry and account isolation.');await context.close();

  await mkdir('artifacts/visual-audit/refined',{recursive:true});
  for(const width of [390,1440]){
    const session=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});const page=await session.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto('http://127.0.0.1:5173/');await page.locator('h1').waitFor();await page.keyboard.press('Control+k');
    const input=page.getByRole('combobox',{name:'Buscar no painel',exact:true});assert.ok(await input.evaluate(el=>el===document.activeElement));await input.fill('Single Piloto');await page.getByRole('option',{name:/Single Piloto/}).waitFor();
    const report=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(report.violations.map(row=>({id:row.id,nodes:row.nodes.map(n=>n.target)})),[]);
    await page.screenshot({path:`artifacts/visual-audit/refined/${width}-search.png`});await input.press('Enter');await page.getByRole('heading',{name:'Single Piloto',exact:true}).waitFor();
    await page.keyboard.press('Control+k');await input.fill('MC Exemplo');await page.getByRole('option',{name:/^MC Exemplo Artista/}).waitFor();await input.press('Enter');await page.getByRole('heading',{name:'Artistas',exact:true}).waitFor();assert.ok(page.url().endsWith('#artist-artist-2'));assert.ok(await page.getByRole('button',{name:'Editar MC Exemplo',exact:true}).evaluate(el=>el===document.activeElement));
    await page.keyboard.press('Control+k');await input.fill('NadaQueExistaNoSistema');await page.getByText('Nenhum resultado encontrado.',{exact:true}).waitFor();await input.press('Escape');assert.equal(await input.inputValue(),'');assert.equal(await page.getByRole('listbox',{name:'Resultados da busca',exact:true}).count(),0);
    assert.deepEqual(errors,[]);console.log(width+'px: real project/artist search, Ctrl K, keyboard selection, empty state, Escape and accessibility passed.');await session.close();
  }
}finally{await browser.close();}

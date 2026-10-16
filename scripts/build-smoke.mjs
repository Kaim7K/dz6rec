// Production frontend comparison and failure recovery. All API traffic is isolated.
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { build } from 'esbuild';
import { writeFile } from 'node:fs/promises';

const bundle=await build({stdin:{contents:'export { mockRequest } from "./src/api/mockData.js";',resolveDir:process.cwd()},bundle:true,write:false,format:'iife',globalName:'QAMock'});
const browser=await chromium.launch(); const results=[];
async function open(origin){
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});await context.addInitScript({content:bundle.outputFiles[0].text+'\nglobalThis.QAMock = QAMock;'});
  const page=await context.newPage();page.setDefaultTimeout(15000);
  await page.route(url=>url.pathname.startsWith('/api/'),async route=>{
    try{const req=route.request();const value=await page.evaluate(({url,method,body})=>QAMock.mockRequest(url,{method,body}),{url:req.url(),method:req.method(),body:req.postData()||undefined});await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(value)});}
    catch(error){if(!page.isClosed()&&!/disposed|closed|destroyed|interrupted/i.test(error.message))throw error;}
  });
  const assets=new Map();const pending=[];
  page.on('response',response=>{const url=new URL(response.url());if(url.pathname.startsWith('/assets/')&&url.pathname.endsWith('.js')&&response.ok())pending.push(response.body().then(body=>assets.set(url.pathname,body.length)));});
  await page.goto(origin);await page.getByRole('heading',{name:'Visão geral',exact:true}).waitFor();await page.waitForTimeout(500);await Promise.all(pending);
  return {page,context,assets,pending};
}
try{
  for(const origin of ['https://dz6rec.vercel.app','http://qa.localhost:4173']){
    const session=await open(origin);const jsBytes=[...session.assets.values()].reduce((sum,n)=>sum+n,0);
    results.push({origin,jsBytes,assets:Object.fromEntries(session.assets)});console.log(origin+' cold Home JavaScript: '+jsBytes+' bytes');await session.context.close();
  }
  assert.ok(results[1].jsBytes<results[0].jsBytes,'cold Home must actually load less JavaScript');
  const session=await open('http://qa.localhost:4173');const page=session.page;
  assert.ok(![...session.assets.keys()].some(path=>path.includes('fileUpload-')),'upload SDK must not load with Home');
  await page.getByRole('link',{name:'Artistas',exact:true}).click();await page.getByRole('button',{name:'Novo artista',exact:true}).click();await page.getByRole('textbox',{name:'Nome',exact:true}).fill('QA deferred upload');
  await page.getByRole('dialog').locator('input[type=file]').setInputFiles('src/assets/dz6-profile.png');await page.getByRole('button',{name:'Criar artista',exact:true}).click();
  await page.getByRole('dialog').getByRole('alert').filter({hasText:'O servidor não autorizou o envio do arquivo.'}).waitFor();
  await Promise.all(session.pending);assert.ok([...session.assets.keys()].some(path=>path.includes('fileUpload-')),'SDK loads when an upload is actually attempted');
  assert.ok(await page.getByRole('button',{name:'Criar artista',exact:true}).isEnabled());await page.getByRole('button',{name:'Cancelar',exact:true}).click();
  await page.route('**/assets/Projects-*.js',route=>route.abort('failed'));
  await page.getByRole('link',{name:'Projetos',exact:true}).click();await page.getByRole('button',{name:'Recarregar página',exact:true}).waitFor();
  assert.ok(await page.getByRole('button',{name:'Abrir conversas',exact:true}).isVisible(),'a failed route must preserve the shell and chat');
  await page.getByRole('link',{name:'Artistas',exact:true}).click();await page.getByRole('heading',{name:'Artistas',exact:true}).waitFor();
  await page.evaluate(()=>{const store=JSON.parse(localStorage.getItem('dz6_mock_store_v1'));store.Project=[];store.ChecklistItem=[];localStorage.setItem('dz6_mock_store_v1',JSON.stringify(store));});
  await page.getByRole('link',{name:'Início',exact:true}).click();await page.getByRole('heading',{name:'Seu catálogo começa aqui',exact:true}).waitFor();await page.getByText('Nenhuma tarefa pendente.',{exact:true}).waitFor();
  await session.context.close();await writeFile('artifacts/performance-comparison.json',JSON.stringify(results,null,2));
  console.log('Built frontend passed: deferred upload SDK, upload failure recovery, lazy route failure boundary, preserved chat/navigation and empty dashboard.');
}finally{await browser.close();}

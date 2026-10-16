// Actual HTTP API + isolated PostgreSQL + two authenticated browser accounts.
// No production credentials, accounts, messages or data are used.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mock } from 'node:test';
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { PGlite } from '@electric-sql/pglite';
import { signToken } from '../api/_utils.js';

process.env.JWT_SECRET = 'isolated-chat-browser-test';
const uiOrigin = process.env.CHAT_UI_URL || 'http://qa.localhost:5173';
const memory = new Map(); globalThis.localStorage = { getItem: key => memory.get(key) || null, setItem: (key, value) => memory.set(key, value) };
const { getMockStore } = await import('../src/api/mockData.js'); const seed = getMockStore();
const db = new PGlite();
await db.exec(`CREATE TABLE app_users (id text PRIMARY KEY, email text UNIQUE, full_name text, role text, permissao text, cargo jsonb DEFAULT '[]', handle text, photo_url text, status text, password_hash text, reset_token text, reset_expires_at timestamptz, created_date timestamptz DEFAULT now(), updated_date timestamptz DEFAULT now());
CREATE TABLE app_records(id text PRIMARY KEY,entity text NOT NULL,data jsonb DEFAULT '{}',created_date timestamptz DEFAULT now(),updated_date timestamptz DEFAULT now());`);
for (const user of seed.User) await db.query('INSERT INTO app_users(id,email,full_name,role,permissao,cargo,handle,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8)', [user.id,user.email,user.full_name,user.role,user.permissao,JSON.stringify(user.cargo),user.handle,user.status]);
for (const [entity, rows] of Object.entries(seed)) if (entity !== 'User' && Array.isArray(rows)) for (const row of rows) await db.query('INSERT INTO app_records(id,entity,data) VALUES($1,$2,$3)', [row.id,entity,JSON.stringify(row)]);
const sql = async (strings, ...values) => (await db.query(strings.reduce((text, part, index) => text + (index ? `$${index}` : '') + part, ''), values)).rows;
mock.module('../api/_db.js', { exports: { ensureDatabase: async () => {}, getSql: () => sql } });
const { default: handler } = await import('../api/[...path].js');
const server = createServer((req,res) => { handler(req,res); }); await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
const api = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch(); const errors=[]; await mkdir('artifacts/visual-audit/global-chat',{recursive:true});
const openPage = async (actor, width = 1440, height = 1000) => {
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}); const page=await context.newPage();page.setDefaultTimeout(15000);
  page.on('pageerror',error=>errors.push(error.message));
  await page.route(url=>url.pathname.startsWith('/api/'),async route=>{
    try {
      const url=new URL(route.request().url());const response=await route.fetch({url:api+url.pathname+url.search,headers:{...route.request().headers(),authorization:`Bearer ${signToken({id:actor})}`}});await route.fulfill({response});
    } catch (error) {
      // Full navigation/closing can dispose an intercepted response already in flight.
      if (!page.isClosed() && !/disposed|Target .*closed|context.*closed/i.test(error.message)) throw error;
    }
  });
  await page.goto(uiOrigin + '/');await page.locator('h1').waitFor();return {context,page};
};
const closeSession = context => context.close();
const pane = page => page.getByRole('region',{name:'Central de conversas',exact:true});
const check = async (page,name,axe=true) => {
  const bounds=await page.evaluate(()=>{
    const panel=document.querySelector('.dz-chat-window');const r=panel?.getBoundingClientRect();
    return {overflow:document.documentElement.scrollWidth>innerWidth+1,fit:!r||(r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1)};
  });assert.equal(bounds.overflow,false,name+' page overflow');assert.equal(bounds.fit,true,name+' window fit');
  if(axe){const report=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(report.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[],name+' accessibility');}
  await page.screenshot({path:`artifacts/visual-audit/global-chat/${name}.png`});
};
try {
  const alice=await openPage('user-admin');const bob=await openPage('user-produtor');const a=alice.page;const b=bob.page;
  await b.getByRole('heading',{name:'Online — 2',exact:true}).waitFor();await a.evaluate(()=>window.dispatchEvent(new Event('focus')));await a.getByRole('heading',{name:'Online — 2',exact:true}).waitFor();
  const roster=a.getByRole('complementary',{name:'Equipe do site'});await roster.getByRole('button',{name:'Ver perfil de Pedro Produtor',exact:true}).click();
  await a.getByRole('heading',{name:'Pedro Produtor',exact:true}).waitFor();await check(a,'desktop-profile');
  await a.getByRole('button',{name:'Conversar',exact:true}).click();await pane(a).getByLabel('Mensagem direta',{exact:true}).fill('Mensagem privada de teste');await pane(a).getByRole('button',{name:'Enviar mensagem direta',exact:true}).click();await pane(a).getByRole('log').getByText('Mensagem privada de teste',{exact:true}).waitFor();
  const saved=(await db.query('SELECT * FROM app_chat_messages')).rows;assert.equal(saved.length,1);assert.equal(saved[0].sender_id,'user-admin');assert.equal(saved[0].recipient_id,'user-produtor');
  await b.evaluate(()=>window.dispatchEvent(new Event('focus')));await b.getByRole('button',{name:'Abrir conversas',exact:true}).click();await pane(b).getByRole('button',{name:'Abrir conversa com Admin DZ6',exact:true}).click();await pane(b).getByRole('log').getByText('Mensagem privada de teste',{exact:true}).waitFor();
  await pane(b).getByLabel('Mensagem direta',{exact:true}).fill('Resposta recebida no chat global');await pane(b).getByRole('button',{name:'Enviar mensagem direta',exact:true}).click();await pane(a).getByRole('log').getByText('Resposta recebida no chat global',{exact:true}).waitFor();await check(a,'desktop-direct');
  await pane(a).getByLabel('Mensagem direta',{exact:true}).fill('Rascunho preservado entre telas');await pane(a).getByRole('button',{name:'Minimizar chat',exact:true}).click();await a.getByRole('link',{name:'Artistas',exact:true}).click();await a.getByRole('heading',{name:'Artistas',exact:true}).waitFor();await a.getByRole('button',{name:'Abrir conversas',exact:true}).click();assert.equal(await pane(a).getByLabel('Mensagem direta',{exact:true}).inputValue(),'Rascunho preservado entre telas');
  await pane(a).getByRole('button',{name:'Escolher conversa',exact:true}).click();await pane(a).getByRole('tab',{name:'Projetos',exact:true}).click();await pane(a).getByRole('button',{name:'Abrir conversa do projeto Single Piloto',exact:true}).click();
  await pane(a).getByLabel('Mensagem para o projeto').fill('Mensagem pelo popup do projeto');await pane(a).getByRole('button',{name:'Enviar mensagem',exact:true}).click();await pane(a).getByText('Mensagem pelo popup do projeto',{exact:true}).waitFor();
  assert.equal((await db.query("SELECT count(*)::int AS n FROM app_records WHERE entity='ProjectMessage' AND data->>'text'='Mensagem pelo popup do projeto'")).rows[0].n,1);
  await check(a,'desktop-project');await pane(a).getByRole('button',{name:'Abrir projeto desta conversa',exact:true}).click();await pane(a).getByRole('button',{name:'Minimizar chat',exact:true}).click();await a.getByRole('tabpanel',{name:'Conversa',exact:true}).getByText('Mensagem pelo popup do projeto',{exact:true}).waitFor();
  await roster.getByRole('button',{name:'Minimizar equipe',exact:true}).click();await a.reload();await a.locator('h1').waitFor();assert.equal(await a.locator('.dz-team-sidebar').count(),0);await check(a,'desktop-minimized');
  await closeSession(alice.context);await closeSession(bob.context);
  for(const [width,height] of [[360,844],[390,844],[768,1000],[844,390]]) {
    const session=await openPage('user-designer',width,height);const page=session.page;
    await page.getByRole('button',{name:'Abrir equipe',exact:true}).click();await page.getByRole('button',{name:'Ver perfil de Pedro Produtor',exact:true}).click();await page.getByRole('button',{name:'Conversar',exact:true}).click();await pane(page).getByLabel('Mensagem direta',{exact:true}).waitFor();
    if(width===360)assert.equal(await pane(page).getByText('Mensagem privada de teste',{exact:true}).count(),0,'third account must not see another pair messages');
    await pane(page).getByLabel('Mensagem direta',{exact:true}).fill('Mensagem móvel '+width);await pane(page).getByRole('button',{name:'Enviar mensagem direta',exact:true}).click();await pane(page).getByText('Mensagem móvel '+width,{exact:true}).waitFor();await check(page,width+'-direct');
    await pane(page).getByRole('button',{name:'Minimizar chat',exact:true}).click();await page.goto(uiOrigin + '/projetos/project-1');await page.locator('h1').waitFor();await page.getByRole('button',{name:'Reproduzir',exact:true}).click();await page.getByRole('region',{name:'Player de áudio',exact:true}).waitFor();await page.getByRole('button',{name:'Abrir conversas',exact:true}).click();await check(page,width+'-with-player');
    await closeSession(session.context);
  }
  assert.deepEqual(errors,[]);console.log('Global chat passed against HTTP API + isolated PostgreSQL: two-way private messages, presence, read markers, profile, project integration, drafts, minimized preference, mobile, player and accessibility.');
} finally {for (const context of browser.contexts()) await closeSession(context);
  await browser.close();await new Promise(resolve=>server.close(resolve));await db.close();}


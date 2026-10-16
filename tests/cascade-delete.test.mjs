import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { after, beforeEach, mock, test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { signToken } from '../api/_utils.js';

process.env.JWT_SECRET = 'isolated-cascade-tests';
const db = new PGlite();
await db.exec(`CREATE TABLE app_users(id text PRIMARY KEY,status text,permissao text);
CREATE TABLE app_records(id text PRIMARY KEY,entity text,data jsonb,created_date timestamptz DEFAULT now(),updated_date timestamptz DEFAULT now());
INSERT INTO app_users VALUES ('actor','ativo','membro'),('inactive','inativo','membro');`);
const sql = async (parts, ...values) => (await db.query(parts.reduce((query, part, i) => query + (i ? '$' + i : '') + part, ''), values)).rows;
mock.module('../api/_db.js', { exports: { ensureDatabase: async () => {}, getSql: () => sql } });
const { default: handler } = await import('../api/[...path].js');
after(() => db.close());
beforeEach(async () => {
  await db.exec('DROP TRIGGER IF EXISTS fail_delete ON app_records; TRUNCATE app_records;');
  for (const [id, entity, data] of [
    ['p1','Project',{}],['p2','Project',{}],['template','ChecklistTemplate',{}],
    ['track','Track',{project_id:'p1'}],['version','TrackVersion',{track_id:'track'}],
    ['section','ChecklistSection',{project_id:'p1'}],['task','ChecklistItem',{section_id:'section',project_id:'p1'}],['subtask','ChecklistItem',{section_id:'section',parent_id:'task'}],['note','ChecklistNote',{section_id:'section'}],
    ['file','ProjectFile',{project_id:'p1'}],['message','ProjectMessage',{project_id:'p1'}],['history','ActivityLog',{project_id:'p1'}],['notification','Notification',{project_id:'p1'}],
    ['templateSection','ChecklistSection',{template_id:'template'}],['templateTask','ChecklistItem',{section_id:'templateSection'}],['templateNote','ChecklistNote',{section_id:'templateSection'}],
    ['otherTrack','Track',{project_id:'p2'}],['otherVersion','TrackVersion',{track_id:'otherTrack'}],['directNotification','Notification',{user_id:'actor'}],
  ]) await db.query('INSERT INTO app_records(id,entity,data) VALUES($1,$2,$3)',[id,entity,JSON.stringify(data)]);
});
const ids = async () => (await db.query('SELECT id FROM app_records ORDER BY id')).rows.map(row => row.id);
const remove = async (entity, id, actor='actor', body={}) => {
  const req = Readable.from([Buffer.from(JSON.stringify(body))]);req.url=`/api/entities/${entity}/${id}`;req.method='DELETE';req.headers=actor ? {authorization:'Bearer '+signToken({id:actor})} : {};
  const res={setHeader(){},end(text){this.body=JSON.parse(text);}};await handler(req,res);return res;
};
test('project deletion atomically removes the full tree, preserving other projects, templates and direct notifications',async()=>{
  const res=await remove('Project','p1');assert.equal(res.statusCode,200);assert.equal(res.body.count,1);assert.equal(res.body.deleted_count,11);
  assert.deepEqual(await ids(),['directNotification','otherTrack','otherVersion','p2','template','templateNote','templateSection','templateTask']);
});
test('template deletion preserves project copies and removes only its own sections, notes and tasks',async()=>{
  const before=await ids();const res=await remove('ChecklistTemplate','template');assert.equal(res.statusCode,200);
  assert.deepEqual(await ids(),before.filter(id=>!['template','templateSection','templateTask','templateNote'].includes(id)));
});
test('an actual PostgreSQL delete error rolls back every parent and child deletion',async t=>{
  t.mock.method(console, 'error', () => {});
  const before=await ids();await db.exec(`CREATE OR REPLACE FUNCTION reject_file_delete() RETURNS trigger AS $$ BEGIN IF OLD.id='file' THEN RAISE EXCEPTION 'simulated delete failure'; END IF; RETURN OLD; END; $$ LANGUAGE plpgsql;
  CREATE TRIGGER fail_delete BEFORE DELETE ON app_records FOR EACH ROW EXECUTE FUNCTION reject_file_delete();`);
  const res=await remove('Project','p1');assert.ok(res.statusCode>=400);assert.deepEqual(await ids(),before);
});
test('authentication and active account requirements remain enforced; missing deletes remain idempotent',async()=>{
  const before=await ids();assert.equal((await remove('Project','p1',null)).statusCode,401);assert.equal((await remove('Project','p1','inactive')).statusCode,403);assert.deepEqual(await ids(),before);
  const res=await remove('Project','missing');assert.equal(res.statusCode,200);assert.equal(res.body.count,0);assert.deepEqual(await ids(),before);
});
test('filtered batch deletion uses the same atomic tree operation',async()=>{
  const res=await remove('Project','many','actor',{where:{id:'p1'}});assert.equal(res.statusCode,200);assert.equal(res.body.count,1);assert.equal(res.body.deleted_count,11);assert.ok((await ids()).includes('p2'));assert.ok(!(await ids()).includes('version'));
});

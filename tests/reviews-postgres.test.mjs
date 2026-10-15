import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { after, beforeEach, mock, test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { signToken } from '../api/_utils.js';
import { reviewStatus } from '../src/lib/reviews.js';

process.env.JWT_SECRET = 'isolated-postgres-review-tests';
const db = new PGlite();
await db.exec(`
  CREATE TABLE app_users (id text PRIMARY KEY, full_name text, email text, status text, permissao text);
  CREATE TABLE app_records (id text PRIMARY KEY, entity text NOT NULL, data jsonb NOT NULL DEFAULT '{}', created_date timestamptz NOT NULL DEFAULT now(), updated_date timestamptz NOT NULL DEFAULT now());
  INSERT INTO app_users VALUES ('author','Autor','author@test.local','ativo','membro'), ('reviewer','Revisor','reviewer@test.local','ativo','membro'), ('other','Outro','other@test.local','ativo','membro');
`);
let concurrentEdit = false;
const sql = async (strings, ...values) => {
  const query = strings.reduce((text, part, index) => text + (index ? `$${index}` : '') + part, '');
  if (concurrentEdit && query.includes('WITH updated AS')) {
    concurrentEdit = false;
    await db.query(`UPDATE app_records SET data = data || '{"name":"Edited concurrently"}'::jsonb WHERE id = 'v1'`);
  }
  return (await db.query(query, values)).rows;
};
mock.module('../api/_db.js', { namedExports: { ensureDatabase: async () => {}, getSql: () => sql } });
const { default: handler } = await import('../api/[...path].js');
after(() => db.close());
beforeEach(async () => {
  concurrentEdit = false;
  await db.exec(`TRUNCATE app_records;
    INSERT INTO app_records (id,entity,data) VALUES
    ('p1','Project','{"name":"QA project"}'),
    ('t1','Track','{"name":"QA track","project_id":"p1"}'),
    ('v1','TrackVersion','{"name":"Mix 1","track_id":"t1","audio_url":"https://example.test/mix.wav"}'),
    ('f1','ProjectFile','{"name":"Capa","project_id":"p1","file_url":"https://example.test/capa.jpg","category":"capa","status":"recebido"}');`);
});
const request = async (path, method = 'GET', body, actor = 'author') => {
  const req = Readable.from([Buffer.from(JSON.stringify(body || {}))]);
  req.method = method; req.url = '/api/' + path;
  req.headers = { authorization: `Bearer ${signToken({ id: actor })}` };
  const res = { setHeader() {}, end(value) { this.body = JSON.parse(value); } };
  await handler(req, res); return res;
};
const count = async entity => Number((await db.query('SELECT count(*) AS n FROM app_records WHERE entity = $1', [entity])).rows[0].n);
const submit = (entity, recordId, action, extra = {}, actor = 'author') => request('reviews', 'POST', { entity, record_id: recordId, action, ...extra }, actor);

for (const [entity, id] of [['TrackVersion', 'v1'], ['ProjectFile', 'f1']]) {
  test(`${entity}: actual PostgreSQL saves review, adjustment, re-request, approval, history and notifications`, async () => {
    const pending = await submit(entity, id, 'request', { reviewer_id: 'reviewer' });
    assert.equal(pending.statusCode, 200, pending.body.error);
    assert.equal(await count('ActivityLog'), 1); assert.equal(await count('Notification'), 1);
    const denied = await submit(entity, id, 'approve', { review_request_id: pending.body.review_request_id }, 'other');
    assert.equal(denied.statusCode, 403); assert.equal(await count('ActivityLog'), 1);
    const adjusted = await submit(entity, id, 'request_changes', { review_request_id: pending.body.review_request_id, comment: 'Ajustar o resultado.' }, 'reviewer');
    assert.equal(adjusted.statusCode, 200, adjusted.body.error);
    assert.equal(adjusted.body.review_comment, 'Ajustar o resultado.');
    const next = await submit(entity, id, 'request', { reviewer_id: 'reviewer' });
    assert.equal(next.statusCode, 200);
    assert.equal((await submit(entity, id, 'approve', { review_request_id: pending.body.review_request_id }, 'reviewer')).statusCode, 409);
    const approved = await submit(entity, id, 'approve', { review_request_id: next.body.review_request_id }, 'reviewer');
    assert.equal(approved.statusCode, 200, approved.body.error);
    assert.equal(approved.body.review_status, 'aprovado');
    assert.equal(await count('ActivityLog'), 4); assert.equal(await count('Notification'), 4);
    const persisted = await request(`entities/${entity}/${id}`);
    assert.equal(persisted.body.review_status, 'aprovado');
    const notifications = (await db.query("SELECT data FROM app_records WHERE entity='Notification'")).rows;
    assert.ok(notifications.every(row => row.data.link.includes(`record=${id}`)));
  });
}
test('actual PostgreSQL rejects concurrent changes without a partial history/notification write', async () => {
  const pending = await submit('TrackVersion', 'v1', 'request', { reviewer_id: 'reviewer' });
  concurrentEdit = true;
  const response = await submit('TrackVersion', 'v1', 'approve', { review_request_id: pending.body.review_request_id }, 'reviewer');
  assert.equal(response.statusCode, 409);
  assert.equal(await count('ActivityLog'), 1); assert.equal(await count('Notification'), 1);
  const current = await request('entities/TrackVersion/v1');
  assert.equal(current.body.name, 'Edited concurrently'); assert.equal(current.body.review_status, 'revisao');
});
test('changing file URL invalidates a pending review in storage and UI', async () => {
  const pending = await submit('ProjectFile', 'f1', 'request', { reviewer_id: 'reviewer' });
  assert.equal((await request('entities/ProjectFile/f1', 'PATCH', { file_url: 'https://example.test/new-cover.jpg' })).statusCode, 200);
  const response = await submit('ProjectFile', 'f1', 'approve', { review_request_id: pending.body.review_request_id }, 'reviewer');
  assert.equal(response.statusCode, 409);
  const current = await request('entities/ProjectFile/f1');
  assert.equal(reviewStatus('ProjectFile', current.body), 'recebido');
  assert.equal(await count('ActivityLog'), 1);
});
test('generic bulk route rejects all writes before a forged approval can change any record', async () => {
  const response = await request('entities/TrackVersion/bulk', 'PATCH', { items: [{ id: 'v1', name: 'Should not save' }, { id: 'v1', review_status: 'aprovado' }] });
  assert.equal(response.statusCode, 403);
  assert.equal((await request('entities/TrackVersion/v1')).body.name, 'Mix 1');
});

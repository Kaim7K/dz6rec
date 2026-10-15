import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { beforeEach, mock, test } from 'node:test';
import { signToken } from '../api/_utils.js';

process.env.JWT_SECRET = 'review-route-tests-only';
const users = [{ id: 'author', full_name: 'Autor', status: 'ativo', permissao: 'membro' }, { id: 'reviewer', full_name: 'Revisor', status: 'ativo', permissao: 'membro' }];
let artifact, logs, conflict, calls;
beforeEach(() => { artifact = { id: 'v1', entity: 'TrackVersion', data: { name: 'Mix 1', track_id: 't1', audio_url: 'https://example.test/mix.wav' } }; logs = []; conflict = false; calls = []; });
const sql = async (strings, ...values) => {
  const query = strings.join('?'); calls.push({ query, values });
  if (query.includes('FROM app_users')) return users.filter(user => user.id === values[0]);
  if (query.includes("entity = 'Track'")) return [{ id: 't1', data: { project_id: 'p1' } }];
  if (query.includes("entity = 'Project'")) return [{ id: 'p1', data: { name: 'Projeto' } }];
  if (query.includes('WITH updated AS')) {
    assert.ok(query.includes('AND data = ?::jsonb'));
    assert.ok(query.includes("'ActivityLog'"));
    assert.ok(query.includes("'Notification'"));
    assert.equal(values[1], 'TrackVersion'); assert.equal(values[2], 'v1');
    assert.deepEqual(JSON.parse(values[3]), artifact.data);
    if (conflict) return [];
    artifact = { ...artifact, data: { ...artifact.data, ...JSON.parse(values[0]) } };
    logs.push(JSON.parse(values[5]));
    return [artifact];
  }
  if (query.includes('SELECT * FROM app_records')) return values[0] === 'TrackVersion' && values[1] === 'v1' ? [artifact] : [];
  return [];
};
mock.module('../api/_db.js', { namedExports: { ensureDatabase: async () => {}, getSql: () => sql } });
const { default: handler } = await import('../api/[...path].js');
const request = async (body, actor = 'author', path = '/api/reviews', method = 'POST') => {
  const req = Readable.from([Buffer.from(JSON.stringify(body))]);
  req.method = method; req.url = path;
  req.headers = actor ? { authorization: `Bearer ${signToken({ id: actor })}` } : {};
  const res = { setHeader() {}, end(data) { this.body = JSON.parse(data); } };
  await handler(req, res); return res;
};
const ask = () => request({ entity: 'TrackVersion', record_id: 'v1', action: 'request', reviewer_id: 'reviewer', user_name: 'Forged actor' });

test('review endpoint authenticates before reading artifacts', async () => {
  const res = await request({}, null); assert.equal(res.statusCode, 401);
  assert.equal(calls.some(call => call.query.includes('app_records')), false);
});
test('request atomically updates the artifact and writes actor-stamped history', async () => {
  const res = await ask(); assert.equal(res.statusCode, 200);
  assert.equal(res.body.reviewer_id, 'reviewer');
  assert.equal(logs.length, 1); assert.equal(logs[0].user_id, 'author'); assert.equal(logs[0].user_name, 'Autor');
});
test('another member cannot decide; assigned reviewer can', async () => {
  const pending = await ask();
  const body = { entity: 'TrackVersion', record_id: 'v1', action: 'approve', review_request_id: pending.body.review_request_id };
  assert.equal((await request(body)).statusCode, 403);
  assert.equal(logs.length, 1);
  const approved = await request(body, 'reviewer');
  assert.equal(approved.statusCode, 200); assert.equal(approved.body.review_decided_by, 'reviewer');
  assert.equal(logs.length, 2);
});
test('stale decisions and concurrent changes cannot update history or artifact', async () => {
  const pending = await ask();
  assert.equal((await request({ entity: 'TrackVersion', record_id: 'v1', action: 'approve', review_request_id: 'old' }, 'reviewer')).statusCode, 409);
  conflict = true;
  assert.equal((await request({ entity: 'TrackVersion', record_id: 'v1', action: 'approve', review_request_id: pending.body.review_request_id }, 'reviewer')).statusCode, 409);
  assert.equal(logs.length, 1); assert.equal(artifact.data.review_status, 'revisao');
});
test('generic single and bulk updates cannot bypass approval validation', async () => {
  assert.equal((await request({ review_status: 'aprovado' }, 'author', '/api/entities/TrackVersion/v1', 'PATCH')).statusCode, 403);
  assert.equal((await request({ items: [{ id: 'v1', name: 'safe' }, { id: 'v2', reviewer_id: 'forged' }] }, 'author', '/api/entities/TrackVersion/bulk', 'PATCH')).statusCode, 403);
  assert.equal(calls.some(call => call.query.includes('UPDATE app_records')), false);
});

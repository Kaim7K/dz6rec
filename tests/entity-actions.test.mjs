// node --experimental-test-module-mocks --test tests/entity-actions.test.mjs
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { mock, test } from 'node:test';
import { signToken } from '../api/_utils.js';

process.env.JWT_SECRET = 'entity-route-tests-only';
let queries = [];
let rows = [];
const sql = async (strings, ...values) => {
  const query = strings.join('?');
  queries.push({ query, values });
  if (query.includes('FROM app_users')) return [{ id: 'test-user', status: 'ativo', permissao: 'membro' }];
  if (query.includes('INSERT INTO app_records')) return [{ id: values[0], entity: values[1], data: JSON.parse(values[2]) }];
  if (query.includes('UPDATE app_records')) return [{ id: values.at(-1), data: JSON.parse(values[0]) }];
  if (query.includes('SELECT * FROM app_records')) return rows;
  return [];
};
mock.module('../api/_db.js', { namedExports: { ensureDatabase: async () => {}, getSql: () => sql } });
const { default: handler } = await import('../api/[...path].js');

async function request(method, path, body, authenticated = true) {
  queries = [];
  const req = Readable.from([Buffer.from(JSON.stringify(body))]);
  req.method = method;
  req.url = `/api/entities/${path}`;
  req.headers = authenticated ? { authorization: `Bearer ${signToken({ id: 'test-user' })}` } : {};
  const res = { setHeader() {}, end(data) { this.body = JSON.parse(data); } };
  await handler(req, res);
  return res;
}

test('mention notifications bulkCreate reaches inserts and returns created rows', async () => {
  const items = [{ user_id: 'mentioned-1', text: 'Mention', read: false }, { user_id: 'mentioned-2', text: 'Mention', read: false }];
  const res = await request('POST', 'Notification/bulk', { items });
  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.body.map(({ id, ...data }) => data), items);
  assert.equal(queries.filter(q => q.query.includes('INSERT INTO')).length, 2);
});

test('bulkUpdate targets record IDs instead of the literal bulk segment', async () => {
  const res = await request('PATCH', 'Notification/bulk', { items: [{ id: 'notification-1', read: true }] });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body[0].id, 'notification-1');
  assert.equal(res.body[0].read, true);
});

test('updateMany applies changes only to matching records', async () => {
  rows = [{ id: 'mine', data: { user_id: 'test-user' } }, { id: 'other', data: { user_id: 'other' } }];
  const res = await request('PATCH', 'Notification/many', { where: { user_id: 'test-user' }, patch: { read: true } });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.map(row => row.id), ['mine']);
});

test('deleteMany deletes only matching IDs', async () => {
  const res = await request('DELETE', 'Notification/many', { where: { user_id: 'test-user' } });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.count, 1);
  assert.deepEqual(queries.find(q => q.query.includes('DELETE FROM')).values, ['Notification', 'mine']);
});

test('collection writes still require authentication', async () => {
  const res = await request('POST', 'Notification/bulk', { items: [] }, false);
  assert.equal(res.statusCode, 401);
  assert.equal(queries.length, 0);
});

test('ordinary message creation keeps its existing response', async () => {
  const res = await request('POST', 'ProjectMessage', { project_id: 'project-1', text: 'Hello' });
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.text, 'Hello');
});

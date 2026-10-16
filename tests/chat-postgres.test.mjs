import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { after, beforeEach, mock, test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { signToken } from '../api/_utils.js';
import { ensureChatDatabase } from '../api/_chat.js';

process.env.JWT_SECRET = 'isolated-chat-tests-not-a-real-secret';
const db = new PGlite();
await db.exec(`CREATE TABLE app_users (id text PRIMARY KEY, email text, full_name text, cargo jsonb DEFAULT '[]', role text DEFAULT 'user', permissao text DEFAULT 'membro', status text DEFAULT 'ativo', password_hash text, reset_token text);
CREATE TABLE app_records (id text PRIMARY KEY, entity text NOT NULL, data jsonb NOT NULL DEFAULT '{}', created_date timestamptz NOT NULL DEFAULT now(), updated_date timestamptz NOT NULL DEFAULT now());
INSERT INTO app_users(id,email,full_name,password_hash,reset_token) VALUES ('a','a@test.local','Pessoa A','secret','reset-secret'),('b','b@test.local','Pessoa B','secret','reset-secret'),('c','c@test.local','Pessoa C','secret','reset-secret');`);
const sql = async (strings, ...values) => (await db.query(strings.reduce((text, part, index) => text + (index ? `$${index}` : '') + part, ''), values)).rows;
await ensureChatDatabase(sql);
mock.module('../api/_db.js', { exports: { ensureDatabase: async () => {}, getSql: () => sql } });
const { default: handler } = await import('../api/[...path].js');
after(() => db.close());
beforeEach(async () => { await db.exec(`TRUNCATE app_records, app_chat_messages, app_chat_presence, app_chat_reads; UPDATE app_users SET status='ativo'; INSERT INTO app_records(id,entity,data) VALUES ('p1','Project','{"name":"Projeto 1"}'),('pm1','ProjectMessage','{"project_id":"p1","user_id":"a","text":"Mensagem existente"}');`); });
const request = async (path, method = 'GET', body, actor = 'a') => {
  const req = Readable.from([Buffer.from(JSON.stringify(body || {}))]); req.method = method; req.url = '/api/chat/' + path;
  req.headers = actor ? { authorization: `Bearer ${signToken({ id: actor })}` } : {};
  const res = { setHeader() {}, end(value) { this.body = JSON.parse(value); } }; await handler(req, res); return res;
};
const send = (text = 'Mensagem privada', extra = {}, actor = 'a') => request('messages', 'POST', { recipient_id: 'b', text, client_id: 'client-request-123456789', ...extra }, actor);
const overview = async actor => (await request('overview', 'GET', undefined, actor)).body;

test('authentication, active access and allowed methods are enforced', async () => {
  assert.equal((await request('overview', 'GET', undefined, null)).statusCode, 401);
  await db.exec("UPDATE app_users SET status='inativo' WHERE id='c'");
  assert.equal((await request('overview', 'GET', undefined, 'c')).statusCode, 403);
  assert.equal((await request('presence')).statusCode, 405);
  assert.equal((await request('unknown')).statusCode, 404);
  assert.equal((await send('oi', { recipient_id: 'c' })).statusCode, 403);
  assert.equal((await send('oi', { recipient_id: 'a' })).statusCode, 400);
});
test('only participants see direct messages; sender cannot be forged and notifications contain no private content', async () => {
  const sent = await send('Conteúdo confidencial', { sender_id: 'c', user_id: 'c' });
  assert.equal(sent.statusCode, 200, sent.body.error); assert.equal(sent.body.sender_id, 'a');
  assert.equal((await request('messages?user_id=a', 'GET', undefined, 'b')).body.messages[0].text, 'Conteúdo confidencial');
  assert.equal((await request('messages?user_id=b')).body.messages.length, 1);
  assert.deepEqual((await request('messages?user_id=a', 'GET', undefined, 'c')).body.messages, []);
  assert.deepEqual((await overview('c')).conversations, []);
  assert.equal((await request('read', 'POST', { kind: 'direct', target_id: 'a', message_id: sent.body.id }, 'c')).statusCode, 404);
  const notification = (await db.query("SELECT data FROM app_records WHERE entity='Notification'")).rows[0].data;
  assert.equal(notification.user_id, 'b'); assert.ok(!JSON.stringify(notification).includes('Conteúdo confidencial'));
  const person = (await overview('a')).users[0]; assert.equal(person.password_hash, undefined); assert.equal(person.reset_token, undefined);
});
test('retry is idempotent and cannot reuse an id for different content or another target', async () => {
  const first = await send(); const second = await send();
  assert.equal(second.body.id, first.body.id);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM app_chat_messages')).rows[0].n, 1);
  assert.equal((await db.query("SELECT count(*)::int AS n FROM app_records WHERE entity='Notification'")).rows[0].n, 1);
  assert.equal((await send('Outro conteúdo')).statusCode, 409);
  assert.equal((await send('Mensagem privada', { recipient_id: 'c' })).statusCode, 409);
  assert.equal((await send(' '.repeat(5))).statusCode, 400);
  assert.equal((await send('x'.repeat(8001))).statusCode, 400);
});
test('unread counts clear only through an authorized message and cannot move backwards', async () => {
  const first = await send();
  await db.query("UPDATE app_chat_messages SET created_date=now()-interval '1 minute' WHERE id=$1", [first.body.id]);
  const second = await send('Outra mensagem', { client_id: 'client-request-987654321' });
  assert.equal((await overview('b')).conversations[0].unread_count, 2);
  const mark = id => request('read', 'POST', { kind: 'direct', target_id: 'a', message_id: id }, 'b');
  assert.equal((await mark(second.body.id)).statusCode, 200);
  assert.equal((await mark(first.body.id)).statusCode, 200);
  assert.equal((await overview('b')).conversations[0].unread_count, 0);
});
test('message pagination preserves the full ordered history with no overlap', async () => {
  for (let index = 0; index < 53; index++) await db.query("INSERT INTO app_chat_messages(id,sender_id,recipient_id,text,client_id,created_date) VALUES($1,'a','b',$2,$1,'2026-01-01'::timestamptz + $3::int * interval '1 second')", ['message-' + index, 'Mensagem ' + index, index]);
  const first = await request('messages?user_id=b'); assert.equal(first.body.messages.length, 50); assert.ok(first.body.next_cursor);
  const older = await request('messages?user_id=b&before=' + encodeURIComponent(first.body.next_cursor));
  assert.equal(older.body.messages.length, 3); assert.equal(older.body.next_cursor, null);
  assert.equal(new Set([...older.body.messages, ...first.body.messages].map(m => m.id)).size, 53);
  assert.equal(older.body.messages[0].text, 'Mensagem 0'); assert.equal(first.body.messages.at(-1).text, 'Mensagem 52');
  assert.equal((await request('messages?user_id=b&before=invalid')).statusCode, 400);
});
test('presence is real, expires, supports multiple sessions and cannot spoof another user', async () => {
  const pulse = (session, available, actor = 'a') => request('presence', 'POST', { session_id: session, available, user_id: 'c' }, actor);
  await pulse('session-one-123456789', true); await pulse('session-two-123456789', true); await pulse('session-one-123456789', false);
  let data = await overview('b'); assert.equal(data.users.find(u => u.id === 'a').online, true); assert.equal(data.users.find(u => u.id === 'c').online, false);
  await db.exec("UPDATE app_chat_presence SET last_seen_at=now()-interval '80 seconds'");
  data = await overview('b'); assert.equal(data.users.find(u => u.id === 'a').online, false);
  assert.equal((await pulse('x', true)).statusCode, 400);
});
test('project unread markers integrate with existing project messages without exposing direct messages', async () => {
  assert.equal((await overview('b')).project_unread[0].unread_count, 1);
  assert.equal((await request('read', 'POST', { kind: 'project', target_id: 'another-project', message_id: 'pm1' }, 'b')).statusCode, 404);
  assert.equal((await request('read', 'POST', { kind: 'project', target_id: 'p1', message_id: 'pm1' }, 'b')).statusCode, 200);
  assert.equal((await overview('b')).project_unread.length, 0);
});

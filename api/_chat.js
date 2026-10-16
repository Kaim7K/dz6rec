import { createHash } from 'node:crypto';
import { publicUser, readJson, record, send } from './_utils.js';

let ready;
export function ensureChatDatabase(sql) {
  if (!ready) ready = (async () => {
    await sql`CREATE TABLE IF NOT EXISTS app_chat_messages (
      id text PRIMARY KEY, sender_id text NOT NULL, recipient_id text NOT NULL,
      text text NOT NULL, client_id text NOT NULL, created_date timestamptz NOT NULL DEFAULT now(),
      UNIQUE(sender_id, client_id)
    )`;
    await sql`CREATE INDEX IF NOT EXISTS app_chat_sender_idx ON app_chat_messages(sender_id, recipient_id, created_date DESC, id DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS app_chat_recipient_idx ON app_chat_messages(recipient_id, created_date DESC, id DESC)`;
    await sql`CREATE TABLE IF NOT EXISTS app_chat_presence (
      user_id text NOT NULL, session_id text NOT NULL, available boolean NOT NULL DEFAULT true,
      last_seen_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id, session_id)
    )`;
    await sql`CREATE TABLE IF NOT EXISTS app_chat_reads (
      user_id text NOT NULL, thread_key text NOT NULL, last_read_at timestamptz NOT NULL,
      last_read_id text NOT NULL, PRIMARY KEY(user_id, thread_key)
    )`;
  })().catch(error => { ready = undefined; throw error; });
  return ready;
}

const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
const threadKey = (kind, target) => `${kind}:${target}`;
const validId = value => typeof value === 'string' && value.length > 0 && value.length <= 160;
async function targetUser(sql, target, actor, sending = false) {
  if (!validId(target) || target === actor.id) fail('Selecione outra pessoa para conversar.');
  const [user] = await sql`SELECT * FROM app_users WHERE id = ${target} LIMIT 1`;
  if (!user) fail('Usuário não encontrado.', 404);
  if (sending && user.status !== 'ativo') fail('Esta conta não tem acesso ativo para receber novas mensagens.', 403);
  return user;
}
function encodeCursor(row) { return Buffer.from(JSON.stringify({ at: new Date(row.created_date).toISOString(), id: row.id })).toString('base64url'); }
function decodeCursor(value) {
  if (!value) return { at: '9999-01-01T00:00:00.000Z', id: '~' };
  try {
    if (value.length > 600) throw new Error();
    const cursor = JSON.parse(Buffer.from(value, 'base64url').toString());
    if (!validId(cursor.id) || !Number.isFinite(Date.parse(cursor.at))) throw new Error();
    return { at: new Date(cursor.at).toISOString(), id: cursor.id };
  } catch { fail('Página de mensagens inválida.'); }
}

export async function handleChat(req, res, sql, actor, action) {
  if (!actor || actor.status !== 'ativo') return send(res, 403, { error: 'Acesso não autorizado.' });
  await ensureChatDatabase(sql);
  if (action === 'presence' && req.method === 'POST') {
    const { session_id, available } = await readJson(req);
    if (typeof session_id !== 'string' || !/^[a-zA-Z0-9_-]{16,80}$/.test(session_id) || typeof available !== 'boolean') fail('Sessão inválida.');
    await sql`WITH expired AS (DELETE FROM app_chat_presence WHERE last_seen_at < now() - interval '1 day')
      INSERT INTO app_chat_presence(user_id, session_id, available, last_seen_at)
      VALUES (${actor.id}, ${session_id}, ${available}, now())
      ON CONFLICT(user_id, session_id) DO UPDATE SET available = EXCLUDED.available, last_seen_at = now()`;
    return send(res, 200, { ok: true });
  }
  if (action === 'overview' && req.method === 'GET') {
    const [users, cargos, projects, conversations, projectUnread] = await Promise.all([
      sql`SELECT u.*, EXISTS(SELECT 1 FROM app_chat_presence p WHERE p.user_id = u.id AND p.available AND p.last_seen_at > now() - interval '75 seconds' AND u.status = 'ativo') AS online FROM app_users u ORDER BY lower(COALESCE(u.full_name, u.email))`,
      sql`SELECT * FROM app_records WHERE entity = 'Cargo' ORDER BY created_date`,
      sql`SELECT id, data->>'name' AS name, data->>'main_artist_name' AS main_artist_name, data->>'cover_url' AS cover_url, data->>'status' AS status FROM app_records WHERE entity = 'Project' ORDER BY updated_date DESC`,
      sql`WITH mine AS (
        SELECT *, CASE WHEN sender_id = ${actor.id} THEN recipient_id ELSE sender_id END AS user_id
        FROM app_chat_messages WHERE sender_id = ${actor.id} OR recipient_id = ${actor.id}
      ), latest AS (
        SELECT DISTINCT ON (user_id) * FROM mine ORDER BY user_id, created_date DESC, id DESC
      ), unread AS (
        SELECT m.sender_id, count(*)::int AS count FROM app_chat_messages m
        LEFT JOIN app_chat_reads r ON r.user_id = ${actor.id} AND r.thread_key = 'direct:' || m.sender_id
        WHERE m.recipient_id = ${actor.id} AND (m.created_date, m.id) > (COALESCE(r.last_read_at, '1970-01-01'::timestamptz), COALESCE(r.last_read_id, ''))
        GROUP BY m.sender_id
      ) SELECT l.user_id, l.text AS last_message, l.created_date, COALESCE(u.count, 0)::int AS unread_count
        FROM latest l LEFT JOIN unread u ON u.sender_id = l.user_id ORDER BY l.created_date DESC`,
      sql`SELECT m.data->>'project_id' AS project_id, count(*)::int AS unread_count
        FROM app_records m LEFT JOIN app_chat_reads r ON r.user_id = ${actor.id} AND r.thread_key = 'project:' || (m.data->>'project_id')
        WHERE m.entity = 'ProjectMessage' AND COALESCE(m.data->>'user_id', '') <> ${actor.id}
        AND (m.created_date, m.id) > (COALESCE(r.last_read_at, '1970-01-01'::timestamptz), COALESCE(r.last_read_id, ''))
        GROUP BY m.data->>'project_id'`,
    ]);
    return send(res, 200, { users: users.map(user => ({ ...publicUser(user), online: user.online })), cargos: cargos.map(record), projects, conversations, project_unread: projectUnread });
  }
  if (action === 'messages' && req.method === 'GET') {
    const params = new URL(req.url, 'http://localhost').searchParams;
    const target = params.get('user_id');
    await targetUser(sql, target, actor);
    const cursor = decodeCursor(params.get('before'));
    const rows = await sql`SELECT * FROM app_chat_messages
      WHERE ((sender_id = ${actor.id} AND recipient_id = ${target}) OR (sender_id = ${target} AND recipient_id = ${actor.id}))
      AND (created_date, id) < (${cursor.at}::timestamptz, ${cursor.id})
      ORDER BY created_date DESC, id DESC LIMIT 51`;
    const page = rows.slice(0, 50);
    return send(res, 200, { messages: page.reverse(), next_cursor: rows.length > 50 ? encodeCursor(rows[49]) : null });
  }
  if (action === 'messages' && req.method === 'POST') {
    const body = await readJson(req);
    const target = await targetUser(sql, body.recipient_id, actor, true);
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    if (!text || text.length > 8000) fail('A mensagem deve ter entre 1 e 8.000 caracteres.');
    if (typeof body.client_id !== 'string' || !/^[a-zA-Z0-9_-]{16,80}$/.test(body.client_id)) fail('Identificador de envio inválido.');
    const messageId = 'dm_' + createHash('sha256').update(JSON.stringify([actor.id, body.client_id])).digest('hex');
    const notification = { user_id: target.id, text: `Nova mensagem de ${actor.full_name || actor.email}`, link: `/?chat=direct&chatId=${encodeURIComponent(actor.id)}`, read: false };
    const rows = await sql`WITH inserted AS (
      INSERT INTO app_chat_messages(id, sender_id, recipient_id, text, client_id)
      VALUES (${messageId}, ${actor.id}, ${target.id}, ${text}, ${body.client_id})
      ON CONFLICT(sender_id, client_id) DO NOTHING RETURNING *
    ), notified AS (
      INSERT INTO app_records(id, entity, data) SELECT ${'notification_' + messageId}, 'Notification', ${JSON.stringify(notification)}::jsonb FROM inserted RETURNING id
    ) SELECT * FROM inserted`;
    let message = rows[0];
    if (!message) [message] = await sql`SELECT * FROM app_chat_messages WHERE sender_id = ${actor.id} AND client_id = ${body.client_id} LIMIT 1`;
    if (!message || message.recipient_id !== target.id || message.text !== text) fail('Este envio já foi utilizado. Tente novamente.', 409);
    return send(res, 200, message);
  }
  if (action === 'read' && req.method === 'POST') {
    const { kind, target_id, message_id } = await readJson(req);
    if (!['direct', 'project'].includes(kind) || !validId(target_id) || !validId(message_id)) fail('Conversa inválida.');
    let message;
    if (kind === 'direct') {
      await targetUser(sql, target_id, actor);
      [message] = await sql`SELECT id, created_date FROM app_chat_messages WHERE id = ${message_id}
        AND ((sender_id = ${actor.id} AND recipient_id = ${target_id}) OR (sender_id = ${target_id} AND recipient_id = ${actor.id})) LIMIT 1`;
    } else {
      [message] = await sql`SELECT id, created_date FROM app_records WHERE entity = 'ProjectMessage' AND id = ${message_id} AND data->>'project_id' = ${target_id} LIMIT 1`;
    }
    if (!message) fail('Mensagem não encontrada nesta conversa.', 404);
    await sql`INSERT INTO app_chat_reads(user_id, thread_key, last_read_at, last_read_id)
      VALUES (${actor.id}, ${threadKey(kind, target_id)}, ${new Date(message.created_date).toISOString()}::timestamptz, ${message.id})
      ON CONFLICT(user_id, thread_key) DO UPDATE SET last_read_at = EXCLUDED.last_read_at, last_read_id = EXCLUDED.last_read_id
      WHERE (EXCLUDED.last_read_at, EXCLUDED.last_read_id) > (app_chat_reads.last_read_at, app_chat_reads.last_read_id)`;
    return send(res, 200, { ok: true });
  }
  return send(res, ['overview', 'presence', 'messages', 'read'].includes(action) ? 405 : 404, { error: 'Requisição de chat não permitida.' });
}

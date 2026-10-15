// Explicitly enabled integration check against a local Vercel dev server.
// Creates only temporary project/artifact records, then removes those exact IDs.
import assert from 'node:assert/strict';
import { neon } from '@neondatabase/serverless';
import { signToken } from '../api/_utils.js';
import { readFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';

if (process.env.RUN_REAL_API_SMOKE !== '1') throw new Error('Set RUN_REAL_API_SMOKE=1 to run the local API integration check.');
const config = parseEnv(await readFile(process.env.API_TEST_ENV_FILE || '.env.local', 'utf8'));
process.env.DATABASE_URL = config.DATABASE_URL;
process.env.JWT_SECRET = config.JWT_SECRET;
if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) throw new Error('Local database/auth configuration is missing.');
try { if (!['postgres:', 'postgresql:'].includes(new URL(process.env.DATABASE_URL).protocol)) throw new Error(); }
catch { throw new Error('The local database configuration is not a valid PostgreSQL URL.'); }
const origin = 'http://localhost:3001';
const sql = neon(process.env.DATABASE_URL);
const [actor] = await sql`SELECT id FROM app_users WHERE status = 'ativo' ORDER BY created_date LIMIT 1`;
if (!actor) throw new Error('No active account exists for the local API check.');
const token = signToken(actor);
const call = async (path, method = 'GET', body) => {
  const response = await fetch(origin + '/api/' + path, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, data: await response.json() };
};
assert.equal((await call('auth/me')).status, 200, 'local API authentication');
const records = [];
let project;
try {
  const create = async (entity, data) => {
    const response = await call(`entities/${entity}`, 'POST', data);
    assert.equal(response.status, 201);
    records.push([entity, response.data.id]);
    return response.data;
  };
  project = await create('Project', { name: `[QA review ${Date.now()}]`, status: 'rascunho', type: 'single' });
  const track = await create('Track', { project_id: project.id, name: 'QA audio' });
  const version = await create('TrackVersion', { track_id: track.id, name: 'QA version', audio_url: 'https://example.com/qa-audio.wav' });
  const cover = await create('ProjectFile', { project_id: project.id, name: 'QA cover', category: 'capa', file_url: 'https://example.com/qa-cover.jpg', status: 'recebido' });
  for (const [entity, artifact] of [['TrackVersion', version], ['ProjectFile', cover]]) {
    const requested = await call('reviews', 'POST', { entity, record_id: artifact.id, action: 'request', reviewer_id: actor.id });
    assert.equal(requested.status, 200, requested.data.error);
    assert.equal(requested.data.review_status, 'revisao');
    const adjusted = await call('reviews', 'POST', { entity, record_id: artifact.id, action: 'request_changes', comment: 'QA adjustment', review_request_id: requested.data.review_request_id });
    assert.equal(adjusted.status, 200, adjusted.data.error);
    assert.equal(adjusted.data.review_status, 'ajuste');
    const retry = await call('reviews', 'POST', { entity, record_id: artifact.id, action: 'request', reviewer_id: actor.id });
    assert.equal(retry.status, 200, retry.data.error);
    const stale = await call('reviews', 'POST', { entity, record_id: artifact.id, action: 'approve', review_request_id: requested.data.review_request_id });
    assert.equal(stale.status, 409);
    const approved = await call('reviews', 'POST', { entity, record_id: artifact.id, action: 'approve', review_request_id: retry.data.review_request_id });
    assert.equal(approved.status, 200, approved.data.error);
    assert.equal(approved.data.review_status, 'aprovado');
    const forged = await call(`entities/${entity}/${artifact.id}`, 'PATCH', { review_status: 'aprovado' });
    assert.equal(forged.status, 403);
    const history = await call(`entities/ActivityLog?filter=${encodeURIComponent(JSON.stringify({ artifact_entity: entity, artifact_id: artifact.id }))}`);
    assert.equal(history.data.length, 4, 'each decision has exactly one history entry');
    console.log(`${entity}: request, adjustments, re-review, stale rejection, approval, write protection and PostgreSQL history passed`);
  }
} finally {
  if (project) {
    const response = await call(`entities/ActivityLog?filter=${encodeURIComponent(JSON.stringify({ project_id: project.id }))}`);
    for (const log of response.data) await call(`entities/ActivityLog/${log.id}`, 'DELETE');
  }
  for (const [entity, id] of records.reverse()) assert.equal((await call(`entities/${entity}/${id}`, 'DELETE')).status, 200, 'temporary record cleanup');
  console.log('Temporary QA records removed; existing users and projects unchanged.');
}

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { prepareReview, protectedReviewPatch, reviewStatus } from '../src/lib/reviews.js';

const actor = { id: 'author', full_name: 'Autor', status: 'ativo', permissao: 'membro' };
const reviewer = { id: 'reviewer', full_name: 'Revisor', status: 'ativo', permissao: 'membro' };
const artifact = { id: 'v1', audio_url: 'https://example.test/mix-1.wav', name: 'Mix 1' };
const request = (entity = 'TrackVersion', record = artifact) => prepareReview({ entity, artifact: record, action: 'request', reviewer, actor, comment: 'Revisar refrão', requestId: 'request-1', now: '2026-10-15T20:00:00Z' });
const decide = (patch = {}) => prepareReview({ entity: 'TrackVersion', artifact: { ...artifact, ...request() }, action: 'approve', actor: reviewer, expectedRequestId: 'request-1', now: '2026-10-15T21:00:00Z', ...patch });

test('request records the real reviewer, requester, file snapshot and request token', () => {
  const result = request();
  assert.equal(result.reviewer_id, reviewer.id);
  assert.equal(result.review_requested_by, actor.id);
  assert.equal(result.review_file_url, artifact.audio_url);
  assert.equal(result.review_status, 'revisao');
  assert.equal(result.review_request_id, 'request-1');
});
test('selected reviewer can approve the requested file', () => {
  const result = decide();
  assert.equal(result.review_status, 'aprovado');
  assert.equal(result.review_decided_by, reviewer.id);
});
test('another member cannot approve', () => assert.throws(() => decide({ actor }), error => error.status === 403));
test('another member cannot take over a pending review by reassigning it', () => assert.throws(() => prepareReview({ entity: 'TrackVersion', artifact: { ...artifact, ...request() }, action: 'request', actor: { ...reviewer, id: 'other-member' }, reviewer, requestId: 'takeover' }), error => error.status === 403));
test('superadmin can decide without changing the assigned reviewer', () => assert.equal(decide({ actor: { ...actor, permissao: 'superadmin' } }).review_status, 'aprovado'));
test('inactive users cannot request or decide reviews', () => assert.throws(() => decide({ actor: { ...reviewer, status: 'inativo' } }), error => error.status === 403));
test('request needs an active real reviewer', () => assert.throws(() => prepareReview({ entity: 'TrackVersion', artifact, actor, action: 'request', reviewer: null }), /revisor/));
test('request requires an attached file', () => assert.throws(() => request('ProjectFile', { file_url: '' }), /Anexe/));
test('changes require a comment and preserve that comment', () => {
  assert.throws(() => decide({ action: 'request_changes', comment: '  ' }), /Descreva/);
  assert.equal(decide({ action: 'request_changes', comment: 'Corrigir o volume.' }).review_comment, 'Corrigir o volume.');
});
test('an old request cannot approve a newer review', () => assert.throws(() => decide({ expectedRequestId: 'old-request' }), error => error.status === 409));
test('changing the file invalidates the old decision and prevents stale approval', () => {
  const changed = { ...artifact, ...request(), audio_url: 'https://example.test/new.wav' };
  assert.equal(reviewStatus('TrackVersion', changed), 'recebido');
  assert.throws(() => decide({ artifact: changed }), error => error.status === 409);
});
test('a completed review cannot be decided a second time', () => assert.throws(() => decide({ artifact: { ...artifact, ...request(), review_status: 'aprovado' } }), error => error.status === 409));
test('file reviews keep the existing file status synchronized', () => {
  const file = { id: 'file-1', file_url: 'https://example.test/capa.jpg' };
  const pending = { ...file, ...request('ProjectFile', file) };
  assert.equal(pending.status, 'revisao');
  assert.equal(decide({ entity: 'ProjectFile', artifact: pending, action: 'request_changes', comment: 'Ajustar contraste.' }).status, 'ajuste');
});
test('generic writes cannot forge review decisions, including bulk/set patches', () => {
  assert.equal(protectedReviewPatch('TrackVersion', { review_status: 'aprovado' }), true);
  assert.equal(protectedReviewPatch('TrackVersion', { $set: { reviewer_id: 'fake' } }), true);
  assert.equal(protectedReviewPatch('ProjectFile', { status: 'aprovado' }, true), true);
  assert.equal(protectedReviewPatch('ProjectFile', { status: 'recebido' }, true), false);
  assert.equal(protectedReviewPatch('TrackVersion', { name: 'Mix final' }), false);
});

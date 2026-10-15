// Real Blob diagnostics. Run with `vercel env run -e development -- node scripts/diagnose-blob.mjs`.
// Credentials stay in Node; the browser receives only short-lived, path-scoped client tokens.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { chromium } from '@playwright/test';
import { del } from '@vercel/blob';
import { handleUpload } from '@vercel/blob/client';

const origin = 'https://dz6rec.vercel.app';
const urls = [];
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const failures = [];
  page.on('requestfailed', request => {
    if (request.url().includes('/api/blob')) failures.push(request.failure()?.errorText);
  });
  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  // This verifies storage from the production origin, not an authenticated UI save.
  // Keep the production API's authentication requirement under test as well.
  const unauthorized = await fetch(`${origin}/api/upload`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'blob.generate-client-token', payload: { pathname: 'uploads/unauthorized.png', multipart: false, clientPayload: null } }),
  });
  assert.equal(unauthorized.status, 401);
  await page.exposeFunction('recordDiagnosticBlob', url => {
    const parsed = new URL(url);
    assert.ok(parsed.hostname.endsWith('.public.blob.vercel-storage.com'));
    assert.match(parsed.pathname, /^\/uploads\/(?:\d+-)?diagnostic-/);
    urls.push(url);
  });
  await page.exposeFunction('diagnosticToken', async (body) => {
    assert.ok(body.payload.pathname.startsWith('uploads/'));
    return handleUpload({
      request: new Request(`${origin}/api/upload`, { method: 'POST' }),
      body,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['audio/*', 'image/*', 'video/*', 'application/pdf', 'application/octet-stream'],
        maximumSizeInBytes: 5 * 1024 ** 4,
        addRandomSuffix: true,
      }),
    });
  });
  const bundle = await build({
    stdin: { contents: 'export { uploadFileToBlob } from "./src/api/fileUpload.js"; export { put } from "@vercel/blob/client";', resolveDir: process.cwd() },
    bundle: true, write: false, format: 'iife', globalName: 'BlobDiagnostic', platform: 'browser',
  });
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  const image = await readFile('src/assets/dz6-profile.png');
  const results = await page.evaluate(async (bytes) => {
    const data = new Uint8Array(7 * 1024 * 1024);
    data.set(bytes);
    const file = new File([data], `diagnostic-${Date.now()}.png`, { type: 'image/png' });
    const progress = [];
    const result = await BlobDiagnostic.uploadFileToBlob(file, {
      request: (_path, options) => window.diagnosticToken(JSON.parse(options.body)),
      onProgress: value => progress.push(value),
    });
    await window.recordDiagnosticBlob(result.file_url);
    const simple = { url: result.file_url, progress: progress.at(-1) };
    const pathname = `uploads/diagnostic-multipart-${Date.now()}.png`;
    const { clientToken } = await window.diagnosticToken({ type: 'blob.generate-client-token', payload: { pathname, multipart: true, clientPayload: null } });
    const multipart = await BlobDiagnostic.put(pathname, file, { token: clientToken, access: 'public', contentType: file.type, multipart: true });
    await window.recordDiagnosticBlob(multipart.url);
    return [simple, { url: multipart.url }];
  }, [...image]);
  for (const result of results) {
    const response = await fetch(result.url);
    assert.equal(response.status, 200);
    assert.equal((await response.arrayBuffer()).byteLength, 7 * 1024 * 1024);
  }
  assert.equal(results[0].progress, 100);
  assert.deepEqual(failures, []);
  console.log(JSON.stringify({ ok: true, origin, simple: '7 MiB, progress 100%', multipart: '7 MiB', downloads: '200, exact size', unauthenticatedApi: unauthorized.status, blobRequestFailures: failures.length }));
} finally {
  await browser.close();
  if (urls.length) {
    await del(urls);
    console.log('Only diagnostic files removed.');
  }
}

// Run with: node --experimental-test-module-mocks --test tests/file-upload.test.mjs
import assert from "node:assert/strict";
import { mock, test } from "node:test";

let sendBlob;
mock.module("@vercel/blob/client", {
  namedExports: { put: (...args) => sendBlob(...args) },
});
const { uploadFileToBlob } = await import("../src/api/fileUpload.js");
const photo = { name: "retrato.jpg", size: 6.8 * 1024 * 1024, type: "image/jpeg" };

test("small photo uploads directly with a scoped client token", async () => {
  let tokenRequest;
  const progress = [];
  sendBlob = async (pathname, file, options) => {
    assert.equal(file, photo);
    assert.equal(pathname, tokenRequest.payload.pathname);
    assert.equal(options.token, "scoped-token");
    assert.equal(options.multipart, false);
    assert.equal(options.contentType, "image/jpeg");
    options.onUploadProgress({ percentage: 45.2 });
    return { url: "https://test.public.blob.vercel-storage.com/retrato.jpg" };
  };
  const result = await uploadFileToBlob(photo, {
    request: async (path, options) => {
      assert.equal(path, "/api/upload");
      assert.equal(options.method, "POST");
      assert.ok(options.signal instanceof AbortSignal);
      tokenRequest = JSON.parse(options.body);
      assert.equal(tokenRequest.type, "blob.generate-client-token");
      assert.equal(tokenRequest.payload.multipart, false);
      return { clientToken: "scoped-token" };
    },
    onProgress: (value) => progress.push(value),
  });
  assert.match(result.file_url, /^https:/);
  assert.deepEqual(progress, [45, 100]);
});

test("large audio retains multipart uploads", async () => {
  sendBlob = async (_, __, options) => {
    assert.equal(options.multipart, true);
    return { url: "https://test/audio.wav" };
  };
  await uploadFileToBlob({ name: "audio.wav", size: 150 * 1024 * 1024, type: "audio/wav" }, {
    request: async (_, options) => {
      assert.equal(JSON.parse(options.body).payload.multipart, true);
      return { clientToken: "scoped-token" };
    },
  });
});

test("API failures preserve status and do not fall back to base64", async () => {
  sendBlob = () => assert.fail("must not upload after token failure");
  const error = Object.assign(new Error("BLOB_READ_WRITE_TOKEN não configurado"), { status: 503 });
  await assert.rejects(uploadFileToBlob(photo, {
    request: async () => { throw error; },
  }), (received) => received === error && received.status === 503);
});

test("network failures give an actionable message without blaming the database", async () => {
  sendBlob = async () => { throw new TypeError("Failed to fetch"); };
  await assert.rejects(uploadFileToBlob(photo, {
    request: async () => ({ clientToken: "scoped-token" }),
  }), /Não foi possível enviar o arquivo ao Vercel Blob/);
});

test("missing token is rejected before sending bytes", async () => {
  sendBlob = () => assert.fail("must not upload without a token");
  await assert.rejects(uploadFileToBlob(photo, { request: async () => ({}) }), /não autorizou/);
});

test("stalled token request expires and cannot start a late upload", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let completeToken;
  let signal;
  sendBlob = () => assert.fail("must not start an upload after timeout");
  const pending = uploadFileToBlob(photo, {
    request: (_, options) => {
      signal = options.signal;
      return new Promise((resolve) => { completeToken = resolve; });
    },
  });
  const rejected = assert.rejects(pending, /Tempo limite/);
  t.mock.timers.tick(120000);
  await rejected;
  assert.equal(signal.aborted, true);
  completeToken({ clientToken: "late-token" });
  await new Promise((resolve) => setImmediate(resolve));
});

test("stalled Blob upload expires and ignores late progress", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let options;
  const progress = [];
  sendBlob = (_, __, input) => {
    options = input;
    return new Promise(() => {});
  };
  const pending = uploadFileToBlob(photo, {
    request: async () => ({ clientToken: "scoped-token" }),
    onProgress: (value) => progress.push(value),
  });
  const rejected = assert.rejects(pending, /Tempo limite/);
  await new Promise((resolve) => setImmediate(resolve));
  t.mock.timers.tick(120000);
  await rejected;
  assert.equal(options.abortSignal.aborted, true);
  options.onUploadProgress({ percentage: 100 });
  assert.deepEqual(progress, []);
});

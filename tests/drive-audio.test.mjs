import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { handleDrive } from "../api/_drive.js";
import { signToken } from "../api/_utils.js";

test("a private Drive upload is indexed and streams ranges only to active DZ6 accounts", async t => {
  const db = new PGlite();
  await db.exec(`
    CREATE TABLE app_users (id text PRIMARY KEY, status text);
    INSERT INTO app_users VALUES ('owner', 'ativo'), ('reviewer', 'ativo'), ('inactive', 'inativo');
    CREATE TABLE app_records (id text PRIMARY KEY, entity text, data jsonb);
    INSERT INTO app_records VALUES ('project', 'Project', '{}'), ('track', 'Track', '{"project_id":"project"}');
  `);
  const sql = async (parts, ...values) => (await db.query(
    parts.reduce((result, part, index) => result + (index ? `$${index}` : "") + part, ""), values
  )).rows;
  Object.assign(process.env, {
    JWT_SECRET: "drive-fixture-only",
    GOOGLE_CLIENT_ID: "client",
    GOOGLE_CLIENT_SECRET: "secret",
    GOOGLE_DRIVE_TOKEN_KEY: Buffer.alloc(32, 1).toString("base64"),
  });
  const server = createServer((req, res) => {
    const [, , , action, key] = new URL(req.url, process.env.APP_URL).pathname.split("/");
    handleDrive(req, res, sql, action, key).catch(error => {
      res.statusCode = 500;
      res.end(error.message);
    });
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    await db.close();
  });
  const origin = process.env.APP_URL = `http://127.0.0.1:${server.address().port}`;
  const nativeFetch = globalThis.fetch;
  let uploadedAsset;
  let revoked = false;
  t.mock.method(globalThis, "fetch", async (input, options) => {
    const url = new URL(input);
    if (url.origin === origin) return nativeFetch(input, options);
    if (url.hostname === "oauth2.googleapis.com") {
      return Response.json(revoked ? { error: "invalid_grant" } : {
        refresh_token: "private-refresh-token", access_token: "private-access-token", scope: "https://www.googleapis.com/auth/drive.file",
      });
    }
    if (url.pathname.endsWith("/about")) return Response.json({ user: { permissionId: "google-owner" } });
    if (url.pathname.startsWith("/upload/")) {
      uploadedAsset = JSON.parse(options.body).appProperties.dz6Asset;
      assert.equal(options.headers.Origin, origin);
      return new Response(null, { headers: { Location: "https://www.googleapis.com/upload/drive/v3/files?upload_id=fixture" } });
    }
    if (url.searchParams.get("alt") === "media") {
      assert.equal(options.headers.Range, "bytes=0-1");
      return new Response("ab", { status: 206, headers: { "Content-Range": "bytes 0-1/8", "Content-Length": "2" } });
    }
    assert.equal(url.pathname, "/drive/v3/files/google-file");
    return Response.json({ id: "google-file", mimeType: "audio/wav", size: "8", ownedByMe: true, appProperties: { dz6Asset: uploadedAsset } });
  });
  const request = (path, { actor, cookie, body, method = body ? "POST" : "GET", range } = {}) => fetch(origin + "/api/drive/" + path, {
    method,
    headers: {
      ...(actor ? { Authorization: "Bearer " + signToken({ id: actor }) } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...(range ? { Range: range } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const connect = await request("connect", { actor: "owner", method: "POST" });
  assert.equal(connect.status, 200);
  const oauth = new URL((await connect.json()).url);
  const callback = "callback?code=fixture&state=" + encodeURIComponent(oauth.searchParams.get("state"));
  assert.match(await (await request(callback)).text(), /connected:false/);
  const stateCookie = connect.headers.get("set-cookie").split(";")[0];
  assert.match(await (await request(callback, { cookie: stateCookie })).text(), /connected:true/);
  const { rows: [connection] } = await db.query("SELECT * FROM app_drive_connections");
  assert.notEqual(connection.refresh_token, "private-refresh-token");

  const start = await request("start", { actor: "owner", body: { name: "Mix.wav", size: 8, type: "audio/wav" } });
  assert.equal(start.status, 200);
  const { asset } = await start.json();
  const finish = await request("finish", { actor: "owner", body: { asset, fileId: "google-file" } });
  assert.equal(finish.status, 200);
  const { file_url } = await finish.json();
  await db.query("INSERT INTO app_records VALUES ('version', 'TrackVersion', $1)", [JSON.stringify({ track_id: "track", audio_url: file_url })]);

  assert.equal((await request("audio/" + asset)).status, 401);
  assert.equal((await request("session", { actor: "inactive", method: "POST" })).status, 403);
  const session = await request("session", { actor: "reviewer", method: "POST" });
  const mediaCookie = session.headers.get("set-cookie").split(";")[0];
  const partial = await request("audio/" + asset, { cookie: mediaCookie, range: "bytes=0-1" });
  assert.equal(partial.status, 206);
  assert.equal(partial.headers.get("content-range"), "bytes 0-1/8");
  assert.equal(await partial.text(), "ab");
  revoked = true;
  assert.equal((await request("audio/" + asset, { cookie: mediaCookie })).status, 410);
  await db.exec("DELETE FROM app_records WHERE id = 'version'");
  assert.equal((await request("audio/" + asset, { cookie: mediaCookie })).status, 404);
});

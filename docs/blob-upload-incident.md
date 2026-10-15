# Upload configuration correction — 2026-10-15

The app uploads with `access: "public"` and stores directly usable image/audio URLs. The connected `dz6music` Blob store was **private**, incompatible with that flow. The browser showed HTTP 400 followed by CORS errors from the Blob endpoint.

Created the public `dz6rec-public` store and connected its managed `BLOB_READ_WRITE_TOKEN` to production, preview and development. Replaced the manually configured upload variable. Kept the private store and its connection intact. No application records were changed.

Redeployed existing production source, rather than publishing the pending local visual changes. Production deployment: `dpl_CRCcFMGTBcGZyZFHpY2JRLjZAZZu`, aliased to https://dz6rec.vercel.app.

## Verification

- Real Chromium uploads from the production origin: simple upload through `src/api/fileUpload.js` and explicit multipart upload, each 7 MiB.
- Generated short-lived scoped tokens in the diagnostic process using the connected store credential and the API's current constraints. This does **not** exercise an authenticated `/api/upload` request or an artist database save.
- Both uploaded files downloaded with HTTP 200 and exact byte count; simple upload reached 100%; no Blob request failures.
- Unauthenticated production `/api/upload` still returned 401.
- Removed synthetic diagnostic files only.
- Lint and all 11 upload/save regression tests passed.

Repeat storage verification with `vercel env run -e development -- node scripts/diagnose-blob.mjs`. This creates public synthetic files, then removes them; credentials stay in Node and are never sent to the browser.

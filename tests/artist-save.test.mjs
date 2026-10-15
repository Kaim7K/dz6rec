// Run with: node --test tests/artist-save.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

// Exercise the real submit handlers with failed services. Rendering primitives
// and hooks are stubbed so these tests need neither a browser nor live data.
function renderForm(filename, { editing, upload, save }) {
  const state = editing
    ? [{ name: "Artista", handle: "", bio: "" }, { name: "foto.jpg" }, false, ""]
    : [[], true, { name: "Artista", handle: "", bio: "" }, { name: "foto.jpg" }, false, "", null];
  let cursor = 0;
  let closed = false;
  const react = {
    createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
    useState: () => {
      const index = cursor++;
      return [state[index], (value) => { state[index] = value; }];
    },
    useEffect: () => {},
  };
  const apiClient = { entities: { Artist: { create: save, update: save } } };
  const source = readFileSync(new URL(filename, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
  }).outputText;
  const exports = {};
  runInNewContext(compiled, {
    exports,
    require: (id) => {
      if (id === "react") return react;
      if (id === "@/api/appClient") return { apiClient };
      if (id === "@/lib/music") return { uploadFile: upload };
      return new Proxy({}, { get: (_, name) => name });
    },
  });
  const tree = exports.default(editing ? {
    artist: { id: "artist-1" }, open: true,
    onSaved: () => {}, onClose: () => { closed = true; },
  } : {});
  function find(node) {
    if (!node || typeof node !== "object") return;
    if (node.type === "form") return node;
    for (const child of node.children || []) {
      const found = find(child);
      if (found) return found;
    }
  }
  return { submit: find(tree).props.onSubmit, state, closed: () => closed };
}

for (const editing of [true, false]) {
  const filename = editing ? "../src/components/artists/EditArtistDialog.jsx" : "../src/pages/Artists.jsx";
  const loadingIndex = editing ? 2 : 4;
  const errorIndex = editing ? 3 : 5;
  test(`${editing ? "edit" : "create"}: upload rejection unlocks form and prevents database write`, async () => {
    let writes = 0;
    const form = renderForm(filename, {
      editing,
      upload: async () => { throw new Error("Falha no upload"); },
      save: async () => { writes++; },
    });
    await form.submit({ preventDefault() {} });
    assert.equal(form.state[loadingIndex], false);
    assert.equal(form.state[errorIndex], "Falha no upload");
    assert.equal(writes, 0);
    assert.equal(form.closed(), false);
    assert.ok(form.state[editing ? 1 : 3], "selected file is retained for retry");
  });
  test(`${editing ? "edit" : "create"}: database rejection unlocks form and shows error`, async () => {
    const form = renderForm(filename, {
      editing,
      upload: async () => "https://test/foto.jpg",
      save: async () => { throw new Error("Banco indisponível"); },
    });
    await form.submit({ preventDefault() {} });
    assert.equal(form.state[loadingIndex], false);
    assert.equal(form.state[errorIndex], "Banco indisponível");
    assert.equal(form.closed(), false);
  });
}

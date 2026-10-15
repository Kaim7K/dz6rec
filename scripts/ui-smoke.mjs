import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";

const origin = process.env.AUDIT_URL || "http://127.0.0.1:5173";
if (!["localhost", "127.0.0.1"].includes(new URL(origin).hostname)) throw new Error("UI smoke tests require the local mock server.");
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
try {
  await page.goto(origin + "/artistas");
  await page.getByRole("button", { name: "Novo artista", exact: true }).click();
  await page.getByLabel("Nome", { exact: true }).fill("Artista QA");
  await page.locator('[role="dialog"] input[type="file"]').setInputFiles({ name: "retrato.png", mimeType: "image/png", buffer: await readFile("src/assets/dz6-profile.png") });
  await page.getByRole("button", { name: "Criar artista", exact: true }).click();
  await page.getByRole("button", { name: "Editar Artista QA", exact: true }).click();
  await page.getByLabel("Nome", { exact: true }).fill("Artista QA Revisado");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await page.getByText("Artista QA Revisado", { exact: true }).waitFor();

  await page.goto(origin + "/projetos");
  await page.getByRole("button", { name: "Novo projeto", exact: true }).click();
  await page.getByLabel("Nome do projeto", { exact: true }).fill("Projeto QA");
  await page.getByRole("combobox", { name: "Tipo", exact: true }).click();
  await page.getByRole("option", { name: "EP", exact: true }).click();
  await page.getByRole("combobox", { name: "Artista principal", exact: true }).click();
  await page.getByRole("option", { name: "Artista QA Revisado", exact: true }).click();
  await page.getByRole("button", { name: "Criar projeto", exact: true }).click();
  await page.getByText("Projeto QA", { exact: true }).click();
  await page.getByRole("button", { name: "Editar projeto", exact: true }).click();
  await page.getByLabel("Nome do projeto", { exact: true }).fill("Projeto QA Revisado");
  await page.getByRole("button", { name: "Salvar alterações", exact: true }).click();
  await page.getByRole("heading", { name: "Projeto QA Revisado", exact: true }).waitFor();
  await page.getByRole("button", { name: "Adicionar faixa", exact: true }).first().click();
  await page.getByLabel("Nome", { exact: true }).fill("Faixa QA");
  await page.getByRole("dialog").getByRole("button", { name: "Adicionar faixa", exact: true }).click();
  await page.getByText("Faixa QA", { exact: true }).waitFor();

  await page.getByRole("tab", { name: "Tarefas", exact: true }).click();
  const input = page.getByRole("textbox", { name: "Adicionar tarefas de Música", exact: true });
  await input.fill("Tarefa QA");
  await page.locator("form").filter({ has: input }).getByRole("button", { name: "Adicionar", exact: true }).click();
  await page.getByRole("checkbox", { name: "Concluir tarefa: Tarefa QA", exact: true }).click();
  await page.getByRole("checkbox", { name: "Reabrir tarefa: Tarefa QA", exact: true }).waitFor();
  assert.equal(await page.getByRole("checkbox", { name: "Reabrir tarefa: Tarefa QA", exact: true }).getAttribute("aria-checked"), "true");

  const store = await page.evaluate(() => JSON.parse(localStorage.getItem("dz6_mock_store_v1")));
  const artist = store.Artist.find((record) => record.name === "Artista QA Revisado");
  const project = store.Project.find((record) => record.name === "Projeto QA Revisado");
  assert.equal(artist.photo_url, "#", "local mock upload contract is retained");
  assert.equal(project.type, "ep");
  assert.equal(project.main_artist_id, artist.id);
  assert.ok(store.Track.some((record) => record.name === "Faixa QA" && record.project_id === project.id));
  assert.ok(store.ChecklistItem.some((record) => record.text === "Tarefa QA" && record.completed && record.project_id === project.id));
  assert.deepEqual(errors, []);
  console.log("UI smoke passed: artist upload/edit, project create/edit, selects, track create and task completion. Disposable local data only.");
} finally { await context.close(); await browser.close(); }

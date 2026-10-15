import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// Only the local mock environment is allowed. No production accounts or data.
const origin = process.env.AUDIT_URL || "http://127.0.0.1:5173";
if (!["localhost", "127.0.0.1"].includes(new URL(origin).hostname)) throw new Error("Visual audit requires the local mock server.");
const output = path.resolve("artifacts/visual-audit");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
const image = await readFile("src/assets/dz6-profile.png");
const widths = process.env.AUDIT_WIDTHS ? process.env.AUDIT_WIDTHS.split(",").map(Number) : [360, 390, 768, 938, 1024, 1280, 1440];

try {
  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: width < 768 ? 844 : 1000 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    let pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    const visit = async (route) => {
      await page.goto(`${origin}${route}`);
      await page.locator("h1").first().waitFor();
      await page.evaluate(() => document.fonts.ready);
    };
    const capture = async (name) => {
      await page.waitForTimeout(120);
      const issues = await page.evaluate(() => {
        const found = [];
        const width = innerWidth;
        if (document.documentElement.scrollWidth > width + 1) found.push(`document overflow: ${document.documentElement.scrollWidth}`);
        const dialog = [...document.querySelectorAll('[role="dialog"], [role="alertdialog"]')].find((element) => element.checkVisibility() && element.dataset.state !== "closed");
        if (dialog) {
          const rect = dialog.getBoundingClientRect();
          if (rect.left < -1 || rect.right > width + 1 || rect.top < -1 || rect.bottom > innerHeight + 1) found.push("dialog outside viewport");
          if (dialog.scrollWidth > dialog.clientWidth + 1) found.push("dialog content overflows horizontally");
        }
        for (const element of document.querySelectorAll('main input:not([type="file"]), main textarea, main [role="combobox"], main .dz-card, [role="dialog"] input:not([type="file"]), [role="dialog"] textarea, [role="dialog"] [role="combobox"]')) {
          if (!element.checkVisibility()) continue;
          const rect = element.getBoundingClientRect();
          if (rect.width > 2 && (rect.left < -1 || rect.right > width + 1)) found.push(`${element.tagName} outside viewport: ${element.getAttribute("aria-label") || element.textContent.trim().slice(0, 35)}`);
        }
        const titles = document.querySelector('.player-titles');
        if (titles && titles.getBoundingClientRect().width < 120) found.push('player title squeezed below 120px');
        const progress = document.querySelector('.project-hero > .project-progress');
        if (progress && Math.abs(progress.getBoundingClientRect().width - progress.parentElement.getBoundingClientRect().width) > 2) found.push('project progress does not span the header');
        for (const row of document.querySelectorAll('.track-row')) {
          const status = row.querySelector('.track-status').getBoundingClientRect();
          if (row.parentElement.clientWidth >= 560 && status.top > row.getBoundingClientRect().top + 40) found.push('track status wraps despite available space');
        }
        for (const cell of document.querySelectorAll('.track-heading > span')) {
          if (cell.checkVisibility() && cell.scrollWidth > cell.clientWidth + 1) found.push('track heading label overflows its column');
        }
        return [...new Set(found)];
      });
      const screenshot = `${width}-${name}.png`;
      const floating = await page.locator('[role="dialog"]:visible, [role="alertdialog"]:visible, [role="listbox"]:visible').count();
      await page.screenshot({ path: path.join(output, screenshot), fullPage: !floating && name !== "player", animations: "disabled" });
      results.push({ width, name, screenshot, issues: [...issues, ...pageErrors] });
      pageErrors = [];
    };
    const scenario = async (name, action) => {
      try { await action(); await capture(name); }
      catch (error) { results.push({ width, name, issues: [error.message] }); }
    };
    const dismiss = async () => {
      const close = page.getByRole("button", { name: "Fechar", exact: true });
      if (await close.isVisible()) await close.click();
      else await page.keyboard.press("Escape");
    };

    for (const [name, route] of Object.entries({ home: "/", projects: "/projetos", artists: "/artistas", tasks: "/minhas-tarefas", templates: "/templates", users: "/usuarios", settings: "/configuracoes", project: "/projetos/project-1", login: "/login", register: "/register", forgot: "/forgot-password", "reset-invalid": "/reset-password", "reset-valid": "/reset-password?token=visual-test", "google-error": "/auth/google/callback", "not-found": "/pagina-inexistente" })) {
      await scenario(name, () => visit(route));
    }

    await visit("/artistas");
    await scenario("new-artist", () => page.getByRole("button", { name: "Novo artista", exact: true }).click());
    await scenario("upload-preview", async () => {
      await page.locator('[role="dialog"] input[type="file"]').setInputFiles({ name: "retrato-do-artista-com-nome-longo-para-validar-truncamento.png", mimeType: "image/png", buffer: image });
      await page.getByRole("button", { name: "Substituir arquivo" }).waitFor();
    });
    await page.getByRole("button", { name: "Remover arquivo" }).click();
    await dismiss();
    await scenario("edit-artist", () => page.getByRole("button", { name: "Editar Artista Demo", exact: true }).click());
    await dismiss();

    await visit("/projetos");
    await scenario("new-project", () => page.getByRole("button", { name: "Novo projeto", exact: true }).first().click());
    await scenario("project-select", () => page.getByRole("combobox", { name: "Tipo", exact: true }).click());
    await page.keyboard.press("Escape");
    await scenario("date-picker", () => page.getByRole("button", { name: "Lançamento previsto", exact: true }).click());
    await page.keyboard.press("Escape");
    await dismiss();

    await visit("/projetos/project-1");
    await scenario("edit-project", () => page.getByRole("button", { name: "Editar projeto", exact: true }).click());
    await dismiss();
    await scenario("add-track", () => page.getByRole("button", { name: "Adicionar faixa", exact: true }).click());
    await dismiss();
    await scenario("track-menu", () => page.getByRole("button", { name: "Opções da faixa Single Piloto" }).click());
    await page.getByRole("button", { name: "Opções da faixa Single Piloto" }).click();
    await scenario("player", () => page.getByRole("button", { name: "Reproduzir Single Piloto" }).click());
    await scenario("delete-project", () => page.getByRole("button", { name: "Excluir Single Piloto" }).click());
    await page.getByRole("button", { name: "Cancelar", exact: true }).click();

    for (const [tab, name] of [["Tarefas", "checklist"], ["Operação", "workspace"], ["Histórico", "history"], ["Conversa", "chat"]]) {
      await scenario(name, () => page.getByRole("tab", { name: tab, exact: true }).click());
      if (name === "checklist") {
        await scenario("task-expanded", () => page.getByRole("button", { name: "Expandir tarefa" }).first().click());
        await scenario("section-notes", () => page.getByRole("button", { name: "Notas da seção" }).first().click());
        await dismiss();
        await scenario("checklist-template", () => page.getByRole("button", { name: "Salvar como template" }).click());
        await dismiss();
      }
    }

    await visit("/templates");
    await scenario("new-template", () => page.getByRole("button", { name: "Novo template", exact: true }).click());
    await dismiss();
    await scenario("template-editor", () => page.getByRole("button", { name: "Editar template Lançamento completo" }).click());
    await dismiss();
    await visit("/usuarios");
    await scenario("edit-user", () => page.getByRole("button", { name: "Editar usuário", exact: true }).first().click());
    await dismiss();
    await scenario("manage-cargos", () => page.getByRole("button", { name: "Gerenciar Cargos", exact: true }).first().click());
    await page.getByRole("button", { name: "Cancelar", exact: true }).click();
    await scenario("delete-user", () => page.getByRole("button", { name: "Excluir usuário", exact: true }).first().click());
    await page.getByRole("button", { name: "Cancelar", exact: true }).click();
    await visit("/configuracoes");
    await scenario("edit-cargo", () => page.getByRole("button", { name: "Editar cargo", exact: true }).first().click());
    await dismiss();
    await scenario("notifications", () => page.getByRole("button", { name: "Notificações", exact: true }).click());
    await page.keyboard.press("Escape");
    await scenario("account-menu", () => page.getByRole("button", { name: "Menu da conta", exact: true }).click());
    await page.keyboard.press("Escape");
    if (width < 1024) {
      await scenario("navigation", () => page.getByRole("button", { name: "Abrir menu", exact: true }).click());
      await page.keyboard.press("Escape");
    }
    // Edge cases are confined to this disposable browser context's mock store.
    const originalStore = await page.evaluate(() => localStorage.getItem("dz6_mock_store_v1"));
    for (const [name, entity, route] of [["empty-projects", "Project", "/projetos"], ["empty-artists", "Artist", "/artistas"], ["empty-templates", "ChecklistTemplate", "/templates"], ["empty-tasks", "ChecklistItem", "/minhas-tarefas"]]) {
      await scenario(name, async () => {
        await page.evaluate(({ originalStore, entity }) => {
          const store = JSON.parse(originalStore); store[entity] = [];
          localStorage.setItem("dz6_mock_store_v1", JSON.stringify(store));
        }, { originalStore, entity });
        await visit(route);
      });
    }
    await page.evaluate((store) => localStorage.setItem("dz6_mock_store_v1", store), originalStore);
    await scenario("reset-success", async () => {
      await visit("/forgot-password");
      await page.getByLabel("E-mail", { exact: true }).fill("visual-qa@example.test");
      await page.getByRole("button", { name: "Enviar link", exact: true }).click();
      await page.getByText("Se existir uma conta com esse e-mail", { exact: false }).waitFor();
    });
    await scenario("validation-error", async () => {
      await visit("/register");
      await page.getByLabel("Nome", { exact: true }).fill("Teste visual");
      await page.getByLabel("E-mail", { exact: true }).fill("visual-qa@example.test");
      await page.getByLabel("Senha", { exact: true }).fill("local-test-123");
      await page.getByLabel("Confirmar senha", { exact: true }).fill("different-local-test");
      await page.getByRole("button", { name: "Criar conta", exact: true }).click();
      await page.getByText("As senhas nao coincidem", { exact: true }).waitFor();
    });
    await scenario("template-populated", async () => {
      await page.evaluate((original) => {
        const store = JSON.parse(original);
        store.ChecklistSection.push({ id: "qa-section", template_id: "template-1", name: "Preparação do lançamento", order: 0 });
        store.ChecklistItem.push({ id: "qa-parent", section_id: "qa-section", text: "Revisar o planejamento e confirmar todos os materiais do lançamento", order: 0, detail_mode: "both", observation: "Confirmar versão final com a equipe antes da entrega." }, { id: "qa-child", section_id: "qa-section", parent_id: "qa-parent", text: "Conferir os arquivos de referência", order: 1 });
        localStorage.setItem("dz6_mock_store_v1", JSON.stringify(store));
      }, originalStore);
      await visit("/templates");
      await page.getByRole("button", { name: "Editar template Lançamento completo" }).click();
      await page.getByText("Revisar o planejamento e confirmar todos os materiais do lançamento", { exact: true }).waitFor();
    });
    await dismiss();
    await scenario("orphan-cargo", async () => {
      await page.evaluate((original) => {
        const store = JSON.parse(original);
        store.User[0].full_name = "Administração da equipe de produção musical";
        store.User[0].cargo = ["CEO", "Coordenação de lançamento descontinuada"];
        localStorage.setItem("dz6_mock_store_v1", JSON.stringify(store));
      }, originalStore);
      await visit("/usuarios");
      await page.getByRole("button", { name: "Gerenciar Cargos", exact: true }).first().click();
    });
    await page.getByRole("button", { name: "Cancelar", exact: true }).click();
    await page.evaluate((original) => {
      const store = JSON.parse(original);
      const long = 'NomeExtensoSemEspacos'.repeat(5);
      store.Project[0].name = long;
      store.Project[0].description = 'Planejamento de lançamento com descrição extensa para validar que o conteúdo se adapta sem cortes. '.repeat(4);
      store.Artist[0].name = long;
      store.User[1].full_name = long;
      store.User[1].email = `${long}@example.test`;
      store.ChecklistItem[0].text = long;
      store.ChecklistItem[0].responsible_ids = store.User.map(user => user.id);
      localStorage.setItem('dz6_mock_store_v1', JSON.stringify(store));
    }, originalStore);
    for (const [name, route] of [['long-project', '/projetos/project-1'], ['long-artists', '/artistas'], ['long-users', '/usuarios']]) {
      await scenario(name, () => visit(route));
    }
    await scenario('long-checklist', async () => {
      await visit('/projetos/project-1');
      await page.getByRole('tab', { name: 'Tarefas', exact: true }).click();
      await page.getByRole('button', { name: 'Expandir tarefa' }).first().click();
    });
    for (const status of ["pendente", "inativo"]) {
      await scenario(`account-${status}`, async () => {
        await page.evaluate(({ originalStore, status }) => {
          const store = JSON.parse(originalStore); store.User[0].status = status;
          localStorage.setItem("dz6_mock_store_v1", JSON.stringify(store));
        }, { originalStore, status });
        await visit("/");
      });
    }
    await scenario("restricted-area", async () => {
      await page.evaluate((original) => {
        localStorage.setItem("dz6_mock_store_v1", original);
        localStorage.setItem("dz6_mock_profile_id", "user-produtor");
      }, originalStore);
      await visit("/usuarios");
    });
    await context.close();
    console.log(`Audited ${width}px`);
  }
} finally {
  await browser.close();
  await writeFile(path.join(output, "results.json"), JSON.stringify(results, null, 2));
}
const failures = results.filter((result) => result.issues.length);
console.log(JSON.stringify({ captures: results.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;

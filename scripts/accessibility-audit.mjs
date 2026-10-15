import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";

const origin = process.env.AUDIT_URL || "http://127.0.0.1:5173";
if (!["localhost", "127.0.0.1"].includes(new URL(origin).hostname)) throw new Error("Accessibility audit requires the local mock server.");
const browser = await chromium.launch();
const checks = [];
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    const check = async (name) => {
      await page.waitForTimeout(150);
      const report = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      checks.push({ width, name, violations: report.violations.map(({ id, impact, nodes }) => ({ id, impact, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })) })) });
    };
    for (const route of ["/", "/projetos", "/artistas", "/minhas-tarefas", "/templates", "/usuarios", "/configuracoes", "/login", "/register", "/forgot-password", "/reset-password?token=visual-test", "/pagina-inexistente"]) {
      await page.goto(origin + route);
      await page.locator("h1").first().waitFor();
      await check(route);
    }
    await page.goto(origin + "/artistas");
    await page.getByRole("button", { name: "Novo artista", exact: true }).click();
    await check("artist-form");
    await page.getByRole("button", { name: "Fechar", exact: true }).click();
    await page.goto(origin + "/projetos/project-1");
    await page.getByRole("tab", { name: "Tarefas", exact: true }).click();
    await page.getByRole("button", { name: "Expandir tarefa" }).first().click();
    await check("expanded-checklist");
    await page.getByRole("tab", { name: "Operação", exact: true }).click();
    await check("workspace");
    await page.getByRole("tab", { name: "Conversa", exact: true }).click();
    await check("chat");
    await page.goto(origin + "/configuracoes");
    await page.getByRole("button", { name: "Notificações", exact: true }).click();
    await check("notifications");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Menu da conta", exact: true }).click();
    await check("account-menu");
    await page.keyboard.press("Escape");
    await page.goto(origin + "/usuarios");
    await page.getByRole("button", { name: "Gerenciar Cargos", exact: true }).first().click();
    await check("manage-cargos");
    await page.getByRole("button", { name: "Cancelar", exact: true }).click();
    await page.goto(origin + "/projetos");
    await page.getByRole("button", { name: "Novo projeto", exact: true }).click();
    await page.getByRole("button", { name: "Lançamento previsto", exact: true }).click();
    await check("calendar");
    await context.close();
    console.log(`Checked accessibility at ${width}px`);
  }
} finally {
  await browser.close();
  await mkdir("artifacts/visual-audit", { recursive: true });
  await writeFile("artifacts/visual-audit/accessibility.json", JSON.stringify(checks, null, 2));
}
const failures = checks.filter((check) => check.violations.length);
console.log(JSON.stringify({ checks: checks.length, failures: failures.map(({ width, name, violations }) => ({ width, name, violations: violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) })) })) }, null, 2));
if (failures.length) process.exitCode = 1;

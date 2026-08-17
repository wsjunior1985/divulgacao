#!/usr/bin/env node
// semear.mjs — semeia dados de exemplo nas contas dos apps para as telas não
// saírem vazias nos cards.
//
//   node scripts/semear.mjs                 todos os apps
//   node scripts/semear.mjs --app remedin   um app só
//
// Usa CAPTURAS_EMAIL/CAPTURAS_SENHA (do .env.local). Roda manualmente, uma vez
// — não é idempotente por completo, então evite rodar repetidamente sem limpar.

import { chromium } from "playwright";
import { carregarEnv, log, ok, erro, env } from "./lib/base.js";

carregarEnv();

const EMAIL = env("CAPTURAS_EMAIL");
const SENHA = env("CAPTURAS_SENHA");
const VIEWPORT = { width: 390, height: 844 };

async function login(page, url, loginUrl) {
  await page.goto(`${url}${loginUrl}`, { waitUntil: "networkidle", timeout: 40000 });
  await page.waitForTimeout(800);
  const aba = page.getByRole("button", { name: "Entrar com E-mail" });
  if (await aba.count()) {
    await aba.first().click();
    await page.waitForTimeout(600);
  }
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', SENHA);
  const submit = page.locator('button[type="submit"]');
  if (await submit.count()) await submit.first().click();
  await page.waitForLoadState("networkidle", { timeout: 40000 }).catch(() => {});
  await page.waitForTimeout(2500);
}

// ---------------------------------------------------------------------------
// Remedin — dois medicamentos com horários fixos, para o dashboard/relatórios
// não saírem zerados.
// ---------------------------------------------------------------------------
async function novoMedicamento(page, nome, dosagem, horarios, estoque) {
  await page.goto("https://remedin.app.br/medications/new", { waitUntil: "networkidle", timeout: 40000 }).catch(() => {});
  await page.waitForTimeout(1200);

  await page.locator('input#name').fill(nome);
  await page.locator('input#dosage').fill(dosagem);

  const times = page.locator('input[type="time"]');
  await times.nth(0).fill(horarios[0]);
  for (let i = 1; i < horarios.length; i++) {
    await page.getByRole("button", { name: "Adicionar horário" }).click();
    await page.waitForTimeout(400);
    await page.locator('input[type="time"]').nth(i).fill(horarios[i]);
  }

  await page.locator('input#stock').fill(String(estoque));
  await page.getByRole("button", { name: "Salvar medicamento" }).click();
  await page.waitForTimeout(2200);
  log(`remedin: "${nome}" ${dosagem}mg salvo`);
}

async function semearRemedin(browser) {
  const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await login(page, "https://remedin.app.br", "/auth");
  await novoMedicamento(page, "Losartana", "50", ["08:00", "20:00"], 30);
  await novoMedicamento(page, "Metformina", "500", ["08:00", "20:00"], 30);
  await ctx.close();
}

// ---------------------------------------------------------------------------
// Vai dar quanto? — itens no carrinho + itens na lista rápida.
// ---------------------------------------------------------------------------
async function semearVaiDarQuanto(browser) {
  const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await login(page, "https://vaidarquanto.com.br", "/login");

  await page.goto("https://vaidarquanto.com.br/carrinho", { waitUntil: "networkidle", timeout: 40000 }).catch(() => {});
  await page.waitForTimeout(1500);

  const itens = [
    ["Frango", "18,90"],
    ["Leite", "5,49"],
    ["Pão francês", "12,00"],
    ["Banana", "4,00"],
  ];
  for (const [nome, preco] of itens) {
    await page.getByText("Adicionar manualmente", { exact: true }).first().click();
    await page.waitForTimeout(500);
    await page.locator('input[placeholder="Produto"]').fill(nome);
    await page.locator('input[placeholder="Preço"]').fill(preco);
    await page.getByRole("button", { name: "Adicionar", exact: true }).click();
    await page.waitForTimeout(700);
  }
  log(`vaidarquanto: ${itens.length} itens no carrinho`);

  await page.goto("https://vaidarquanto.com.br/listas", { waitUntil: "networkidle", timeout: 40000 }).catch(() => {});
  await page.waitForTimeout(1500);
  for (const nome of ["Café", "Açúcar", "Óleo de soja", "Sabão em pó"]) {
    await page.locator('input[placeholder="Adicionar item…"]').fill(nome);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(600);
  }
  log("vaidarquanto: lista rápida preenchida");

  await ctx.close();
}

// ---------------------------------------------------------------------------
// AI-Eat — hidratação (o resumo já tem IMC/TMB da conta).
// ---------------------------------------------------------------------------
async function semearAiEat(browser) {
  const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await login(page, "https://aieat.app.br", "/auth");
  await page.goto("https://aieat.app.br/diario", { waitUntil: "networkidle", timeout: 40000 }).catch(() => {});
  await page.waitForTimeout(2000);
  for (let i = 0; i < 7; i++) {
    await page.getByRole("button", { name: "+200ml" }).click();
    await page.waitForTimeout(400);
  }
  log("aieat: hidratação 1400ml");
  await ctx.close();
}

async function main() {
  if (!EMAIL || !SENHA) throw new Error("CAPTURAS_EMAIL/CAPTURAS_SENHA não definidos");

  const argv = process.argv.slice(2);
  const apenas = argv.includes("--app") ? argv[argv.indexOf("--app") + 1] : null;

  const browser = await chromium.launch();

  const tarefas = {
    remedin: semearRemedin,
    vaidarquanto: semearVaiDarQuanto,
    aieat: semearAiEat,
  };

  for (const [id, tarefa] of Object.entries(tarefas)) {
    if (apenas && id !== apenas) continue;
    log(`— ${id} —`);
    try {
      await tarefa(browser);
    } catch (e) {
      erro(`${id}: ${e.message}`);
    }
  }

  await browser.close();
  ok("semeadura concluída");
}

main().catch((e) => {
  erro(e.message || String(e));
  process.exit(1);
});

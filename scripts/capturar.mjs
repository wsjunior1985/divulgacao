#!/usr/bin/env node
// capturar.mjs — captura as telas INTERNAS reais dos apps para os cards.
//
//   node scripts/capturar.mjs                  todos os apps
//   node scripts/capturar.mjs --app gasonol    um app só
//
// Nunca fotografa a tela de login: cada app aponta para as rotas internas (o
// dashboard e as telas de uso), e quando exige conta, autentica com
// CAPTURAS_EMAIL / CAPTURAS_SENHA (no .env.local / Secrets) e só então navega.
//
// Requer Playwright (devDependency) + `npx playwright install chromium`.

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { carregarEnv, log, ok, aviso, erro, env, RAIZ } from "./lib/base.js";

carregarEnv();

const VIEWPORT = { width: 390, height: 844 };
const DPR = 2;
const DESTINO = resolve(RAIZ, "assets/capturas");

const EMAIL = env("CAPTURAS_EMAIL");
const SENHA = env("CAPTURAS_SENHA");

// Modo escuro por app: a chave de localStorage que cada app usa para decidir o
// tema. Some ao `colorScheme: "dark"` do contexto (que cobre quem usa
// prefers-color-scheme, como o Convertendo).
const TEMA_ESCURO = {
  gasonol: [["theme", "dark"]],
  remedin: [["remedin-theme", "dark"]],
  aieat: [["aieat.theme", "dark"]],
  convertendo: [],
  vaidarquanto: [["vdq-app-dark", "true"]],
};

// ---------------------------------------------------------------------------
// Cenários do GASONOL (sem login). A tela de cálculo é progressiva: selecionar
// veículo → calculadora → resultado. Cada passo é uma captura diferente.
// ---------------------------------------------------------------------------

async function escolherVeiculo(page) {
  const sels = page.locator("select");
  await sels.nth(0).selectOption({ label: "VOLKSWAGEN" });
  await page.waitForTimeout(1200);
  await sels.nth(1).selectOption({ index: 1 });
  await page.waitForTimeout(1200);
  await sels.nth(2).selectOption({ index: 1 });
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: "Confirmar veículo" }).click();
  await page.waitForTimeout(2200);
}

async function preencherPrecos(page, gasolina, etanol) {
  const inputs = page.locator('input[placeholder="0,00"]');
  await inputs.nth(0).fill(gasolina);
  await inputs.nth(1).fill(etanol);
  await page.waitForTimeout(1800);
}

const APPS = [
  {
    id: "gasonol",
    url: "https://gasonol.com.br",
    login: false,
    telas: [
      { nome: "seletor", url: "/app" },
      { nome: "calculadora", preparar: escolherVeiculo },
      { nome: "resultado", preparar: (page) => preencherPrecos(page, "5,49", "3,59") },
    ],
  },
  {
    id: "remedin",
    url: "https://remedin.app.br",
    login: true,
    loginUrl: "/auth",
    telas: ["/dashboard", "/assistant", "/medications/new"],
  },
  {
    id: "aieat",
    url: "https://aieat.app.br",
    login: true,
    loginUrl: "/auth",
    telas: ["/", "/diario", "/historico"],
  },
  {
    id: "convertendo",
    url: "https://convertendo.app.br",
    login: true,
    loginUrl: "/auth",
    telas: ["/converter", "/cotacoes", "/configuracoes"],
  },
  {
    id: "vaidarquanto",
    url: "https://vaidarquanto.com.br",
    login: true,
    loginUrl: "/login",
    telas: ["/inicio", "/carrinho", "/listas"],
  },
];

async function autenticar(page, app) {
  if (!EMAIL || !SENHA) {
    throw new Error("CAPTURAS_EMAIL/CAPTURAS_SENHA não definidos — não dá para autenticar");
  }
  await page.goto(`${app.url}${app.loginUrl}`, { waitUntil: "networkidle", timeout: 40000 });

  // Vai dar quanto? esconde os campos atrás da aba "Entrar com E-mail".
  const abaEmail = page.getByRole("button", { name: "Entrar com E-mail" });
  if (await abaEmail.count()) {
    await abaEmail.first().click();
    await page.waitForTimeout(800);
  }

  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', SENHA);

  const submit = page.locator('button[type="submit"]');
  if (await submit.count()) await submit.first().click();
  else await page.getByRole("button", { name: /Entrar/i }).last().click();

  await page.waitForLoadState("networkidle", { timeout: 40000 }).catch(() => {});
  await page.waitForTimeout(2500);

  if (/\/auth|\/login/i.test(page.url())) {
    throw new Error("login não saiu da tela de autenticação — confira as credenciais");
  }
}

async function capturarApp(browser, app) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DPR,
    isMobile: true,
    hasTouch: true,
    colorScheme: "dark",
  });

  const pares = TEMA_ESCURO[app.id] ?? [];
  if (pares.length) {
    await context.addInitScript((tema) => {
      for (const [chave, valor] of tema) localStorage.setItem(chave, valor);
    }, pares);
  }

  const page = await context.newPage();

  try {
    if (app.login) {
      await autenticar(page, app);
    }

    for (let i = 0; i < app.telas.length; i++) {
      const tela = app.telas[i];
      const alvo = typeof tela === "string" ? tela : tela.url;
      // Telas sem `url` continuam do estado anterior (fluxo contínuo, como o
      // GASONOL: seletor → calculadora → resultado na mesma sessão).
      if (alvo) {
        await page.goto(`${app.url}${alvo}`, { waitUntil: "networkidle", timeout: 40000 }).catch(() => {});
        await page.waitForTimeout(2500);
      }
      if (tela.preparar) await tela.preparar(page);

      const nome = typeof tela === "string" ? `${app.id}-${i}` : `${app.id}-${tela.nome}`;
      const caminho = resolve(DESTINO, `${nome}.png`);
      await page.screenshot({ path: caminho });
      log(`capturado ${nome}.png`);
    }
  } finally {
    await context.close();
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const apenas = argv.includes("--app") ? argv[argv.indexOf("--app") + 1] : null;

  mkdirSync(DESTINO, { recursive: true });

  const apps = APPS.filter((a) => !apenas || a.id === apenas);
  if (!apps.length) throw new Error(`app desconhecido: ${apenas}`);

  const browser = await chromium.launch();

  let falhas = 0;
  for (const app of apps) {
    log(`— ${app.id} —`);
    try {
      await capturarApp(browser, app);
    } catch (e) {
      falhas++;
      erro(`${app.id}: ${e.message}`);
    }
  }

  await browser.close();

  if (falhas) aviso(`${falhas} app(s) falharam — os cards usam as capturas anteriores, se houver`);
  else ok("capturas em assets/capturas/");
}

main().catch((e) => {
  erro(e.message || String(e));
  process.exit(1);
});

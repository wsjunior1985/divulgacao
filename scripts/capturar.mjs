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

const VIEWPORT = { width: 412, height: 915 };
const DPR = 2;
const DESTINO = resolve(RAIZ, "assets/capturas");

const EMAIL = env("CAPTURAS_EMAIL");
const SENHA = env("CAPTURAS_SENHA");

// Chaves de localStorage gravadas antes de carregar cada app: o tema escuro e,
// no AI-Eat, as flags que dispensam avisos/convitres (o botão X deles não tem
// aria-label, então não dá para fechar via `fecharDicas`). Some ao
// `colorScheme: "dark"` do contexto (que cobre quem usa prefers-color-scheme,
// como o Convertendo).
const LOCALSTORAGE_PRE = {
  gasonol: [["theme", "dark"]],
  remedin: [["remedin-theme", "dark"]],
  aieat: [
    ["aieat.theme", "dark"],
    ["aieat.apikey-warning-dismissed", "1"],
    ["aieat:passkey-invite-dismissed", "1"],
  ],
  convertendo: [],
  vaidarquanto: [["vdq-app-dark", "true"]],
};

// ---------------------------------------------------------------------------
// Cenários do AI-EAT — semeia comidas no diário para o card não sair vazio.
// ---------------------------------------------------------------------------

/**
 * O diário mostra "0 kcal" para hoje se vazio. Adiciona 4 comidas rápidas
 * para o total e os macros aparecerem (e o card parecer mais preenchido).
 */
async function semearAiEatRapido(page) {
  await page.goto("https://aieat.app.br/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  // Tenta adicionar comidas via botão de foto ou busca; se não funcionar, pula.
  // O app carrega receitas; vamos adicionar pelo botão de "+" se houver.
  const btnAdicionar = page.locator("button").filter({ hasText: "+" }).first();
  if (await btnAdicionar.count() && await btnAdicionar.isVisible().catch(() => false)) {
    for (let i = 0; i < 3; i++) {
      await btnAdicionar.click().catch(() => {});
      await page.waitForTimeout(600);
      // Tenta buscar "Arroz" e clicar no primeiro resultado
      const busca = page.locator('input').filter({ hasText: /buscar|pesq/i }).first();
      if (await busca.count()) {
        await busca.fill("arroz");
        await page.waitForTimeout(800);
        const primeiro = page.locator("button, [role=button]").filter({ hasText: /arroz/i }).first();
        if (await primeiro.count()) await primeiro.click().catch(() => {});
        await page.waitForTimeout(400);
      }
    }
  }

  // Tenta o botão genérico de +200ml (hidratação) para aparecer algo no card
  for (let i = 0; i < 2; i++) {
    const btn = page.getByRole("button", { name: "+200ml" });
    if (await btn.count()) await btn.click().catch(() => {});
    await page.waitForTimeout(300);
  }
}

// ---------------------------------------------------------------------------
// Cenários do GASONOL (com login, para capturar o estado premium). A tela de
// cálculo é progressiva: selecionar veículo → calculadora → resultado. Cada
// passo é uma captura diferente.
// ---------------------------------------------------------------------------

// Fiat 500: tem consumo de etanol E de gasolina no PBEV (8 e 11,4 km/l). O
// modelo escolhido antes, o primeiro da Volkswagen, marcava etanol 0 km/l — e o
// card saía anunciando "limite 0,0%", que não diz nada a ninguém.
//
// Marca e modelo por rótulo, para não depender da ordem da lista; o ano segue
// por índice porque a lista muda conforme o modelo. Cuidado ao trocar: rótulos
// genéricos como "UNO" ou "ARGO" existem no select mas não habilitam o botão de
// confirmar — só as variantes com motorização têm ficha no PBEV.
async function escolherVeiculo(page) {
  const sels = page.locator("select");
  await sels.nth(0).selectOption({ label: "FIAT" });
  await page.waitForTimeout(1200);
  await sels.nth(1).selectOption({ label: "500" });
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

/**
 * Assim que os dois preços entram, o app abre sozinho a folha de resultado.
 * Fechá-la deixa a calculadora com valores de verdade — que é o que vende o
 * app. Antes o card mostrava R$ 0,00 nos dois campos, porque a calculadora era
 * fotografada logo depois de escolher o veículo.
 */
async function fecharResultado(page) {
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(900);
}

/** Reabre a folha mexendo de novo no preço do etanol. */
async function reabrirResultado(page) {
  const etanol = page.locator('input[placeholder="0,00"]').nth(1);
  await etanol.fill("");
  await page.waitForTimeout(400);
  await etanol.fill("3,59");
  await page.waitForTimeout(1800);
  await apagarCortina(page);
}

/**
 * A folha de resultado vem sobre um véu que escurece 65% e desfoca a tela
 * inteira. No app isso dá profundidade; no card, com o celular reduzido a um
 * terço da largura, vira uma mancha borrada com um retângulo laranja no pé.
 * Some só com o véu — a folha e o resto da interface continuam como são.
 */
async function apagarCortina(page) {
  await page.addStyleTag({
    content: `.fixed.inset-0.z-50.backdrop-blur-sm {
      background: transparent !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }
    [class*="confetti"], [id*="confetti"], canvas { display: none !important; }
    `,
  }).catch(() => {});
  // Estende o tempo de espera para a animação terminar naturalmente se não for supprimida
  await page.waitForTimeout(1500);
}

// Overlays de dica/onboarding que estragam o card: janelas de "Como usar?",
// "Dica de uso", aviso de instalação etc. São fechados antes de cada foto.
const SELETORES_FECHAR_DICA = [
  'button[aria-label="Fechar dica"]',
  'button[aria-label="Fechar"]',
  'button[aria-label="Entendi"]',
  'button[aria-label="Pular"]',
  'button[aria-label="Skip"]',
];

/** Fecha, um por um, os overlays de dica visíveis (o locator é re-resolvido a
 * cada clique, porque fechar um pode re-renderizar a página). */
async function fecharDicas(page) {
  for (const seletor of SELETORES_FECHAR_DICA) {
    for (let guarda = 0; guarda < 8; guarda++) {
      const total = await page.locator(seletor).count();
      let alvo = null;
      for (let i = 0; i < total; i++) {
        const el = page.locator(seletor).nth(i);
        if (await el.isVisible().catch(() => false)) {
          alvo = el;
          break;
        }
      }
      if (!alvo) break;
      await alvo.click({ timeout: 1500 }).catch(() => {});
      await page.waitForTimeout(250);
    }
  }
  await page.waitForTimeout(300);
}

const APPS = [
  {
    id: "gasonol",
    url: "https://gasonol.com.br",
    login: true,
    loginUrl: "/login",
    telas: [
      { nome: "seletor", url: "/app" },
      {
        nome: "calculadora",
        preparar: async (page) => {
          await escolherVeiculo(page);
          await preencherPrecos(page, "5,49", "3,59");
          await fecharResultado(page);
        },
      },
      { nome: "resultado", preparar: reabrirResultado },
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
    telas: [{ nome: "home", url: "/", preparar: semearAiEatRapido }, "/diario", "/historico"],
  },
  {
    id: "convertendo",
    url: "https://convertendo.app.br",
    login: true,
    loginUrl: "/auth",
    telas: ["/converter", "/cotacoes", "/converter"],
  },
  {
    id: "vaidarquanto",
    url: "https://vaidarquanto.com.br",
    login: true,
    loginUrl: "/login",
    telas: ["/inicio", "/carrinho", "/listas"],
  },
  {
    id: "papelzinho",
    url: "https://papelzinho.waldeapps.systems",
    login: true,
    loginUrl: "/auth",
    telas: ["/dashboard", "/events/new", "/premium"],
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

  const pares = LOCALSTORAGE_PRE[app.id] ?? [];
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

      await fecharDicas(page);

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

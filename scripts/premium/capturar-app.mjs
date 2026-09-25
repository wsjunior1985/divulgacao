// Captura, em 3x, as telas internas reais de um app com login para os cards premium.
// Uso: node scripts/premium/capturar-app.mjs <app>     (saída em assets/premium/<app>/)
//
// Entra com CAPTURAS_EMAIL / CAPTURAS_SENHA (.env.local / Secrets), sempre pela aba
// "Entrar" — e aborta se o botão de envio for de criar conta. Antes de cada foto,
// remove avisos que poluem a tela e troca dados pessoais por fictícios: o nome da
// saudação, e-mails, fotos de perfil e os nomes listados em CAPTURAS_NOMES.
import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { carregarEnv, env, log, ok, RAIZ } from "../lib/base.js";

carregarEnv();

const FICTICIO = { nome: "Ana", completo: "Ana Ribeiro", email: "ana.ribeiro@email.com" };

const APPS = {
  omeualbum: {
    url: "https://omeualbum.waldeapps.systems",
    login: "/auth",
    // As telas do card vêm das capturas oficiais da landing (/landing/showcase-*-540.webp,
    // conta de demonstração): a conta de captura tem o álbum vazio. Estas rotas servem
    // para recapturar quando houver uma conta com o álbum preenchido.
    telas: { "tela-grupos": "/album", "tela-estatisticas": "/estatisticas" },
  },
  vaidarquanto: {
    url: "https://vaidarquanto.com.br",
    login: "/login",
    armazenamento: { "vdq-app-dark": "true" },
    telas: { "tela-inicio": "/inicio", "tela-carrinho": "/carrinho", "tela-listas": "/listas" },
  },
  papelzinho: {
    url: "https://papelzinho.waldeapps.systems",
    login: "/auth",
    telas: { "tela-dashboard": "/dashboard", "tela-novo": "/events/new" },
  },
  opalpiteiro: {
    url: "https://opalpiteiro.app.br",
    login: "/auth",
    remover: ["Instale como aplicativo no seu dispositivo"],
    telas: { "tela-app": "/app", "tela-boloes": "/pools", "tela-ranking": "/ranking", "tela-criar": "/pools/new" },
  },
  aieat: {
    url: "https://aieat.app.br",
    login: "/auth",
    armazenamento: { "aieat.theme": "dark", "aieat.apikey-warning-dismissed": "1", "aieat:passkey-invite-dismissed": "1" },
    remover: ["Leve o AI-Eat para a tela inicial"],
    telas: {
      "tela-home": "/",
      "tela-agua": { rota: "/", clicar: "Água" },
      "tela-scanner": "/scanner",
      "tela-diario": "/diario",
      "tela-historico": "/historico",
      "tela-premium": "/premium",
    },
  },
  convertendo: {
    url: "https://convertendo.app.br",
    login: "/auth",
    telas: {
      "tela-converter": "/converter",
      "tela-cotacoes": "/cotacoes",
      "tela-compras": "/compras",
    },
  },
};

const id = process.argv[2];
const app = APPS[id];
if (!app) throw new Error(`app sem roteiro de captura: ${id} (disponíveis: ${Object.keys(APPS).join(", ")})`);
const saida = resolve(RAIZ, `assets/premium/${id}`);
mkdirSync(saida, { recursive: true });
const avatar = "data:image/svg+xml;base64," + readFileSync(resolve(RAIZ, "assets/premium/gasonol/avatar.svg")).toString("base64");
const nomesReais = env("CAPTURAS_NOMES", "").split(",").map((n) => n.trim()).filter(Boolean);

async function entrar(p) {
  await p.goto(app.url + app.login, { waitUntil: "networkidle" });
  await p.waitForTimeout(1500); // hidratação: clicar antes disso não troca a aba
  const aba = p.getByRole("tab", { name: "Entrar", exact: true }).or(p.getByRole("button", { name: "Entrar", exact: true })).first();
  for (let i = 0; i < 3 && (await aba.count()); i++) {
    await aba.click();
    await p.waitForTimeout(800);
    if (!/criar|cadastr/i.test(await p.locator('button[type="submit"]').first().innerText())) break;
  }
  await p.fill('input[type="email"]', env("CAPTURAS_EMAIL"));
  await p.fill('input[type="password"]', env("CAPTURAS_SENHA"));
  const enviar = p.locator('button[type="submit"]').first();
  if (/criar|cadastr/i.test(await enviar.innerText())) throw new Error("o botão de envio é de criar conta — login abortado");
  await enviar.click();
  await p.waitForLoadState("networkidle").catch(() => {});
  await p.waitForTimeout(3000);
  if (/\/auth|\/login/.test(p.url())) {
    const aviso = await p.$$eval("[role=status],[role=alert],li[data-sonner-toast]", (n) => n.map((e) => e.innerText.trim()).join(" | "));
    throw new Error(`login não saiu da tela de autenticação${aviso ? ` — o app disse: ${aviso}` : ""}`);
  }
}

// Nomes aprendidos pela saudação ("Olá, Fulano") valem para as telas seguintes.
const aprendidos = new Set(nomesReais);

async function limpar(p) {
  const novos = await p.evaluate(({ remover, FICTICIO, avatar, nomesReais }) => {
    // Avisos: sobe do texto até o cartão que o contém e remove o cartão inteiro.
    for (const texto of remover) {
      const alvo = [...document.querySelectorAll("body *")].find((el) => el.children.length === 0 && el.textContent.includes(texto));
      let cartao = alvo;
      while (cartao && cartao.parentElement && !/rounded/.test(cartao.className) ) cartao = cartao.parentElement;
      cartao?.remove();
    }
    // Textos: saudação, e-mails e nomes reais (o nome da saudação e os já conhecidos,
    // com os sobrenomes que vierem depois).
    const saudacao = /(Olá|Oi|Bom dia|Boa tarde|Boa noite),\s*([^\s!,👋]+)/;
    const achados = [...document.body.innerText.matchAll(new RegExp(saudacao, "g"))].map((m) => m[2]).filter((n) => n !== FICTICIO.nome);
    const nomes = [...new Set([...nomesReais, ...achados])];
    const caminhar = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const escapar = (n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const trocas = [
      [new RegExp(saudacao, "g"), `$1, ${FICTICIO.nome}`],
      [/[\w.+-]+@[\w-]+\.[\w.]+/g, FICTICIO.email],
      ...nomes.map((n) => [new RegExp(`${escapar(n)}(\\s+(d[aeo]s?\\s+)?[A-ZÀ-Ý][\\wÀ-ÿ]+)*`, "gi"), (m) => (m.trim().includes(" ") ? FICTICIO.completo : FICTICIO.nome)]),
    ];
    for (let no = caminhar.nextNode(); no; no = caminhar.nextNode()) {
      let t = no.nodeValue;
      for (const [re, por] of trocas) t = t.replace(re, por);
      if (t !== no.nodeValue) no.nodeValue = t;
    }
    // Fotos de perfil (Google e afins) viram o avatar genérico.
    for (const img of document.querySelectorAll("img")) {
      if (/googleusercontent|gravatar|avatar/i.test(img.src)) img.src = avatar;
    }
    window.scrollTo(0, 0);
    return achados;
  }, { remover: app.remover ?? [], FICTICIO, avatar, nomesReais: [...aprendidos] });
  novos.forEach((n) => aprendidos.add(n));
  await p.waitForTimeout(600);
}

const navegador = await chromium.launch();
const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: "dark" });
await ctx.addInitScript((pares) => { for (const [k, v] of Object.entries(pares)) localStorage.setItem(k, v); }, app.armazenamento ?? {});
const p = await ctx.newPage();
try {
  await entrar(p);
  for (const [nome, alvo] of Object.entries(app.telas)) {
    const { rota, clicar } = typeof alvo === "string" ? { rota: alvo } : alvo;
    await p.goto(app.url + rota, { waitUntil: "networkidle" }).catch(() => {});
    await p.waitForTimeout(2500);
    await limpar(p);
    if (clicar) { await p.getByRole("button", { name: clicar, exact: true }).or(p.getByRole("tab", { name: clicar, exact: true })).first().click().catch(() => {}); await p.waitForTimeout(1200); }
    await p.screenshot({ path: `${saida}/${nome}.png` });
    log(`${id}/${nome}.png`);
  }
  ok(`telas em assets/premium/${id}/`);
} finally {
  await navegador.close();
}

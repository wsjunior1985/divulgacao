// Renderiza em 3x uma tela de app a partir de markup extraído da sessão logada
// (scripts/premium/telas/*.html, já anonimizado), com o CSS real do app.
// Usado quando a conta de captura não entra no app: o dono abre o app no
// navegador embutido, o markup é copiado com dados pessoais trocados por
// fictícios e este script fotografa o resultado.
//
// Uso: node scripts/premium/renderizar-markup.mjs remedin-hoje
import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { RAIZ } from "../lib/base.js";

const PILULA = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide size-5"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"></path><path d="m8.5 8.5 7 7"></path></svg>`;

function agendaRemedin(itens) {
  return itens
    .map(([nome, dose, estado]) => {
      const tomada = estado === "Tomada";
      const cor = tomada ? "bg-success/15 text-success" : "bg-warning/20 text-warning-foreground";
      return `<div class="rounded-xl border bg-card text-card-foreground shadow p-4 flex items-center gap-3 sm:gap-4"><div class="size-11 shrink-0 rounded-xl grid place-items-center ${cor}">${PILULA}</div><div class="flex-1 min-w-0"><p class="font-medium truncate">${nome}</p><p class="text-xs text-muted-foreground">${dose}</p></div><div class="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold border-0 ${cor}">${estado}</div>${tomada ? "" : '<button class="inline-flex min-h-10 items-center justify-center font-medium border border-input bg-background shadow-sm h-10 rounded-md px-3 text-xs shrink-0">Tomei</button>'}</div>`;
    })
    .join("");
}

function dockRemedin(ativo) {
  const itens = [
    ["Hoje", '<rect width="7" height="9" x="3" y="3" rx="1"></rect><rect width="7" height="5" x="14" y="3" rx="1"></rect><rect width="7" height="9" x="14" y="12" rx="1"></rect><rect width="7" height="5" x="3" y="16" rx="1"></rect>'],
    ["Medicamentos", '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"></path><path d="m8.5 8.5 7 7"></path>'],
    ["Cuidador", '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><path d="M16 3.128a4 4 0 0 1 0 7.744"></path><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><circle cx="9" cy="7" r="4"></circle>'],
    ["Relatórios", '<path d="M3 3v16a2 2 0 0 0 2 2h16"></path><path d="M18 17V9"></path><path d="M13 17V5"></path><path d="M8 17v-3"></path>'],
    ["Assistente", '<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"></path><path d="M20 2v4"></path><path d="M22 4h-4"></path><circle cx="4" cy="20" r="2"></circle>'],
  ];
  return itens
    .map(([rotulo, tracos]) => {
      const cls = rotulo === ativo ? "font-semibold text-primary after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:rounded-full after:bg-primary" : "text-muted-foreground";
      return `<a class="relative flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 overflow-hidden px-0.5 py-2.5 text-[11px] ${cls}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide size-5">${tracos}</svg><span class="max-w-full text-center leading-tight">${rotulo}</span></a>`;
    })
    .join("");
}

// Avatares fictícios com iniciais, cada um num degradê: dão vida à tela sem usar foto de ninguém.
const AVATARES = [["RC", "#8b5cf6", "#ec4899"], ["BL", "#f97316", "#facc15"], ["CS", "#06b6d4", "#3b82f6"], ["DA", "#22c55e", "#14b8a6"], ["ER", "#f43f5e", "#a855f7"]];
function avatarIniciais(iniciais, cor1, cor2) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${cor1}"/><stop offset="1" stop-color="${cor2}"/></linearGradient></defs><rect width="96" height="96" fill="url(#g)"/><text x="48" y="60" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="36" font-weight="800" fill="#fff">${iniciais}</text></svg>`;
  return "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
}

const CAPA_FUTEBOL = "https://img.olympics.com/images/image/private/t_s_16_9_g_auto/t_s_w1460/f_auto/primary/vpj8lsp1weo4zs0a8fhk";
const capaLocal = (arquivo) => "data:image/jpeg;base64," + readFileSync(resolve(RAIZ, arquivo)).toString("base64");

function bolaoCard(nome, data, participantes, categoria = "⚽ Futebol", capa = CAPA_FUTEBOL) {
  const etiqueta = (t) => `<span class="flex items-center gap-1 rounded-md bg-gradient-to-br from-black/60 to-black/40 px-2 py-1 text-xs font-bold uppercase text-white/90 backdrop-blur-sm ring-1 ring-white/10 shadow-sm">${t}</span>`;
  return `<div><a><div class="group relative overflow-hidden rounded-2xl shadow-md min-h-[220px] bg-black"><img alt="" class="absolute inset-0 size-full object-cover" src="${capa}"><div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div><div class="relative flex flex-col justify-between p-4 h-full min-h-[220px]"><div class="flex items-start justify-between">${etiqueta(categoria)}${etiqueta("🔓")}</div><div class="flex items-center justify-center px-4"><span class="line-clamp-2 text-center font-display text-sm text-white">${nome}</span></div><div class="flex items-end"><div class="flex flex-1"></div><div class="flex flex-1 justify-center">${etiqueta(`📅 ${data}`)}</div><div class="flex flex-1 justify-end">${etiqueta(`👥 ${participantes}`)}</div></div></div></div></a></div>`;
}

function dockPalpiteiro() {
  const item = (rotulo, tracos, ativo) => `<a class="flex min-h-12 flex-1 flex-col items-center justify-center gap-1 rounded-xl pb-1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide size-5 ${ativo ? "text-primary" : "text-muted-foreground/60"}">${tracos}</svg><span class="text-xs font-semibold ${ativo ? "text-primary" : "text-muted-foreground/60"}">${rotulo}</span></a>`;
  return `<div class="mx-auto flex max-w-sm items-end">${item("Início", '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>', true)}${item("Bolões", '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"></path><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"></path><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"></path>')}<a class="-mt-6 flex min-h-11 flex-1 justify-center"><div class="grid size-14 place-items-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-xl shadow-primary/35"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="lucide size-6"><path d="M5 12h14M12 5v14"></path></svg></div></a>${item("Rank", '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>')}${item("Config", '<circle cx="12" cy="12" r="3"></circle><path d="M12 2v3M12 19v3M2 12h3M19 12h3"></path>')}</div>`;
}

const TELAS = {
  "remedin-hoje": {
    app: "remedin",
    origem: "https://remedin.app.br/auth",
    armazenamento: { "remedin-theme": "dark" },
    saida: "tela-hoje",
    montar: (html) =>
      html
        .replace("<div class=\"space-y-2\" data-agenda></div>", `<div class="space-y-2">${agendaRemedin([
          ["Vitamina D", "2.000 UI · 08:00", "Tomada"],
          ["Losartana", "50 mg · 08:00", "Tomada"],
          ["Ômega 3", "1.000 mg · 08:00", "Tomada"],
          ["Vitamina C", "500 mg · 08:00", "Tomada"],
          ["Dipirona", "500 mg · 12:00", "Tomada"],
          ["Dipirona", "500 mg · 22:00", "Tomada"],
          ["Paracetamol", "750 mg · 23:00", "Atrasada"],
        ])}</div>`)
        .replace("data-dock></nav>", `>${dockRemedin("Hoje")}</nav>`),
  },
  "opalpiteiro-app": {
    app: "opalpiteiro",
    origem: "https://opalpiteiro.app.br/auth",
    saida: "tela-app",
    montar: (html) =>
      html
        .replace('<div class="space-y-3" data-boloes></div>', `<div class="space-y-3">${[
          ["CAMPEONATO BRASILEIRO - RODADA 29", "7 de out.", 24],
          ["CHÁ DE REVELAÇÃO DA JÚLIA", "12 de out.", 42, "🍼 Chá de bebê", capaLocal("assets/premium/opalpiteiro/capa-cha.jpg")],
        ].map((b) => bolaoCard(...b)).join("")}</div>`)
        .replace("data-dock></nav>", `>${dockPalpiteiro()}</nav>`)
        .replace(/"AV(\d)"/g, (_, i) => `"${avatarIniciais(...AVATARES[i - 1])}"`),
  },
  "aeroliso-rota": {
    app: "aeroliso",
    origem: "https://aeroliso.waldeapps.systems/auth",
    saida: "tela-rota",
    montar: (html) => html.replace(/"AV(\d)"/g, (_, i) => `"${avatarIniciais(...AVATARES[i - 1])}"`),
  },
  "aeroliso-alertas": { app: "aeroliso", origem: "https://aeroliso.waldeapps.systems/auth", saida: "tela-alertas", montar: (html) => html.replace(/"AV(\d)"/g, (_, i) => `"${avatarIniciais(...AVATARES[i - 1])}"`), },
  "aeroliso-insights": { app: "aeroliso", origem: "https://aeroliso.waldeapps.systems/auth", saida: "tela-insights", montar: (html) => html.replace(/"AV(\d)"/g, (_, i) => `"${avatarIniciais(...AVATARES[i - 1])}"`), },
  "rifazinha-vendas": { app: "rifazinha", origem: "https://rifazinha.waldeapps.systems/", saida: "tela-vendas", tema: "claro", montar: (html) => html.replace(/"AV(\d)"/g, (_, i) => `"${avatarIniciais(...AVATARES[i - 1])}"`), },
  "papelzinho-eventos": {
    app: "papelzinho",
    origem: "https://papelzinho.waldeapps.systems/auth",
    saida: "tela-eventos",
    tema: "claro",
    montar: (html) => html,
  },
};

const id = process.argv[2];
const tela = TELAS[id];
if (!tela) throw new Error(`tela desconhecida: ${id} (disponíveis: ${Object.keys(TELAS).join(", ")})`);

const avatar = "data:image/svg+xml;base64," + readFileSync(resolve(RAIZ, "assets/premium/gasonol/avatar.svg")).toString("base64");
const bruto = readFileSync(resolve(RAIZ, `scripts/premium/telas/${id}.html`), "utf8").replace(/<!--[\s\S]*?-->\n?/, "");
const html = tela.montar(bruto).replaceAll("AVATAR_GENERICO", avatar);
const saida = resolve(RAIZ, `assets/premium/${tela.app}`);
mkdirSync(saida, { recursive: true });

const navegador = await chromium.launch();
const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: tela.tema === "claro" ? "light" : "dark" });
await ctx.addInitScript((pares) => { for (const [k, v] of Object.entries(pares)) localStorage.setItem(k, v); }, tela.armazenamento ?? {});
const p = await ctx.newPage();
try {
  await p.goto(tela.origem, { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);
  // O app já carregou o CSS; troca o corpo pelo markup anonimizado e congela a página.
  await p.evaluate(({ markup, claro }) => {
    document.querySelectorAll("script").forEach((s) => s.remove());
    document.body.innerHTML = markup;
    if (claro) document.documentElement.classList.remove("dark"); else document.documentElement.classList.add("dark");
  }, { markup: html, claro: tela.tema === "claro" });
  await p.waitForLoadState("networkidle").catch(() => {});
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${saida}/${tela.saida}.png` });
  console.log(`assets/premium/${tela.app}/${tela.saida}.png`);
} finally {
  await navegador.close();
}

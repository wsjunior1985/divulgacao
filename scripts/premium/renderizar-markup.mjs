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
const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: "dark" });
await ctx.addInitScript((pares) => { for (const [k, v] of Object.entries(pares)) localStorage.setItem(k, v); }, tela.armazenamento ?? {});
const p = await ctx.newPage();
try {
  await p.goto(tela.origem, { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);
  // O app já carregou o CSS; troca o corpo pelo markup anonimizado e congela a página.
  await p.evaluate((markup) => {
    document.querySelectorAll("script").forEach((s) => s.remove());
    document.body.innerHTML = markup;
    document.documentElement.classList.add("dark");
  }, html);
  await p.waitForLoadState("networkidle").catch(() => {});
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${saida}/${tela.saida}.png` });
  console.log(`assets/premium/${tela.app}/${tela.saida}.png`);
} finally {
  await navegador.close();
}

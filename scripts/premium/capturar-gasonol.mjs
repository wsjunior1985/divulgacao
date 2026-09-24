// Captura telas reais do app GASONOL (/app) em 3x para o mockup do celular dos cards premium.
// Reproduz o estado logado com markup extraído da sessão real (avatar, card de indicação, perfil),
// trocando dados pessoais por fictícios e a foto por um avatar genérico.
// Uso: node scripts/premium/capturar-gasonol.mjs [pasta-de-saida]
import { chromium } from "playwright";
import { readFileSync } from "fs";

const saida = process.argv[2] ?? "assets/premium/gasonol";
const CARRO = "FIAT STRADA (RANCH T200AT T) (2026)";
const avatar = "data:image/svg+xml;base64," + readFileSync("assets/premium/gasonol/avatar.svg").toString("base64");
const PERFIL = readFileSync("scripts/premium/perfil-indique.html", "utf8").replace(/<!--.*?-->\n?/, "").replaceAll("AVATAR_GENERICO", avatar);

const AVATAR = `<button type="button" class="shrink-0 rounded-full" aria-label="Abrir menu da conta"><span class="relative flex shrink-0 overflow-hidden rounded-full h-8 w-8 sm:h-9 sm:w-9 border border-primary/30 shadow-sm"><img class="aspect-square h-full w-full object-cover" alt="" src="${avatar}"></span></button>`;
const INDIQUE = `<div class="w-full"><div class="glass-card rounded-2xl p-4"><div class="flex items-center gap-3"><div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-gift h-5 w-5"><path d="M12 7v14"></path><path d="M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"></path><path d="M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5"></path><rect x="3" y="7" width="18" height="4" rx="1"></rect></svg></div><div class="min-w-0 flex-1"><p class="text-sm font-semibold">Os dois ganham 30 dias de Premium</p><p class="text-xs text-muted-foreground">Indique um amigo: ele ganha 30 dias grátis ao assinar e você ganha mais 30 dias.</p></div><a class="shrink-0 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm">Indicar</a></div></div></div>`;

const navegador = await chromium.launch();

async function abrir() {
  const p = await navegador.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: "dark" });
  await p.goto("https://gasonol.com.br/app", { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  return p;
}

// Aplica o estado logado: avatar genérico no cabeçalho, card de indicação no lugar do upsell de visitante.
async function logar(p, { comIndique = true } = {}) {
  await p.evaluate(({ AVATAR, INDIQUE, comIndique }) => {
    const entrar = [...document.querySelectorAll("header a")].find((a) => a.textContent.trim() === "Entrar");
    if (entrar) entrar.outerHTML = AVATAR;
    const coluna = document.querySelector("main section")?.parentElement;
    if (coluna) {
      [...coluna.children].filter((el) => el.tagName !== "SECTION").forEach((el) => el.remove());
      if (comIndique) coluna.insertAdjacentHTML("beforeend", INDIQUE);
    }
    window.scrollTo(0, 0);
  }, { AVATAR, INDIQUE, comIndique });
  await p.waitForTimeout(700);
}

async function escolherCarro(p) {
  await p.fill('input[placeholder^="Buscar"]', "Strada");
  await p.waitForTimeout(1200);
  await p.getByText(CARRO).first().click();
  await p.waitForTimeout(1200);
}

async function precos(p, gasolina, etanol) {
  const campos = await p.$$('input[placeholder="0,00"]');
  await campos[0].click(); await p.keyboard.type(gasolina);
  await campos[1].click(); await p.keyboard.type(etanol);
  return campos;
}

async function resultado(nome, gasolina, etanol) {
  const p = await abrir();
  await escolherCarro(p);
  const campos = await precos(p, gasolina, etanol);
  await logar(p);
  await campos[1].click(); await p.keyboard.press("Enter");
  await p.waitForTimeout(6500); // confete termina
  await p.screenshot({ path: `${saida}/${nome}.png` });
  await p.close();
}

// Calculadora preenchida.
{
  const p = await abrir();
  await escolherCarro(p);
  await precos(p, "679", "349");
  await p.evaluate(() => document.activeElement?.blur());
  await logar(p);
  await p.screenshot({ path: `${saida}/tela-calculadora.png` });
  await p.close();
}

// Calculadora vazia: botões de microfone em cada preço (entrada por voz).
{
  const p = await abrir();
  await escolherCarro(p);
  await logar(p, { comIndique: false });
  await p.screenshot({ path: `${saida}/tela-voz.png` });
  await p.close();
}

// Seletor de veículo: busca com consumo oficial de cada versão.
{
  const p = await abrir();
  await logar(p, { comIndique: false });
  await p.fill('input[placeholder^="Buscar"]', "Strada");
  await p.waitForTimeout(1500);
  await p.evaluate(() => window.scrollTo(0, 190));
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${saida}/tela-seletor.png` });
  await p.close();
}

await resultado("tela-etanol", "679", "349");    // 51,4%: vai de etanol
await resultado("tela-gasolina", "629", "479");  // 76,2%: acima do limite, vai de gasolina
await resultado("tela-economia", "699", "369");  // quanto rende cada R$ 100

// Perfil: "Indique e ganhe" com dados fictícios.
{
  const p = await abrir();
  await logar(p, { comIndique: false });
  await p.evaluate((PERFIL) => { document.querySelector("main").outerHTML = PERFIL; window.scrollTo(0, 0); }, PERFIL);
  await p.waitForTimeout(700);
  await p.screenshot({ path: `${saida}/tela-indique.png` });
  await p.close();
}

// Aberto no navegador: barra de endereço do Safari com o domínio, para o tema "sem baixar nada".
{
  const p = await abrir();
  await escolherCarro(p);
  await logar(p);
  await p.evaluate(() => {
    const barra = document.createElement("div");
    barra.innerHTML = `<div style="position:fixed;left:0;right:0;bottom:0;z-index:9999;padding:10px 14px 30px;background:rgba(28,28,30,.94);backdrop-filter:blur(20px);border-top:1px solid rgba(255,255,255,.08);font-family:-apple-system,Inter,sans-serif">
      <div style="display:flex;align-items:center;justify-content:center;gap:7px;height:44px;border-radius:13px;background:rgba(118,118,128,.28);color:#fff;font-size:17px;font-weight:500">
        <svg width="12" height="15" viewBox="0 0 12 15" fill="none" stroke="#fff" stroke-width="1.6"><rect x="1" y="6.5" width="10" height="7.5" rx="1.6" fill="#fff" stroke="none"/><path d="M3.2 6.5V4.4a2.8 2.8 0 015.6 0v2.1"/></svg>gasonol.com.br</div>
      <div style="display:flex;justify-content:space-between;padding:12px 16px 0;opacity:.9">${["M15 5l-7 7 7 7","M9 5l7 7-7 7","M12 4v11M7.5 8.5L12 4l4.5 4.5M5 14v5h14v-5","M4 6h16M4 12h16M4 18h16","M5 5h6v6H5zM13 5h6v6h-6zM5 13h6v6H5zM13 13h6v6h-6z"].map((d) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`).join("")}</div></div>`;
    document.body.appendChild(barra);
  });
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${saida}/tela-navegador.png` });
  await p.close();
}

await navegador.close();
console.log(`telas salvas em ${saida}`);

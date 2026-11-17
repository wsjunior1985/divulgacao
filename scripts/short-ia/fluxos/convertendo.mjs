// Fluxo gravado do Convertendo: digitar um valor em dólar na home pública e ver o custo em reais. Só leitura; sem login.
export const url = "https://convertendo.app.br/";
export const contexto = {};
export default async function fluxo({ p, esp, marca }) {
  marca("inicio"); await esp(4000); // a cotação carrega depois da página
  const campo = p.locator("#converter-amount");
  await campo.scrollIntoViewIfNeeded(); await esp(800);
  await campo.click(); await esp(300);
  await p.keyboard.press("Meta+A"); await p.keyboard.press("Backspace"); await esp(300);
  for (const ch of "1250") { await p.keyboard.type(ch); await esp(180); }
  marca("valor"); await esp(3500);
}

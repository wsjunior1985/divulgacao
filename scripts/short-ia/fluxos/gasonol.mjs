// Fluxo gravado do GASONOL: escolher o carro, digitar os preços e ver o resultado. Só leitura (escritas bloqueadas).
export const url = "https://gasonol.com.br/app";
export const contexto = { sessionStorage: { "install-card-dismissed": "1" } };
export default async function fluxo({ p, esp, marca }) {
  marca("inicio"); await esp(500);
  await p.click('input[placeholder^="Buscar"]'); await esp(250);
  for (const ch of "strada") { await p.keyboard.type(ch); await esp(110); }
  await esp(500);
  await p.getByText(/FIAT STRADA/i).first().click(); marca("carro"); await esp(900);
  const ins = p.locator('input[placeholder="0,00"]');
  await ins.nth(0).click(); await esp(200);
  for (const k of "679") { await p.keyboard.type(k); await esp(150); }
  await esp(250);
  await ins.nth(1).click(); await esp(200);
  for (const k of "349") { await p.keyboard.type(k); await esp(150); }
  marca("precos"); await esp(3400);
}

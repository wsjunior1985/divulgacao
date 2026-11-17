// Fluxo gravado do Vai dar quanto?: digitar frases de itens com preço e ver o total do carrinho. Só leitura; dados fictícios.
export const url = "https://vaidarquanto.com.br/carrinho";
export const contexto = { localStorage: { "vdq-app-dark": "true", "pwa-install-intro-seen": "1" } };
export default async function fluxo({ p, esp, marca }) {
  marca("inicio"); await esp(700);
  await p.getByRole("button", { name: /fechar|dispensar/i }).first().click().catch(() => {});
  await esp(300);
  await p.getByLabel("Digitar frase").click(); marca("teclado"); await esp(500);
  const campo = p.locator('input[placeholder^="ex."]').last();
  for (const frase of ["arroz 12 reais", "feijão 8,50 reais"]) {
    await campo.click();
    for (const ch of frase) { await p.keyboard.type(ch); await esp(55); }
    await esp(250); await p.keyboard.press("Enter"); marca(`item-${frase.split(" ")[0]}`); await esp(700);
  }
  await p.getByLabel(/Digitar frase|Fechar/).first().click().catch(() => {});
  await esp(1800); marca("total");
}

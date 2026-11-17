// Fluxo gravado do Faz o PIX!: chave, nome e cidade → QR Pix. Dados 100% fictícios; escritas bloqueadas.
export const url = "https://fazopix.waldeapps.systems/app";
export const contexto = {};
export default async function fluxo({ p, esp, marca }) {
  marca("inicio"); await esp(800);
  await p.getByRole("radio", { name: "E-mail" }).click(); await esp(400);
  await p.locator("#pix-key-input").click(); await esp(200);
  await p.keyboard.insertText("exemplo@exemplo.com"); await esp(600);
  marca("chave");
  await p.locator("#merchant-name-input").click(); await esp(200);
  for (const ch of "Maria Exemplo") { await p.keyboard.type(ch); await esp(60); }
  await esp(300);
  await p.locator("#merchant-city-input").click(); await esp(200);
  for (const ch of "SAO PAULO") { await p.keyboard.type(ch); await esp(70); }
  await esp(500);
  await p.getByRole("button", { name: "Concluir" }).click(); marca("concluir");
  await esp(3600);
}

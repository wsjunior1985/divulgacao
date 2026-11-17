// Fluxo gravado do Barbarizando: página pública de agendamento (serviço → profissional → data → horário). Só leitura; nada é confirmado.
export const url = "https://barbarizando.com.br/agendar/patrono-barber-club";
export const contexto = {};
export const permitirPost = ["/functions/v1/public-catalog", "/functions/v1/public-availability"]; // POST só de leitura (catálogo e horários livres da barbearia)
export default async function fluxo({ p, esp, marca }) {
  const tocar = async (re) => { await p.evaluate((s) => { const r = new RegExp(s, "i"); const e = [...document.querySelectorAll("button,a,[role=button]")].find((x) => r.test(x.innerText.trim())); e && e.click(); }, re); };
  const rolar = async (y) => { await p.evaluate((v) => window.scrollTo({ top: v, behavior: "smooth" }), y); await esp(700); };
  marca("inicio"); await esp(2500);
  await rolar(620);
  await tocar("^Corte Simples"); await esp(600);
  await tocar("^Pezinho"); await esp(600); marca("servicos");
  await rolar(900);
  await tocar("ESCOLHER PROFISS"); await esp(1100); await rolar(0);
  await tocar("^Qualquer profissional"); await esp(700); await rolar(560); marca("profissional");
  await tocar("VER DATAS"); await esp(2300); await rolar(0); await rolar(330);
  await tocar("^TER\\."); await esp(1400); await rolar(330);
  await tocar("^09:00"); await esp(800); marca("horario"); await rolar(700); await esp(1800);
}

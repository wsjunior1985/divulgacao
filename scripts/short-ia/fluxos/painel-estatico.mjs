// Marcador: o barbarizando-2 usa telas estáticas do painel (assets/premium/barbarizando/tela-*.png), pois o painel do dono exige login.
// A captura.mp4 dele é montada a partir dessas imagens; não há fluxo gravável. Não rode `capturar` para este Short.
export const url = "about:blank";
export default async function fluxo() {
  throw new Error("barbarizando-2 não tem fluxo gravável: a captura.mp4 vem das telas estáticas do painel (veja este arquivo)");
}

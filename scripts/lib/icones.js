// icones.js — o traço dos ícones dos cards.
//
// Por que desenhar à mão em vez de usar uma biblioteca: o resvg não carrega
// SVG externo nem fontes de ícone, e empacotar um pacote inteiro para usar 20
// glifos custaria mais do que estes 20 caminhos. Todos vivem na mesma grade de
// 24x24 e no mesmo peso de traço, então a fileira de recursos sai regular.
//
// O token "@" vira a cor no momento de desenhar — é o que permite pintar o
// mesmo ícone de branco no círculo colorido e da cor da marca no rodapé.

const T = 1.9; // peso do traço, constante em toda a grade

const TRACOS = {
  camera:
    '<path d="M3.5 9a1.9 1.9 0 011.9-1.9h1.8l1.3-2h7l1.3 2h1.8A1.9 1.9 0 0120.5 9v8.2a1.9 1.9 0 01-1.9 1.9H5.4a1.9 1.9 0 01-1.9-1.9z"/><circle cx="12" cy="13.1" r="3.3"/>',
  gota: '<path d="M12 3.2s5.6 5.9 5.6 9.6a5.6 5.6 0 11-11.2 0C6.4 9.1 12 3.2 12 3.2z"/>',
  alvo: '<circle cx="12" cy="12" r="8.2"/><circle cx="12" cy="12" r="4.2"/><circle cx="12" cy="12" r="1.1" fill="@" stroke="none"/>',
  grafico: '<path d="M4 19.6V4.6"/><path d="M4 19.6h15.8"/><path d="M8.6 19.6v-5.4"/><path d="M13 19.6v-9"/><path d="M17.4 19.6v-6.6"/>',
  sino: '<path d="M6.4 10.2a5.6 5.6 0 1111.2 0c0 4 1.4 5.6 1.4 5.6H5s1.4-1.6 1.4-5.6z"/><path d="M10.1 19a2.2 2.2 0 003.8 0"/>',
  pilula:
    '<rect x="2.9" y="8.6" width="18.2" height="6.8" rx="3.4" transform="rotate(-45 12 12)"/><path d="M9.4 9.4l5.2 5.2"/>',
  relogio: '<circle cx="12" cy="12" r="8.4"/><path d="M12 7.3V12l3.2 2"/>',
  microfone:
    '<rect x="9.1" y="3" width="5.8" height="10.4" rx="2.9"/><path d="M5.9 11.4a6.1 6.1 0 0012.2 0"/><path d="M12 17.5V21"/>',
  carrinho:
    '<path d="M3 4.2h2.4l2.3 10.2h9.1l2-6.6H6.6"/><circle cx="9.2" cy="18.6" r="1.5"/><circle cx="16.4" cy="18.6" r="1.5"/>',
  lista: '<path d="M9 6.4h11"/><path d="M9 12h11"/><path d="M9 17.6h11"/><path d="M4 5.6l1.2 1.4L7.4 4.6"/><path d="M4 11.2l1.2 1.4 2.2-2.4"/><path d="M4 16.8l1.2 1.4 2.2-2.4"/>',
  globo: '<circle cx="12" cy="12" r="8.4"/><path d="M3.6 12h16.8"/><path d="M12 3.6c2.2 2.3 3.4 5.3 3.4 8.4s-1.2 6.1-3.4 8.4c-2.2-2.3-3.4-5.3-3.4-8.4s1.2-6.1 3.4-8.4z"/>',
  dinheiro: '<circle cx="12" cy="12" r="8.4"/><path d="M14.6 9.3c-.5-.9-1.5-1.4-2.6-1.4-1.6 0-2.7.9-2.7 2.1 0 3 5.4 1.5 5.4 4.4 0 1.3-1.2 2.2-2.7 2.2-1.2 0-2.2-.5-2.7-1.5"/><path d="M12 6.2v11.6"/>',
  cartao: '<rect x="2.8" y="5.4" width="18.4" height="13.2" rx="2.4"/><path d="M2.8 10h18.4"/><path d="M6.4 14.6h3.4"/>',
  regua:
    '<rect x="1.8" y="8.4" width="20.4" height="7.2" rx="1.6"/><path d="M6.4 8.4v3"/><path d="M9.8 8.4v4.4"/><path d="M13.2 8.4v3"/><path d="M16.6 8.4v4.4"/>',
  carro:
    '<path d="M3.4 16.2v-3.1l2-4.7a2 2 0 011.9-1.2h9.4a2 2 0 011.9 1.2l2 4.7v3.1"/><path d="M3.4 13.1h17.2"/><circle cx="7.4" cy="16.4" r="1.7"/><circle cx="16.6" cy="16.4" r="1.7"/>',
  celular:
    '<rect x="6.4" y="2.6" width="11.2" height="18.8" rx="2.6"/><path d="M10.6 5.4h2.8"/><path d="M10.4 18.4h3.2"/>',
  pessoas:
    '<circle cx="9" cy="8.6" r="3.2"/><path d="M3.4 19.4c0-3.1 2.5-5.2 5.6-5.2s5.6 2.1 5.6 5.2"/><path d="M16.2 6.1a3.2 3.2 0 010 6.1"/><path d="M17.4 14.6c2 .6 3.2 2.3 3.2 4.8"/>',
  documento:
    '<path d="M6 2.8h7.4L19 8.4v12.8H6z"/><path d="M13.4 2.8v5.6H19"/><path d="M8.8 13h7.4"/><path d="M8.8 16.6h5"/>',
  escudo: '<path d="M12 2.8l7.2 2.8v6c0 4.2-3 7.4-7.2 9.6-4.2-2.2-7.2-5.4-7.2-9.6v-6z"/><path d="M8.9 12.1l2.2 2.3 4-4.4"/>',
  raio: '<path d="M13.4 2.6L5.2 13.4h5.6l-.6 8 8.6-11.2h-6z"/>',
  nuvem:
    '<path d="M7.2 18.4a4.2 4.2 0 01-.5-8.4 5.6 5.6 0 0110.8-1.2 3.8 3.8 0 01-.4 9.6z"/>',
  estrela: '<path d="M12 3.2l2.7 5.6 6.1.8-4.5 4.3 1.2 6.1L12 17.1l-5.5 2.9 1.2-6.1L3.2 9.6l6.1-.8z"/>',
  check: '<circle cx="12" cy="12" r="8.6"/><path d="M8.2 12.2l2.7 2.8 5-5.6"/>',
  compartilhar:
    '<circle cx="17.4" cy="5.6" r="2.6"/><circle cx="6.2" cy="12" r="2.6"/><circle cx="17.4" cy="18.4" r="2.6"/><path d="M8.5 10.7l6.6-3.8"/><path d="M8.5 13.3l6.6 3.8"/>',
  calendario:
    '<rect x="3.4" y="5.2" width="17.2" height="15.4" rx="2.2"/><path d="M3.4 10h17.2"/><path d="M8 2.8v4"/><path d="M16 2.8v4"/>',
  busca: '<circle cx="10.8" cy="10.8" r="6.6"/><path d="M15.6 15.6l4.6 4.6"/>',
  troca: '<path d="M4.2 8.4h13.4l-3.2-3.4"/><path d="M19.8 15.6H6.4l3.2 3.4"/>',
  offline:
    '<path d="M12 3.6v9.8"/><path d="M8.2 9.8l3.8 3.8 3.8-3.8"/><path d="M4.4 16.4v2.2a1.8 1.8 0 001.8 1.8h11.6a1.8 1.8 0 001.8-1.8v-2.2"/>',
};

export const NOMES_ICONES = Object.keys(TRACOS);

/**
 * Devolve o ícone desenhado dentro de uma caixa `tamanho` x `tamanho`, com o
 * canto superior esquerdo em (x, y).
 *
 * O traço é declarado na grade de 24 e escala junto com o grupo, então o peso
 * óptico fica igual em qualquer tamanho — é o que mantém o ícone de 34px da
 * lista de recursos e o de 26px do rodapé com a mesma aparência.
 */
export function icone(nome, { x = 0, y = 0, tamanho = 24, cor = "#ffffff", peso = T } = {}) {
  const tracos = TRACOS[nome] ?? TRACOS.check;
  const escala = tamanho / 24;
  return `<g transform="translate(${x}, ${y}) scale(${escala})" fill="none" stroke="${cor}" stroke-width="${peso}" stroke-linecap="round" stroke-linejoin="round">${tracos.replaceAll("@", cor)}</g>`;
}

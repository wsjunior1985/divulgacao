// cor.js — converte as cores dos apps para algo que o renderizador entenda.
//
// Os apps declaram a paleta em oklch (é o que está no index.css de cada um). O
// renderizador de SVG só entende sRGB, então a conversão acontece aqui — assim o
// card usa a cor real da marca, não uma aproximação escolhida no olho.

/** oklch(L C H) → #rrggbb. L em 0..1, C em 0..0.4, H em graus. */
export function oklchParaHex(L, C, H) {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  // OKLab → LMS
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  // LMS → sRGB linear
  const rl = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gl = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  const gama = (u) => {
    const v = u <= 0.0031308 ? 12.92 * u : 1.055 * Math.abs(u) ** (1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, v)) * 255);
  };

  return `#${[gama(rl), gama(gl), gama(bl)].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

/** Aceita "oklch(0.48 0.22 310)", "#rgb", "#rrggbb" — devolve sempre #rrggbb. */
export function paraHex(valor) {
  const v = String(valor).trim();
  const m = v.match(/^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)/i);
  if (m) {
    const L = m[1].endsWith("%") ? Number.parseFloat(m[1]) / 100 : Number.parseFloat(m[1]);
    return oklchParaHex(L, Number.parseFloat(m[2]), Number.parseFloat(m[3]));
  }
  if (/^#[0-9a-f]{3}$/i.test(v)) return `#${v.slice(1).split("").map((c) => c + c).join("")}`;
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
  throw new Error(`cor não reconhecida: ${valor}`);
}

const canais = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));

/** Mistura duas cores. p=0 devolve a primeira, p=1 a segunda. */
export function misturar(hexA, hexB, p) {
  const [ra, ga, ba] = canais(paraHex(hexA));
  const [rb, gb, bb] = canais(paraHex(hexB));
  const m = (x, y) => Math.round(x + (y - x) * p).toString(16).padStart(2, "0");
  return `#${m(ra, rb)}${m(ga, gb)}${m(ba, bb)}`;
}

export const escurecer = (hex, p = 0.3) => misturar(hex, "#000000", p);
export const clarear = (hex, p = 0.3) => misturar(hex, "#ffffff", p);

/** Luminância relativa — decide se o texto por cima vai de preto ou branco. */
export function luminancia(hex) {
  const [r, g, b] = canais(paraHex(hex)).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contraste WCAG entre duas cores (1 a 21). */
export function contraste(hexA, hexB) {
  const a = luminancia(hexA);
  const b = luminancia(hexB);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** Texto legível sobre um fundo: escolhe entre o claro e o escuro da marca. */
export function textoSobre(fundo, claro = "#ffffff", escuro = "#0b0b0f") {
  return contraste(fundo, claro) >= contraste(fundo, escuro) ? claro : escuro;
}

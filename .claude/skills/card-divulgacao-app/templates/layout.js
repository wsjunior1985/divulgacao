// <id>.js — layout próprio do app: reaproveita a vitrine e ajusta só o CSS (logo horizontal alinhada à borda
// esquerda do texto e, se o app for escuro, moldura clara + halo). Copie para scripts/lib/cards/<id>.js, troque o nome
// da função, registre em LAYOUTS (scripts/lib/cards.js) e ponha "layout": "<id>" em apps/<id>.json → visual.
import { vitrine } from "./vitrine.js";

const AJUSTE = `
/* logo horizontal (ícone + nome) na borda esquerda do texto (x=58) */
.logo { left:58px; top:52px; width:auto; height:104px; max-height:none; }
body.vertical .logo { left:58px; top:104px; width:auto; height:128px; max-height:none; }
/* evita corte das descendentes na linha de destaque */
h1 .l2 { padding-bottom:.16em; margin-bottom:-.16em; }
/* moldura clara do aparelho + halo na cor de acento (app escuro sobre card escuro) */
.aro { box-shadow: 0 0 0 2px rgba(255,255,255,.55), 18px 14px 60px rgba(0,0,0,.8), 0 0 90px rgba(var(--acento-rgb),.42); }
`;

export function novoapp(args) {
  return vitrine(args).replace("</style>", `${AJUSTE}</style>`);
}

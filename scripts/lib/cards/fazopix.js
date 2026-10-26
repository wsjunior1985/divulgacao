// fazopix.js — a vitrine com a logo horizontal (ícone + nome ao lado) alinhada à
// borda esquerda do texto, e o aparelho com moldura clara e halo verde para
// destacar as telas escuras do app sobre o fundo escuro do card.
import { vitrine } from "./vitrine.js";

const AJUSTE = `
.logo { left:58px; top:52px; width:auto; height:104px; max-height:none; }
h1 .l2 { padding-bottom:.16em; margin-bottom:-.16em; }
body.vertical .logo { left:58px; top:104px; width:auto; height:128px; max-height:none; }
.aro { background:linear-gradient(135deg,#d5dad6 0%,#7f8782 16%,#eef2ef 32%,#8b938e 50%,#cfd5d1 68%,#6f7873 84%,#e3e8e4 100%);
  box-shadow: 1px 0 0 #aeb5b0, 2px 0 0 #9aa29d, 3px 0 0 #868e89, 4px 1px 0 #737b76, 5px 1px 0 #626a65, 6px 1px 0 #535a56,
    7px 2px 0 #474d4a, 8px 2px 0 #3d4340, 9px 2px 0 #343a37, 10px 3px 0 #2c322f, 11px 3px 0 #252a28, 12px 3px 0 #1f2321,
    13px 4px 0 #1a1e1c, 14px 4px 0 rgba(var(--acento-rgb),.8),
    18px 14px 60px rgba(0,0,0,.8), 0 0 90px rgba(var(--acento-rgb),.42), 0 0 22px rgba(var(--acento-rgb),.35); }
.aro::after { box-shadow:inset 0 0 0 2px rgba(255,255,255,.55), inset 3px 3px 6px rgba(255,255,255,.35); }
`;

export function fazopix(args) {
  return vitrine(args).replace("</style>", `${AJUSTE}</style>`);
}

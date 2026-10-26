// barbarizando.js — a vitrine com a logo horizontal (brasão + nome ao lado)
// alinhada à borda esquerda do texto. A logo já vem recortada, sem margem.
import { vitrine } from "./vitrine.js";

const AJUSTE = `
.logo { left:58px; top:30px; width:auto; height:150px; max-height:none; }
body.vertical .logo { left:58px; top:84px; width:auto; height:190px; max-height:none; }
`;

export function barbarizando(args) {
  return vitrine(args).replace("</style>", `${AJUSTE}</style>`);
}

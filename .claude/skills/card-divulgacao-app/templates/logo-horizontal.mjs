// Monta o lockup horizontal da logo (ícone à esquerda, nome ao lado), recortado e sem margem transparente.
// uso: node logo-horizontal.mjs <icone.png> <nome.png> <saida.png> [escalaNome=1.5] [gap=90]
// Se a logo oficial vem empilhada (ícone em cima, nome embaixo), recorte antes as duas partes com sharp.extract.
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
const [icone, nome, saida, escala = '1.5', gap = '90'] = process.argv.slice(2);
if (!icone || !nome || !saida) throw new Error('uso: logo-horizontal.mjs <icone> <nome> <saida> [escala] [gap]');
const ic = await sharp(icone).trim().toBuffer(); const im = await sharp(ic).metadata();
const nm = await sharp(nome).trim().toBuffer(); const nmeta = await sharp(nm).metadata();
const w = Math.round(nmeta.width * Number(escala)), h = Math.round(nmeta.height * Number(escala));
const nmR = await sharp(nm).resize(w, h).toBuffer();
const G = Number(gap), W = im.width + G + w, H = Math.max(im.height, h);
const out = await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: ic, left: 0, top: Math.round((H - im.height) / 2) }, { input: nmR, left: im.width + G, top: Math.round((H - h) / 2) }])
  .png().toBuffer();
writeFileSync(saida, out); console.log('ok', W, 'x', H, saida);

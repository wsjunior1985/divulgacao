---
name: card-divulgacao-app
description: Cria os cards premium (feed 1080×1350 e vertical 1080×1920) e o perfil de rodízio de um app novo no repositório divulgacao da WaldeApps, com telas reais do app, logo alinhada, 8 temas de texto e inclusão em ORDEM_APPS. Use quando pedirem "cards do app X", "incluir o app X na divulgação/rodízio", "refazer os cards", "card premium", ou ao mexer em apps/<id>.json, assets/premium/<id>/ ou scripts/lib/cards/.
---

# Cards de divulgação de um app (padrão premium)

Método usado para Barbarizando e Faz o PIX! (e que os demais apps seguem). O card é uma página HTML/CSS renderizada no Chromium (Playwright) e salva em JPEG: **feed 1080×1350** e **vertical 1080×1920** (o vertical sobe a pílula do site e os selos para ficar acima da legenda do TikTok/Reels). O rodízio é determinístico (7 horários/dia, `ORDEM_APPS`), então basta o perfil do app e os assets. Leia antes: `apps/GUIA-RAPIDO.md`, `apps/README.md` e a seção "O card" do `README.md`.

## Pacote mínimo
- `apps/<id>.json`: perfil com 8 temas (estrutura em `references/estrutura-json.md`; esqueleto em `templates/app.json`).
- `assets/logos/<id>.png` e `assets/premium/<id>/logo.png` (mesma imagem, PNG, sem margem transparente).
- `assets/premium/<id>/tela-*.png`: telas reais do app (390×844 @3x), sem dados pessoais.
- Opcional: `scripts/lib/cards/<id>.js` (layout próprio, só se a vitrine precisar de ajuste) + registro em `scripts/lib/cards.js`.
- `scripts/lib/conteudo.js`: `<id>` no fim de `ORDEM_APPS` (**só depois da aprovação do card 1 pelo dono**).

## Passos
1. **Entender o app**: `PRODUCT.md`, `DESIGN.md`, landing. Confirme a **URL pública real** (responde 200? o domínio do JSON é o que está no ar?). Anote cores da marca, anti-referências, público e o que o app **realmente** faz.
2. **Identidade do card**: cor de fundo e destaque da marca (`marca`), bloco `visual` (`layout`, `efeito` `luz`|`fogo`, `acento`/`acento2`, `fonteTitulo`, `selos`). Fontes disponíveis: `assets/fontes/` (Inter, Inter Display, Barlow Condensed, Fraunces, Manrope, Plus Jakarta Sans, Sora, Space Grotesk; mapa em `scripts/lib/cards/comum.js`). Escolha a mais próxima da fonte do app; se precisar de outra, adicione o `.ttf` (com licença) e registre.
3. **Logo**: monte o lockup **horizontal** (ícone à esquerda, nome ao lado), recortado sem margem, com a borda esquerda em **x=58**, igual ao texto (`templates/logo-horizontal.mjs`). O dono pediu o nome ao lado do ícone e alinhado ao título.
4. **Telas reais**: `templates/captura-telas.mjs` (Playwright, 390×844 @3x, **modo escuro do app** quando existir, contexto novo, escritas bloqueadas, dados 100% fictícios: nunca chave Pix/CPF/telefone/nome reais, nunca criar conta em produção). Se o app exige login, siga `video-apresentacao-app/references/captura-e-login.md`. Nada de tela inventada: se não há tela de instalação, não há captura dela.
5. **Perfil `apps/<id>.json`**: 8 temas; cada um com `card`, `ganchos`, `corpos`, `ctas`, `curtos` e o bloco `premium` (título com `<br>`, linha de destaque, subtítulo com `<b>`, `tela`, 3 `beneficios` com ícone existente em `NOMES_ICONES`). Texto em pt-BR, tom do app, **só o que o app faz** (sem número, preço, prova social, "garantido"). Conferir os afirmados contra o código/`PRODUCT.md`.
6. **Layout próprio (só se precisar)**: copie `templates/layout.js` para `scripts/lib/cards/<id>.js`, ajuste só CSS (posição da logo, moldura do aparelho), registre em `LAYOUTS` de `scripts/lib/cards.js` e ponha `"layout": "<id>"` em `visual`. **Não altere layouts compartilhados**; se for inevitável, regenere um card do GASONOL e do Papelzinho antes/depois para provar que não mudaram. App de tela escura sobre card escuro: moldura metálica clara + halo na cor de acento (ver `fazopix.js`).
7. **ORDEM_APPS**: incluir o `<id>` no fim (para testes locais isso altera só a cópia de trabalho). Aviso: mudar o número de apps muda **todos** os slots futuros (o módulo da agenda); a ordem de hoje não muda se o app ficar no fim.
8. **Validar**: `npm run cards -- --app <id> --todos` e `--formato vertical`; `npm run agenda -- --dias 7`; `npm test`; `node scripts/publicar.mjs --dry-run --app <id>` (**sem** publicar; apague os `NNN-<id>-*` que o dry-run deixa em `assets/cards/`). **Olhe cada um dos 16 cards** (Read em imagem) com o checklist abaixo e corrija até ficarem no nível dos de GASONOL/Barbarizando.
9. **Aprovação**: mostre o card 1 (feed) e um vertical ao dono (SendUserFile). Só com "aprovado" siga.
10. **Commit**: `revisor-codigo` antes; `git add` por caminho (`apps/<id>.json`, `apps/GUIA-RAPIDO.md`, `scripts/lib/cards.js`, `scripts/lib/cards/<id>.js`, `scripts/lib/conteudo.js`, `assets/logos/<id>.png`, `assets/premium/<id>/`); mensagem "Incluir <App> no rodízio de divulgação [skip ci]"; `git pull --rebase --autostash origin main` e `git push origin main`. Deixe de fora o `CALENDARIO-1ANO.md` regenerado e arquivos alheios (pergunte se o dono quer o calendário). Os previews `assets/cards/preview-*` são ignorados pelo git.

## Checklist de QA (por card)
Título que não cabe ou quebra em 3+ linhas · palavra órfã (uma palavra sozinha numa linha) · descendente cortada ("g", "p", "ç") · logo fora do alinhamento x≈58 ou colada no título · texto sobre a pílula do site ou os selos · tela do celular cortada (QR/botão cortado) · tela errada para o tema · aparelho escuro "sumindo" no fundo escuro · dado pessoal real · afirmação que o app não cumpre · URL diferente da pública · contraste ruim · card vertical com conteúdo abaixo da área da legenda.

## Armadilhas
Leia `references/armadilhas.md`.

## Delegação
Um agente por app com o briefing de `references/briefing-agente.md`. Quem coordena confere os cards e mostra ao dono; o dono aprova o card 1 antes do commit.

---
name: video-apresentacao-app
description: Cria, confere e publica o vídeo de apresentação de um app da WaldeApps, nativo em 9:16 (vertical, Reels/TikTok/Shorts) ou em 16:9 (horizontal, YouTube/Facebook/site), ~40 s, com telas reais capturadas do app, música própria e legendas por rede. Use quando pedirem "vídeo de apresentação", "reels/short do app X", "vídeo horizontal/16:9 do app", "refazer o vídeo", "vídeo para publicar nas redes", ou ao criar/ajustar qualquer projeto em videos/projetos/<app>/ do repositório divulgacao.
---

# Vídeo de apresentação de um app (9:16 ou 16:9)

Método usado nos 12 vídeos entregues (Aeroliso, AI-Eat, Barbarizando, Comunidade do Céu, Convertendo, Faz o PIX!, GASONOL, O Palpiteiro, Papelzinho, Remedin, Vai dar quanto?, VouTroCar). Tudo mora em `divulgacao/videos/`; leia `videos/README.md` (estrutura, comandos de publicação) antes de começar. **Não crie projeto de vídeo fora de `videos/projetos/<app>/`.**

## Escolha o formato (pergunte se não estiver claro)
| Formato | Resolução | Para quê | Arquivo final | Cópia faststart |
|---|---|---|---|---|
| **9:16** vertical (padrão) | 1080×1920 | Reels, TikTok, Shorts, Threads, Bluesky, X | `videos/nativos/<app>.mp4` | `videos/9x16/<app>.mp4` |
| **16:9** horizontal | 1920×1080 | YouTube, Facebook, X, LinkedIn, site | `videos/nativos/<app>-16x9.mp4` | `videos/16x9/<app>.mp4` |

Dá para entregar os dois: capture uma vez (`capture/` e `music/` compartilhados) e recomponha o layout para cada formato (nunca estique um no outro). O padrão do 9:16 está abaixo; o do 16:9, em `references/formato-16x9.md`.

## Resultado esperado
H.264 + AAC, 30 fps, faststart, 35–60 s, áudio ≈ −14 LUFS com pico ≤ −1,5 dBTP. Depois: cópia faststart, legendas em `videos/videos.json`, publicação, commit só dos arquivos de texto (**nenhum vídeo vai para o git**).

## Passos
1. **Entender o app**: leia `PRODUCT.md`, `DESIGN.md`, `README.md` do app e `divulgacao/apps/<app>.json` (tagline, recursos, tom). Confirme a URL pública (responde 200?). Confira se o app tem login. Se existir um 16:9 antigo em `videos/origem/`, extraia quadros (ffmpeg, a cada ~3 s) e olhe: serve só de referência de história e identidade, nunca se encaixa em fundo desfocado.
2. **Roteiro** (5–8 cenas): gancho com o problema do usuário → o que o app faz, uma ideia por cena → prova real (o fluxo funcionando) → diferencial (grátis, sem cadastro, offline, instala como app… só se for verdade) → fechamento com logo, domínio e chamada. Use SÓ o que o app mostra e faz: nada de número, preço, depoimento ou promessa inventados. Se a conta de teste está vazia, simule dados **só no navegador** e marque a cena com "dados de exemplo".
3. **Capturar as telas reais** (Playwright, viewport 390×844, `deviceScaleFactor` 3), em **modo escuro** do app quando ele tiver (preferência do dono), contexto novo de navegador por captura. Veja `templates/captura-fluxo.mjs` (sequência de screenshots a 30 fps com cues de cursor/teclas) e `references/captura-e-login.md`.
4. **Gerar as cenas** com HyperFrames (HTML + GSAP): um `tools/gen.mjs` escreve `index.html`, `compositions/*.html` e `music/cues.json`. Cada cena é um `<template>` com `data-composition-id`, linha do tempo GSAP pausada e crossfade de entrada de 0,3 s. Use as skills `hyperframes`, `hyperframes-cli`, `hyperframes-registry` e `media-use`. Modelo vivo: `videos/projetos/aeroliso/video/tools/gen.mjs` (e os demais projetos).
5. **Música e efeitos**: `music/compose.py` (Python puro, semente fixa) lê o `cues.json` e grava `video/assets/audio/mix.wav` (trilha própria + clique, tecla, pop, whoosh nas trocas, chime, impacto no fecho).
6. **Render e conferência**: `npx hyperframes check` (0 erros) e `render` local; depois `templates/finalize.sh` (loudnorm 2 passes + faststart) e `FORMATO=9x16|16x9 templates/qa.sh` (quadros com guias de área segura).
7. **QA olhando os quadros** (≥ 25, incluindo cortes e zooms; Read em imagem). Checklist abaixo. Corrigir e re-renderizar até zerar.
8. **Entrega e aprovação do dono** antes de publicar. Depois: `ffmpeg -c copy -movflags +faststart` para `videos/9x16/<app>.mp4` (ou `videos/16x9/<app>.mp4`), legendas, `node scripts/publicar-video.mjs --dry-run --app <app> [--formato 16x9]` e publicação (ver `videos/README.md`; o 16:9 só sai em facebook, threads, bluesky e x). Peça confirmação antes de qualquer publicação ou exclusão de post.

## Padrão visual 9:16 (obrigatório no vertical; o 16:9 está em `references/formato-16x9.md`)
- Nativo vertical; **aparelho com a tela inteira do app** (cabeçalho + rodapé), ~55–60% da largura (≈ 608 × 1280 px), topo em y≈490, base ≈ y 1770. Nunca sangrando pela base.
- Título de **até 2 linhas** a partir de y≈212–230, com **60–80 px de respiro** até o aparelho; nenhuma linha tocada ou coberta. Texto essencial entre y=210 e y=1520.
- **Zoom por cena de no máximo 1,25×**, ancorado no topo do aparelho (a moldura continua visível e o respiro do título não muda), voltando à tela completa antes do corte; sem cortar palavras nas laterais.
- Rolagem do app **dentro** do aparelho (cabeçalho e rodapé fixos) quando a tela for mais longa.
- Quadro 0 com o gancho completo e parado (título não animando).
- Transições em crossfade curto (0,3–0,5 s): sem quadro liso/vazio, sem aparelho preto, sem fantasma prolongado, sem título esmaecido em quadro de repouso.
- App escuro **não** vai sobre fundo igualmente escuro: fundos de cor da marca, moldura do aparelho mais clara. Respeite as anti-referências do app (ex.: Faz o PIX! proíbe roxo).
- Cursor branco com contorno, cliques com micro-escala; chip "dados de exemplo" / "dados do app" nas cenas de captura quando couber.

## Checklist de QA (por quadro)
Tela cortada · título tocado/coberto pelo aparelho · quadro vazio ou aparelho preto · título ainda animando no quadro 0 · texto fora da largura · palavra órfã na quebra de linha · QR/imagem cortada · dado pessoal real · número que o app não mostra · contraste ruim (título claro sobre fundo claro).

## Segurança e dados
- Dados pessoais sempre **fictícios** (Maria Exemplo, SAO PAULO, exemplo@exemplo.com…). Nunca chave Pix, CPF, telefone ou nome reais de ninguém.
- **Nunca criar conta em produção.** Interceptar toda escrita (POST/PATCH/PUT/DELETE → 204). Login só para entrar (magic link; ver referência), sessão apagada ao fim. Não imprimir segredos.
- Conta de teste vazia ou plano pago: simular só no navegador (interceptação) e deixar explícito no vídeo.

## Delegação
Cada vídeo (por formato) é uma unidade independente de ~20–30 min: delegue a um agente com o briefing de `references/briefing-agente.md` (já traz o padrão e as armadilhas; preencha o campo de formato). Rodar até 3 agentes em paralelo; mais que isso estoura o limite de uso. Quem coordena confere os quadros do mp4 antes de mostrar ao dono.

## Armadilhas já pagas
Leia `references/armadilhas.md` antes de começar.

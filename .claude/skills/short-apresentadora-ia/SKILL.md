---
name: short-apresentadora-ia
description: Cria um Short vertical (9:16, ~14 s) de um app da WaldeApps com apresentadora gerada por IA (Google Flow / Veo 3.1) + captura REAL do app dentro de um celular + legenda sincronizada + vinheta e URL do app, pronto para entrar no rodízio de Reels/Shorts. Use quando pedirem "Short com apresentadora", "vídeo com IA para o app X", "repetir o piloto do GASONOL", "mais vídeos do app X" ou ao mexer em scripts/short-ia*, videos/shorts-ia/ ou videos-moldura.
---

# Short com apresentadora de IA + captura real do app

Método validado no piloto do GASONOL (`gasonol-4`). Dá para repetir em qualquer app que tenha uma tela pública gravável. Os Reels de maior alcance da conta foram os com pessoa falando, por isso este é o formato prioritário (o de tela pura rende menos).

## O que é automático e o que é manual
| Etapa | Quem faz |
|---|---|
| Config do app (`scripts/short-ia/<app>.json` + `fluxos/<fluxo>.mjs`) | agente |
| Quadro de referência e prompt do Flow (`preparar`) | script |
| **Gerar o clipe no Google Flow** (20 créditos, Veo 3.1 Fast) | **dono** (sem API: os créditos do plano AI Pro só valem no Flow; a API do Veo exige faturamento com pré-carga de R$ 200) |
| Captura real do app, legenda, composição, vinheta, URL, manifesto, bucket, commit | agente |

## Requisitos
`ffmpeg`, `ffprobe` e `whisper-cli` instalados (Homebrew), `playwright` do projeto e o modelo do Whisper em `~/.cache/whisper-cpp/`.

## Passos
1. **Escolha a fala** (≤ ~20 palavras, 8 s) só com o que o app faz, tirada de `apps/<app>.json` e das legendas em `videos/videos.json`. Sem número, preço ou promessa novos. Português correto; marca escrita como no app.
2. **Config**: crie `scripts/short-ia/<app>.json` (copie o do `gasonol`): `fala`, `apresentadora` (quadro de referência de um clipe existente), `corte` (segundo em que ela começa a levantar o celular), `destaques`/`cores` (cores da marca na legenda), `cena` (fluxo, logo, fundo com as cores do app) e `tempos` (vazio no começo). Crie o fluxo gravável `scripts/short-ia/fluxos/<fluxo>.mjs` (`url`, `contexto`, função que clica/digita; reaproveite seletores de `videos/projetos/<app>/capture/*.mjs`). **Dados 100% fictícios, escritas bloqueadas (204), nunca criar conta.**
3. `node scripts/short-ia.mjs preparar <app>` → `videos/shorts-ia/<app>/{1-apresentadora.png, prompt.txt, LEIA-ME.md}`. Copie o prompt com `LC_ALL=en_US.UTF-8 pbcopy < prompt.txt` (sem UTF-8 os acentos quebram e o Veo fala errado).
4. **Dono gera no Flow**: sobe só `1-apresentadora.png`, Agente > Configurações com **Veo 3.1 Fast**, **9:16**, x1 e "Confirmar antes de gerar: Sempre"; cola o prompt; confirma os 20 créditos; baixa em qualidade original como `piloto.mp4` na pasta. Cada tela nova do Flow, peça print antes de indicar o clique.
5. `capturar <app>` grava o fluxo real em quadros com tempo real e monta `captura.mp4`. Confira os quadros (Read em imagem).
6. `transcrever <app>` ouve o clipe com o Whisper (`~/.cache/whisper-cpp/ggml-small-q5_1.bin`, de huggingface.co/ggerganov/whisper.cpp) e imprime os tempos das palavras. **Confira se a fala bate com a legenda e ouça a pronúncia da marca** (o Whisper sem dica ouve "gás ou nó" para GASONOL; com `--prompt` ele acerta, mas só o dono confirma de ouvido). Preencha `tempos` (uma linha de legenda por bloco, `ini`/`fim` exclusivos para não sobrepor).
7. **Antes**, se o app ainda não tem vinheta, rode `videos-moldura.mjs preparar` (veja "Vinheta e URL por app"); sem `videos/molduras/<app>/` o `compor` pula a vinheta. `compor <app>` → `videos/9x16/<id>.mp4`: rosto até `corte`, depois a **tela real** do app em moldura de celular (a tela falsa que o Veo inventa no close **nunca** entra), legenda queimada, áudio do clipe com fade. Se o app tem moldura (`videos/molduras/<app>/`), aplica vinheta + pílula da URL.
8. **QA nos quadros** (≥ 8, Read): legenda de uma linha e sem sobreposição, cores da marca, sem texto falso no celular, rosto e mãos naturais, URL legível entre y 1330 e 1450, nada abaixo de y 1520 além da legenda. Reprove e regere (mais 20 créditos) se o rosto ou a mão estiverem estranhos.
9. **Publicar no rodízio**: cadastre `<id>` em `videos/videos.json` copiando as legendas do app e preenchendo `youtube {titulo, abertura, tags, playlist}`; `ia: true` (marca o conteúdo como sintético no YouTube); sem texto "gerada por IA" nas legendas (decisão do dono); inclua no `rodizio` com `desde` numa data em que o teste "never repeats the same video in consecutive slots" passe (`npm test`); suba o arquivo ao bucket com `hospedarVideo` e confira o tamanho; `revisor-codigo`; commit com `[skip ci]` só de texto (os mp4 não vão ao git).

## Vinheta e URL por app
`node scripts/videos-moldura.mjs preparar --app <app> --origem <intro.mp4> --intro 2.7:4.6 --outro 7.0:10.0 --url <dominio>` (origem 9:16 entra direto; 16:9 entra inteira sobre fundo desfocado, sem cortar a logo) e `aplicar --app <app>` nos vídeos do app. O original fica em `videos/nativos/anteriores/<id>-sem-moldura.mp4`; `aplicar` recusa dobrar a moldura sem `--forcar`. Use só 1,9 s de abertura e ~3 s de encerramento: a vinheta inteira de 10 s derruba a retenção.

## Armadilhas já pagas
- Acento quebrado ao copiar o prompt (use `LC_ALL=en_US.UTF-8 pbcopy`).
- Imagem de referência com outra pessoa mistura personagens: suba só a da apresentadora e diga "FIRST reference image only" no prompt.
- O Veo inventa a interface do celular: prompt pede tela não legível e a cena real substitui o close.
- A fala quase sempre ocupa os 8 s inteiros, inclusive o trecho do celular: a voz continua por cima da cena do app.
- Clipe sai em 720×1280: sobe para 1080×1920 com Lanczos + leve nitidez (aceitável em Short).
- `ffmpeg` do Homebrew local não tem `drawtext`: legendas viram PNG (Chromium) e entram com `overlay`.
- Alterar o tamanho do `rodizio` muda `seq % n` e pode repetir vídeo na virada (use `desde` e o teste).
- `compor` substitui `videos/nativos/anteriores/<id>-sem-moldura.mp4` pela composição nova (só depois de pronta) e reaplica a moldura; o clipe do Flow (`piloto.mp4`) nunca é apagado.
- A legenda é de uma linha e diminui a fonte sozinha até caber; se ficar pequena demais, quebre a frase em dois blocos em `tempos`.
- A captura bloqueia service workers e escritas (204): o fluxo é só leitura.
- Créditos: Flow (plano AI Pro) ~1.000/mês, Veo Fast ~20 por vídeo; confirmar antes de gerar sempre.

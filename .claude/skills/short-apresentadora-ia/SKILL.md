---
name: short-apresentadora-ia
description: Cria um Short vertical (9:16, ~13,5 s) de um app da WaldeApps com apresentador(a) gerado(a) por IA (Google Flow / Veo 3.1 Fast) + tela do app dentro de um celular + legenda sincronizada + vinheta e URL, e coloca no rodízio de Reels/Shorts. Serve para qualquer app, com captura real (fluxo gravável) ou telas premium estáticas (apps com login ou com uma só tela). Use quando pedirem "Short com apresentadora", "vídeo com IA para o app X", "próximo app: X" na série de Shorts de IA, "mais vídeos do app X" ou ao mexer em scripts/short-ia*, videos/shorts-ia/ ou videos-moldura.
---

# Short com apresentador(a) de IA + tela do app

Método validado em 13 Shorts (gasonol-4, vdq-3, fazopix-1, convertendo-1, barbarizando-1/2, aeroliso-1, aieat-2, remedin-2, papelzinho-1, opalpiteiro-1, voutrocar-1). Os Reels de maior alcance da conta são os com pessoa falando; é o formato prioritário.

## Resultado
`videos/9x16/<id>.mp4`, 13,5 s: vinheta de ~1,9 s com a logo → rosto falando até o `corte` → tela do app em moldura de celular (a tela falsa que o Veo inventa nunca entra) → legenda de uma linha sincronizada → encerramento de ~3 s com a pílula da URL (domínio sem https://). O mp4 não vai ao git (`videos/*` é ignorado): vai ao bucket.

## Quem faz o quê
| Etapa | Quem |
|---|---|
| Config `scripts/short-ia/<app>.json`, fala, legendas por rede, manifesto | agente |
| Imagem do(a) apresentador(a) e clipe no Google Flow (Chrome) | agente, dirigindo o Flow via claude-in-chrome |
| **Aprovar os 20 créditos do clipe** | **dono**, sempre. Pergunte (AskUserQuestion) e só então clique em "Aprovar" **uma vez**; nunca "Sempre aprovar no projeto". A imagem não pede confirmação |
| Captura, transcrição, composição, vinheta, QA | agente |
| Aprovar o vídeo (rosto, pronúncia, tela) | **dono**: envie com SendUserFile e pergunte "Aprova o Short para subir no rodízio?" |
| Bucket, rodízio, testes, revisão, commit/push | agente |

Downloads do Flow: diga o nome do arquivo, a origem e o tamanho no relatório. Dados do app sempre fictícios, escritas bloqueadas, nunca criar conta nem gerar sessão de login. Peça um app por vez ("Próximo app: X").

## Requisitos
`ffmpeg`, `ffprobe`, `whisper-cli` (Homebrew), `playwright` do projeto, modelo `~/.cache/whisper-cpp/ggml-small-q5_1.bin`, Chrome com a extensão (claude-in-chrome) logado no Google Flow (plano AI Pro, ~1.000 créditos/mês, ~20 por clipe).

## Passos
1. **Ler o app**: `apps/<app>.json` (recursos, marca), legendas existentes em `videos/videos.json`, `assets/premium/<app>/` (logo e `tela-*.png` 1170×2532). Veja as telas e a logo (Read em imagem). A logo deve ser RGBA com cantos transparentes; logo com fundo preto ou borda escura estranha precisa de ajuste.
2. **Fala** (≤ ~20 palavras, 8 s): só o que o app faz, sem número, preço ou promessa novos. Pergunta de gancho + "No/Com <App> você …". Se o nome for difícil, escreva a fala foneticamente (ex.: "Ai Ít" para AI-Eat); a legenda sempre usa a grafia real. Números por extenso na fala ("cinquenta"); a legenda pode usar dígitos.
3. **Config** `scripts/short-ia/<app>.json` (copie `remedin.json` ou `voutrocar.json`): `app`, `id` (`<app>-N`, o próximo livre), `dominio`, `fala`, `apresentadora` (`pronome` he/she, `referencia: null`, `descricao`, `cenario`, `gesto`), `corte`, `tempos: []`, `destaques`/`cores` (cor da marca no nome; pode ser aninhado: `VouTro<i class=\"c2\">Car</i>`), `cena`.
   - **Um(a) apresentador(a) diferente por app**; alterne gênero, idade, roupa e cenário ligado ao tema (sala de Natal para amigo oculto, TV de futebol para bolão).
   - `cena`: `fluxo`, `inicio`, `logo`, `logoLargura`/`logoAltura` (logo quadrada ~160; larga ~200×170), `fundo` (gradiente com as cores da marca, fundo escuro).
   - **Layout do celular** (opcional; sem estes campos o layout é o original): `escala` 1.06 e `topo` 245 (celular maior sem encostar na logo e na legenda), `semNotch: true` (o notch não cobre o cabeçalho do app), `margem` 16 + `corTela` (cor de fundo do app: recua a tela e preenche a borda com a cor, evitando que os cantos quadrados da tela passem por cima das quinas arredondadas da moldura). Em app de tela clara use `corTela` escura (#0b0b10), que vira "borda de celular".
4. `node scripts/short-ia.mjs preparar <app>` → `videos/shorts-ia/<app>/{prompt.txt, prompt-imagem.txt, LEIA-ME.md}`.
5. **Imagem do(a) apresentador(a) no Flow** (ver "Google Flow"): gere com `prompt-imagem.txt`, confira rosto e mão (cinco dedos, tela do celular escura), baixe em 1K e salve como `videos/shorts-ia/<app>/1-apresentadora.jpg`.
6. **Clipe**: anexe a imagem, cole `prompt.txt` (com acentos), o Flow pergunta "1 geração de vídeo, 20 créditos". **Pergunte ao dono**, aprove uma vez, aguarde ~1–2 min, baixe em 720p e salve como `piloto.mp4`.
7. **Captura do app** (`videos/shorts-ia/<app>/captura.mp4` + `captura.json`):
   - Fluxo gravável (app com tela pública): `scripts/short-ia/fluxos/<fluxo>.mjs`, depois `node scripts/short-ia.mjs capturar <app>`. Só leitura, dados fictícios.
   - Telas estáticas (app com login ou uma só tela): `node scripts/short-ia-estatico.mjs <app> <tela1> [tela2 …]` (zoom lento por tela, transição de 0,4 s, 6,4 s). Use `"fluxo": "painel-estatico"` na config e não rode `capturar`. 1–2 telas bastam.
8. `node scripts/short-ia.mjs transcrever <app>`: confira se a fala ouvida bate (e ouça o nome da marca: só o dono confirma a pronúncia). Preencha `tempos` (um bloco de legenda por trecho, `ini`/`fim` exclusivos, ~38 caracteres no máximo por linha) e ajuste `corte` para o fim do nome do app.
9. **Manifesto**: cadastre `<id>` em `videos/videos.json` (antes de compor: sem isso a vinheta não é aplicada) com `arquivo`, `nome`, `titulo`, `legendas` das 6 redes (instagram, facebook com UTM `utm_campaign=<tema>`, threads, bluesky, tiktok, x), `url`, `youtube {titulo, abertura, tags, playlist}`, `ia: true`, `moldura: "<app>"`. Sem "gerada por IA" nas legendas (decisão do dono); só ressalvas reais ("dados ilustrativos"). Inclua o id no fim de `rodizio` e um `desde` (passo 12).
10. **Vinheta** (uma vez por app): `node scripts/videos-moldura.mjs preparar --app <app> --padrao --url <dominio>` → `videos/molduras/<app>/`.
11. `node scripts/short-ia.mjs compor <app>` → `videos/9x16/<id>.mp4`. **QA**: extraia ≥ 8 quadros (`ffmpeg -ss <t> -frames:v 1`) e uma folha de contato; confira legenda de uma linha sem sobreposição e na cor da marca, tela do app **inteira** na moldura (sem corte nas bordas, sem notch no cabeçalho, sem encostar na logo e na legenda), URL legível, rosto e mãos naturais. Envie o vídeo ao dono (SendUserFile) e peça aprovação. Rosto estranho = nova geração (mais 20 créditos, pergunte).
12. **Subir e agendar** (só após "Aprovado, subir"):
    - `node --env-file=.env.local -e 'import("./scripts/lib/midia-video.js").then(m=>m.hospedarVideo("videos/9x16/<id>.mp4"))'` e confira o tamanho com `curl -sI https://supabase.waldeapps.systems/storage/v1/object/public/marketing-videos/videos/<id>.mp4` (HTTP 200, `content-length` igual ao arquivo).
    - Escolha o `desde`: `node scripts/short-ia-desde.mjs <id> --de <data>` lista as datas sem repetição em slots seguidos, a estreia (12h ou 19h BRT) e o menor intervalo. Prefira a data pedida pelo dono; senão a que dê maior intervalo. Mudar o tamanho do `rodizio` muda `seq % n` e reorganiza os slots dali em diante, então mexer em vários vídeos de uma vez exige simular de novo; para espalhar a estreia, troque posições do array (ex.: trocar com o filler do mesmo app) e rode a simulação.
    - `npm test` (11 testes, inclui "nunca o mesmo vídeo em slots consecutivos") e dry-run: `node --env-file=.env.local scripts/publicar-video-rodizio.mjs --dry-run --data AAAA-MM-DD --pos 0|1` (pos 0 = 12h BRT, 1 = 19h BRT).
    - Agente `revisor-codigo` antes do commit (escopo, legendas, segredos, JSON).
    - Commit só de texto na `main`, com `git add` dos caminhos explícitos (`videos/videos.json`, `scripts/short-ia/<app>.json`), mensagem terminando com `[skip ci]` enquanto a cota do Actions estiver bloqueada (veja o regimento), depois `git pull --rebase --autostash origin main` e `git push origin main`.

## Google Flow (claude-in-chrome; coordenadas do viewport ~1211×650, podem mudar com a UI)
Use `browser_batch` e confira com `screenshot` a cada tela nova; espera máxima de 10 s por ação.
1. `navigate https://flow.google.com/` → clicar "Novo projeto" (604,530) → painel do agente à direita.
2. Configurações do agente (1128,605): imagem **9:16** (1143,382), **x1** (901,434), modelo (1018,472) → **Nano Banana Pro** (960,514); rolar o painel 5 ticks: vídeo **9:16** (1096,475), **x1** (901,527), modelo (1018,565) → **Veo 3.1 Fast** (930,454) (se "Veo 3.1 - Fast" estiver listado, não "Omni"); **Salvar** (1026,609). Mantenha "Confirmar antes de gerar: Sempre".
3. Caixa de texto (1020,558): digitar o prompt da imagem e Return. A imagem leva ~25 s; abrir (318,200); baixar: ícone (927,38) → **1K** (945,85); **Concluir** (1146,38).
4. Anexar: "+" (889,605) → a imagem já vem selecionada → "Incluir no comando" (1006,535); caixa (1000,558): digitar o prompt do vídeo, Return. O agente mostra "1 geração de vídeo, 20 créditos" com "Aprovar" (~(938,317–386), confira no screenshot).
5. Depois da aprovação do dono: o vídeo leva ~1 min; abrir (318,200); baixar: ícone (849,38) → **720p** (873,135).
6. Os downloads caem em `~/Downloads` (`Woman_…`/`Man_…`, nome gerado pelo Flow): copie para a pasta do app.

## Armadilhas já pagas
- Acento quebrado ao digitar/colar o prompt: digite em UTF-8 (a ferramenta `type` aceita acentos).
- Imagem de referência com outra pessoa mistura personagens: o prompt diz "FIRST reference image only".
- O Veo inventa a interface do celular: o prompt exige tela não legível e a cena real substitui o close.
- A fala ocupa os 8 s: a voz continua por cima da cena do app (a captura é acelerada ~1,1–1,5× para caber).
- Clipe sai em 720×1280 e sobe para 1080×1920 com Lanczos; aceitável em Short.
- `ffmpeg` do Homebrew local não tem `drawtext`: a legenda vira PNG (Chromium) e entra com `overlay`.
- A moldura fica **por baixo** da tela: cantos quadrados da tela vazam sobre as quinas arredondadas. Solução: `margem` + `corTela`, não `fillborders`/smear.
- A tela do app não deve ser maior que a área entre a logo (topo) e a legenda (y ≥ 1545); ajuste `escala`/`topo`.
- `compor` só aplica vinheta se `videos/molduras/<app>/` existe **e** o id já está em `videos/videos.json`.
- `compor` substitui `videos/nativos/anteriores/<id>-sem-moldura.mp4`; o `piloto.mp4` do Flow nunca é apagado.
- A legenda diminui a fonte para caber em uma linha; se ficar pequena, quebre o trecho em dois blocos de `tempos`.
- Alterar o `rodizio` muda `seq % n`: sempre simule (`short-ia-desde.mjs`) e rode `npm test`.
- O Whisper escreve nome de marca em minúscula ou com vogal alongada ("Remediin"): é só transcrição; o que vale é o ouvido do dono.
- Veo Fast aparece como "Disponível até 5 de dez." no Flow: depois dessa data, confira o modelo disponível.

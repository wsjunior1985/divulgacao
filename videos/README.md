# Vídeos de apresentação 9:16

Tudo que é vídeo de apresentação dos apps mora aqui, dentro do `divulgacao`.
**Não crie projeto de vídeo fora desta pasta** (nada de `<app>-video` solto em
`Projetos/`): crie em `videos/projetos/<app>/`.

## Estrutura

| Pasta / arquivo | O que é | No git? |
|---|---|---|
| `videos.json` | Manifesto: nome, URL, arquivo e **legenda por rede** de cada vídeo | sim |
| `projetos/<app>/` | Fonte de cada vídeo (capturas, gerador de cenas, música, render) | não (local; pesa ~3,5 GB e tem dado de captura) |
| `nativos/<app>.mp4` | Entrega final aprovada, 1080×1920 | não |
| `nativos/anteriores/` | Versões antigas (`<app>-v1.mp4`, `-v2`…) | não |
| `9x16/<app>.mp4` | Cópia com `faststart` que o publicador envia às redes | não |
| `origem/` | Os 16:9 originais, só como referência | não |

Os scripts ficam em `scripts/`: `videos-converter.mjs`, `publicar-video.mjs`,
`apagar-video.mjs` e os adaptadores `canais/video.js`, `lib/midia-video.js`.
O estado do que já saiu fica em `estado/videos.json` (IDs de cada post por rede).

## Mapa dos projetos

| App | Pasta | Gerador de cenas | Música / áudio |
|---|---|---|---|
| Aeroliso | `projetos/aeroliso/` | `video/tools/gen.mjs` | `music/compose.py`, `finalize.sh` |
| AI-Eat | `projetos/aieat/video-vertical/` | `tools/gen.mjs` | no próprio projeto |
| Barbarizando | `projetos/barbarizando/video-vertical/` | `video/tools/gen.mjs` | `music/compose.py`, `finalize.sh` |
| Comunidade do Céu | `projetos/comunidadedoceu/video-vertical/` (atual, 9:16) | Remotion (`src/vertical`) | `scripts/` |
| Comunidade do Céu (anteriores) | `projetos/comunidadedoceu/video/` (Remotion original e tutorial de instalação) e `video-social-9x16/` (versão social de 33 s) | Remotion / HyperFrames | — |
| Convertendo | `projetos/convertendo/video/` | `tools/gen.mjs` | `tools/compose.py`, `finalize.sh` |
| GASONOL | `projetos/gasonol/` | `video/tools/gen.mjs` | `music/compose.py` |
| O Palpiteiro | `projetos/opalpiteiro/video-vertical/` | `video/tools/gen.mjs` | `music/compose.py`, `finalize.sh` |
| Papelzinho | `projetos/papelzinho/video-vertical/` | `gerador/gen.mjs` | `assets/` |
| Remedin | `projetos/remedin/` | `build.py` | `music/compose.py` |
| Vai dar quanto? | `projetos/vaidarquanto/` | `video/tools/gen.mjs` | `music/compose.py`, `video/tools/finalize.sh` |
| Faz o PIX! | `projetos/fazopix/` | `video/tools/gen.mjs` | `music/compose.py`, `finalize.sh` |
| VouTroCar | `projetos/voutrocar/` | `video/tools/gen.mjs` | `music/compose.py`, `finalize.sh` |

Os `gen-v1`/`gen-v2` são versões anteriores (aparelho cortado), guardadas só
para histórico. O app `comunidadedoceu` não guarda mais nenhuma pasta de vídeo:
as duas que existiam nele (`video/` e `video-social-9x16/`) foram movidas para cá.

## Padrão do vídeo (aprendido com as revisões do dono)

- Nativo 9:16 (1080×1920, 30 fps), nunca 16:9 encaixado em fundo desfocado.
- Aparelho com a **tela inteira** do app (cabeçalho e rodapé), ~55–60% da largura,
  do topo em y≈500 até y≈1760.
- Título de até 2 linhas a partir de y≈212; **60–80 px de respiro** até o aparelho
  (nenhuma linha tocada ou coberta). Texto essencial entre y=210 e y=1520.
- Zoom por cena de **no máximo 1,25×**, ancorado no topo, com a moldura visível,
  voltando à tela completa antes do corte; sem cortar palavras nas laterais.
- Quadro 0 com o gancho completo e parado; transições em crossfade curto, sem
  quadro vazio nem aparelho preto.
- App escuro não vai sobre fundo igualmente escuro.
- Telas reais (Playwright, 390×844 @3x, WebP); dados pessoais sempre fictícios,
  "dados de exemplo" quando a conta estiver vazia. Nunca criar conta em produção,
  interceptar toda escrita, login só para entrar, sem imprimir segredo.
- Áudio com música própria e efeitos, loudnorm ≈ −14 LUFS, pico ≤ −1,5 dBTP.
- QA: ≥ 20 quadros do render final olhados, com guias em y=250 e y=1520.

## Fluxo

```bash
# 1. conferir/normalizar o mp4 final (faststart) em videos/9x16/
#    (o conversor `npm run videos:converter` só serve para 16:9 → fundo desfocado; os
#    vídeos nativos de videos/nativos/ são só remuxados)
ffmpeg -y -i videos/nativos/<app>.mp4 -c copy -movflags +faststart videos/9x16/<app>.mp4
#    atenção: no app do Céu o arquivo nativo é `comunidadedoceu.mp4`, mas o id do
#    manifesto e o arquivo publicado são `comunidade-do-ceu` (videos/9x16/comunidade-do-ceu.mp4)

# 2. cadastrar/ajustar a legenda de cada rede em videos/videos.json

# 3. ver o que sairia, sem publicar
node scripts/publicar-video.mjs --dry-run --app <app>

# 4. publicar (o TikTok fica fora: a API só aceita post privado até a auditoria)
node scripts/publicar-video.mjs --app <app> --canais bluesky,instagram,facebook,threads,x

# republicar um vídeo que já saiu (cria um post novo, não apaga o antigo)
node scripts/publicar-video.mjs --app <app> --forcar --canais ...

# apagar posts de vídeo (X só apaga o que ainda está na fila do Buffer)
node scripts/apagar-video.mjs --app <app> [--canais ...] [--dry-run]
```

Vídeo novo de um app: crie `projetos/<app>/`, copie a estrutura de um projeto
pronto (por exemplo `projetos/barbarizando/video-vertical`) e siga o padrão acima.

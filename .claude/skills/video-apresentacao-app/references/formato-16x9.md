# Formato 16:9 (1920×1080) — horizontal

Use para YouTube, Facebook, X, LinkedIn, site/landing e apresentações. Reels, TikTok e Shorts exigem 9:16 (ver `SKILL.md`). Os mesmos princípios valem: pensado para o formato desde o início, tela inteira do app visível, textos grandes, sem faixas vazias.

## Layout
- Tela 1920×1080. **Margem de segurança de 96 px** em todos os lados; texto essencial dentro dela.
- **Aparelho com a tela inteira do app** (nunca cortado): ≈ 440 × 950 px (proporção 390:844 + moldura), centralizado na vertical, de y≈65 a y≈1015. Ocupa um terço da largura, **à esquerda ou à direita**; o bloco de texto ocupa o outro lado (≈ 960 px de largura).
- **Alternar o lado do aparelho** a cada 2–3 cenas para dar ritmo (ex.: A esquerda, B direita), sempre com o texto no lado oposto. Nas cenas sem aparelho (gancho, fecho) o texto/logo vai centralizado ou em duas colunas.
- **Título**: 2 linhas, 96–150 px, alinhado ao bloco de texto, uma palavra de destaque em cor da marca; subtítulo 40–52 px; no máximo 1 chip de apoio. Respiro ≥ 60 px entre o bloco de texto e a moldura do aparelho; nenhuma linha tocada.
- **Zoom por cena ≤ 1,25×**, ancorado no topo do aparelho, moldura visível, voltando antes do corte; sem cortar palavras. Pode aproximar o aparelho em cenas de detalhe, ou usar um recorte ampliado ao lado (callout) do trecho da tela, em vez de ampliar a tela real.
- Fundos de cor/gradiente da marca; app escuro nunca sobre fundo igualmente escuro; moldura clara.
- Quadro 0 completo e parado; transições por crossfade de 0,3–0,5 s; sem quadro vazio.

## Duração e áudio
- 40–60 s. O 16:9 tolera um pouco mais de ritmo lento que o vertical, mas corte o que for redundante.
- Mesmo áudio (música própria + efeitos), loudnorm 2 passes −14 LUFS, pico ≤ −1,5 dBTP, faststart.

## Implementação
- Mesmo pipeline: `gen.mjs` com `W = 1920, H = 1080`, `data-width/height` e `viewport` do `index.html` em 1920×1080, `html, body` com `width:1920px;height:1080px`.
- Ao gerar a partir de um projeto 9:16 existente, **recomponha as cenas** (não estique): reaproveite capturas, música (`cues.json` por cena) e roteiro; refaça só o layout (aparelho ao lado do texto). Prefira manter a duração das cenas para reaproveitar o áudio.
- Para a mesma peça nos dois formatos, gere um `gen.mjs` com constante de formato (`FORMATO = '9x16' | '16x9'`) e dois blocos de layout, ou duas pastas `video-9x16/` e `video-16x9/` dentro de `videos/projetos/<app>/` compartilhando `capture/` e `music/`.
- Entrega: `videos/nativos/<app>-16x9.mp4`; cópia faststart em `videos/16x9/<app>.mp4`.
- QA: `FORMATO=16x9 templates/qa.sh …` (guias de margem a 96 px). Procure: aparelho cortado, texto tocando a moldura, texto fora da margem, faixa vazia, quadro 0 animando.

## Publicação por formato
- **9:16**: Instagram Reels, TikTok (privado até a auditoria), YouTube Shorts, Threads, Bluesky, X.
- **16:9**: YouTube, Facebook (vídeo na Página), X, Bluesky, Threads, LinkedIn. O Instagram (Reel) e o TikTok exigem 9:16.
- O `scripts/publicar-video.mjs` aceita `--formato 9x16|16x9` (padrão 9x16). No 16:9 ele envia só a facebook, threads, bluesky e x e **pula** instagram e tiktok com aviso. O arquivo vem de `arquivos["16x9"]` no `videos/videos.json` ou, sem essa chave, de `videos/16x9/<id>.mp4`. O estado do 16:9 fica em `estado/videos.json` na chave `<id>@16x9` (independente do 9:16), e o arquivo é hospedado no Supabase com o nome `16x9-<id>.mp4`.
- Exemplos: `node scripts/publicar-video.mjs --dry-run --app <id> --formato 16x9` e `node scripts/publicar-video.mjs --app <id> --formato 16x9 --canais facebook,x`. A exclusão aceita o mesmo `--formato` (`apagar-video.mjs`).

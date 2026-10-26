# Armadilhas e correções aprendidas

## Enquadramento (as três reprovações do dono)
1. **16:9 encaixado em fundo desfocado**: reprovado. Fica pequeno, com faixas vazias. O vídeo tem que ser pensado para retrato.
2. **Aparelho sangrando pela base** (mostrava só metade da tela do app): reprovado. A tela inteira tem que aparecer; isso reduz o aparelho a ~55–60% da largura, e o ganho de leitura vem do zoom ≤ 1,25×.
3. **Título colado/coberto pelo aparelho**: a 2ª linha era encoberta. Sempre 60–80 px de respiro e conferir em todas as cenas (inclusive as de 3 linhas).
- Zoom grande (1,5–1,8×) vira "recorte sem moldura com bordas retas" e parece tela cortada. Ancorar no topo do aparelho e ficar em ≤ 1,25×.
- Zoom que corta palavras nas laterais ("RESULTADO" → "ULTADO"): reduzir o zoom ou escolher outro trecho.
- Se o conteúdo do aparelho é escuro, fundo da cena de cor (não escuro) e moldura clara.

## Quadros e transições
- Quadro 0 precisa mostrar o gancho completo, parado (renderize e olhe o frame 0).
- Fundo liso/vazio de 0,2–0,6 s entre cenas: use crossfade em vez de wipe de cor; títulos saem ~0,15–0,4 s antes do corte.
- Aparelho preto antes da gravação carregar: comece a gravação junto com a entrada do aparelho ou use um still da tela por baixo.
- Título "fantasma" nos crossfades: esmaecer o conteúdo da cena anterior antes da próxima começar.
- Cena sem texto de apoio ou com rodapé vazio: preencha com chip/legenda real.

## Captura
- Contexto novo do navegador por captura (sem localStorage sobrando) e `page.route` devolvendo 204 para tudo que não é GET.
- Screencast CDP em vez de `recordVideo` quando precisar de vídeo; para telas estáticas, sequência de screenshots a 30 fps é mais nítida e controlável (`templates/captura-fluxo.mjs`).
- `navigator.share` não existe no desktop: simule só na captura quando o botão de compartilhar importar.
- Cartão/janela de impressão trava screenshot: capture o toque no botão e não a janela.
- Refresh token do GoTrue rotaciona: gere uma sessão nova por rodada de captura (a sessão dura ~1 h).
- Conta Free não abre telas premium: simule a leitura da assinatura **só no navegador** e marque "dados de exemplo".
- Telas longas: capturar a página inteira e rolar dentro do aparelho; não prometa "tela inteira" se o app só tem a tela do topo.
- Nunca preencha formulário de **criar conta** em produção (um script de login chegou a tentar na aba "Criar Conta"; removido).
- App offline-first: cuidado com ícones que não entram no cache do service worker (o ícone do cabeçalho do Faz o PIX! aparece quebrado offline).

## Áudio
- Loudnorm de 1 passe estoura o pico no AAC: usar 2 passes, alvo −14 LUFS, TP −2,6 no passe final (fica ≈ −1,6 dBTP no arquivo) e `faststart`.
- Trilha sintetizada em Python puro (sem numpy), semente fixa, regenerável pelo `cues.json`.
- Ninguém ouve o áudio no ambiente de QA: só medir (ebur128). Avise o dono que o áudio não foi ouvido.

## Projeto/sistema
- Pastas de projeto de vídeo soltas em `Projetos/` sumiram do disco várias vezes. Tudo agora em `divulgacao/videos/projetos/<app>/` (local, ignorado pelo git). Se um projeto sumir, o histórico do HyperFrames (`~/.cache/hyperframes/history`) permite restaurar.
- `pkill -f hyperframes.*render` derruba renders de outros vídeos em paralelo: não use.
- Rode no máximo 3 agentes de vídeo ao mesmo tempo (limite de uso da conta).
- Encerrar servidores de preview iniciados pelo agente.

## Publicação
- Instagram/Facebook/Threads baixam o mp4 de uma URL pública (Supabase Storage, bucket de vídeos); TikTok e Bluesky recebem upload direto. O vídeo **nunca** entra no git.
- Bluesky: o token de serviço precisa apontar para o PDS real da conta (resolver pelo DID), senão dá 401 no `uploadVideo`. Um 401 isolado costuma passar repetindo só esse canal.
- X sai pelo Buffer (agenda alguns minutos à frente; post já publicado no X só se apaga à mão).
- TikTok só aceita post privado até a auditoria da plataforma: ficou fora.
- Excluir posts é irreversível e a API do Instagram/Buffer tem limites: só com autorização do dono.

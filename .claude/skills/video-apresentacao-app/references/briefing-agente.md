# Briefing para delegar um vídeo a um agente

Copie, preencha os campos `<…>` e envie a um agente `general-purpose` (um agente por vídeo; no máximo 3 em paralelo).

---
Responda e escreva tudo em português do Brasil.

TAREFA: criar do zero o vídeo de apresentação do **<App>** (<URL pública>; <tagline e o que faz, em 1–2 linhas>; código em /Users/wsjunior/Projetos/<pasta-do-app> — leia PRODUCT.md, DESIGN.md, AGENTS.md/README e /Users/wsjunior/Projetos/divulgacao/apps/<id>.json) NATIVO em <9:16 (1080x1920) | 16:9 (1920x1080)>, 30 fps. <Se houver 16:9 antigo: está em divulgacao/videos/origem/<arquivo>; extraia quadros e olhe só como referência de história e identidade.> Alvo: 35–45 s, música própria e efeitos nas ações. Roteiro sugerido: <gancho → …→ fechamento>. Use SÓ o que o app realmente faz e mostra; nunca invente número, preço, prova social nem promessa.

PADRÃO OBRIGATÓRIO: leia PRIMEIRO `/Users/wsjunior/Projetos/divulgacao/.claude/skills/video-apresentacao-app/SKILL.md` (e `references/formato-16x9.md` se o formato for 16:9) e `references/armadilhas.md` e `/Users/wsjunior/Projetos/divulgacao/videos/README.md`, e siga à risca o "Padrão visual" e o "Checklist de QA". <Se o app tiver tema escuro: telas em modo escuro sobre fundos de cor, sem fundo escuro atrás do aparelho. Anti-referências de marca: <…>.>

DADOS E SEGURANÇA: dados 100% fictícios; nunca criar conta em produção; interceptar toda escrita; login só para entrar (magic link via GoTrue do <app>-auth, segredo lido por SSH em memória, sem imprimir; ou as credenciais de captura de /Users/wsjunior/Projetos/divulgacao/.env.local sem imprimir) e apagar a sessão ao fim; contexto novo do navegador por captura.

COMO TRABALHAR: carregue as skills `hyperframes`, `hyperframes-cli`, `hyperframes-registry`, `media-use`. Use como referência os projetos prontos em `/Users/wsjunior/Projetos/divulgacao/videos/projetos/*` (o Aeroliso e o Faz o PIX! são os mais próximos para app escuro sobre fundos de cor) e os vídeos finais em `videos/nativos/*.mp4` (extraia quadros e olhe). Crie o projeto SÓ em `/Users/wsjunior/Projetos/divulgacao/videos/projetos/<id>/` (use `templates/` da skill como ponto de partida). Se precisar de servidor local, a porta do app está em /Users/wsjunior/Projetos/LIXO/PORTAS_DEV.md; prefira capturar o site público; encerre o que iniciar. Rode o `check` do HyperFrames, renderize local, normalize com `finalize.sh`. QA: ≥ 25 quadros do render final com guias em y=250 e y=1520, olhando cada um (cortes, zooms, quadro 0).

ENTREGA: mp4 em `/Users/wsjunior/Projetos/divulgacao/videos/nativos/<id>.mp4` (9:16) ou `<id>-16x9.mp4` (16:9), faststart, conferido com ffprobe. NÃO faça commit, push nem publicação; não altere o app nem o divulgacao além do mp4 e da pasta do projeto. Reporte em Comprovado / Hipótese / Pendente, com duração, tamanho, cenas, URL pública para as legendas e tudo que tiver feito em produção.
---

## Quando o dono pedir ajuste
Responda ao MESMO agente (ele guarda o contexto), cite o quadro/cena, peça backup da versão anterior em `videos/nativos/anteriores/<id>-vN.mp4` antes de sobrescrever e nova QA de quadros. Conferir você mesmo os quadros do mp4 antes de mostrar.

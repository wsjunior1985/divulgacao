# Briefing para delegar os cards de um app

Preencha `<…>` e envie a um agente `general-purpose` (um por app).

---
Responda e escreva tudo em português do Brasil.

TAREFA: no projeto /Users/wsjunior/Projetos/divulgacao, criar os cards premium do app "<Nome>" (<tagline/o que faz>; código em /Users/wsjunior/Projetos/<pasta> — leia PRODUCT.md, DESIGN.md, AGENTS.md; descubra e confira a URL pública real) e deixá-lo pronto para entrar no rodízio. Siga à risca `/Users/wsjunior/Projetos/divulgacao/.claude/skills/card-divulgacao-app/SKILL.md` (+ references/) e `apps/GUIA-RAPIDO.md`. Molde: `apps/barbarizando.json` e `apps/fazopix.json` (layouts próprios em `scripts/lib/cards/`). Público: <…>. Marca: <cores, anti-referências>.

ENTREGÁVEIS: 1) `apps/<id>.json` com EXATAMENTE 8 temas (só o que o app faz; nenhuma afirmação não verificada); 2) `assets/logos/<id>.png`, `assets/premium/<id>/logo.png` (lockup horizontal alinhado em x≈58) e telas reais `assets/premium/<id>/tela-*.png` (Playwright 390×844 @3x, modo escuro, dados 100% fictícios, contexto novo, escritas bloqueadas); 3) layout próprio opcional registrado em `cards.js`; 4) `<id>` no fim de `ORDEM_APPS` (cópia local) e `apps/GUIA-RAPIDO.md` atualizado; 5) validação: cards feed+vertical, agenda 7 dias, `npm test`, dry-run (apague os cards do dry-run); olhe CADA card e corrija.
NÃO regenere `CALENDARIO-1ANO.md`; NÃO faça commit/push/publicação; NÃO toque em `videos/`, `estado/` nem scripts de vídeo; não imprima segredos.
Relate em Comprovado / Hipótese / Pendente, com a lista de arquivos e os caminhos do card 1 (feed) e de um vertical para aprovação.
---

Ajustes do dono: responda ao MESMO agente (mantém o contexto), cite o card e o problema, peça regeneração dos 16 e nova conferência. Confira você mesmo os cards antes de mostrar.

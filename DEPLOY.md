# Deploy

> Aviso: o deploy web não usa GitHub Actions. Os workflows desta pasta são apenas para captura, publicação de cards e renovação de tokens. O fluxo do site continua sendo GitHub -> Coolify -> VPS.


Este projeto segue o padrão oficial do portfólio WaldeApps, mas tem fluxo próprio de automação:

- o deploy das telas e cards não deve voltar para GitHub Actions como publicação de app web;
- a captura, a publicação e a renovação de tokens têm workflows separados e precisam de revisão própria;
- qualquer mudança de infraestrutura deve ser validada com calma porque esse projeto mistura automação e publicação de conteúdo.

Regra geral:

1. mantenha o fluxo web fora de GitHub Actions;
2. trate capturas, publicações e tokens como automações específicas;
3. documente qualquer ajuste de produção antes de mudar o comportamento.

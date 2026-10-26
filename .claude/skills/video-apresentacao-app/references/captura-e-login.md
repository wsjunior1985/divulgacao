# Captura das telas e login

## Princípios
- Capturar o **site público** em produção, com Playwright (Chromium), viewport 390×844, `deviceScaleFactor: 3`, `colorScheme: 'dark'` quando o app tiver tema escuro (forçar também pelo mecanismo de tema do app: `localStorage`, classe no `html` ou `prefers-color-scheme`; leia o código do app para saber a chave).
- Um contexto novo por captura; descartar no fim.
- Bloquear escritas: `page.route('**/*', r => ['GET','HEAD','OPTIONS'].includes(r.request().method()) ? r.continue() : r.fulfill({status:204}))` (liberar apenas as chamadas de sessão do GoTrue quando estiver logado).
- Trocar dados pessoais por fictícios na própria página (nomes, e-mails, fotos) só para o screenshot.
- Converter as capturas para WebP antes de usar nas cenas (arquivos de 2–3 MB não servem).

## Quando o app exige login
Preferir o app sem login ou as telas públicas. Se for indispensável:
1. Gerar um magic link pelo endpoint admin do GoTrue do app (`/auth/v1/admin/generate_link`), assinando um JWT `service_role` de 10 min com o segredo lido por SSH do container `<app>-auth` (`GOTRUE_JWT_SECRET`), **só em memória, sem imprimir nem salvar**.
2. Trocar o token por sessão em `/auth/v1/verify` e injetar a sessão no `localStorage` do contexto (`sb-<ref>-auth-token`).
3. Fazer só leituras; mockar as respostas de dados que a conta de teste não tem (alertas, ranking, assinatura premium) com `page.route`, e marcar "dados de exemplo" na cena.
4. Apagar o arquivo de sessão ao terminar (a sessão dura cerca de 1 h; o refresh token rotaciona).
Ver `templates/sessao-magic-link.mjs`. O e-mail da conta de teste vem de variável de ambiente (`CAPTURA_EMAIL`), nunca fixo no arquivo.

## Sequência de screenshots a 30 fps
`templates/captura-fluxo.mjs` grava cada passo como um JPEG numerado com uma duração (`list.json`), mais `cues` de cursor (`move`/`click`) e teclas (`key`) com o tempo do fluxo. O `gen.mjs` converte esses cues em animação do cursor e em efeitos sonoros (tick ao digitar, click). Rolagens usam easing para ficar suaves.

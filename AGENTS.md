# Regimento do estúdio WaldeApps

Estas regras valem para todos os projetos, agentes e subagentes em qualquer ferramenta (Claude, Codex, Antigravity/Gemini, Cursor).
Responda sempre em português do Brasil.

---

## 🏢 Quem somos
WaldeApps é um estúdio de aplicativos PWA (https://waldeapps.systems).
Cada repositório é um app com identidade visual, público e contexto próprios.

---

## 🛠️ Stack padrão e Acessos

### Frontend & Backend:
- **Frontend:** React, TypeScript, Vite, TanStack Start/Router, Tailwind CSS.
- **Backend:** Supabase (PostgreSQL, Auth/GoTrue, Storage, RPCs, migrations, tipos gerados).
- **Infraestrutura:** Git → GitHub → GitHub Actions → GHCR → Coolify → VPS (Hostinger, Traefik, Docker). Lovable NÃO faz parte do fluxo.

### Acessos e Infraestrutura já configurados:
- `ssh hostinger-vps` → `root@187.127.48.43`
- `ssh supabase-waldeapps` → `wsjunior@supabase.waldeapps.systems`
- **Hostinger MCP:** já disponível e configurada neste ambiente para tarefas de infraestrutura, VPS, hospedagem e DNS.
- **Diretriz de autonomia:** Use esses acessos diretamente antes de pedir host, usuário ou credenciais. Resolva questões com o mínimo de intervenção manual do usuário, seguindo as melhores práticas. Se precisar consultar banco ou logs na VPS, verifique via SSH antes de sugerir mudanças.

---

## 🔌 Portas de Desenvolvimento Local (Porta Única por Projeto)

- **Regra obrigatória:** Todo projeto do estúdio roda em desenvolvimento (`dev` / `vite` / `preview`) em uma **porta localhost exclusiva e fixa** para evitar colisão entre projetos abertos simultaneamente e para garantir o redirect correto do login com Google (pois cada container `<app>-auth` na VPS tem apenas a sua porta liberada no `GOTRUE_URI_ALLOW_LIST`).
- **Tabela oficial de portas:** Consulte sempre `/Users/wsjunior/Projetos/PORTAS_DEV.md`.
- **Projetos novos ou ausentes:** Se o projeto aberto não constar na tabela de `PORTAS_DEV.md`:
  1. Selecionar a **próxima porta da sequência disponível** (a partir de `8128`).
  2. Adicionar o novo projeto na tabela de `/Users/wsjunior/Projetos/PORTAS_DEV.md`.
  3. Configurar no `vite.config.ts` (ou equivalente) `server: { port: <PORTA>, strictPort: true }`.
  4. Adicionar a entrada em `/Users/wsjunior/Projetos/.claude/launch.json`.
  5. Avisar o usuário para que libere a porta no `GOTRUE_URI_ALLOW_LIST` do GoTrue na VPS, se aplicável.

---

## 🚀 Fluxo de Deploy e Contingência

### Fluxo Padrão:
- Push para o GitHub → GitHub Actions valida e constrói a imagem → GHCR publica a imagem → Coolify faz o deploy automático dessa imagem.

### Contingência Manual na VPS (`vps-deploy`):
- `vps-deploy` e deploys diretos por SSH são exclusivamente contingência para dois casos:
  1. O GitHub bloquear execuções por **esgotamento de cota de Actions**.
  2. **Incidente no GitHub Actions:** o run não concluir no tempo esperado (em fila ou sem terminar por mais de 2 minutos, ou cancelado pelo GitHub sem passo com falha) **e** houver incidente de Actions aberto em investigação no githubstatus.com. Confirme o incidente antes de usar a contingência.
- Falhas de build, testes, segredos, permissões, GHCR ou Coolify devem ser investigadas e corrigidas no fluxo padrão — nunca mascaradas com deploy por SSH.
- Assim que a cota do GitHub renovar ou o incidente for resolvido, o fluxo padrão via GitHub Actions deve ser retomado imediatamente, e o commit publicado por SSH deve passar pelo pipeline normal.

---

## 👥 Equipe de Subagentes (quando delegar)
- `verificador-deploy` → após qualquer push ou para validar "já está no ar?".
- `diagnostico-infra` → app fora do ar, erro de DNS, TLS, proxy, 502/503/504.
- `guardiao-supabase` → qualquer SQL, migration, RLS, RPC ou mudança de schema/tipos.
- `auditor-pwa` → service worker, cache, offline, instalação PWA, safe areas, navegação.
- `auditor-analytics` → métricas, eventos, funil e painel administrativo da WaldeApps.
- `revisor-codigo` → antes de commits críticos para revisar o diff e escopo.
- `marketing-conteudo` → campanhas, posts, calendário editorial, UTMs e o app Divulgação.

*Subagentes não chamam outros subagentes: quem coordena é sempre o agente principal.*

**Obrigatório:** o agente principal aciona o subagente correspondente quando o gatilho ocorre, sem esperar pedido explícito do usuário. `guardiao-supabase` roda **antes** de aplicar SQL; `revisor-codigo` roda **antes** de cada commit; `verificador-deploy` roda **depois** de cada push; `auditor-pwa` roda quando a mudança toca safe areas, viewport ou navegação mobile. Se o ambiente não permitir a chamada, o agente principal informa o usuário antes de seguir.

---

## 🌿 Regras de Git
- Commits pequenos, atômicos, explícitos e por repositório, sem arquivos alheios à tarefa.
- Preserve alterações paralelas na árvore de trabalho do usuário.
- **NUNCA** use `git reset --hard`, `git checkout --`, `git clean -fd` ou force push sem autorização explícita.

---

## 📦 Regras de Deploy e Publicação
- Build local aprovado, push aceito ou container antigo saudável **NÃO** provam publicação.
- Só declare "publicado" após checagem completa: SOURCE_COMMIT, tag da imagem, StartedAt, status do container, hostname público, DNS, TLS e resposta HTTP 200/healthcheck funcional.

---

## 📱 Regras de Produto e UX
- **Mobile-first:** Barra inferior no celular, lateral no desktop quando aplicável.
- **PWA nativo:** Respeite safe areas/notch de iPhone, instalação, service worker e página offline.
- Quando o app tiver feeling nativo, preserve `maximum-scale=1` e `user-scalable=no`.
- Preserve a identidade visual, paleta e tipografia próprias de cada app; não uniformize arbitrariamente interfaces distintas.
- Correções visuais devem ser validadas no layout renderizado real, não apenas no diff de classes CSS.
- **Voz e Sincronização:** Preserve detecção de silêncio/parsing nos fluxos de voz e sincronize deleções via tombstones.

---

## 📊 Como relatar
Separe sempre em três blocos objetivos:
1. **Comprovado:** O que foi validado com testes locais, commit, container no ar ou requisição HTTP.
2. **Hipótese:** Possíveis causas sob investigação.
3. **Pendente:** O que falta para concluir a tarefa.

---

## 🔄 Sincronização deste arquivo

Este é o regimento principal do estúdio. Depois de qualquer edição neste arquivo, o agente deve rodar `/Users/wsjunior/estudio-regimento/scripts/sync-agents.sh` para refletir a mudança nos `AGENTS.md` dos projetos. O script não sobrescreve projetos com instruções próprias (`gasonol`, `barbarizando`, `gbifitas`), que devem ser alinhados manualmente.

# Automação de divulgação — guia passo a passo

Este sistema publica sozinho os posts de `marketing/posts.json` no Instagram,
Facebook e TikTok via **GitHub Actions**. Você faz o setup **uma vez** (criar
tokens — exige login/verificação) e depois só precisa renovar o token da Meta a
cada ~60 dias (com **lembrete automático** via issue no GitHub).

> ⚠️ **Nunca cole tokens no chat.** Eles vão em `Settings → Secrets` do GitHub
> (ou no `.env.local` local, que é ignorado pelo git).

---

## Etapa 1 — Criar a página e conta profissional (se ainda não tiver)

1. **Facebook:** tenha uma **página** (não perfil pessoal). Crie em
   https://www.facebook.com/pages/creation (Página → **Início**).
2. **Instagram:** transforme seu perfil em **conta profissional** e conecte à página:
   - Instagram app → Ajustes → Tipo de conta → **Conta profissional**.
   - Ajustes → Central de Contas → **Conectar** → escolha a página do Facebook.
   - (Se aparecer verificação de negócio, siga o fluxo — é necessária para publicar.)

## Etapa 2 — Criar o app da Meta e o token

1. Acesse https://developers.facebook.com/apps → **Criar aplicativo**.
   - Tipo: **Negócios**. Nome: `Remedin Automação`. E-mail: seu.
2. No painel do app, em **Adicionar produto**: adicione **Instagram** e
   **Facebook Login para Negócios**.
3. Produto **Instagram** → **Gerenciar** → **Contas vinculadas**:
   - Conecte sua **página** do Facebook e a **conta profissional** do Instagram.
4. **Gerar o token curto:**
   - Vá em **Ferramentas → Graph API Explorer**.
   - **Aplicativo:** `Remedin Automação`. **Permissões** (User token): adicione
     `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`,
     `instagram_content_publish`, `business_management`.
   - Clique **Gerar Access Token** → aceite a janela de autorização.
5. **Gerar o token long-lived (~60 dias):** no navegador, troque `<APP_ID>`,
   `<APP_SECRET>` e `<TOKEN_CURTO>`:
   ```
   https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=<APP_ID>&client_secret=<APP_SECRET>&fb_exchange_token=<TOKEN_CURTO>
   ```
   - `<APP_ID>` e `<APP_SECRET>` ficam em **Configurações → Básico** do app.
   - O resultado tem `access_token` (long-lived, 60 dias) — **guarde**.
6. **Token da página (também long-lived):**
   ```
   https://graph.facebook.com/v21.0/me/accounts?access_token=<TOKEN_LONG_LIVED>
   ```
   - Pegue o `access_token` e o `id` da sua página. O `id` é o **`META_PAGE_ID`**.
   - ⚠️ Use o token **da página** (o do resultado deste passo), não o do passo 5,
     para postar — é ele que vai no secret `META_ACCESS_TOKEN`.
7. **ID da conta do Instagram:**
   ```
   https://graph.facebook.com/v21.0/<PAGE_ID>?fields=instagram_business_account&access_token=<TOKEN_DA_PAGINA>
   ```
   - O `id` retornado é o **`META_IG_USER_ID`**.

## Etapa 3 — Criar o app do TikTok

1. Acesse https://developers.tiktok.com/apps → **Create New App**.
   - Tipo: **Business/TikTok API**. Nome: `Remedin Automação`.
2. Em **Permissions → Content Posting API**, adicione: `video.upload`, `video.publish`.
3. **Solicite a revisão** das permissões de publicação (leva alguns dias — faça já).
4. Gere o **access token** pelo fluxo OAuth (Authorization Code) com escopo
   `video.publish`. Guarde: **access token**, **refresh token**, **client key**
   e **client secret** (ficam em **Manage App → Client Key**).

## Etapa 4 — Criar o bucket público no Supabase

O bucket `marketing` guarda as imagens que viram URL pública para as APIs.

1. Acesse https://supabase.com/dashboard → projeto **lctpecauuqyxjvqxvazgl**.
2. **Storage → New bucket**:
   - Name: `marketing`
   - **Public bucket: ON**
   - Max file size: `10 MB` → **Create bucket**.
3. Se a migration do repositório já criou o bucket, basta confirmar que está
   **Public** (Storage → `marketing` → ⚙️ → Public).
4. Pegue a **service role key**: **Settings → API keys → `service_role`**
   (⚠️ secreta — só vai no GitHub Secrets).

## Etapa 5 — Configurar os GitHub Secrets

Repositório (https://github.com/wsjunior1985/remedin) →
**Settings → Secrets and variables → Actions → New repository secret**.
Crie cada um e cole o valor:

| Secret                      | De onde vem                                                    |
| --------------------------- | -------------------------------------------------------------- |
| `META_ACCESS_TOKEN`         | Token da página (Etapa 2.6)                                    |
| `META_PAGE_ID`              | ID da página (Etapa 2.6)                                        |
| `META_IG_USER_ID`           | ID da conta do Instagram (Etapa 2.7)                            |
| `TIKTOK_ACCESS_TOKEN`       | Access token do TikTok (Etapa 3.4)                              |
| `TIKTOK_CLIENT_KEY`         | Client Key (Etapa 3.4)                                          |
| `TIKTOK_CLIENT_SECRET`      | Client Secret (Etapa 3.4)                                       |
| `TIKTOK_REFRESH_TOKEN`      | Refresh token (Etapa 3.4)                                       |
| `SUPABASE_URL`              | `https://lctpecauuqyxjvqxvazgl.supabase.co`                     |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (Etapa 4.4)                                    |

## Etapa 6 — Testar (opcional, antes de largar no cron)

1. **Local (sua máquina):** crie/edite `.env.local` com os mesmos valores dos
   secrets acima e rode:
   ```bash
   npm run divulgacao:dry -- --date 2026-08-13   # vê o que faria
   npm run divulgacao -- --date 2026-08-13       # publica de verdade
   ```
2. **GitHub Actions:** aba **Actions → divulgacao → Run workflow** para disparar
   manualmente um teste (posta o que estiver agendado para hoje).

## Etapa 7 — Como funciona depois de configurado

- O cron roda todos os dias às **10:00, 11:00, 12:00, 16:00 e 18:00 (Brasília)**.
- Publica os posts de `marketing/posts.json` marcados para a data.
- Registra o que já postou em `marketing/.posted.json` (não duplica).
- Renova o token do TikTok via refresh token, se necessário.

## Lembrete automático do token da Meta 🔔

O workflow `lembrete-token-meta` roda **todo dia 09:30 BRT** e:
- consulta a expiração do `META_ACCESS_TOKEN` na API do Facebook;
- quando faltar **≤ 7 dias**, **abre/atualiza uma issue** no GitHub
  intitulada "⚠️ Token da Meta expira em N dias", com link para este guia.

Quando você renovar o token (Etapa 2) e atualizar o secret, feche a issue —
no dia seguinte o lembrete some sozinho.

## Onde está cada coisa

- **Agenda/posts:** `marketing/posts.json`
- **Imagens:** `marketing/assets/`
- **Scripts:** `scripts/divulgacao/` (`runner.js`, `meta.js`, `tiktok.js`)
- **Workflows:** `.github/workflows/divulgacao.yml` (posts) e
  `.github/workflows/lembrete-token.yml` (lembrete)
- **Conteúdo/campanhas:** `marketing/conteudo.md`, `marketing/anuncios.md`

## Limitações honestas

- **TikTok** usa **Photo Mode** (imagens). Vídeo (reels) exige um MP4.
- **WhatsApp** não automatiza *status* de número pessoal (só WhatsApp Business
  API com opt-in).
- **Meta** expira a cada ~60 dias → o lembrete automático avisa antes.
- **Campanhas pagas (Google/Meta Ads)** não são postadas — exigem conta com
  verificação e orçamento; plano pronto em `marketing/anuncios.md`.

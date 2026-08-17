# Setup — a única parte que exige você

Depois desta página, o sistema roda sozinho. São 4 blocos independentes: cada um
que você terminar já começa a publicar, e o que faltar fica desligado sem
quebrar os outros.

Ordem sugerida pelo custo/benefício:

| Bloco | Tempo | Dificuldade | O que destrava |
|---|---|---|---|
| 1. Bluesky | 3 min | trivial | Bluesky |
| 2. Meta | 30–40 min | média (é a chata) | Instagram + Facebook |
| 3. Threads | 10 min | fácil (reaproveita o app da Meta) | Threads |
| 4. TikTok | 20 min + auditoria | média + espera | TikTok |

> ⚠️ **Nunca cole token no chat.** Tudo vai em `Settings → Secrets and variables
> → Actions` no GitHub, ou no `.env.local` da sua máquina (ignorado pelo git).

---

## Bloco 0 — Colocar o repositório no GitHub

O repositório precisa ser **público**, porque é ele que hospeda os cards: as
redes baixam a imagem de `raw.githubusercontent.com`. Aqui não tem segredo no
código — os tokens ficam em Secrets, que continuam privados mesmo em repo
público.

```bash
gh repo create divulgacao --public --source=. --push
```

Prefere manter privado? Então use um bucket público do Supabase para as imagens:
defina a variável `MEDIA_MODE=supabase` e os secrets `SUPABASE_URL` e
`SUPABASE_SERVICE_ROLE_KEY` (bucket `marketing`, público).

---

## Bloco 1 — Bluesky (3 minutos)

1. Crie a conta em https://bsky.app (ex.: `waldeapps.bsky.social`).
2. **Configurações → Privacidade e segurança → Senhas de aplicativo → Adicionar**.
3. Dê um nome (`divulgacao`) e copie a senha no formato `xxxx-xxxx-xxxx-xxxx`.

Secrets:

| Secret | Valor |
|---|---|
| `BLUESKY_IDENTIFIER` | seu handle, ex. `waldeapps.bsky.social` |
| `BLUESKY_APP_PASSWORD` | a senha de aplicativo |

Pronto. Não tem revisão, não tem app, não expira.

---

## Bloco 2 — Meta: Instagram + Facebook

### 2.1 Contas

1. **Página do Facebook** (não perfil pessoal): https://www.facebook.com/pages/creation
2. **Instagram profissional**: app do Instagram → Ajustes → Tipo de conta →
   **Conta profissional** (Criador ou Empresa).
3. **Vincular os dois**: Instagram → Ajustes → Central de Contas → Conectar → escolha a Página.

### 2.2 App da Meta

1. https://developers.facebook.com/apps → **Criar aplicativo** → tipo **Negócios**.
2. Nome: `Divulgação Waldeapps`.
3. Em **Adicionar produto**: adicione **Instagram** e **Login do Facebook para Negócios**.
4. **Deixe o app em modo de Desenvolvimento.** Como ele só publica nas SUAS
   contas, não precisa de App Review nem de verificação de negócio.
5. Anote **App ID** e **App Secret** (Configurações → Básico).

### 2.3 Token que não expira

1. **Ferramentas → Graph API Explorer**.
2. Aplicativo: `Divulgação Waldeapps`. Permissões:
   `pages_manage_posts`, `pages_read_engagement`, `pages_show_list`,
   `instagram_basic`, `instagram_content_publish`.
3. **Gerar Access Token** → autorize.
4. Troque por um token de 60 dias (no navegador, substituindo os valores):
   ```
   https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=APP_ID&client_secret=APP_SECRET&fb_exchange_token=TOKEN_CURTO
   ```
5. Com o token longo, pegue o **token da Página** — este **não expira**:
   ```
   https://graph.facebook.com/v21.0/me/accounts?access_token=TOKEN_LONGO
   ```
   Guarde o `access_token` (é o `META_ACCESS_TOKEN`) e o `id` (é o `META_PAGE_ID`).
6. Descubra o id do Instagram:
   ```
   https://graph.facebook.com/v21.0/PAGE_ID?fields=instagram_business_account&access_token=TOKEN_DA_PAGINA
   ```

Secrets:

| Secret | Valor |
|---|---|
| `META_ACCESS_TOKEN` | token **da Página** (passo 5) |
| `META_PAGE_ID` | id da Página (passo 5) |
| `META_IG_USER_ID` | id do Instagram (passo 6) |
| `META_APP_ID` / `META_APP_SECRET` | do passo 2.2 — usados só para monitorar a validade |


META_ACCESS_TOKEN=EAAjbmSKhl98BSKi4JDqZBDFhVngy4yUWeDbQuyZALZAJ8lOjxruI8dal365zac4n1KIzlRZCGS5ZCmDIAkz8EptwSVIKWsZAzY8ZA1amMlgVePHWy6mYeXI6IbPEE1sH4xX1yWg2bVP09bcDeDuuJwprLZAHiBEwGYHZCXYZCz2MtBOphywyuw6ugzizlZB402dP35ZBuZAwYqPY3
META_PAGE_ID=1293634587162251
META_IG_USER_ID=1293634587162251
META_APP_ID= 2493250571179999
META_APP_SECRET=9b4b7ca4da6971ca16b9d527f84244cd
	
---

## Bloco 3 — Threads

O Threads usa o mesmo app da Meta, mas **token próprio** e host próprio.

1. No app da Meta → **Adicionar produto → Threads API**.
2. Em **Casos de uso**, habilite `threads_basic` e `threads_content_publish`.
3. Configure a URI de redirecionamento (qualquer URL sua serve, ex.:
   `https://waldeapps.lovable.app/`).
4. Gere o token pelo **Graph API Explorer do Threads** ou pelo fluxo de login do
   produto Threads. Pegue também o seu **user id** do Threads:
   ```
   https://graph.threads.net/v1.0/me?fields=id,username&access_token=SEU_TOKEN
   ```

Secrets:

| Secret | Valor |
|---|---|
| `THREADS_USER_ID` | o `id` acima |
| `THREADS_ACCESS_TOKEN` | o token (60 dias — **renovado sozinho**, ver abaixo) |

---

## Bloco 4 — TikTok

**Leia isto antes:** enquanto o app não passar pela auditoria do Content Posting
API, todo post publicado por API sai **privado (SELF_ONLY)** — só você vê. É
regra do TikTok, não limitação do código. A auditoria é gratuita e leva de 2 a 6
semanas.

1. https://developers.tiktok.com/apps → **Create an app**.
2. Produto **Content Posting API** → habilite **Direct Post**.
3. Escopos: `video.upload`, `video.publish`, `user.info.basic`.
4. **Solicite a auditoria já** (é o item de maior espera). Texto sugerido:

   > Aplicação interna, de uso exclusivo do proprietário das contas, que publica
   > cards informativos sobre os aplicativos próprios (utilitários gratuitos de
   > finanças pessoais, saúde e consumo). Não há usuários terceiros: o app
   > publica somente na conta do próprio desenvolvedor, em agenda automatizada.
   > Todo o conteúdo é original e produzido por nós.

5. Rode o fluxo OAuth uma vez para obter o **refresh token** (o access token dura
   24h e é renovado sozinho a partir dele).

Secrets:

| Secret | Valor |
|---|---|
| `TIKTOK_CLIENT_KEY` / `TIKTOK_CLIENT_SECRET` | do painel do app |
| `TIKTOK_REFRESH_TOKEN` | do fluxo OAuth |

Variável (não é secret): `TIKTOK_PRIVACY` — deixe `SELF_ONLY` até a auditoria
sair; depois mude para `PUBLIC_TO_EVERYONE` em **Settings → Variables**.

---

## Bloco 5 — Renovação automática (recomendado)

O Threads expira em 60 dias e o refresh do TikTok rotaciona a cada uso. Para o
sistema atualizar os próprios secrets sem você:

1. https://github.com/settings/tokens → **Fine-grained token**.
2. Repositório: só o `divulgacao`. Permissão: **Secrets: Read and write**.
3. Salve como secret `GH_PAT`.

Sem isso nada quebra — o workflow apenas **abre uma issue** avisando que um token
precisa de você.

---

## Bloco 6 — Captura das telas dos apps (opcional, recomendado)

Os cards mostram um celular com a **tela interna real** de cada app. Essas telas
são fotografadas pelo `scripts/capturar.mjs` (Playwright) e commitadas em
`assets/capturas/`. O workflow `capturar` refaz isso semanalmente.

Como Remedin, AI-Eat, Convertendo e Vai dar quanto? exigem conta para mostrar o
interior, a captura precisa autenticar. Use uma conta sua (a mesma dos apps):

1. Em `Settings → Secrets and variables → Actions`, crie dois secrets:

| Secret | Valor |
|---|---|
| `CAPTURAS_EMAIL` | e-mail da conta (ex.: `waldeapps@gmail.com`) |
| `CAPTURAS_SENHA` | senha dessa conta |

2. Localmente, coloque os mesmos valores em `.env.local`:

```
CAPTURAS_EMAIL=waldeapps@gmail.com
CAPTURAS_SENHA=...
```

Para recapturar na sua máquina (o Chromium do Playwright precisa estar
instalado: `npx playwright install chromium`):

```bash
npm run capturar            # todos os apps
npm run capturar -- --app gasonol
```

O GASONOL não pede login e é capturado por um fluxo (seletor → calculadora →
resultado). Os demais navegam nas rotas internas após autenticar. Se a captura
falhar, os cards usam as telas anteriores — publicar nunca quebra por isso.

---

## Conferir tudo

Local (crie um `.env.local` a partir do `.env.example`):

```bash
npm install && npm run verificar
```

No GitHub: aba **Actions → tokens → Run workflow**. O log lista canal por canal.

Teste sem publicar nada:

```bash
npm run dry
```

E o primeiro post de verdade, num canal só:

```bash
node scripts/publicar.mjs --canais bluesky
```

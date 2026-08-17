# Automação de divulgação — Setup

A automação lê credenciais de `marketing/.env.marketing` (local) ou de variáveis
de ambiente (GitHub Actions secrets). Copie o modelo e preencha conforme abaixo.

```bash
cp marketing/.env.marketing.example marketing/.env.marketing
```

> **Nunca** envie senha de login ou cookie. Só tokens de API oficiais. O
> arquivo `.env.marketing` é gitignored — não o comite.

---

## 1. E-mail (Resend) — ~5 min

1. Crie uma conta em https://resend.com
2. Adicione um **domínio** (ex: `vaidarquanto.com.br`) e siga a verificação de DNS.
3. Crie uma **API key** em `API Keys` → `Create API Key` → copie o `re_...`.
4. Preencha:
   - `RESEND_API_KEY=re_...`
   - `RESEND_FROM="Vai dar quanto? <oi@vaidarquanto.com.br>"`

**Para `--to=supabase`** (enviar aos usuários do app), o Resend precisa de um
público. O script só busca os e-mails; envie com `--to=supabase`.

---

## 2. Instagram (Meta Graph API) — ~20 min

> ⚠️ **O produto "Instagram" só aparece se o app for criado do jeito certo.** A
> Meta mudou a interface: hoje o tipo de app é escolhido pelo **caso de uso**.

> ⚠️ **Pré-requisito (causa do erro "Função de desenvolvedor é insuficiente")**:
> a conta Instagram precisa ser profissional **E** estar vinculada a um negócio
> do Facebook (Meta Business). Antes de configurar o app:
> 1. Crie/use uma **página do Facebook** (facebook.com/pages/create)
> 2. Em business.facebook.com, adicione a página e **Conecte o Instagram** em
>    Configurações → **Contas vinculadas → Instagram**
> Sem essa vinculação, a API de conteúdo recusa com "Função de desenvolvedor
> é insuficiente".

1. Em https://developers.facebook.com/apps → **Criar app**:
   - **Caso de uso**: escolha **Outro** (última opção, em "Refine seu caso de uso")
   - **Tipo de app**: **Empresa**
   - Se criou com "Consumidor" ou outro caso de uso, **não há opção Instagram** — crie um novo.
2. Na página do app, em **Adicionar produtos ao seu app**, procure **Instagram** →
   abra o produto (a sub-opção usada é **API de conteúdo**).
3. Em **Configurações > Básico**, anote o *App ID* e o *App Secret*.
4. **Vincule a conta**: em *Instagram > API de conteúdo*, clique em **Configurar** e
   faça login com a conta do Facebook/Instagram que gerencia a conta profissional.
   - A conta do Instagram precisa ser **profissional** (Criador/Empresa) e estar
     vinculada a uma página ou perfil de negócio do Facebook.
5. No **Graph API Explorer**: selecione o app, e adicione a permissão
   `instagram_content_publish` (e `pages_read_engagement` se aparecer). Gere o token.
6. Troque o token **curto** por **longo** (60 dias):
   `GET /oauth/access_token?grant_type=fb_exchange_token&client_id=APP_ID&client_secret=APP_SECRET&fb_exchange_token=SHORT_TOKEN`
7. Obtenha o `IG_USER_ID`:
   `GET /me/accounts` → page id → `GET /{page_id}?fields=instagram_business_account`
8. Preencha:
   - `IG_ACCESS_TOKEN=...`
   - `IG_USER_ID=...`
   - `IG_IMAGE_URL=https://vaidarquanto.com.br/screenshots/wide.webp`

**Se ainda não aparecer o produto Instagram**: a causa mais comum é o app ter
sido criado como Consumidor, ou a conta do Facebook não ter uma página/negócio
vinculada. Crie o app novamente com caso de uso **Outro → Empresa**.

**Erro "Função de desenvolvedor é insuficiente"** ao configurar a conta: o
perfil do Facebook logado não é Admin do app. Corrija em
`developers.facebook.com/apps/<APP_ID>/app-roles/`: confirme que o perfil logado
é **Admin**, e se a conta Instagram a conectar pertence a outro Facebook,
adicione esse perfil como Admin antes de tentar de novo.

---

## 3. Meta Ads — ~15 min

1. No mesmo app da Meta, adicione o produto **Marketing API**.
2. Crie uma conta de anúncios em https://business.facebook.com → **Conta de anúncios**
   (anote o ID com prefixo `act_`).
3. Conceda `ads_management` e `ads_read` ao app/token no **Business Manager**.
4. Gere o token no **Graph API Explorer** com essas permissões.
5. Preencha:
   - `META_ADS_ACCESS_TOKEN=...`
   - `META_AD_ACCOUNT_ID=act_0000000000000000`
   - `META_PAGE_ID=...` (página que veiculará o anúncio)
   - `META_ADS_DAILY_BUDGET_BRL=500` (limite diário)

> Segurança: o script **sempre cria campanhas pausadas**. Nenhum real é gasto
> até você revisar no Ads Manager. Para ativar: `--channel=meta-ads --activate --yes`.

---

## 4. Google Ads — módulo esqueleto

Ainda não implementado (o alvo inicial é o Meta Ads). Habilite depois seguindo a
Google Ads REST API. As variáveis são `GOOGLE_ADS_*` (developer token, OAuth).

---

## Como usar

```bash
# Sem credenciais: valida e mostra o que faria (recomendado primeiro)
node marketing/publish.mjs --dry-run

# Instagram: post de lançamento
node marketing/publish.mjs --channel=instagram --campaign=launch

# E-mail: reativação para os usuários do app
node marketing/publish.mjs --channel=email --campaign=reactivation --to=supabase

# E-mail: oferta para uma lista literal
node marketing/publish.mjs --channel=email --campaign=promo --to=a@x.com,b@y.com

# Meta Ads: cria campanha PAUSADA (sem gasto)
node marketing/publish.mjs --channel=meta-ads
```

O orquestrador guarda o que já publicou em `marketing/.publish-log.json` e não
repete dentro da janela de cooldown (`--force` ignora).

## No GitHub Actions

1. Publique este repositório.
2. Em **Settings > Secrets and variables > Actions**, adicione as mesmas chaves
   (RESEND_API_KEY, IG_ACCESS_TOKEN, etc.).
3. O workflow roda toda quarta e publica Instagram + e-mail. Disparo manual:
   *Actions > Marketing automation > Run workflow*.

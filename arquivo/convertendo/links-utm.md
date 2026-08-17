# Convertendo — Links com UTM prontos para copiar

> Copie o link e cole na divulgação. Cada link identifica o canal e a campanha no painel **Admin → Funil → Canais (UTM)**.
> Regra: `utm_source` = canal · `utm_medium` = tipo · `utm_campaign` = ação.

## 1. Home — campanha de divulgação geral

| Canal | Link |
|-------|------|
| X (Twitter) | https://convertendo.app.br/?utm_source=x&utm_medium=social&utm_campaign=divulgacao |
| Instagram | https://convertendo.app.br/?utm_source=instagram&utm_medium=social&utm_campaign=divulgacao |
| LinkedIn | https://convertendo.app.br/?utm_source=linkedin&utm_medium=social&utm_campaign=divulgacao |
| TikTok | https://convertendo.app.br/?utm_source=tiktok&utm_medium=social&utm_campaign=divulgacao |
| Facebook | https://convertendo.app.br/?utm_source=facebook&utm_medium=social&utm_campaign=divulgacao |
| YouTube | https://convertendo.app.br/?utm_source=youtube&utm_medium=social&utm_campaign=divulgacao |
| WhatsApp | https://convertendo.app.br/?utm_source=whatsapp&utm_medium=social&utm_campaign=divulgacao |
| Telegram | https://convertendo.app.br/?utm_source=telegram&utm_medium=social&utm_campaign=divulgacao |
| Reddit | https://convertendo.app.br/?utm_source=reddit&utm_medium=social&utm_campaign=divulgacao |

## 2. Guia de IOF (conteúdo educativo)

| Canal | Link |
|-------|------|
| X | https://convertendo.app.br/guias/iof-cartao-credito-internacional?utm_source=x&utm_medium=social&utm_campaign=guia_iof |
| Instagram | https://convertendo.app.br/guias/iof-cartao-credito-internacional?utm_source=instagram&utm_medium=social&utm_campaign=guia_iof |
| LinkedIn | https://convertendo.app.br/guias/iof-cartao-credito-internacional?utm_source=linkedin&utm_medium=social&utm_campaign=guia_iof |
| WhatsApp | https://convertendo.app.br/guias/iof-cartao-credito-internacional?utm_source=whatsapp&utm_medium=social&utm_campaign=guia_iof |

## 3. Guia de conversor de moeda (conteúdo educativo)

| Canal | Link |
|-------|------|
| LinkedIn | https://convertendo.app.br/guias/conversor-de-moeda?utm_source=linkedin&utm_medium=social&utm_campaign=guia_cambio |
| X | https://convertendo.app.br/guias/conversor-de-moeda?utm_source=x&utm_medium=social&utm_campaign=guia_cambio |
| WhatsApp | https://convertendo.app.br/guias/conversor-de-moeda?utm_source=whatsapp&utm_medium=social&utm_campaign=guia_cambio |

## 4. Guia de franquia alfandegária (conteúdo educativo)

| Canal | Link |
|-------|------|
| Instagram | https://convertendo.app.br/guias/franquia-alfandegaria?utm_source=instagram&utm_medium=social&utm_campaign=guia_franquia |
| TikTok | https://convertendo.app.br/guias/franquia-alfandegaria?utm_source=tiktok&utm_medium=social&utm_campaign=guia_franquia |
| X | https://convertendo.app.br/guias/franquia-alfandegaria?utm_source=x&utm_medium=social&utm_campaign=guia_franquia |

## 5. Product Hunt (lançamento)

| Onde | Link |
|------|------|
| Perfil do PH / redes no dia | https://convertendo.app.br/?utm_source=producthunt&utm_medium=referral&utm_campaign=ph_launch |

## 6. Google Ads (se for investir)

| Campanha | Link |
|----------|------|
| "conversor de dólar" | https://convertendo.app.br/?utm_source=google_ads&utm_medium=cpc&utm_campaign=conversor_dolar |
| "cambio turismo" | https://convertendo.app.br/?utm_source=google_ads&utm_medium=cpc&utm_campaign=cambio_turismo |
| "quanto custa em reais" | https://convertendo.app.br/?utm_source=google_ads&utm_medium=cpc&utm_campaign=quanto_custa_reais |

> Obs.: para campanhas pagas, além do UTM, configure a **conversão de checkout** no Google Ads depois.

## 7. Email / público que já tem conta

| Onde | Link |
|------|------|
| Newsletter | https://convertendo.app.br/planos?utm_source=email&utm_medium=email&utm_campaign=newsletter_planos |

> `/planos` exige login — use só para quem já tem conta (newsletter de usuários).

---

## Como validar que está funcionando

1. Abra uma aba anônima (ou limpe `sessionStorage`).
2. Cole um link acima, ex.: `https://convertendo.app.br/?utm_source=x&utm_medium=social&utm_campaign=divulgacao`.
3. No app, entre em **Admin → Funil → Canais** e verifique se `x` apareceu com 1 visitante.
4. Repita com outro canal — cada fonte aparece como uma linha separada.

**Regra de ouro:** nunca poste a home sem UTM. Sem UTM, o visitante cai em `utm_source` "sem canal" e você não sabe de onde veio.

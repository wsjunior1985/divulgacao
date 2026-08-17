# Ads e e-mail — capacidades que o núcleo não cobre

Isto veio de `vaidarquanto/marketing/` e **não** foi absorvido por
`scripts/publicar.mjs`, que só cuida de redes sociais orgânicas. Está aqui para
não se perder, mas continua sendo execução manual.

O que faz:

| Canal | Arquivo | O que exige |
|---|---|---|
| E-mail de reativação | `lib/resend.mjs`, `lib/audience.mjs` | `RESEND_API_KEY`, e a lista sai do Supabase do app |
| Campanha paga na Meta | `lib/meta-ads.mjs` | conta de anúncios verificada e **orçamento real** |
| Campanha paga no Google | `lib/google-ads.mjs` | idem |

```bash
node publish.mjs --dry-run
node publish.mjs --channel=email --campaign=reactivation --to=supabase
```

**Cuidado:** `--activate` em campanha paga gasta dinheiro de verdade. O script
exige `--yes` junto, de propósito.

Os textos em `lib/templates.mjs` falam só do "Vai dar quanto?" — se for reusar
para outro app, troque-os antes.

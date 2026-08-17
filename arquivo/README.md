# Arquivo — material das automações antigas

Aqui está o que existia espalhado dentro dos cinco apps antes de tudo ser
centralizado neste repositório, em 17/08/2026. Nada aqui roda: é acervo.

Foram três automações paralelas e divergentes, cada uma com sua ideia:

| Origem | O que era | Substituído por |
|---|---|---|
| `remedin/scripts/divulgacao/` | Runner com Meta + TikTok e manifesto de posts com data fixa (`posts.json`) | `scripts/publicar.mjs` — o rodízio é calculado pela data e não acaba |
| `convertendo/scripts/marketing/` | Planner de 7 dias + cards + Cloudinary, enfileirando no Buffer à mão | `scripts/canais/buffer.js` — o cron enfileira sozinho |
| `vaidarquanto/marketing/` | Publisher próprio com Instagram, e-mail (Resend) e campanhas pagas | Instagram: coberto. E-mail e Ads: ver `../extra/ads-e-email/` |

**Por que guardar:** os textos de divulgação (`divulgacao.md`, `conteudo.md`,
`redes-sociais.md`, os planners) são matéria-prima boa para novos temas em
`apps/*.json`. Se um tema aqui ainda faz sentido, copie o texto para o perfil do
app e ele entra no rodízio.

As imagens foram convertidas de PNG para WebP na mudança (4,2 MB → 0,4 MB).

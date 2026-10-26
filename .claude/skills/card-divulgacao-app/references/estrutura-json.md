# Estrutura de `apps/<id>.json` (resumo; modelo real: `apps/fazopix.json`, `apps/barbarizando.json`)

```jsonc
{
  "id": "novoapp",                      // curto, estável, sem espaços
  "nome": "Novo App",
  "url": "https://novoapp.waldeapps.systems",   // domínio PÚBLICO real (confira que responde)
  "tagline": "Frase curta de marca.",
  "fonte": "jakarta",                   // chave em scripts/lib/cards/comum.js (inter, barlow, fraunces, manrope, jakarta, sora, spacegrotesk…)
  "marca": { "emoji": "🚀", "fundoA": "#06231e", "destaque": "#00806b" },
  "visual": {
    "layout": "vitrine",                // ou o id de um layout próprio em scripts/lib/cards/<id>.js
    "efeito": "luz",                    // "luz" (padrão) ou "fogo"
    "acento": "#19c2a6", "acento2": "#5fdcc6", "calor": "#00806b",
    "fonteTitulo": "jakarta",
    "urlSufixo": "",
    "selos": [ { "icone": "check", "titulo": "Sem cadastro" } ]   // 3 selos do rodapé
  },
  "recursos": [ { "icone": "celular", "titulo": "Recurso", "descricao": "Descrição curta e verdadeira." } ],
  "chips": ["Chip 1", "Chip 2"],
  "selos": [ { "icone": "check", "titulo": "Selo" } ],
  "hashtags": ["#novoapp", "#tema"],
  "posts": [                            // EXATAMENTE 8
    {
      "id": "tema-1",
      "card": { "titulo": "Título com *destaque*", "sub": "Subtítulo curto" },
      "ganchos": ["Abertura 1", "Abertura 2"],
      "corpos":  ["Parágrafo 1", "Parágrafo 2"],
      "ctas":    ["👉 {link}"],
      "curtos":  ["Versão curta com {link}"],            // Bluesky/X (≤ 280 caracteres com o link)
      "premium": {
        "titulo": "Primeira<br>segunda linha",            // até 2–3 linhas, sem palavra órfã
        "destaque": "Linha de destaque (cor da marca)",
        "sub": "Subtítulo com <b>trecho em negrito</b>.",
        "tela": "tela-qr-pronto",                         // assets/premium/<id>/tela-qr-pronto.png
        "tamanho": 104,                                   // opcional: corpo fixo do título
        "beneficios": [ { "icone": "cronometro", "titulo": "Curto", "texto": "Frase de apoio." } ]   // 3 itens
      }
    }
  ]
}
```

- `{link}` vira a URL do app com UTM do canal (no texto só aparece o domínio).
- Ícones disponíveis: `NOMES_ICONES` em `scripts/lib/icones.js` (o script falha silenciosamente com um ícone desconhecido: confira).
- Sem `premium`, o card usa `card.titulo` (trecho entre `*asteriscos*` vira o destaque), `card.sub` e os 3 primeiros `recursos`.
- O texto combina `ganchos × corpos × ctas` em ciclo: escreva 2+ de cada para variar sem repetir.

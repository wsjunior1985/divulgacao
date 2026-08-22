# Como adicionar um novo projeto

Se você quer só o caminho mais curto, abra [`GUIA-RAPIDO.md`](GUIA-RAPIDO.md).
Este arquivo fica como referência completa.

Este repositório publica os apps em rodízio determinístico. Hoje a regra prática
é simples: se você quer que nenhum projeto fique de fora em um dia, o total de
horários precisa ser igual ao total de apps.

Exemplo atual:

- 6 apps
- 6 horários por dia
- 1 slot por app, sem repetição no mesmo dia

Se você adicionar um 7º projeto, a agenda precisa ganhar um 7º horário. Se
ficar com menos horários do que apps, algum projeto vai pular aquele dia. Se
ficar com mais horários, algum app vai repetir no mesmo dia.

## O que precisa ser criado

Use o app atual como referência. O pacote mínimo é:

- `apps/<id>.json`
- `assets/logos/<id>.png`
- `assets/capturas/<id>-0.png`
- `assets/capturas/<id>-1.png`
- `assets/capturas/<id>-2.png`

Se o projeto tiver uma fonte de display própria, adicione também o arquivo `.ttf`
em `assets/fontes/` e o mapeamento em `scripts/lib/cards.js`.

## Estrutura do JSON

Mantenha o arquivo no mesmo formato dos apps já existentes:

```json
{
  "id": "novoapp",
  "nome": "Novo App",
  "url": "https://novoapp.com.br",
  "tagline": "Frase curta de marca",
  "fonte": "inter",
  "marca": {
    "emoji": "🚀",
    "fundoA": "#101427",
    "destaque": "#7c3aed"
  },
  "recursos": [
    { "icone": "grafico", "titulo": "Recurso 1", "descricao": "Descrição curta" }
  ],
  "chips": ["Chip 1", "Chip 2"],
  "selos": [
    { "icone": "estrela", "titulo": "Selo 1" }
  ],
  "hashtags": ["#novoapp", "#produto"],
  "posts": [
    {
      "id": "tema-1",
      "card": {
        "titulo": "Título com *destaque*",
        "sub": "Subtítulo curto"
      },
      "ganchos": ["Abertura 1", "Abertura 2"],
      "corpos": ["Parágrafo 1", "Parágrafo 2"],
      "ctas": ["👉 {link}"],
      "curtos": ["Versão curta com {link}"]
    }
  ]
}
```

Regras práticas:

- use `id` curto, estável e sem espaços;
- mantenha `8 posts` por app, como os projetos atuais;
- prefira `ganchos`, `corpos`, `ctas` e `curtos` para o texto variar sozinho;
- use `card.titulo` e `card.sub` para orientar o layout do card;
- inclua `destaque` apenas quando fizer sentido visual.

## Ordem do rodízio

A ordem que vai para a publicação fica em
[`scripts/lib/conteudo.js`](/Users/wsjunior/Projetos/divulgacao/scripts/lib/conteudo.js),
na constante `ORDEM_APPS`.

Ao entrar um projeto novo:

1. adicione o `id` do novo app em `ORDEM_APPS`;
2. mantenha essa ordem coerente com a história que você quer contar no feed;
3. se a quantidade de apps mudar, atualize também os horários do dia.

## Horários e cron

Os horários vivem em quatro lugares e precisam bater:

- `scripts/publicar.mjs`
- `scripts/agenda.mjs`
- `scripts/calendario.mjs`
- `.github/workflows/publicar.yml`

O valor também aparece em `.env.example` e, localmente, em `.env.local`.

Se a meta for "nenhum projeto fica de fora no mesmo dia", os horários devem
ter a mesma quantidade que os apps. Hoje isso significa:

- `08h`
- `11h`
- `14h`
- `17h`
- `20h`
- `21h`

## Validação rápida

Depois de criar ou alterar um app, rode nesta ordem:

```bash
npm run cards -- --app novoapp --todos
npm run agenda -- --dias 7
npm run calendario
npm run verificar
```

Se houver captura nova, rode também:

```bash
npm run capturar -- --app novoapp
```

E, antes de deixar o cron publicar, confira um dry-run:

```bash
npm run dry
```

## Checklist de entrega

- o JSON novo está em `apps/`;
- o logo está em `assets/logos/`;
- as capturas estão em `assets/capturas/`;
- `ORDEM_APPS` foi atualizado;
- os horários do dia batem com a quantidade de apps;
- o calendário foi regenerado;
- o preview do card ficou bom;
- o commit foi feito só com os arquivos do projeto.

## Exemplo recente

O projeto `O Palpiteiro` entrou por este fluxo:

- `apps/opalpiteiro.json`
- `assets/logos/opalpiteiro.png`
- `assets/capturas/opalpiteiro-0.png`
- `assets/capturas/opalpiteiro-1.png`
- `assets/capturas/opalpiteiro-2.png`
- `assets/capturas/opalpiteiro-3.png`
- atualização em `scripts/lib/conteudo.js`
- ajuste de horários para manter 6 apps por dia

Esse conjunto serve como modelo para os próximos projetos.

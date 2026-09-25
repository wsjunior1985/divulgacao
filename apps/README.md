# Como adicionar um novo projeto

Se você quer só o caminho mais curto, abra [`GUIA-RAPIDO.md`](GUIA-RAPIDO.md).
Este arquivo fica como referência completa.

Este repositório publica os apps em rodízio determinístico: a cada horário do
dia, o próximo app da lista `ORDEM_APPS` publica o próximo tema dele.

Hoje são 7 horários por dia e mais apps do que horários. Isso é intencional:
os apps se revezam ao longo da semana (nenhum repete no mesmo dia) em vez de
lotar os perfis com um post de cada app todo dia. Para incluir um app novo,
basta acrescentá-lo em `ORDEM_APPS` — os horários não mudam.

Regra do estúdio: um app só entra em `ORDEM_APPS` depois que o card 1 no padrão
premium for aprovado pelo dono.

## O que precisa ser criado

Use o app atual como referência. O pacote mínimo é:

- `apps/<id>.json`
- `assets/logos/<id>.png`
- `assets/capturas/<id>-0.png`
- `assets/capturas/<id>-1.png`
- `assets/capturas/<id>-2.png` *(opcional, se você quiser manter três telas)*

Se o projeto tiver telas internas novas, registre as rotas em
[`scripts/capturar.mjs`](../scripts/capturar.mjs) para que o recapturador
automático continue funcionando.

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
- o card segue o padrão premium: escreva o bloco `premium` de cada post
  (título, destaque, subtítulo, três benefícios e a tela do app) e o bloco
  `visual` do app (cores, efeito, fonte do título, selos) — ver "O card" no
  [README](../README.md) e o exemplo em `gasonol.json`;
- sem `premium`, o card usa `card.titulo` (o trecho entre `*asteriscos*` vira
  a linha de destaque), `card.sub` e os três primeiros `recursos`;
- as telas do tema ficam em `assets/premium/<id>/` e a logo em alta em
  `assets/premium/<id>/logo.png` (sem dados pessoais nas telas).

## Ordem do rodízio

A ordem que vai para a publicação fica em
[`scripts/lib/conteudo.js`](/Users/wsjunior/Projetos/divulgacao/scripts/lib/conteudo.js),
na constante `ORDEM_APPS`.

Ao entrar um projeto novo:

1. adicione o `id` do novo app em `ORDEM_APPS`;
2. mantenha essa ordem coerente com a história que você quer contar no feed;
3. os horários não mudam: continuam 7 por dia, e os apps se revezam neles.

## Horários e cron

Os horários (7 por dia, fixos) vivem em quatro lugares e precisam bater entre si:

- `scripts/publicar.mjs`
- `scripts/agenda.mjs`
- `scripts/calendario.mjs`
- `.github/workflows/publicar.yml`

O valor também aparece em `.env.example` e, localmente, em `.env.local`.

Os horários ficam fixos em 7 por dia; o número de apps pode ser maior (ver o início deste guia).

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
- o card 1 premium foi aprovado pelo dono antes de entrar em `ORDEM_APPS`;
- o calendário foi regenerado;
- um exemplo visual do card foi mostrado para o usuário aprovar ou pedir
  ajustes antes de ir para produção;
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
- (na época, com ajuste de horários; hoje eles ficam fixos em 7)

`Papelzinho` entrou logo depois, usando o mesmo fluxo:

- `apps/papelzinho.json`
- `assets/logos/papelzinho.png`
- `assets/capturas/papelzinho-0.png`
- `assets/capturas/papelzinho-1.png`
- captura automática registrada em `scripts/capturar.mjs`
- atualização em `scripts/lib/conteudo.js`
- (na época, com ajuste de horários; hoje eles ficam fixos em 7)

Esse conjunto serve como modelo para os próximos projetos.

# Divulgação automática

Publica sozinho os sete apps — **Vai dar quanto?, AI-Eat, GASONOL, Convertendo,
Remedin, O Palpiteiro e Papelzinho** — no **Instagram, Facebook, Threads,
Bluesky, TikTok e X**, em rodízio, de graça, sem ninguém apertar botão.

Depois do [SETUP.md](SETUP.md), a sua participação é: nenhuma.

## Deploy

Veja o guia local em [DEPLOY.md](./DEPLOY.md). Este projeto tem fluxo
especial; não volte para GitHub Actions como caminho de deploy de app web.

## Como funciona

O GitHub Actions dispara nos horários agendados. A cada disparo o sistema:

1. calcula o **slot** a partir da data — o rodízio é determinístico, então nunca
   existe fila para reabastecer e o conteúdo não acaba;
2. escolhe o app da vez e o tema da vez (`apps/*.json`);
3. renderiza o card premium (HTML/CSS no Chromium → JPEG; retrato para o feed,
   vertical para o TikTok);
4. hospeda o card (commit no próprio repo → `raw.githubusercontent.com`);
5. publica em cada canal, com o texto adaptado ao limite e ao formato de cada um
   e UTM próprio por rede;
6. registra em `estado/publicados.json` para não repetir.

Falha de um canal não derruba os outros: o log diz o que saiu, o que foi pulado
por falta de credencial e o que quebrou.

## Comandos

```bash
npm run agenda            # o que sai nos próximos 7 dias (previsão exata)
npm run dry               # o post de agora, sem publicar
npm run verificar         # testa cada credencial com uma chamada real de leitura
npm run cards             # gera cards para conferir o visual
npm run capturar          # refotografa as telas reais dos apps
npm run semear            # semeia dados de exemplo nas contas (telas "vivas")
npm run publicar          # publica o slot atual
npm run renovar           # renova os tokens que expiram
```

Variações úteis:

```bash
node scripts/publicar.mjs --canais bluesky,threads
node scripts/publicar.mjs --slot 42 --dry-run
node scripts/cards.mjs --app gasonol --todos
node scripts/agenda.mjs --dias 30
```

## O card

Todo card segue o **padrão premium**: uma página HTML/CSS renderizada no
Chromium (Playwright) e salva em JPEG, em [`scripts/lib/cards.js`](scripts/lib/cards.js).
Retrato 1080×1350 para o feed e 1080×1920 para o TikTok.

A composição é fixa:

1. **Logo oficial** no alto, à esquerda (`assets/premium/<app>/logo.png`, com
   `assets/logos/<app>.png` de reserva).
2. **Título** em duas cores: as linhas brancas e uma linha de **destaque** com o
   gradiente do app. Se não couber, o próprio card reduz o corpo até caber na
   coluna e não encostar no site.
3. **Subtítulo** e **três benefícios** em caixas com ícone neon.
4. **Celular em perspectiva 3D** com uma **tela real do app** — nunca a landing.
5. **O site do app** numa pílula amarela e três **selos** no rodapé.

O fundo é desenhado na hora (feixes de luz, faíscas, vinheta), com a cor e o
efeito de cada app. No vertical, pílula e selos sobem para ficar acima da
legenda que o TikTok sobrepõe.

### De onde vem cada parte

| Parte | Campo em `apps/<app>.json` | Sem o campo |
|---|---|---|
| Cores, efeito, fonte do título, selos, sufixo do site | `visual` | derivados de `marca.destaque`, `fonte` e `selos` |
| Título, destaque, subtítulo, benefícios | `posts[].premium` | trecho entre `*asteriscos*` do `card.titulo` vira o destaque; os 3 primeiros `recursos` viram benefícios |
| Tela do celular | `posts[].premium.tela` → `assets/premium/<app>/<tela>.png` | capturas automáticas de `assets/capturas/`, em rodízio |

Exemplo de tema premium:

```json
"premium": {
  "titulo": "Gasolina<br>ou Etanol?",
  "destaque": "Descubra na hora",
  "sub": "O <b>GASONOL</b> mostra em segundos qual combustível compensa mais.",
  "tela": "tela-calculadora",
  "tamanho": 104,
  "beneficios": [
    { "icone": "cronometro", "titulo": "Cálculo rápido", "texto": "Resultado em segundos." }
  ]
}
```

`tamanho` (opcional) fixa o corpo do título; `<br>` quebra a linha e `<b>`
destaca no subtítulo.

As fontes são arquivos locais em `assets/fontes/` (licença OFL), então o card
sai igual no Mac e no runner: Barlow Condensed no GASONOL, e a fonte do campo
`fonte` nos demais (Sora, Manrope, Fraunces, Space Grotesk, Plus Jakarta Sans,
Inter Display). A Inter fica no corpo.

Para conferir sem publicar:

```bash
npm run cards -- --app gasonol --todos
npm run cards -- --app gasonol --todos --formato vertical
```

## As capturas dos apps

As telas internas são fotografadas pelo `scripts/capturar.mjs` (Playwright):

- **GASONOL** entra com a conta (para capturar o estado premium) e percorre o
  fluxo real (seletor de veículo → calculadora → resultado), capturando os três
  estados.
- **Remedin, AI-Eat, Convertendo e Vai dar quanto?** exigem conta: o script
  autentica com `CAPTURAS_EMAIL`/`CAPTURAS_SENHA` e navega nas rotas internas.

As credenciais ficam em `.env.local` (local) e em Secrets no GitHub — nunca no
chat nem no código. Para recapturar na sua máquina:

```bash
npm run capturar            # todos os apps
npm run capturar -- --app gasonol
```

Contas novas saem com telas vazias. O `npm run semear` preenche dados de exemplo
(medicamentos no Remedin, itens no carrinho do Vai dar quanto?, hidratação no
AI-Eat) para os cards saírem com as telas "vivas" — rode uma vez, e de novo só
se os dados forem apagados.

Quando entra um projeto novo, registre as rotas dele em
[`scripts/capturar.mjs`](scripts/capturar.mjs) para a recaptura semanal
continuar funcionando sem trabalho manual.

Se uma captura falhar, o card usa as telas que já estão commitadas — a
publicação nunca é bloqueada por isso.

As telas dos temas premium do GASONOL (`assets/premium/gasonol/`) são feitas por
[`scripts/premium/capturar-gasonol.mjs`](scripts/premium/capturar-gasonol.mjs):
ele reproduz o estado logado com markup extraído da sessão real e troca dados
pessoais por fictícios (avatar genérico, "Ana Ribeiro").

## Mudar o conteúdo

Tudo vive em `apps/<app>.json`: `tagline`, cores da marca, `emblema`, `recursos`
(cada um com `icone`, `titulo` e `descricao`), `selos` do rodapé, hashtags e a
lista de temas. Os nomes de ícone disponíveis estão em `NOMES_ICONES`, em
[`scripts/lib/icones.js`](scripts/lib/icones.js) — traços na mesma grade de 24,
inseridos inline no card e pintados com a cor do app.
 Cada tema é **combinatório** — `ganchos` (aberturas), `corpos`
(parágrafos), `ctas` (fechos com `{link}`) e `curtos` (versão de 1 linha para
Bluesky/X) — e o `montarTexto` combina um de cada por enumeração mista, variando
a cada ciclo completo sem repetir o mesmo texto no ano. O `card`
(título/subtítulo/destaque) é fixo por tema.

Se for adicionar um novo projeto, comece por
[`apps/GUIA-RAPIDO.md`](apps/GUIA-RAPIDO.md): ele cabe em uma página e traz o
checklist mínimo para IA e humanos. Se quiser o guia completo, siga em
[`apps/README.md`](apps/README.md).

`{link}` vira a URL do app com UTM do canal (no texto só o domínio aparece; o
UTM viaja no clique).

São 8 temas por app, 56 no total, o que dá 8 dias de ciclo publicando 7×/dia
(1 post por app). O calendário completo do ano fica em
[`CALENDARIO-1ANO.md`](CALENDARIO-1ANO.md) (`npm run calendario`).

## Ritmo

Padrão: **7 posts por dia** (08h, 11h, 14h, 17h, 20h, 21h e 22h BRT), em
rodízio pelos apps — na ordem Remedin, AI-Eat, Vai dar quanto?, GASONOL,
Convertendo, O Palpiteiro e Papelzinho. Para mudar, ajuste a variável
`HORARIOS` (ex.: `9,13,19`) e os `cron` de
[.github/workflows/publicar.yml](.github/workflows/publicar.yml) — os dois
precisam bater.

Limites das plataformas, para referência: Instagram aceita 25 publicações por
API a cada 24h; Threads, 250.

## Custo

Zero. GitHub Actions é grátis em repositório público, e todos os canais são
gratuitos.

O X merece explicação: a **API direta** do X é paga desde fevereiro de 2026
(US$ 0,015 por post, US$ 0,20 com link), e por isso não a usamos. O canal `x`
daqui sai pelo **Buffer**, que publica no X sem cobrar porque a cota de API é
dele. O Buffer gratuito limita canais e fila, então cada execução enfileira
apenas o post do slot, poucos minutos à frente — a fila fica curta e nunca seca.

## O que ainda precisa de você

- **TikTok**: até a auditoria do Content Posting API sair (2 a 6 semanas), os
  posts saem privados. É regra da plataforma.
- **Tokens**: Threads e TikTok se renovam sozinhos se você configurar `GH_PAT`.
  O token da Meta, gerado como token de Página, não expira. Se algo assim mesmo
  precisar de você, o workflow abre uma issue.

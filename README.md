# Divulgação automática

Publica sozinho os seis apps — **Vai dar quanto?, AI-Eat, GASONOL, Convertendo,
Remedin e O Palpiteiro** — no **Instagram, Facebook, Threads, Bluesky, TikTok e
X**, em rodízio, de graça, sem ninguém apertar botão.

Depois do [SETUP.md](SETUP.md), a sua participação é: nenhuma.

## Como funciona

O GitHub Actions dispara nos horários agendados. A cada disparo o sistema:

1. calcula o **slot** a partir da data — o rodízio é determinístico, então nunca
   existe fila para reabastecer e o conteúdo não acaba;
2. escolhe o app da vez e o tema da vez (`apps/*.json`);
3. desenha o card em SVG e rasteriza em JPEG (retrato para o feed, vertical para
   o TikTok);
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

Cada post vira uma imagem gerada na hora, com a identidade real do app:

- **Logo oficial**, tirada do PWA de cada projeto (`assets/logos/`).
- **Paleta da marca**, convertida do `index.css` de cada app — os projetos
  declaram cor em `oklch` e o `lib/cor.js` traduz para sRGB. Nenhuma cor é
  escolhida no olho, e o contraste do texto é verificado.
- **Tipografia embarcada** (licença OFL, em `assets/fontes/`). O renderizador
  recebe os arquivos da fonte, então o card sai idêntico no seu Mac e no runner
  do GitHub. Antes disso o resultado mudava de máquina para máquina — Helvetica
  de um lado, DejaVu do outro.
- **Uma fonte de display por app**, no campo `fonte`: Sora no AI-Eat, Manrope no
  Remedin, Fraunces no Convertendo, Space Grotesk no GASONOL, Plus Jakarta Sans
  no Vai dar quanto? e Inter Display no O Palpiteiro. Como o rodízio publica um
  app por slot, seis posts seguidos saem com seis tipografias diferentes — a
  variedade aparece no feed sem que um mesmo app mude de cara de um post para o
  outro. A Inter continua no corpo, nas descrições e no rodapé.

  > O nome da família precisa ser o que o renderizador enxerga (name ID 16, ou
  > ID 1 quando não há). A Inter Display se chama `Inter Display`, com espaço —
  > o código pedia `InterDisplay`, que não casava com nada e caía calado no
  > fallback: media com um desenho e imprimia com outro.
- **Largura medida no arquivo da fonte** (opentype.js), não estimada: é o que
  garante que o título nunca vaze a margem.
- **Hero com o app real**: um mockup de celular mostra uma **captura da tela
  interna** do app (não a landing, não a tela de login). As capturas vivem em
  `assets/capturas/` e são refotografadas semanalmente pelo workflow `capturar`
  — a publicação usa as já commitadas, então uma captura que falha não derruba
  nada.

O layout padrão é a **vitrine**, com cinco elementos fixos:

1. **Marca no topo** — logo em ladrilho arredondado, nome no maior corpo que
   couber e a `tagline` do app. O recorte arredondado existe porque nem todo
   logo do PWA tem transparência (GASONOL e Vai dar quanto? são PNG opaco): sem
   ele, o quadrado sólido virava uma caixa preta solta no card.
2. **Manchete** com a palavra-chave na cor da marca — marque-a com asteriscos no
   título: `"Sem balança, *sem tabela*"`. Os asteriscos nunca saem no card nem no
   texto publicado; o `alt` da imagem é limpo com `semMarcadores`.
3. **Número em destaque** acima da manchete, quando o post tem `destaque`.
4. **Os quatro recursos**, cada um com ícone, cor própria, título em caixa alta e
   descrição. A cor sai de uma rampa puxada 35% para a marca, então as quatro
   variantes seguem reconhecíveis como do mesmo app.
5. **Os aparelhos** e o **rodapé** com o CTA do domínio e os `selos`. A pilha
   tem três arranjos (dois aparelhos subindo, um só maior, dois descendo),
   escolhidos pela variação do slot — sem isso os 48 cards repetiam a mesma
   composição. Ela cabe inteira dentro da margem: nada sangra na borda.

Quando o título é longo, quem cede é o corpo da manchete (78 → 42), não a lista:
os quatro recursos são identidade do app e aparecem em todos os 48 cards. Só se
nem no menor corpo couber é que um recurso sai.

Os layouts anteriores continuam no código como rede de segurança, escolhidos
quando falta material:

| Layout | Quando é usado | Campo no JSON |
|---|---|---|
| `vitrine` | padrão — exige captura e recursos | — |
| `hero` | há captura, mas o tema não tem recursos | — |
| `manchete` | sem captura: título grande, subtítulo e chips | `"layout": "classico"` |
| `recursos` | sem captura, com lista de recursos | `"layout": "recursos"` |
| `destaque` | sem captura, um número é o argumento | `"destaque": "3,38%"` |

Para conferir sem publicar:

```bash
npm run cards -- --app gasonol --todos
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

Se uma captura falhar ou o Chromium não estiver instalado, o card cai de volta
no layout só de texto — a publicação nunca é bloqueada por isso.

## Mudar o conteúdo

Tudo vive em `apps/<app>.json`: `tagline`, cores da marca, `emblema`, `recursos`
(cada um com `icone`, `titulo` e `descricao`), `selos` do rodapé, hashtags e a
lista de temas. Os nomes de ícone disponíveis estão em `NOMES_ICONES`, em
[`scripts/lib/icones.js`](scripts/lib/icones.js) — são traços desenhados na mão
na mesma grade de 24, porque o resvg não carrega SVG externo nem fonte de ícone.
 Cada tema é **combinatório** — `ganchos` (aberturas), `corpos`
(parágrafos), `ctas` (fechos com `{link}`) e `curtos` (versão de 1 linha para
Bluesky/X) — e o `montarTexto` combina um de cada por enumeração mista, variando
a cada ciclo completo sem repetir o mesmo texto no ano. O `card`
(título/subtítulo/destaque) é fixo por tema.

Se for adicionar um novo projeto, siga o checklist em
[`apps/README.md`](apps/README.md): ele resume os arquivos que precisam existir,
a ordem do rodízio, a regra dos horários e a validação antes de publicar.

`{link}` vira a URL do app com UTM do canal (no texto só o domínio aparece; o
UTM viaja no clique).

São 8 temas por app, 48 no total, o que dá 8 dias de ciclo publicando 6×/dia
(1 post por app). O calendário completo do ano fica em
[`CALENDARIO-1ANO.md`](CALENDARIO-1ANO.md) (`npm run calendario`).

## Ritmo

Padrão: **6 posts por dia** (08h, 11h, 14h, 17h, 20h e 21h BRT), em rodízio pelos
apps — na ordem Remedin, AI-Eat, Vai dar quanto?, GASONOL, Convertendo e O
Palpiteiro. Para mudar, ajuste a variável `HORARIOS` (ex.: `9,13,19`) e os `cron` de
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

# Divulgação automática

Publica sozinho os cinco apps — **Vai dar quanto?, AI-Eat, GASONOL, Convertendo e
Remedin** — no **Instagram, Facebook, Threads, Bluesky, TikTok e X**, em rodízio,
de graça, sem ninguém apertar botão.

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

## Mudar o conteúdo

Tudo vive em `apps/<app>.json`: pitch, cores da marca, hashtags e a lista de
temas. Cada tema tem o texto longo (Instagram/Facebook/Threads), a versão `curto`
(Bluesky/TikTok) e o par título/subtítulo do card. `{link}` vira a URL do app com
UTM do canal.

Acrescentar um tema aumenta o ciclo sem repetição — hoje são 8 por app, 40 no
total, o que dá **20 dias sem repetir nada** publicando 2×/dia.

## Ritmo

Padrão: **2 posts por dia** (10h e 18h BRT), cada app aparecendo a cada 2,5 dias.
Para mudar, ajuste a variável `HORARIOS` (ex.: `9,13,19`) e os `cron` de
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

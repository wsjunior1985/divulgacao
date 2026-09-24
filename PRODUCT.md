# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

O usuário primário é o dono do repositório (Waldemar), donos dos sete apps
divulgados. A situação: manter presença ativa em seis redes sociais para sete
produtos próprios, sem tempo para produzir e publicar conteúdo manualmente. O
trabalho a ser feito ("job"): a divulgação acontece sozinha, em rodízio
determinístico, sem que ninguém precise desenhar um post ou apertar um botão
depois da configuração inicial (SETUP.md).

Um usuário secundário implícito é o público de cada app nas redes sociais —
quem vê o card no feed e decide clicar — mas o produto deste repositório não
desenha uma interface para essa audiência interagir; ela só recebe a imagem
publicada.

## Product Purpose

Divulgação automática: publica os sete apps (Vai dar quanto?, AI-Eat, GASONOL,
Convertendo, Remedin, O Palpiteiro, Papelzinho) no Instagram, Facebook,
Threads, Bluesky, TikTok e X, em rodízio, de graça, sem intervenção humana
recorrente. Sucesso é o sistema rodar continuamente pelo GitHub Actions,
gerando cards fiéis à identidade de cada app e publicando no horário certo,
sem repetir conteúdo e sem que uma falha de canal derrube os demais.

## Positioning

O rodízio é determinístico a partir da data/hora do slot — não há fila para
reabastecer e o conteúdo nunca acaba. Cada card é gerado na hora com a
identidade real do app (logo oficial, paleta extraída do `index.css` via
oklch→sRGB, fonte de display própria por app, captura de tela real da UI
interna), não com um template genérico. Isso é o que um concorrente que apenas
agendasse posts de forma manual ou com imagens estáticas não conseguiria
replicar com a mesma fidelidade e o mesmo zero-esforço.

## Operating Context

- Disparado por GitHub Actions em horários agendados; calcula o slot a partir
  da data, escolhe app e tema (`apps/*.json`), renderiza o card premium
  (HTML/CSS no Chromium → JPEG), hospeda via commit no próprio repo
  (`raw.githubusercontent.com`) e publica em cada canal com texto e UTM
  próprios.
- Registra publicações em `estado/publicados.json` para nunca repetir.
- Falha de um canal não derruba os outros; o log reporta o que saiu, o que
  foi pulado por falta de credencial e o que quebrou.
- Capturas de tela em `assets/capturas/` são refotografadas semanalmente pelo
  workflow `capturar`; a publicação usa sempre as já commitadas.
- Adicionar um app novo exige manter a paridade entre número de apps e número
  de horários no dia (ver `apps/README.md`), senão algum projeto pula o dia
  ou repete.
- Comandos operacionais principais: `npm run agenda`, `npm run dry`,
  `npm run verificar`, `npm run cards`, `npm run capturar`, `npm run semear`,
  `npm run publicar`, `npm run renovar`.

## Capabilities and Constraints

- Card no padrão premium (HTML/CSS renderizado no Chromium → JPEG; retrato
  para feed, vertical para TikTok): logo oficial, título em duas cores com
  linha de destaque, três benefícios com ícone neon, celular em perspectiva 3D
  com tela real do app, site do app em destaque e selos no rodapé.
- Identidade por app no bloco `visual` (cores, efeito de fundo, fonte do
  título, selos); o que faltar é derivado da cor da marca por `lib/cor.js`.
- Conteúdo por tema no bloco `premium` de cada post; sem ele, o card é
  montado a partir do `card` e dos `recursos` do app.
- Tipografia local por licença OFL (`assets/fontes/`), igual no Mac e no
  runner; o título se ajusta sozinho para caber na coluna.
- O site de acesso ao app aparece sempre no card.
- Hero mostra sempre uma captura real da tela interna do app (nunca landing
  ou login).
- TikTok: renovação automática de token está desligada por falta do secret
  `GH_PAT` (pendências em `pendencias.md`) — renovação manual até isso ser
  configurado.
- Não há deploy via GitHub Actions para apps web; ver DEPLOY.md para o fluxo
  correto.

## Brand Commitments

- Cada um dos sete apps mantém identidade própria e real (logo oficial do
  PWA, paleta da marca, fonte de display própria) — o motor de cards nunca
  inventa ou normaliza essas identidades, apenas as extrai e renderiza com
  fidelidade.
- Nenhum conteúdo (texto de post, prova social, números) é inventado; o
  conteúdo de cada post vem de `apps/<id>.json` (ganchos, corpos, CTAs
  redigidos previamente).

## Evidence on Hand

- Estrutura de dados de cada app com copy já escrito (ganchos, corpos, CTAs,
  variações curtas) em `apps/*.json` — ver `apps/gasonol.json` como
  referência completa de formato.
- Logos reais em `assets/logos/`, capturas reais em `assets/capturas/`,
  fontes OFL em `assets/fontes/`.
- Nenhuma prova social, depoimento ou benchmark externo está registrado no
  repositório; trabalho futuro não deve fabricar esse tipo de conteúdo.

## Product Principles

- Fidelidade de marca antes de conveniência: cor, fonte e logo sempre saem do
  ativo real do app, nunca de uma aproximação genérica.
- Determinismo sobre fila: o rodízio calculado a partir do slot elimina
  necessidade de curadoria manual e garante que o conteúdo nunca acabe.
- Falha isolada, não em cascata: um canal quebrado nunca deve impedir a
  publicação nos demais.
- Zero esforço recorrente: qualquer trabalho de design ou engenharia deve
  preservar a promessa central do README — depois do setup, a participação
  humana é nenhuma.

# Campanhas de anúncio — Remedin

Estratégia de tráfego pago para **Google Ads** e **Meta Ads** (Instagram/Facebook). Orçamento inicial sugerido: **R$ 15–30/dia por conta** (~R$ 500–900/mês) para validar. Meta pixel/Conversions API e Google Analytics já instrumentados no app (funnel `checkout_started`, `checkout_completed`).

---

## 1. Google Ads (Busca + Search Partner)

### 1.1 Campanha: "Lembrete de Remédio" (Busca)
- **Objetivo:** Conversões (assinaturas) — ou leads se preferir começar mais simples.
- **Rede:** Busca (+ Search Partners opcional).
- **Idioma:** Português (Brasil).
- **Geo:** Brasil (comece por todo o país; depois refine por estado/cidade de melhor conversão).

**Grupo de anúncios 1 — Intenção direta (Alta):**
| Palavra-chave | Tipo |
|---|---|
| lembrete de remedio app | Frase |
| app para lembrar de tomar remedio | Frase |
| lembrar de tomar remedio | Amplo (modificado) |
| aplicativo para nao esquecer remedio | Frase |
| app lembrete remedio grátis | Frase |
| aplicativo controle de medicamentos | Frase |
| melhor app lembrete de remedio | Exata |

**Grupo de anúncios 2 — Cuidador/idosos:**
| Palavra-chave | Tipo |
|---|---|
| app para idosos lembrar de tomar remedio | Frase |
| app cuidador de idosos medicamentos | Frase |
| lembrete de remedio para idosos | Frase |
| acompanhar medicamentos de parentes | Frase |
| app de remedios para familia | Frase |

**Grupo de anúncios 3 — Condições comuns:**
| Palavra-chave | Tipo |
|---|---|
| app pressao alta remedios | Frase |
| app diabetes lembretes | Frase |
| controle de remedios de uso continuo | Frase |

**Palavras negativas (sugestão):** `gratis app de quem sabe`, `receita gratis`, `sistema para farmacia`, `software para drogaria`, `estoque de farmacia`, `desenvolvedor`, `fazer um app`.

**Anúncios responsivos de busca (Headlines):**
1. Nunca esqueça seu remédio
2. Lembrete de remédio grátis
3. Aplicativo de medicamentos
4. Modo Cuidador incluso
5. Assistente IA de bulas
6. Até 3 meds grátis
7. Controle de estoque
8. Baixe agora

**Descrições:**
1. O Remedin lembra na hora certa, registra doses e avisa se você pular. Até 3 medicamentos grátis para sempre.
2. Cuide de quem você ama à distância: lembretes + aviso de dose esquecida. Premium a partir de R$ 14,90/mês.

**Links de site (Sitelinks):**
- Planos e preços — https://remedin.lovable.app/planos
- Como funciona — https://remedin.lovable.app/#recursos
- Preços — https://remedin.lovable.app/planos

### 1.2 Campanha "Performance Max" (opcional, após dados)
- Um só grupo, ativo = todo o feed (Busca, Shopping, Display, YouTube, Discover).
- Meta de conversão: assinatura. Orçamento R$ 20–30/dia.
- Criativos: reutilize os do Meta Ads (2.2) + imagens da landing.

---

## 2. Meta Ads (Instagram + Facebook)

### 2.1 Estrutura
- **Campanha 1 — Tráfego/Conversão (público quente/frio):** objetivo Conversões (evento `checkout_completed`) ou Tráfego no início.
- **Campanha 2 — Remarketing (visitantes do site):** Meta Pixel `ViewContent`/`AddToCart` → quem visitou /planos ou /auth mas não assinou.

### 2.2 Anúncios (imagem 1:1 e 4:5)

**Anúncio A — Benefício (cuidador)**
> **Título:** Cuidar de quem você ama, de longe
> **Texto principal:** Lembretes de remédio na hora certa + aviso se a dose foi esquecida. O Remedin conecta você à rotina de quem você cuida. Até 3 medicamentos grátis para sempre. 💊
> **CTA:** Instalar agora / Baixar app
> **Imagem:** screenshot do Modo Cuidador ou foto emocional de cuidador/idoso + selo "Grátis até 3 medicamentos".

**Anúncio B — Dor (esquecimento)**
> **Título:** Nunca mais esqueça seu remédio
> **Texto principal:** 6 em cada 10 pessoas esquecem alguma dose. Com o Remedin, você confirma cada uma com um toque e ainda controla o estoque. Baixe grátis. ✅
> **CTA:** Instalar agora
> **Imagem:** mockup do app mostrando notificação + botão "Tomei".

**Anúncio C — IA**
> **Título:** Dúvida de bula? Pergunta pra IA
> **Texto principal:** Assistente IA do Remedin responde dúvidas de medicamento, e o app ainda organiza horários e doses. Premium a partir de R$ 14,90/mês.
> **CTA:** Saiba mais
> **Imagem:** print da conversa com a IA.

### 2.3 Públicos (sugestão inicial)
- **Interesses:** saúde, medicamentos, cuidados com idosos, diabetes, hipertensão, cuidadores, enfermagem.
- **Idade:** 25–65+. Foco em 35–65 (quem cuida de pais idosos / tratamento contínuo).
- **Gênero:** todos.
- **Idioma:** PT-BR. **Localização:** Brasil.
- **Excluir:** quem já converteu (público de assinantes) para não gastar.

### 2.4 Remarketing
- Público: visitantes de /planos, /auth e /checkout nos últimos 30 dias.
- Mensagem: "Ainda dá tempo: comece 7 dias grátis do Premium".
- Frequência cap: 3/dia.

---

## 3. Orçamento e metas (plano de 30 dias)

| Item | Valor |
|---|---|
| Google Ads (Busca) | R$ 300 |
| Meta Ads (conversão) | R$ 300 |
| Meta Ads (remarketing) | R$ 100 |
| **Total mês** | **R$ 700** |

- **Meta semana 1:** validar CTR (meta > 1%) e CPC (meta < R$ 1,50).
- **Meta semana 2:** conversões. CPA alvo: até **R$ 15–20** por assinatura (LTV: R$ 14,90+/mês → payback em ~1–2 meses).
- **Meta semana 4:** escalar campanhas que bateram CPA e pausar as ruins.

---

## 4. Rastreamento a configurar
1. **Google Ads:** tag de conversão no `checkout_completed` (webhook) e `checkout_started`.
2. **Meta Pixel:** eventos `PageView`, `ViewContent` (página /planos), `InitiateCheckout` (`/checkout`), `Purchase` (`/checkout/return`).
3. **UTMs:** adicionar `utm_source=google` / `utm_source=meta` nos links (a landing aceita `?ref=` e mantém o usuário).

---

## 5. Checklists de lançamento
- [ ] Criar conta Google Ads e verificar domínio (Search Console).
- [ ] Instalar Meta Pixel (ou Conversions API via servidor).
- [ ] Criar público de remarketing.
- [ ] Subir campanha de Busca com os grupos de anúncios acima.
- [ ] Subir 2 conjuntos de anúncios no Meta (conversão + remarketing).
- [ ] Rodar 7 dias com orçamento baixo, olhar CTR/CPC/CPA, e ajustar.

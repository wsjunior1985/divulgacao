// Gerador de calendário de conteúdo para Instagram + TikTok.
// Lê preços/limites reais de src/lib/plan.ts e produz posts prontos (Reels/TikTok,
// legendas, hashtags e links com UTM) em docs/promotion/content-calendar.md.
// Uso: npm run content
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const BASE = "https://aieat.app.br";

function extract(re, fallback, label) {
  const m = planSrc.match(re);
  if (!m) {
    console.warn(`[content] não encontrou ${label}, usando fallback ${fallback}`);
    return fallback;
  }
  return m[1];
}

const planSrc = readFileSync(resolve(root, "src/lib/plan.ts"), "utf8");
const priceMonthly = extract(/premium_monthly_1990:\s*\{[\s\S]*?displayPrice:\s*"([^"]+)"/, "R$19,90", "preço mensal");
const priceYearly = extract(/premium_yearly_11900:\s*\{[\s\S]*?displayPrice:\s*"([^"]+)"/, "R$119", "preço anual");
const freeScan = extract(/FREE_AI_SCAN_LIMIT\s*=\s*(\d+)/, "3", "limite de scans IA");
const freeFood = extract(/FREE_FOOD_LIMIT\s*=\s*(\d+)/, "5", "limite de refeições");
const freeHistory = extract(/FREE_HISTORY_DAYS\s*=\s*(\d+)/, "7", "dias de histórico");
const trialDays = extract(/PREMIUM_TRIAL_DAYS\s*=\s*(\d+)/, "7", "dias de trial");

function utm(platform, content) {
  const p = new URLSearchParams({
    utm_source: platform,
    utm_medium: "social",
    utm_campaign: "alwayson",
    utm_content: content,
  });
  return `${BASE}/?${p.toString()}`;
}

// Pilares de conteúdo (temas). Cada um gera Reel (IG) + vídeo (TikTok).
const pillars = [
  {
    id: "scanner",
    title: "Scanner de prato com IA",
    hook: "Tira a foto do prato e a IA diz quantas calorias tem.",
    steps: [
      "Abra o AI-Eat e vá em Registrar refeição.",
      "Tire a foto do prato.",
      "A IA devolve calorias + proteínas, carbos e gorduras.",
      "O total do dia se soma à sua meta automaticamente.",
    ],
    caption:
      "Contar caloria na mão é chato. No AI-Eat você tira a foto e a IA faz o trabalho: calorias + macros na hora. " +
      `Plano Free já libera ${freeScan} análises por dia.`,
    hashtags: ["#emagrecimento", "#ia", "#nutricao", "#dieta", "#aieat"],
  },
  {
    id: "metas",
    title: "Sua meta calórica em 1 minuto",
    hook: "A matemática do emagrecimento no seu bolso.",
    steps: [
      "Informe peso, altura, idade e nível de atividade.",
      "O app calcula IMC, TMB e Gasto Energético Total.",
      "Define seu déficit e a meta diária de calorias.",
      "Pronto: você sabe exatamente quanto comer.",
    ],
    caption:
      "Emagrecer é matemática, não sofrimento. O AI-Eat calcula IMC, TMB e sua meta calórica em 1 minuto — " +
      "sem planilha, sem nutrição cara.",
    hashtags: ["#imc", "#tmb", "#metacalorica", "#emagrecercomsaude", "#aieat"],
  },
  {
    id: "hidratacao",
    title: "Hidratação no piloto automático",
    hook: "Esquece de beber água? O app lembra pra você.",
    steps: [
      "Ative o lembrete de hidratação nas configurações.",
      "Escolha o intervalo (30min a 2h).",
      "Receba avisos entre 7h e 22h, mesmo com o app fechado.",
      "Acompanhe os copos do dia na tela inicial.",
    ],
    caption:
      "Hidratação é metade da disciplina. O AI-Eat manda lembretes de água no intervalo que você quiser — " +
      "você só bebe e marca.",
    hashtags: ["#hidratacao", "#saudavel", "#dicasdesaude", "#aieat", "#bemestar"],
  },
  {
    id: "preco",
    title: "Preço que cabe no bolso",
    hook: "Plano Premium a partir de " + priceMonthly + "/mês. Menos que um café.",
    steps: [
      "Free: registre refeições e veja suas metas.",
      `Premium: a partir de ${priceMonthly}/mês (ou ${priceYearly}/ano).`,
      "Desbloqueia scanner de IA ilimitado e métricas avançadas.",
      "Comece pelo link da bio — sem cartão para testar.",
    ],
    caption:
      `Premium do AI-Eat sai por ${priceMonthly}/mês (ou ${priceYearly}/ano). ` +
      "Menos que um café por dia e com scanner de IA ilimitado. Comece de graça.",
    hashtags: ["#appdedigestao", "#emagrecimento", "#promocao", "#aieat", "#produtividade"],
  },
  {
    id: "indicacao",
    title: "Ganhe dias de Premium indicando",
    hook: "Indicou um amigo? Ganhou Premium grátis.",
    steps: [
      "Vá em Configurações → Indique e ganhe.",
      "Copie seu link de convite único.",
      "O amigo que entrar pelo link ganha dias de Premium.",
      "Você também ganha dias grátis por indicação.",
    ],
    caption:
      `Indique amigos no AI-Eat e ganhe ${trialDays} dias de Premium grátis por indicação — eles também ganham. ` +
      "Todo mundo sai ganhando.",
    hashtags: ["#indiqueeganhe", "#aieat", "#emagrecimento", "#dicadedinheiro", "#amigos"],
  },
  {
    id: "mitos",
    title: "Mito: dieta hipocalórica = passar fome",
    hook: "Dieta hipocalórica não é passar fome. É déficit controlado.",
    steps: [
      "Déficit de 500–1000 kcal reduz ~0,5 a 1 kg por semana.",
      "O mínimo seguro é 1200 kcal/dia (aviso no app).",
      "Você come o que gosta, respeitando a meta.",
      "O AI-Eat mostra sua meta e o déficit aplicado.",
    ],
    caption:
      "Mito: dieta hipocalórica é passar fome. Na verdade é déficit calórico controlado — " +
      "e o mínimo seguro (1200 kcal) aparece como aviso no AI-Eat.",
    hashtags: ["#mitos", "#nutricao", "#emagrecercomsaude", "#aieat", "#educacional"],
  },
];

// Sequência de 2 posts por semana (8 slots) distribuindo os pilares.
const sequence = [0, 3, 1, 4, 2, 5, 0, 3];

// Posts no formato da API do Buffer (updates/create), prontos para quando houver a key.
const bufferPosts = [];
// Posts no formato da Instagram Graph API (IG Business), prontos para quando houver a key.
const metaPosts = [];
let postCounter = 0;
function nextSchedule() {
  postCounter++;
  const d = new Date();
  d.setDate(d.getDate() + postCounter * 3);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
}

function renderPost(platform, pillar, week) {
  const link = utm(platform, pillar.id);
  const script = pillar.steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
  const tags = pillar.hashtags.join(" ");
  const caption =
    platform === "tiktok"
      ? `${pillar.caption}\n\n${tags}\n\n🔗 ${link}`
      : `${pillar.caption}\n\n${tags}\n\nLink na bio: ${link}`;
  const platformLabel = platform === "tiktok" ? "TikTok" : "Instagram (Reel)";
  const scheduled = nextSchedule();

  // Formato Buffer: texto + link anexado (media.link). profile_ids/access_token
  // são preenchidos no momento da postagem (a partir do .env).
  bufferPosts.push({
    platform,
    text: `${pillar.caption}\n\n${tags}`,
    media: { link },
    scheduled_at: scheduled,
  });

  // Formato Instagram Graph API (IG Business): criação de container de REEL.
  // video_url deve apontar para o vídeo hospedado; link vai na bio.
  if (platform === "instagram") {
    metaPosts.push({
      ig_user_id: "<IG_USER_ID>",
      media_type: "REEL",
      caption: `${pillar.caption}\n\n${tags}\n\nLink na bio: ${link}`,
      video_url: "<URL_DO_VIDEO>",
      access_token: "<INSTAGRAM_GRAPH_API_TOKEN>",
      scheduled_publish_time: Math.floor(new Date(scheduled).getTime() / 1000),
      link,
    });
  }

  return `### Semana ${week} — ${platformLabel}: ${pillar.title}

**Hook (2s iniciais):** ${pillar.hook}

**Roteiro (30–45s):**
${script}

**Legenda:**
${caption}
`;
}

const weeks = [1, 2, 3, 4];
let calendar = "";
for (const w of weeks) {
  const ig = pillars[sequence[(w - 1) * 2]];
  const tk = pillars[sequence[(w - 1) * 2 + 1]];
  calendar += renderPost("instagram", ig, w);
  calendar += renderPost("tiktok", tk, w);
}

// Stories (IG) — rotação diária.
const stories = [
  { name: "Enquete", text: 'Enquete: "Você bateu a meta hoje?" Sim/Não + link na bio.' },
  { name: "Demo", text: "Vídeo 5s: foto do prato → IA devolve kcal. Link sticker." },
  { name: "Hidratação", text: "Contador: copos hoje X meta. Lembrete do app." },
  { name: "Prova", text: "Print de resultado (ex.: −1,2 kg) + sticker de pergunta." },
  { name: "Preço", text: `Premium a partir de ${priceMonthly}/mês. Setinha pro "Ver planos".` },
];

const storiesMd = stories
  .map((s, i) => `${i + 1}. **${s.name}** — ${s.text}`)
  .join("\n");

const out = `# Calendário de Conteúdo — AI-Eat (Instagram + TikTok)

> Gerado automaticamente por \`npm run content\`. Preços/limites lidos de \`src/lib/plan.ts\`:
> Premium **${priceMonthly}/mês** (ou **${priceYearly}/ano**) · Free: ${freeScan} scans IA/dia, ${freeFood} refeições/dia, ${freeHistory} dias de histórico · Trial ${trialDays} dias.
> Link base: ${BASE}

## Como usar (workflow copy-paste)
1. Rode \`npm run content\` para regenerar este arquivo sempre que o preço mudar.
2. Para cada post abaixo: copie o **Roteiro** (grava o vídeo) e a **Legenda** (cola na legenda).
 3. O link já vem com **UTM** — assim dá pra ver no app quantos vieram de cada rede.
 4. IG Stories: use a rotação diária ao fim do arquivo.
 5. O arquivo 'docs/promotion/buffer-posts.json' já sai no formato da API do Buffer (text + media.link + scheduled_at). Quando tiver BUFFER_API_KEY e BUFFER_PROFILE_IDS no .env, é só enviar esse JSON.
 6. O arquivo 'docs/promotion/meta-posts.json' sai no formato da Instagram Graph API (IG Business): container de REEL com caption + video_url + scheduled_publish_time. Preencha ig_user_id/access_token no .env (META_*).

---

## Calendário (4 semanas)

${calendar}

## Instagram Stories — rotação diária
${storiesMd}

---

## Links de rastreio (copie conforme a rede)
- Instagram: ${utm("instagram", "bio")}
- TikTok: ${utm("tiktok", "bio")}
`;

const outPath = resolve(root, "docs/promotion/content-calendar.md");
writeFileSync(outPath, out);
console.log(`[content] calendário gerado em ${outPath}`);

const bufferPath = resolve(root, "docs/promotion/buffer-posts.json");
writeFileSync(bufferPath, JSON.stringify(bufferPosts, null, 2) + "\n");
console.log(`[content] ${bufferPosts.length} posts no formato Buffer em ${bufferPath}`);

const metaPath = resolve(root, "docs/promotion/meta-posts.json");
writeFileSync(metaPath, JSON.stringify(metaPosts, null, 2) + "\n");
console.log(`[content] ${metaPosts.length} posts no formato Instagram Graph API em ${metaPath}`);

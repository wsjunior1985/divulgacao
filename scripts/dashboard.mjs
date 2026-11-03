#!/usr/bin/env node
// Dashboard operacional privado, servido apenas em localhost.

import { createServer } from "node:http";
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { carregarEnv, env, buscar, RAIZ } from "./lib/base.js";

carregarEnv();

const PORTA = Number(env("DASHBOARD_PORT", "8138"));
const HOST = "127.0.0.1";
const CACHE = resolve(homedir(), ".cache/waldeapps-divulgacao-dashboard/metricas.json");
const HTML = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../dashboard/index.html"));
const REDES = ["instagram", "facebook", "threads", "bluesky", "x", "tiktok"];
const NOMES = { instagram: "Instagram", facebook: "Facebook", threads: "Threads", bluesky: "Bluesky", x: "X · Buffer", tiktok: "TikTok" };
const URLS = {
  instagram: (id) => `https://www.instagram.com/p/${id}/`,
  facebook: (id) => `https://www.facebook.com/${id}`,
  threads: (id) => `https://www.threads.net/@me/post/${id}`,
};
const versaoMeta = env("META_API_VERSION", "v21.0");
let atualizando = false;

function json(path, fallback) {
  try { return JSON.parse(readFileSync(resolve(RAIZ, path), "utf8")); }
  catch { return fallback; }
}

function carregarMetricas() {
  return json(CACHE, { atualizadoEm: null, itens: {}, fontes: {} });
}

function salvarMetricas(dados) {
  mkdirSync(dirname(CACHE), { recursive: true });
  writeFileSync(CACHE, `${JSON.stringify(dados, null, 2)}\n`, { mode: 0o600 });
}

function construirDados() {
  const estado = json("estado/publicados.json", { posts: {}, atualizadoEm: null });
  const videos = json("estado/videos.json", { videos: {}, atualizadoEm: null });
  const perfis = new Map();
  for (const arquivo of listJson(resolve(RAIZ, "apps"))) {
    const p = json(`apps/${arquivo}`, null);
    if (p?.id) perfis.set(p.id, p);
  }

  const metricas = carregarMetricas();
  const registros = [];
  for (const [chave, canais] of Object.entries(estado.posts ?? {})) {
    const [slot, appId, ...temaPartes] = chave.split("-");
    const app = perfis.get(appId);
    const temaId = canais?.instagram?.tipo === "carrossel" ? canais.instagram.temaId : temaPartes.join("-");
    const perfilId = canais?.instagram?.tipo === "carrossel" ? canais.instagram.appId : appId;
    const perfil = perfis.get(perfilId);
    const tema = perfil?.posts?.find((p) => p.id === temaId);
    for (const [rede, r] of Object.entries(canais ?? {})) {
      registros.push({
        chave: `${rede}:${r.id ?? chave}`, tipo: r.tipo ?? "post", formato: r.formato ?? null, rede, redeNome: NOMES[rede] ?? rede,
        app: perfil?.nome ?? app?.nome ?? appId, appId: perfilId, tema: tema?.card?.titulo?.replace(/<[^>]*>/g, " ").replace(/[*_`]/g, "").trim() ?? temaId,
        status: r.status ?? "desconhecido", id: r.id ?? null, url: r.url ?? URLS[rede]?.(r.id) ?? null,
        em: r.em ?? null, erro: r.erro ?? null,
        utm: r.utm ?? null, metricas: metricas.itens?.[`${rede}:${r.id}`] ?? null,
      });
    }
  }

  const videoManifest = json("videos/videos.json", { videos: {} });
  const manifestItems = Array.isArray(videoManifest.videos) ? videoManifest.videos : Object.entries(videoManifest.videos ?? {}).map(([app, v]) => ({ app, ...v }));
  const manifestPorApp = new Map(manifestItems.map((v) => [v.app, v]));
  for (const [appId, canais] of Object.entries(videos.videos ?? {})) {
    const app = perfis.get(appId);
    const video = manifestPorApp.get(appId);
    for (const [rede, r] of Object.entries(canais ?? {})) {
      registros.push({
        chave: `${rede}:${r.id ?? appId}`, tipo: "vídeo", rede, redeNome: NOMES[rede] ?? rede,
        app: app?.nome ?? appId, appId, tema: video?.titulo ?? "Vídeo de apresentação",
        status: r.status ?? "desconhecido", id: r.id ?? null, url: r.url ?? null,
        em: r.em ?? null, erro: r.erro ?? null, utm: r.utm ?? null,
        metricas: metricas.itens?.[`${rede}:${r.id}`] ?? null,
      });
    }
  }

  const repeticoes = acharRepeticoesInstagram(metricas.publicacoesInstagram ?? []);
  const registrados = new Set(registros.filter((r) => r.rede === "instagram").map((r) => r.id).filter(Boolean));
  for (const p of metricas.publicacoesInstagram ?? []) {
    if (!p.id || registrados.has(p.id)) continue;
    registros.push({
      chave: `instagram:${p.id}`, tipo: "importado da API", rede: "instagram", redeNome: NOMES.instagram,
      app: "Instagram", appId: null, tema: (p.caption ?? "Publicação recuperada do Instagram").replace(/\s+/g, " ").slice(0, 180),
      status: "ok", id: p.id, url: p.permalink ?? URLS.instagram(p.id), em: p.timestamp ?? null,
      erro: null, utm: null, repeticaoRecente: repeticoes.ids.has(p.id), metricas: metricas.itens?.[`instagram:${p.id}`] ?? null,
    });
  }

  const threadsRegistrados = new Set(registros.filter((r) => r.rede === "threads").map((r) => r.id).filter(Boolean));
  for (const p of metricas.publicacoesThreads ?? []) {
    if (!p.id || threadsRegistrados.has(p.id)) continue;
    registros.push({
      chave: `threads:${p.id}`, tipo: "importado da API", rede: "threads", redeNome: NOMES.threads,
      app: "Threads", appId: null, tema: (p.text ?? "Publicação recuperada do Threads").replace(/\s+/g, " ").slice(0, 180),
      status: "ok", id: p.id, url: p.permalink ?? `https://www.threads.net/@waldeapps.oficial/post/${p.id}`, em: p.timestamp ?? null,
      erro: null, utm: null, metricas: metricas.itens?.[`threads:${p.id}`] ?? null,
    });
  }

  registros.sort((a, b) => (b.em ?? "").localeCompare(a.em ?? ""));
  const resumoRede = Object.fromEntries(REDES.map((rede) => {
    const itens = registros.filter((r) => r.rede === rede);
    return [rede, {
      nome: NOMES[rede], total: itens.length,
      sucesso: itens.filter((r) => r.status === "ok").length,
      falha: itens.filter((r) => r.status === "erro").length,
      pendente: itens.filter((r) => !["ok", "erro"].includes(r.status)).length,
      comMetricas: itens.filter((r) => r.metricas?.valores && Object.keys(r.metricas.valores).length).length,
    }];
  }));
  const sucesso = registros.filter((r) => r.status === "ok").length;
  const falha = registros.filter((r) => r.status === "erro").length;
  const datas = registros.map((r) => r.em).filter(Boolean).sort();
  const totalMetricas = Object.values(metricas.itens ?? {}).length;
  const resumoSemanal = gerarResumoSemanal(registros);

  return {
    registros,
    resumo: {
      total: registros.length, sucesso, falha,
      taxaSucesso: sucesso + falha ? sucesso / (sucesso + falha) : null,
      redes: resumoRede,
      primeiraPublicacao: datas[0] ?? null,
      ultimaPublicacao: datas.at(-1) ?? null,
      estadoAtualizadoEm: estado.atualizadoEm ?? null,
      metricasAtualizadasEm: metricas.atualizadoEm ?? null,
      metricasRegistradas: totalMetricas,
      tiktokComVideo: resumoRede.tiktok.total,
      atualizando,
      cobertura: metricas.fontes ?? {},
      resumoSemanal,
      repeticoesInstagramRecentes: repeticoes.quantidade,
    },
  };
}

function acharRepeticoesInstagram(posts) {
  const grupos = new Map();
  for (const p of posts) {
    const texto = (p.caption ?? "").toLocaleLowerCase("pt-BR").replace(/\s+/g, " ").trim();
    if (!texto || !p.timestamp || !p.id) continue;
    grupos.set(texto, [...(grupos.get(texto) ?? []), { id: p.id, em: Date.parse(p.timestamp) }]);
  }
  const ids = new Set();
  for (const grupo of grupos.values()) {
    grupo.sort((a, b) => a.em - b.em);
    for (let i = 1; i < grupo.length; i++) {
      if (grupo[i].em - grupo[i - 1].em < 6 * 60 * 60 * 1000) ids.add(grupo[i].id);
    }
  }
  return { ids, quantidade: ids.size };
}

function interacoes(r) {
  const valores = r.metricas?.valores ?? {};
  return Object.entries(valores).reduce((total, [chave, bruto]) => {
    const n = typeof bruto === "number" ? bruto : bruto?.valor;
    return /like|curtida|reaction|comment|coment|repl|respost|repost|quote|citac|share|compart|saved|salvo/i.test(chave) && Number.isFinite(n) ? total + n : total;
  }, 0);
}

function gerarResumoSemanal(registros) {
  const agora = new Date();
  const inicio = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
  const daSemana = registros.filter((r) => r.em && Date.parse(r.em) >= inicio.getTime() && Date.parse(r.em) <= agora.getTime());
  const avaliaveis = daSemana.filter((r) => r.status === "ok" && r.metricas?.valores && Object.keys(r.metricas.valores).length && !r.repeticaoRecente);
  const porRede = {};
  const sugestoes = [];
  const media = (itens) => itens.length ? itens.reduce((s, x) => s + x.valor, 0) / itens.length : null;
  const nomeFaixa = (data) => {
    const hora = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", hour: "2-digit", hourCycle: "h23" }).format(data));
    return hora >= 5 && hora < 11 ? "Manhã (05–10h)" : hora >= 11 && hora < 17 ? "Tarde (11–16h)" : hora >= 17 && hora < 23 ? "Noite (17–22h)" : "Madrugada (23–04h)";
  };
  for (const rede of REDES) {
    const baseRede = avaliaveis.filter((r) => r.rede === rede);
    const alcance = ["views", "impressions", "impressionsCount"].map((nome) => ({ nome, n: baseRede.filter((r) => Number.isFinite(Number(typeof r.metricas.valores[nome] === "object" ? r.metricas.valores[nome]?.valor : r.metricas.valores[nome]))).length }))
      .sort((a, b) => b.n - a.n)[0];
    const medidaRede = alcance?.n >= Math.max(2, Math.ceil(baseRede.length * 0.6)) ? alcance.nome : "interações";
    const itens = baseRede.map((r) => {
      const vals = r.metricas.valores;
      const bruto = vals[medidaRede];
      return { r, medida: medidaRede, valor: medidaRede === "interações" ? interacoes(r) : Number(typeof bruto === "object" ? bruto?.valor : bruto) };
    }).filter((x) => Number.isFinite(x.valor));
    const gruposTema = new Map(); const gruposHorario = new Map(); const gruposFormato = new Map();
    for (const item of itens) {
      const r = item.r;
      const adicionar = (map, chave) => { const lista = map.get(chave) ?? []; lista.push(item); map.set(chave, lista); };
      if (r.appId && r.tema) adicionar(gruposTema, `${r.app} · ${r.tema}`);
      if (r.em) adicionar(gruposHorario, nomeFaixa(new Date(r.em)));
      if (["post", "carrossel", "vídeo"].includes(r.tipo)) adicionar(gruposFormato, r.tipo === "vídeo" ? "Vídeo" : r.tipo === "carrossel" ? "Carrossel" : "Post (formato não identificado)");
    }
    const baseline = media(itens);
    const destaque = (map, minimo) => [...map].map(([nome, rows]) => ({ nome, n: rows.length, media: media(rows) }))
      .filter((x) => x.n >= minimo && baseline > 0 && x.media >= baseline * 1.2 && x.media - baseline >= 1)
      .sort((a, b) => b.media - a.media)[0] ?? null;
    const melhorTema = destaque(gruposTema, 3); const melhorHorario = destaque(gruposHorario, 3); const melhorFormato = gruposFormato.size > 1 ? destaque(gruposFormato, 3) : null;
    porRede[rede] = { publicacoes: daSemana.filter((r) => r.rede === rede).length, avaliadas: itens.length, medida: medidaRede, tema: melhorTema, horario: melhorHorario, formato: melhorFormato };
    if (melhorTema) sugestoes.push({ rede, texto: `Usar “${melhorTema.nome}” como pauta de um novo post em ${NOMES[rede]}; sinal exploratório em ${melhorTema.n} posts, média ${Math.round(melhorTema.media)}.` });
    if (melhorHorario) sugestoes.push({ rede, texto: `Testar novamente ${melhorHorario.nome} em ${NOMES[rede]}; sinal exploratório em ${melhorHorario.n} posts, média ${Math.round(melhorHorario.media)}.` });
    if (melhorFormato) sugestoes.push({ rede, texto: `Manter o formato ${melhorFormato.nome} em ${NOMES[rede]} e comparar com outro formato em publicações futuras.` });
  }
  const avaliadosDestaque = Object.values(porRede).some((x) => x.tema || x.horario || x.formato);
  if (!avaliadosDestaque) sugestoes.push({ rede: null, texto: "Ainda não apareceu um tema, horário ou formato com sinal acima da média semanal. Na próxima semana, teste uma variação de gancho ou formato por vez e compare as métricas após a publicação." });
  return { periodoDias: 7, inicio: inicio.toISOString(), fim: agora.toISOString(), base: "média simples das métricas disponíveis na própria rede; destaques exigem 3 publicações, 20% e pelo menos 1 unidade acima da média; associação não prova causa", totalPublicacoes: daSemana.length, totalAvaliavel: avaliaveis.length, redes: porRede, sugestoes };
}

function listJson(diretorio) {
  try { return readdirSync(diretorio).filter((f) => f.endsWith(".json")); }
  catch { return []; }
}

async function obter(url, opcoes = {}) {
  const res = await buscar(url, { ...opcoes, signal: AbortSignal.timeout(15000) }, { tentativas: 2, esperaMs: 800 });
  const dados = await res.json().catch(() => ({}));
  if (!res.ok || dados.error || dados.errors?.length) {
    throw new Error(dados.error?.message ?? dados.errors?.map((e) => e.message).join("; ") ?? `HTTP ${res.status}`);
  }
  return dados;
}

async function concorrente(itens, limite, fn) {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limite, itens.length) }, async () => {
    while (cursor < itens.length) {
      const i = cursor++;
      try { await fn(itens[i]); } catch { /* O erro individual fica registrado no snapshot. */ }
    }
  });
  await Promise.all(workers);
}

async function atualizarMetricas() {
  if (atualizando) return false;
  atualizando = true;
  const metricas = carregarMetricas();
  const estado = json("estado/publicados.json", { posts: {} });
  const videos = json("estado/videos.json", { videos: {} });
  const alvos = [];
  for (const [chave, canais] of Object.entries(estado.posts ?? {})) {
    const [slot, appId, ...tema] = chave.split("-");
    for (const [rede, r] of Object.entries(canais ?? {})) {
      if (r.status === "ok" && r.id && ["instagram", "facebook", "threads", "bluesky", "x"].includes(rede)) {
        alvos.push({ chave, rede, id: r.id, em: r.em ?? "", appId, tema: tema.join("-") });
      }
    }
  }
  for (const [appId, canais] of Object.entries(videos.videos ?? {})) {
    for (const [rede, r] of Object.entries(canais ?? {})) {
      if (r.status === "ok" && r.id && ["instagram", "facebook", "threads", "bluesky", "x"].includes(rede)) {
        alvos.push({ chave: `video:${appId}`, rede, id: r.id, em: r.em ?? "", appId, tema: "video" });
      }
    }
  }
  const porRede = Object.fromEntries(REDES.map((r) => [r, alvos.filter((p) => p.rede === r).sort((a, b) => b.em.localeCompare(a.em)).slice(0, 40)]));
  const fontes = {};

  // A API do Instagram também ajuda a recuperar posts recentes ausentes do
  // estado local após uma execução que publicou e depois falhou.
  const tokenMeta = env("META_ACCESS_TOKEN");
  const contaInstagram = env("META_IG_USER_ID");
  if (tokenMeta && contaInstagram) {
    try {
      const data = await obter(`https://graph.facebook.com/${versaoMeta}/${contaInstagram}/media?fields=id,caption,timestamp,permalink,like_count,comments_count&limit=100&access_token=${encodeURIComponent(tokenMeta)}`);
      metricas.publicacoesInstagram = data.data ?? [];
      for (const post of metricas.publicacoesInstagram) {
        if (post.id && (post.like_count !== undefined || post.comments_count !== undefined)) {
          metricas.itens[`instagram:${post.id}`] = {
            valores: Object.fromEntries([["curtidas", post.like_count], ["comentarios", post.comments_count]].filter(([, v]) => v !== undefined)),
            atualizadoEm: new Date().toISOString(), fonte: "Instagram Graph API",
          };
        }
      }
      fontes.instagramHistorico = { status: "ok", consultados: metricas.publicacoesInstagram.length, nota: "Até 100 posts recentes importados direto do Instagram para completar o histórico local." };
    } catch (e) {
      fontes.instagramHistorico = { status: "erro", mensagem: e.message, nota: "O histórico local continua disponível; a importação da API não funcionou." };
    }
  }

  // Inclui publicações feitas diretamente no Threads, mesmo que não estejam no estado local.
  const tokenThreads = env("THREADS_ACCESS_TOKEN");
  if (tokenThreads) {
    try {
      const data = await obter(`https://graph.threads.net/v1.0/me/threads?fields=id,text,timestamp,permalink,media_type&limit=100&access_token=${encodeURIComponent(tokenThreads)}`);
      metricas.publicacoesThreads = data.data ?? [];
      fontes.threadsHistorico = { status: "ok", consultados: metricas.publicacoesThreads.length, nota: "Até 100 publicações recentes importadas diretamente do Threads." };
    } catch (e) {
      fontes.threadsHistorico = { status: "erro", mensagem: e.message, nota: "Publicações registradas localmente continuam disponíveis; importação do Threads falhou." };
    }
  }

  // Consultas publicamente legíveis no AT Protocol: contagens atuais, sem alcance/impressões.
  const bluesky = porRede.bluesky;
  if (bluesky.length) {
    try {
      await concorrente(bluesky, 4, async (alvo) => {
        if (!alvo.id.startsWith("at://")) return;
        const data = await obter(`https://public.api.bsky.app/xrpc/app.bsky.feed.getPosts?uris=${encodeURIComponent(alvo.id)}`);
        const post = data.posts?.[0];
        if (!post) return;
        metricas.itens[`bluesky:${alvo.id}`] = {
          valores: { curtidas: post.likeCount, respostas: post.replyCount, reposts: post.repostCount, citacoes: post.quoteCount },
          atualizadoEm: new Date().toISOString(), fonte: "Bluesky AT Protocol",
        };
      });
      fontes.bluesky = { status: "parcial", consultados: bluesky.length, comDados: bluesky.filter((p) => metricas.itens[`bluesky:${p.id}`]?.valores).length, nota: "Interações públicas; visualizações e alcance não são fornecidos." };
    } catch (e) { fontes.bluesky = { status: "erro", mensagem: e.message }; }
  }

  // Métricas do post para X são fornecidas pelo Buffer; seu token pessoal mantém a credencial no servidor local.
  const buffer = porRede.x;
  if (buffer.length && env("BUFFER_ACCESS_TOKEN")) {
    try {
      for (let i = 0; i < buffer.length; i += 20) {
        const lote = buffer.slice(i, i + 20);
        const campos = lote.map((p, n) => `p${n}: post(input: { id: "${p.id.replaceAll('"', "")}" }) { id metrics { type name value unit } metricsUpdatedAt }`).join("\n");
        const data = await obter("https://api.buffer.com", {
          method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${env("BUFFER_ACCESS_TOKEN")}` },
          body: JSON.stringify({ query: `query { ${campos} }` }),
        });
        for (const p of Object.values(data.data ?? {})) if (p?.id) {
          metricas.itens[`x:${p.id}`] = {
            valores: Object.fromEntries((p.metrics ?? []).map((m) => [m.type, { nome: m.name, valor: m.value, unidade: m.unit }])),
            atualizadoEm: p.metricsUpdatedAt ?? new Date().toISOString(), fonte: "Buffer",
          };
        }
      }
      fontes.x = { status: "ok", consultados: buffer.length, nota: "Dados de desempenho importados pelo Buffer; a atualização pode atrasar até 24 h." };
    } catch (e) { fontes.x = { status: "erro", mensagem: e.message, consultados: 0 }; }
  } else if (buffer.length) fontes.x = { status: "indisponivel", nota: "Defina BUFFER_ACCESS_TOKEN para carregar métricas do X." };

  // Leitura de contagens da Meta. Instagram fornece curtidas/comentários; Insights
  // (views/reach/saves) exige permissão que não existe no token atual.
  for (const rede of ["instagram", "facebook"]) {
    const lista = rede === "instagram" ? [...new Map([...porRede.instagram, ...alvos.filter((p) => p.rede === "instagram")].map((p) => [p.id, p])).values()].sort((a, b) => b.em.localeCompare(a.em)).slice(0, 100) : porRede[rede];
    if (!lista.length) continue;
    const token = env("META_ACCESS_TOKEN");
    if (!token) { fontes[rede] = { status: "indisponivel", nota: "META_ACCESS_TOKEN não configurado." }; continue; }
    await concorrente(lista, 3, async (p) => {
      const fields = rede === "instagram"
        ? "like_count,comments_count,timestamp,permalink"
        : "likes.summary(true).limit(0),comments.summary(true).limit(0)";
      try {
        const data = await obter(`https://graph.facebook.com/${versaoMeta}/${p.id}?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(token)}`);
        const counts = rede === "instagram"
          ? { curtidas: data.like_count, comentarios: data.comments_count }
          : { curtidas: data.likes?.summary?.total_count, comentarios: data.comments?.summary?.total_count };
        metricas.itens[`${rede}:${p.id}`] = {
          valores: Object.fromEntries(Object.entries(counts).filter(([, v]) => v !== undefined)),
          atualizadoEm: new Date().toISOString(), fonte: "Meta Graph API",
        };
      } catch (e) { metricas.itens[`${rede}:${p.id}`] = { valores: {}, atualizadoEm: new Date().toISOString(), fonte: "Meta Graph API", erro: e.message }; }
    });
    const erros = lista.filter((p) => metricas.itens[`${rede}:${p.id}`]?.erro).length;
    fontes[rede] = { status: erros === lista.length ? "erro" : erros ? "parcial" : "ok", consultados: lista.length, erros,
      nota: rede === "instagram" ? "Curtidas e comentários nos até 100 posts recentes. Views, alcance, salvamentos e compartilhamentos exigem a consulta de Insights e permissões da conta profissional." : "Curtidas e comentários consultados nos posts registrados. A API não disponibilizou compartilhamentos nesta consulta." };
  }

  // Insights do Threads: métricas vitalícias disponíveis por publicação.
  const threads = [...new Map([...porRede.threads, ...(metricas.publicacoesThreads ?? []).filter((p) => p.id).map((p) => ({ id: p.id, em: p.timestamp ?? "" }))].map((p) => [p.id, p])).values()].sort((a, b) => (b.em ?? "").localeCompare(a.em ?? "")).slice(0, 100);
  if (threads.length && env("THREADS_ACCESS_TOKEN")) {
    await concorrente(threads, 3, async (p) => {
      try {
        const data = await obter(`https://graph.threads.net/v1.0/${p.id}/insights?metric=views,likes,replies,reposts,quotes,shares&access_token=${encodeURIComponent(env("THREADS_ACCESS_TOKEN"))}`);
        const valores = Object.fromEntries((data.data ?? []).map((x) => [x.name, x.values?.[0]?.value]));
        metricas.itens[`threads:${p.id}`] = { valores, atualizadoEm: new Date().toISOString(), fonte: "Threads API" };
      } catch (e) { metricas.itens[`threads:${p.id}`] = { valores: {}, atualizadoEm: new Date().toISOString(), fonte: "Threads API", erro: e.message }; }
    });
    const erros = threads.filter((p) => metricas.itens[`threads:${p.id}`]?.erro).length;
    fontes.threads = { status: erros === threads.length ? "erro" : "parcial", consultados: threads.length, erros,
      nota: "Views e interações disponíveis conforme a publicação; valores podem variar por tipo de post." };
  } else if (threads.length) fontes.threads = { status: "indisponivel", nota: "THREADS_ACCESS_TOKEN não configurado." };

  fontes.tiktok = { status: "indisponivel", consultados: porRede.tiktok.length,
    nota: porRede.tiktok.length ? "Token sem escopo de leitura video.list; não é possível consultar views/likes/comentários." : "Nenhuma publicação TikTok consta no registro do projeto." };

  metricas.atualizadoEm = new Date().toISOString();
  metricas.fontes = fontes;
  salvarMetricas(metricas);
  atualizando = false;
  return true;
}

const servidor = createServer(async (req, res) => {
  const pathname = new URL(req.url ?? "/", `http://${HOST}`).pathname;
  if (req.method === "GET" && pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    return res.end(HTML);
  }
  if (req.method === "GET" && pathname === "/api/dashboard") {
    try {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      return res.end(JSON.stringify(construirDados()));
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      return res.end(JSON.stringify({ erro: e.message }));
    }
  }
  if (req.method === "POST" && pathname === "/api/atualizar-metricas") {
    res.writeHead(202, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    if (!atualizando) {
      atualizarMetricas().catch((e) => console.error(`Falha ao atualizar métricas: ${e.message}`));
    }
    res.end(JSON.stringify({ iniciada: true }));
    return;
  }
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Não encontrado");
});

servidor.listen(PORTA, HOST, () => {
  console.log(`Dashboard local: http://${HOST}:${PORTA}`);
  console.log("O painel é privado e acessível apenas neste computador.");
});

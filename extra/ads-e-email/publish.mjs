#!/usr/bin/env node
// Orquestrador da automação de divulgação.
//
// Uso:
//   node marketing/publish.mjs --dry-run            # mostra o que seria feito
//   node marketing/publish.mjs --channel=instagram --campaign=launch
//   node marketing/publish.mjs --channel=email --campaign=reactivation --to=supabase
//   node marketing/publish.mjs --channel=email --campaign=promo --to=voce@exemplo.com
//   node marketing/publish.mjs --channel=meta-ads --activate --yes   # ativa campanha paga
//   node marketing/publish.mjs --channel=meta-ads                     # cria pausada
//
// Flags:
//   --dry-run        valida e mostra sem enviar
//   --force          ignora o cooldown de repetição
//   --to=supabase    e-mail: usa a base de usuários do app
//   --to=a@x.com,b@y.com   e-mail: lista literal
//   --activate       meta-ads: deixa a campanha ativa (exige --yes)
//   --yes            confirma ações que mexem com dinheiro
import { env, requireEnv, appLink } from "./lib/env.mjs";
import * as templates from "./lib/templates.mjs";
import { publishedWithin, recordPublished } from "./lib/state.mjs";
import { sendEmail, emailReady } from "./lib/resend.mjs";
import { fetchSupabaseEmails } from "./lib/audience.mjs";
import { publishInstagram, instagramReady } from "./lib/meta-ig.mjs";
import { createTrafficCampaign, metaAdsReady } from "./lib/meta-ads.mjs";
import { createGoogleAdsCampaign, googleAdsReady } from "./lib/google-ads.mjs";

const CHANNELS = ["email", "instagram", "meta-ads", "google-ads"];
const CAMPAIGNS = {
  launch: { email: false, instagram: true },
  promo: { email: true, instagram: true },
  reactivation: { email: true, instagram: true },
};

function parseArgs(argv) {
  const args = { channel: [], campaign: "launch", to: null, dryRun: false, force: false, activate: false, yes: false };
  for (const a of argv) {
    const [k, v] = a.split("=");
    switch (k) {
      case "--channel":
        args.channel.push(v);
        break;
      case "--campaign":
        args.campaign = v;
        break;
      case "--to":
        args.to = v;
        break;
      case "--dry-run":
        args.dryRun = true;
        break;
      case "--force":
        args.force = true;
        break;
      case "--activate":
        args.activate = true;
        break;
      case "--yes":
        args.yes = true;
        break;
      default:
        console.error(`Argumento desconhecido: ${k}`);
        process.exit(1);
    }
  }
  if (!CAMPAIGNS[args.campaign]) {
    console.error(`Campanha desconhecida: ${args.campaign} (disponíveis: ${Object.keys(CAMPAIGNS).join(", ")})`);
    process.exit(1);
  }
  if (args.channel.length === 0) args.channel = [...CHANNELS];
  return args;
}

const COOLDOWN_HOURS = { email: 7 * 24, instagram: 3 * 24, "meta-ads": 30 * 24, "google-ads": 30 * 24 };

async function runEmail(args, campaign) {
  if (!CAMPAIGNS[campaign].email) {
    console.log(`[email] campanha "${campaign}" não usa e-mail — pulando.`);
    return;
  }
  const ready = emailReady();
  if (!ready.ok) {
    console.log(`[email] desabilitado: ${ready.error}`);
    return;
  }
  if (!args.force && publishedWithin("email", campaign, COOLDOWN_HOURS.email)) {
    console.log(`[email] "${campaign}" já enviada recentemente — use --force para repetir.`);
    return;
  }

  let to;
  if (args.to === "supabase") {
    const res = await fetchSupabaseEmails();
    if (!res.ok) {
      console.log(`[email] ${res.error}`);
      return;
    }
    to = res.emails;
    if (to.length === 0) {
      console.log("[email] nenhum e-mail encontrado no Supabase.");
      return;
    }
  } else if (args.to) {
    to = args.to.split(",").map((e) => e.trim()).filter(Boolean);
  } else {
    console.log('[email] informe --to=supabase ou --to=email@exemplo.com');
    return;
  }

  const link = appLink({ source: "email", medium: "email", campaign });
  const content =
    campaign === "promo"
      ? templates.emailPromo({ link })
      : templates.emailReactivation({ link });

  const res = await sendEmail(
    { from: ready.from, to, ...content },
    { dryRun: args.dryRun },
  );
  if (!res.ok) {
    console.log(`[email] erro: ${res.error}`);
    return;
  }
  if (res.dryRun) return;
  recordPublished("email", campaign, { to: to.length });
  console.log(`[email] enviado "${content.subject}" para ${to.length} destinatário(s) (id ${res.id}).`);
}

async function runInstagram(args, campaign) {
  if (!CAMPAIGNS[campaign].instagram) {
    console.log(`[instagram] campanha "${campaign}" não usa Instagram — pulando.`);
    return;
  }
  const ready = instagramReady();
  if (!ready.ok) {
    console.log(`[instagram] desabilitado: ${ready.error}`);
    return;
  }
  if (!args.force && publishedWithin("instagram", campaign, COOLDOWN_HOURS.instagram)) {
    console.log(`[instagram] "${campaign}" já publicada recentemente — use --force para repetir.`);
    return;
  }

  const link = appLink({ source: "instagram", medium: "social", campaign });
  const { caption } =
    campaign === "promo"
      ? templates.instagramPromo({ link })
      : campaign === "reactivation"
        ? templates.instagramReactivation({ link })
        : templates.instagramLaunch({ link });

  const res = await publishInstagram({ caption }, { dryRun: args.dryRun });
  if (!res.ok) {
    console.log(`[instagram] erro: ${res.error}`);
    return;
  }
  if (res.dryRun) return;
  recordPublished("instagram", campaign, { media_id: res.id });
  console.log(`[instagram] post publicado (media ${res.id}).`);
}

async function runMetaAds(args, campaign) {
  const ready = metaAdsReady();
  if (!ready.ok) {
    console.log(`[meta-ads] desabilitado: ${ready.error}`);
    return;
  }
  if (!args.force && publishedWithin("meta-ads", campaign, COOLDOWN_HOURS["meta-ads"])) {
    console.log(`[meta-ads] "${campaign}" já criada recentemente — use --force para repetir.`);
    return;
  }
  if (args.activate && !args.yes) {
    console.log("[meta-ads] --activate gasta dinheiro real. Repita com --activate --yes para confirmar.");
    return;
  }

  const budget = Number(env("META_ADS_DAILY_BUDGET_BRL") ?? 500);
  const link = appLink({ source: "meta_ads", medium: "cpc", campaign });
  const res = await createTrafficCampaign(
    { link, budgetBRL: budget },
    { dryRun: args.dryRun, activate: args.activate && args.yes },
  );
  if (!res.ok) {
    console.log(`[meta-ads] erro: ${res.error}`);
    return;
  }
  if (res.dryRun) return;
  recordPublished("meta-ads", campaign, {
    campaign_id: res.campaign_id,
    adset_id: res.adset_id,
    ad_id: res.ad_id,
    status: res.status,
  });
  console.log(
    `[meta-ads] campanha ${res.status} criada (campaign ${res.campaign_id}). ${res.status === "PAUSED" ? "Revise no Ads Manager antes de ativar." : ""}`,
  );
}

async function runGoogleAds(args, campaign) {
  const ready = googleAdsReady();
  if (!ready.ok) {
    console.log(`[google-ads] desabilitado: ${ready.error}`);
    return;
  }
  const res = await createGoogleAdsCampaign({}, { dryRun: args.dryRun });
  if (!res.ok) {
    console.log(`[google-ads] erro: ${res.error}`);
    return;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log(
    `Vai dar quanto? — automação de divulgação\nCampanha: ${args.campaign} | canais: ${args.channel.join(", ")} | ${args.dryRun ? "MODO DRY-RUN (nada será enviado)" : "modo real"}\n`,
  );

  for (const channel of args.channel) {
    switch (channel) {
      case "email":
        await runEmail(args, args.campaign);
        break;
      case "instagram":
        await runInstagram(args, args.campaign);
        break;
      case "meta-ads":
        await runMetaAds(args, args.campaign);
        break;
      case "google-ads":
        await runGoogleAds(args, args.campaign);
        break;
      default:
        console.log(`Canal desconhecido: ${channel}`);
    }
  }
}

main().catch((err) => {
  console.error("Falha na automação:", err);
  process.exit(1);
});

// Criação de campanha no Meta Ads (Marketing API).
//
// SEGURANÇA: campanhas, conjuntos e anúncios são criados sempre em status
// PAUSED. Nada de dinheiro real é gasto até você revisar no Ads Manager (ou
// passar --activate, que só funciona com confirmação explícita no CLI).
// Requer: App Meta com produto Marketing API, ad account, token com
// ads_management. Veja marketing/SETUP.md.
import { requireEnv } from "./env.mjs";

const GRAPH = "https://graph.facebook.com/v21.0";

export function metaAdsReady() {
  const token = requireEnv("META_ADS_ACCESS_TOKEN", "token com ads_management");
  const account = requireEnv("META_AD_ACCOUNT_ID", "ex: act_123456789");
  const page = requireEnv("META_PAGE_ID", "ID da página do Facebook");
  return {
    ok: token.ok && account.ok && page.ok,
    error: token.error ?? account.error ?? page.error,
  };
}

function params(obj) {
  return new URLSearchParams(obj).toString();
}

async function apiCall(url) {
  const res = await fetch(url, { method: "POST" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: `${res.status} ${JSON.stringify(data).slice(0, 300)}` };
  return { ok: true, data };
}

/**
 * Cria campanha de tráfego para a landing, pausada.
 * @param {{link:string, budgetBRL:number}} spec
 */
export async function createTrafficCampaign(spec, { dryRun = false, activate = false } = {}) {
  const token = requireEnv("META_ADS_ACCESS_TOKEN");
  const account = requireEnv("META_AD_ACCOUNT_ID");
  const page = requireEnv("META_PAGE_ID");
  const missing = [token, account, page].filter((x) => !x.ok);
  if (missing.length) return { ok: false, error: missing.map((x) => x.error).join(" ") };

  const dailyBudget = Math.max(500, Math.round((spec.budgetBRL ?? 500) * 100)); // centavos, mínimo R$5/dia
  const stamp = new Date().toISOString().slice(0, 16).replace(/[T:]/g, "-");
  const status = activate ? "ACTIVE" : "PAUSED";

  if (dryRun) {
    console.log(
      `[dry-run] Meta Ads: criaria campanha de tráfego pausada, orçamento ~R$${(dailyBudget / 100).toFixed(2)}/dia -> ${spec.link}`,
    );
    return { ok: true, dryRun: true };
  }

  const tok = encodeURIComponent(token.value);
  const base = `${GRAPH}/${account.value}`;

  // 1. Campanha
  const campaign = await apiCall(
    `${base}/campaigns?${params({
      name: `VDQ Tráfego ${stamp}`,
      objective: "OUTCOME_TRAFFIC",
      status,
      special_ad_categories: JSON.stringify([]),
      buy_type: "AUCTION",
      access_token: tok,
    })}`,
  );
  if (!campaign.ok) return { ok: false, error: `campanha: ${campaign.error}` };

  // 2. Conjunto de anúncios (público amplo BR, otimizado por cliques)
  const adset = await apiCall(
    `${base}/adsets?${params({
      name: `VDQ Público BR ${stamp}`,
      campaign_id: campaign.data.id,
      daily_budget: String(dailyBudget),
      billing_event: "IMPRESSIONS",
      optimization_goal: "link_clicks",
      bid_strategy: "LOWEST_COST_WITHOUT_CAP",
      status,
      targeting: JSON.stringify({
        geo_locations: { countries: ["BR"] },
        age_min: 18,
        age_max: 65,
        publisher_platforms: ["facebook", "instagram"],
      }),
      access_token: tok,
    })}`,
  );
  if (!adset.ok) return { ok: false, error: `conjunto: ${adset.error}` };

  // 3. Anúncio
  const ad = await apiCall(
    `${base}/ads?${params({
      name: `VDQ Anúncio ${stamp}`,
      adset_id: adset.data.id,
      status,
      creative: JSON.stringify({
        object_story_spec: {
          page_id: page.value,
          link_data: {
            link: spec.link,
            name: "Saiba quanto vai gastar antes do caixa",
            message:
              "Dite os produtos por voz e acompanhe o total da compra em tempo real. Grátis para começar.",
            call_to_action: { type: "LEARN_MORE" },
          },
        },
      }),
      access_token: tok,
    })}`,
  );
  if (!ad.ok) return { ok: false, error: `anúncio: ${ad.error}` };

  return {
    ok: true,
    campaign_id: campaign.data.id,
    adset_id: adset.data.id,
    ad_id: ad.data.id,
    status,
  };
}

// Google Ads — esqueleto. O Google Ads REST é significativamente mais complexo
// que o da Meta (OAuth com refresh token, developer token, customer id, e o
// endpoint /v17/customers/{id}/googleAds:searchStream para tudo).
//
// O alvo inicial recomendado é o Meta Ads (já implementado). Habilite este
// módulo depois que a campanha da Meta estiver rodando e você tiver:
//   GOOGLE_ADS_DEVELOPER_TOKEN      (Developer token do Google Ads)
//   GOOGLE_ADS_CLIENT_ID            (OAuth client id)
//   GOOGLE_ADS_CLIENT_SECRET        (OAuth client secret)
//   GOOGLE_ADS_REFRESH_TOKEN        (gerado via OAuth consent, escopo ads)
//   GOOGLE_ADS_CUSTOMER_ID          (ex: 123-456-7890)
//   GOOGLE_ADS_MANAGER_ID           (opcional, MCC que gerencia a conta)
import { requireEnv } from "./env.mjs";

export function googleAdsReady() {
  const keys = [
    "GOOGLE_ADS_DEVELOPER_TOKEN",
    "GOOGLE_ADS_CLIENT_ID",
    "GOOGLE_ADS_CLIENT_SECRET",
    "GOOGLE_ADS_REFRESH_TOKEN",
    "GOOGLE_ADS_CUSTOMER_ID",
  ];
  const missing = keys.filter((k) => !requireEnv(k).ok);
  return {
    ok: missing.length === 0,
    error: missing.length
      ? `Google Ads: faltam ${missing.join(", ")} — veja marketing/SETUP.md`
      : null,
  };
}

export async function createGoogleAdsCampaign(_spec, { dryRun = false } = {}) {
  if (dryRun) {
    console.log("[dry-run] Google Ads: módulo ainda não implementado (ver SETUP.md).");
    return { ok: true, dryRun: true };
  }
  return {
    ok: false,
    error:
      "Google Ads ainda não implementado. Comece pelo Meta Ads; depois adicione este módulo seguindo a Google Ads REST API.",
  };
}

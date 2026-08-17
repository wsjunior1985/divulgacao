// Audiência para e-mail marketing: busca os e-mails dos usuários do app no
// Supabase (base própria — quem criou conta). Requer SERVICE_ROLE_KEY porque a
// leitura de profiles passa por RLS para o cliente anônimo.
import { requireEnv } from "./env.mjs";

export async function fetchSupabaseEmails() {
  const url = requireEnv("SUPABASE_URL", "ex: https://xyz.supabase.co");
  const key = requireEnv(
    "SUPABASE_SERVICE_ROLE_KEY",
    "service role key (Settings > API) — para --to=supabase",
  );
  if (!url.ok) return { ok: false, error: url.error };
  if (!key.ok) return { ok: false, error: key.error };

  try {
    const res = await fetch(`${url.value}/rest/v1/profiles?select=email`, {
      headers: {
        apikey: key.value,
        Authorization: `Bearer ${key.value}`,
      },
    });
    if (!res.ok) throw new Error(`Supabase respondeu ${res.status}`);
    const rows = await res.json();
    const emails = Array.isArray(rows)
      ? [...new Set(rows.map((r) => r?.email).filter((e) => typeof e === "string" && e.includes("@")))]
      : [];
    return { ok: true, emails };
  } catch (err) {
    return { ok: false, error: `Falha ao buscar usuários no Supabase: ${err.message}` };
  }
}

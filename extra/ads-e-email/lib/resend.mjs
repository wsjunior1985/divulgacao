// Publicador de e-mail via API do Resend (https://resend.com/docs/api-reference/emails/send-email).
import { requireEnv } from "./env.mjs";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export function emailReady() {
  const key = requireEnv("RESEND_API_KEY", "chave sk_ do Resend");
  const from = requireEnv("RESEND_FROM", 'ex: "Vai dar quanto? <oi@vaidarquanto.com.br>"');
  return { ok: key.ok && from.ok, error: key.error ?? from.error, from: from.ok ? from.value : null };
}

/**
 * Envia um e-mail para uma lista.
 * @param {{from:string, to:string[], subject:string, html:string, text:string}} email
 */
export async function sendEmail(email, { dryRun = false } = {}) {
  const key = requireEnv("RESEND_API_KEY", "chave sk_ do Resend");
  if (!key.ok) return { ok: false, error: key.error };

  const payload = {
    from: email.from,
    to: email.to,
    subject: email.subject,
    ...(email.html ? { html: email.html } : {}),
    ...(email.text ? { text: email.text } : {}),
  };

  if (dryRun) {
    console.log(`[dry-run] E-mail "${email.subject}" -> ${email.to.length} destinatário(s): ${email.to.slice(0, 3).join(", ")}${email.to.length > 3 ? "…" : ""}`);
    return { ok: true, dryRun: true };
  }

  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key.value}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { ok: false, error: `Resend ${res.status}: ${body.slice(0, 300)}` };
  }
  const data = await res.json();
  return { ok: true, id: data?.id };
}

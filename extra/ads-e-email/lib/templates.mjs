// Biblioteca de conteúdo: gera o texto de cada campanha por canal a partir de
// variáveis (preços, link com UTM). Um lugar só — editar aqui reflete em todos
// os canais e mantém a marca consistente.
import { APP_URL, PREMIUM_MONTHLY, PREMIUM_ANNUAL } from "./env.mjs";

/** Instagram: post de lançamento do app. */
export function instagramLaunch({ link }) {
  return {
    caption: [
      "Já chegou no caixa do mercado e levou um susto com o total? 😅",
      "",
      "O Vai dar quanto? resolve isso: você dita os produtos por voz e ele mostra o total em tempo real, antes de fechar a conta. Sem instalar nada — abre no navegador.",
      "",
      "✅ Total em tempo real",
      "✅ Orçamento pra não estourar",
      "✅ Sem anúncios, sem rastreamento",
      `✅ Grátis pra começar · Premium ${PREMIUM_MONTHLY}`,
      "",
      `👉 ${link}`,
      "",
      "#controlefinanceiro #supermercado #economia #compras #financaspessoais #app",
    ].join("\n"),
  };
}

/** Instagram: post de oferta/destaque do Premium. */
export function instagramPromo({ link }) {
  return {
    caption: [
      "Quem controla o orçamento economiza todo mês. 💸",
      "",
      `Com o Premium do Vai dar quanto? você leva lista rápida, histórico completo e estatísticas dos seus gastos — por ${PREMIUM_ANNUAL} no plano anual (economia de 33% vs. mensal).`,
      "",
      "Fala o produto, ele soma. Simples assim.",
      "",
      `👉 ${link}`,
      "",
      "#orcamento #economizar #controlefinanceiro #supermercado #financaspessoais",
    ].join("\n"),
  };
}

/** Instagram: post para quem já baixou/visitou e ainda não assinou. */
export function instagramReactivation({ link }) {
  return {
    caption: [
      "Você já sabe quanto vai gastar antes de chegar no caixa? 🛒",
      "",
      "Se ainda não testou, esse é o momento: o Vai dar quanto? conta o total em tempo real enquanto você monta a compra, por voz ou texto.",
      "",
      `Grátis pra começar e, quando quiser ir além, o Premium custa ${PREMIUM_MONTHLY}.`,
      "",
      `👉 ${link}`,
      "",
      "#controlefinanceiro #compras #supermercado #economia #organizacao",
    ].join("\n"),
  };
}

function emailShell({ title, bodyHtml }) {
  return `<!doctype html>
<html lang="pt-BR">
<body style="margin:0;padding:0;background:#0a0e27;font-family:Inter,Arial,sans-serif;color:#e8eaf6;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <p style="font-size:14px;font-weight:700;color:#a5b4fc;letter-spacing:1px;">VAI DAR QUANTO?</p>
    <h1 style="font-size:24px;line-height:1.3;color:#ffffff;margin:8px 0 16px;">${title}</h1>
    ${bodyHtml}
    <p style="font-size:12px;color:#64748b;margin-top:32px;">
      Você recebeu este e-mail por ser usuário do Vai dar quanto?. Dúvidas? Responda a este e-mail.
    </p>
  </div>
</body>
</html>`;
}

function emailBody({ link, preco }) {
  return `
    <p style="font-size:15px;line-height:1.7;color:#e8eaf6;">
      Quem controla o orçamento economiza todo mês. Com o <strong>Vai dar quanto?</strong> você
      dita os produtos por voz e acompanha o total da compra em tempo real — antes de chegar no caixa.
    </p>
    <p style="font-size:15px;line-height:1.7;color:#e8eaf6;">
      Grátis para começar. Quando quiser ir além, o <strong>Premium</strong> adiciona lista rápida,
      histórico, estatísticas e sincronização em nuvem por <strong>${preco}</strong>.
    </p>
    <p style="margin:24px 0;text-align:center;">
      <a href="${link}" style="display:inline-block;background:linear-gradient(90deg,#6366f1,#a855f7);color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:9999px;">
        Testar grátis
      </a>
    </p>`;
}

/** E-mail: reativação de usuário que criou conta mas não voltou. */
export function emailReactivation({ link }) {
  const html = emailShell({
    title: "O caixa ainda te pega de surpresa?",
    bodyHtml: emailBody({ link, preco: PREMIUM_MONTHLY }),
  });
  const text = [
    `Quem controla o orçamento economiza todo mês. Com o Vai dar quanto? você dita os produtos por voz e acompanha o total da compra em tempo real — antes de chegar no caixa.`,
    ``,
    `Grátis para começar. O Premium adiciona lista rápida, histórico, estatísticas e sincronização em nuvem por ${PREMIUM_MONTHLY}.`,
    ``,
    `Testar grátis: ${link}`,
  ].join("\n");
  return { subject: "O caixa ainda te pega de surpresa?", html, text };
}

/** E-mail: oferta do plano anual. */
export function emailPromo({ link }) {
  const html = emailShell({
    title: "Economize 33% no Premium anual",
    bodyHtml: emailBody({ link, preco: PREMIUM_ANNUAL }),
  });
  const text = [
    `O Premium anual do Vai dar quanto? custa ${PREMIUM_ANNUAL} — 33% a menos que o mensal (${PREMIUM_MONTHLY}).`,
    ``,
    `Lista rápida, histórico completo, estatísticas e sincronização em nuvem.`,
    ``,
    `Ver planos: ${link}`,
  ].join("\n");
  return { subject: "Economize 33% no Premium anual", html, text };
}

/** Texto de perfil/compartilhamento no WhatsApp (reuso em material manual). */
export function whatsappBlurb({ link }) {
  return `Estou usando o Vai dar quanto? pra controlar os gastos do supermercado: dito os produtos por voz e ele mostra o total em tempo real 🛒 Grátis pra começar!\n${link}`;
}

export const APP_URL_EXPORT = APP_URL;

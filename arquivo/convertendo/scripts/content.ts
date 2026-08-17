import { BASE_URL, type ChannelDef } from "./config.ts";

export type PostTemplate = {
  kind: string;
  path?: string; // caminho da página (ex.: /guias/iof-cartao-credito-internacional)
  text: string; // {url} é substituído pelo link com UTM
  card: { title: string; sub: string }; // texto curto para o card (Instagram/TikTok)
};

export const POSTS: PostTemplate[] = [
  {
    kind: "divulgacao",
    card: { title: "Quanto custa em reais?", sub: "O custo real, antes de pagar." },
    text: "US$ 149 = quanto em reais?\n\nCom IOF e spread do seu cartão, não a cotação de blog. Converta, compare formas de pagamento e escaneie etiquetas no Convertendo.\n\nGrátis → {url}",
  },
  {
    kind: "divulgacao",
    card: { title: "Viaje sem conta de cabeça", sub: "Conversor, comparador, lista e scanner." },
    text: "Viajar é bom. Fazer conta de quanto custa em reais, nem tanto.\n\nO Convertendo resolve: moedas, comparador de pagamentos, lista com scanner e medidas — tudo em reais.\n\nGrátis → {url}",
  },
  {
    kind: "dica_iof",
    path: "/guias/iof-cartao-credito-internacional",
    card: { title: "3,38% de IOF?", sub: "Cartão de crédito internacional." },
    text: "Cartão de crédito internacional paga 3,38% de IOF. Uma remessa paga 0,38%.\n\nNuma compra de US$ 1.000, a diferença passa de R$ 150.\n\nGuia completo 👉 {url}",
  },
  {
    kind: "dica_cambio",
    path: "/guias/conversor-de-moeda",
    card: { title: "A cotação não é o que você paga", sub: "Spread + IOF explicados." },
    text: "A cotação que você vê não é o que você paga.\n\nCâmbio comercial x turismo, spread e IOF explicados em um guia rápido:\n👉 {url}",
  },
  {
    kind: "dica_franquia",
    path: "/guias/franquia-alfandegaria",
    card: { title: "Quanto trazer sem imposto?", sub: "Franquia alfandegária na prática." },
    text: "Voltou do exterior com compras? Não deixe pra pensar na alfândega na hora.\n\nEntenda a franquia, o imposto sobre o excedente e como declarar:\n👉 {url}",
  },
  {
    kind: "cta",
    card: { title: "Pare de pagar mais caro", sub: "Veja o custo real em reais." },
    text: "Pare de pagar mais caro no exterior sem saber.\n\nConverta, compare formas de pagamento e veja o custo REAL em reais antes de pagar.\n\nComece grátis → {url}",
  },
  {
    kind: "divulgacao",
    card: { title: "Só descobriu o valor na fatura?", sub: "Não deixe isso acontecer." },
    text: "Fez compra internacional e só viu o valor em reais na fatura?\n\nO Convertendo mostra o custo total antes de pagar — com IOF, spread e a melhor forma de pagamento.\n\nComece grátis: {url}",
  },
  {
    kind: "dica_cambio",
    card: { title: "7 formas de pagamento, 1 vencedora", sub: "Compare antes de pagar." },
    text: "7 formas de pagamento, 1 vencedora.\n\nO Convertendo compara cartão de crédito, pré-pago, remessa, dinheiro e cripto — e mostra onde você economiza até 3%.\n\nTeste agora: {url}",
  },
  {
    kind: "cta",
    card: { title: "Viajando? Leve no bolso.", sub: "Moedas, compras e medidas." },
    text: "Viajando? Traga o Convertendo no bolso.\n\nMoedas, cotações, lista de compras e medidas — tudo convertido pra reais, sem anúncio.\n\nBaixe grátis: {url}",
  },
  {
    kind: "dica_franquia",
    path: "/guias/franquia-alfandegaria",
    card: { title: "Limite da franquia mudou?", sub: "Veja a regra atualizada." },
    text: "Quanto posso trazer do exterior sem pagar imposto?\n\nA franquia alfandegária tem limites que mudam — veja o guia atualizado:\n👉 {url}",
  },
];

export function buildUrl(
  channel: string,
  def: ChannelDef,
  campaign: string,
  template: PostTemplate,
): string {
  const base = template.path ? `${BASE_URL}${template.path}` : `${BASE_URL}/`;
  const params = new URLSearchParams({
    utm_source: channel,
    utm_medium: "social",
    utm_campaign: campaign,
  });
  return `${base}?${params.toString()}`;
}

export function pickPosts(start: number, count: number): PostTemplate[] {
  const out: PostTemplate[] = [];
  for (let i = 0; i < count; i++) out.push(POSTS[(start + i) % POSTS.length]);
  return out;
}

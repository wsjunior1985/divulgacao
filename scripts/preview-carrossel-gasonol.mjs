#!/usr/bin/env node
// Renderiza o piloto visual aprovado de GASONOL em sete imagens para revisão.
// Não publica nem altera a agenda automática.

import { mkdirSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import { carregarEnv, lerJson } from "./lib/base.js";
import { gerarCard } from "./lib/cards.js";

carregarEnv();

const app = lerJson("apps/gasonol.json");
const destino = resolve("carrosseis/2026-11-03-gasonol-recriar-referencia/slides");
mkdirSync(destino, { recursive: true });

const beneficios = (...itens) => itens.map(([icone, titulo, texto]) => ({ icone, titulo, texto }));
const slides = [
  {
    titulo: "Gasolina<br>ou etanol?", destaque: "Depende do carro",
    sub: "A resposta muda conforme o consumo do seu modelo.", tela: "tela-calculadora",
    beneficios: beneficios(["carro", "Consumo do modelo", "Cada carro tem uma conta diferente."], ["gota", "Preço da bomba", "Compare os valores que você encontrou."], ["cronometro", "Decisão rápida", "Veja o resultado antes de abastecer."]),
  },
  {
    titulo: "A regra dos", destaque: "70% não basta",
    sub: "Essa aproximação não considera o consumo do seu veículo.", tela: "tela-etanol",
    beneficios: beneficios(["carro", "Seu modelo importa", "O consumo muda de carro para carro."], ["medalha", "Dados PBEV", "Consumo por versão na base INMETRO/PBEV."], ["alvo", "Conta individual", "A comparação considera o veículo escolhido."]),
  },
  {
    titulo: "Escolha marca,", destaque: "modelo e ano",
    sub: "O GASONOL usa os dados de consumo do veículo selecionado.", tela: "tela-seletor",
    beneficios: beneficios(["carro", "Busque o veículo", "Encontre marca, modelo e ano."], ["medalha", "Base oficial", "Dados de consumo INMETRO/PBEV."], ["estrada", "Dois percursos", "Consulte cidade ou estrada."]),
  },
  {
    titulo: "Informe os preços", destaque: "ou fale os valores",
    sub: "Digite os preços da bomba ou use o comando de voz.", tela: "tela-voz",
    beneficios: beneficios(["gota", "Gasolina e etanol", "Preencha os dois valores do posto."], ["microfone", "Comando de voz", "Fale os preços para preencher."], ["cronometro", "Na hora", "Consulte antes de escolher a bomba."]),
  },
  {
    titulo: "Compare", destaque: "cidade e estrada",
    sub: "O consumo do veículo pode mudar conforme o percurso.", tela: "tela-gasolina",
    beneficios: beneficios(["estrada", "Modo cidade", "Compare usando o consumo urbano."], ["estrada", "Modo estrada", "Veja a comparação para rodovia."], ["alvo", "Mesmo veículo", "Alterne o percurso do modelo escolhido."]),
  },
  {
    titulo: "Consulte seus", destaque: "cálculos anteriores",
    sub: "O histórico ajuda a rever resultados e preços informados.", tela: "tela-economia",
    beneficios: beneficios(["lista", "Consultas salvas", "Reveja cálculos anteriores."], ["grafico", "Compare resultados", "Consulte os valores registrados."], ["check", "Você controla", "Apague o histórico quando quiser."]),
  },
  {
    titulo: "Na próxima parada,", destaque: "faça a conta",
    sub: "Compare os combustíveis para o seu carro antes de abastecer.", tela: "tela-calculadora",
    beneficios: beneficios(["carro", "Escolha seu modelo", "Use o consumo da versão escolhida."], ["gota", "Informe os preços", "Digite ou fale os valores da bomba."], ["raioCirculo", "Decida com clareza", "Acesse gasonol.com.br e compare."]),
  },
];

for (let i = 0; i < slides.length; i++) {
  const conteudo = slides[i];
  const post = {
    id: `carrossel-piloto-${i + 1}`,
    card: { titulo: conteudo.titulo, sub: conteudo.sub },
    premium: {
      titulo: conteudo.titulo,
      destaque: conteudo.destaque,
      sub: conteudo.sub,
      tela: conteudo.tela,
      beneficios: conteudo.beneficios,
    },
  };
  const nome = `preview-carrossel-gasonol-${String(i + 1).padStart(2, "0")}`;
  const renderizado = await gerarCard({ app, post, formato: "feed", nome, variacao: i % 3 });
  const pagina = String(i + 1).padStart(2, "0");
  const indicador = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="110" height="46" viewBox="0 0 110 46"><rect x="1" y="1" width="108" height="44" rx="22" fill="#080b08" fill-opacity=".92" stroke="#8ee53a" stroke-width="2"/><text x="55" y="30" text-anchor="middle" font-family="Arial,sans-serif" font-size="21" font-weight="700" fill="#fff">${Number(pagina)}/7</text></svg>`);
  await sharp(renderizado.caminho)
    .composite([{ input: indicador, left: 922, top: 34 }])
    .jpeg({ quality: 92, chromaSubsampling: "4:4:4" })
    .toFile(resolve(destino, `${pagina}-gasonol.jpg`));
  unlinkSync(renderizado.caminho);
  console.log(`${i + 1}/7 ${conteudo.titulo.replaceAll("<br>", " ")}`);
}

console.log(`Pronto para revisão visual: ${destino}`);

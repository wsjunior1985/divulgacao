// Gera o plano semanal de posts (JSON + Markdown) com links UTM.
//
// Uso:
//   bun scripts/marketing/planner.ts                       # próximos 7 dias
//   bun scripts/marketing/planner.ts --days 7 --campaign divulgacao
//   bun scripts/marketing/planner.ts --start 1             # começa amanhã
import { buildPlan, writePlan } from "./planner.ts";

const args = process.argv.slice(2);
function flag(name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

const days = Number(flag("--days") ?? "7");
const campaign = flag("--campaign") ?? "divulgacao";
const startOffset = Number(flag("--start") ?? "1");

const plan = buildPlan({ days, campaign, startOffset });
const { json, md } = writePlan(plan, "marketing");

console.log(`Plano de ${plan.length} posts gerado (campanha: ${campaign}, ${days} dias).`);
console.log(`JSON: ${json}`);
console.log(`Markdown para revisão: ${md}`);

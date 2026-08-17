import { mkdirSync, writeFileSync } from "node:fs";
import { CHANNELS, TIMEZONE, WEEKDAYS, channelList, type ChannelDef } from "./config.ts";
import { buildUrl, pickPosts, type PostTemplate } from "./content.ts";

export type PlanEntry = {
  id: string;
  channel: string;
  channelLabel: string;
  adapter: string;
  service: string;
  needsMedia: boolean;
  date: string; // YYYY-MM-DD local
  time: string; // HH:MM local
  dueAt: string; // ISO 8601 UTC
  kind: string;
  text: string;
  media: string | null;
  cardTitle: string;
  cardSub: string;
};

export function localTimeToUtc(date: string, time: string, tz: string): string {
  // 1) Trata a hora de parede como se fosse UTC (candidato).
  const candidate = new Date(`${date}T${time}:00Z`);
  // 2) Qual hora de parede no fuso alvo o candidato representa?
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    fmt
      .formatToParts(candidate)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value]),
  );
  const wallInTz = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  // 3) O instante real = candidato ajustado pela diferença do fuso.
  const delta = candidate.getTime() - wallInTz;
  return new Date(candidate.getTime() + delta).toISOString();
}

export function buildPlan(options: {
  days: number;
  campaign: string;
  startOffset: number; // dias a partir de hoje (0 = hoje, 1 = amanhã)
}): PlanEntry[] {
  const { days, campaign, startOffset } = options;
  const entries: PlanEntry[] = [];

  const channelKeys = channelList();

  for (const channel of channelKeys) {
    const def: ChannelDef = CHANNELS[channel];
    const weekdayFilter = WEEKDAYS[channel] ?? [];
    // Cada canal avança no banco de posts em lotes; o base diferencia os canais
    // para o mesmo dia não repetir exatamente o mesmo texto em todas as redes.
    let cursor = channelKeys.indexOf(channel) * 3;

    for (let dayOffset = 0; dayOffset < days; dayOffset++) {
      const d = new Date();
      d.setHours(12, 0, 0, 0);
      d.setDate(d.getDate() + startOffset + dayOffset);
      const date = d.toLocaleDateString("en-CA"); // YYYY-MM-DD (hora neutra não afeta a data)
      const weekday = d.getDay();

      if (!weekdayFilter.includes(weekday)) continue;

      const templates: PostTemplate[] = pickPosts(cursor, def.times.length);
      cursor += def.times.length;

      templates.forEach((tpl, i) => {
        const time = def.times[i % def.times.length];
        const url = buildUrl(channel, def, campaign, tpl);
        const text = tpl.text.replace("{url}", url);
        entries.push({
          id: `${channel}-${date}-${i}`,
          channel,
          channelLabel: def.label,
          adapter: def.adapter,
          service: def.service,
          needsMedia: def.needsMedia,
          date,
          time,
          dueAt: localTimeToUtc(date, time, TIMEZONE),
          kind: tpl.kind,
          text,
          media: null,
          cardTitle: tpl.card.title,
          cardSub: tpl.card.sub,
        });
      });
    }
  }

  entries.sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  return entries;
}

export function writePlan(entries: PlanEntry[], outDir: string): { json: string; md: string } {
  mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const jsonPath = `${outDir}/planner-${stamp}.json`;
  const mdPath = `${outDir}/planner-${stamp}.md`;

  writeFileSync(jsonPath, JSON.stringify(entries, null, 2) + "\n");

  const lines = [
    `# Plano de posts — ${stamp}`,
    "",
    `Total: **${entries.length}** posts agendados.`,
    "",
    "| Data (SP) | Hora | Canal | Tipo | Adapter |",
    "|---|---|---|---|---|",
    ...entries.map(
      (e) =>
        `| ${e.date} | ${e.time} | ${e.channelLabel} | ${e.kind} | ${e.adapter}${e.needsMedia ? " (precisa mídia)" : ""} |`,
    ),
    "",
    "> Gerado com `npm run marketing:plan`. Revise antes de enfileirar.",
  ];
  writeFileSync(mdPath, lines.join("\n") + "\n");

  return { json: jsonPath, md: mdPath };
}

// Lista canais conectados ao Buffer — teste de autenticação e mapeamento.
// Uso: bun scripts/marketing/channels.ts
import { listChannels, listOrganizations } from "./buffer.ts";

const orgs = await listOrganizations();
if (!orgs.length) {
  console.log("Nenhuma organização encontrada. Confira o token em .env.local.");
  process.exit(1);
}
for (const org of orgs) {
  console.log(`\nOrganização: ${org.name} (${org.id})`);
  const channels = await listChannels(org.id);
  for (const c of channels) {
    const status = c.isQueuePaused ? "pausado" : "ok";
    console.log(`  - [${c.service}] ${c.displayName || c.name} → ${c.id} (${status})`);
  }
}

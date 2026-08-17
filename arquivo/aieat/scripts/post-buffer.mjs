// Posta docs/promotion/buffer-posts.json via Buffer GraphQL API (api.buffer.com/graphql).
// Descobre os canais automaticamente (não precisa de BUFFER_PROFILE_IDS) e faz o
// match por plataforma (instagram -> canal Instagram, tiktok -> canal TikTok).
// Só roda se BUFFER_API_KEY estiver no ambiente. BUFFER_DRAFT=true cria rascunhos
// (seguro para testar); defina false para publicar na fila.
// Uso: preencha BUFFER_API_KEY no .env e rode `npm run content:buffer`.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// Carrega .env manualmente (sem dependência externa).
try {
  const envRaw = readFileSync(resolve(root, ".env"), "utf8");
  for (const line of envRaw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  // .env ausente — usa só o que já estiver no ambiente.
}

const TOKEN = process.env.BUFFER_API_KEY;
const DRAFT = (process.env.BUFFER_DRAFT ?? "true") !== "false";
const GQL = "https://api.buffer.com/graphql";

if (!TOKEN) {
  console.error("[buffer] Defina BUFFER_API_KEY no .env para postar.");
  process.exit(1);
}

async function gql(query, variables) {
  const res = await fetch(GQL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json().catch(() => ({}));
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("; "));
  return json.data;
}

function channelMatches(channel, platform) {
  const hay = `${channel.name} ${channel.descriptor}`.toLowerCase();
  return hay.includes(platform);
}

async function main() {
  const account = await gql(`query { account { organizations { id } } }`);
  const orgId = account.account.organizations?.[0]?.id;
  if (!orgId) throw new Error("nenhuma organização encontrada na conta Buffer.");

  const chData = await gql(
    `query($o:OrganizationId!){ channels(input:{organizationId:$o}){ id name descriptor } }`,
    { o: orgId },
  );
  const channels = chData.channels;
  console.log(`[buffer] canais disponíveis: ${channels.map((c) => c.descriptor).join(", ") || "nenhum"}`);

  const posts = JSON.parse(
    readFileSync(resolve(root, "docs/promotion/buffer-posts.json"), "utf8"),
  );

  let ok = 0;
  let skipped = 0;
  for (const post of posts) {
    const channel = channels.find((c) => channelMatches(c, post.platform));
    if (!channel) {
      console.log(`[buffer] ⚠ pulando ${post.platform} (sem canal correspondente no Buffer)`);
      skipped++;
      continue;
    }
    try {
      const data = await gql(
        `mutation CreatePost($input: CreatePostInput!) {
          createPost(input: $input) {
            __typename
            ... on PostActionSuccess { post { id } }
            ... on NotFoundError { message }
            ... on UnauthorizedError { message }
            ... on UnexpectedError { message }
            ... on RestProxyError { message }
            ... on LimitReachedError { message }
            ... on InvalidInputError { message }
          }
        }`,
        {
          input: {
            channelId: channel.id,
            text: post.text,
            assets: post.platform === "tiktok" ? [] : [{ link: { url: post.media.link } }],
            mode: "addToQueue",
            schedulingType: "automatic",
            needsApproval: false,
            saveToDraft: DRAFT,
          },
        },
      );
      const payload = data.createPost;
      if (payload?.__typename !== "PostActionSuccess") {
        throw new Error(payload?.message ?? "erro desconhecido");
      }
      ok++;
      console.log(
        `[buffer] ✓ ${post.platform} -> ${channel.descriptor}${DRAFT ? " (rascunho)" : ""}`,
      );
    } catch (e) {
      console.error(`[buffer] ✗ ${post.platform} falhou: ${e.message}`);
    }
  }
  console.log(`[buffer] ${ok} enviados, ${skipped} pulados.`);
}

main().catch((e) => {
  console.error("[buffer] erro:", e.message);
  process.exit(1);
});

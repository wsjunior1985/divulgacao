import { loadEnv } from "./env.ts";

loadEnv();

export type BufferChannel = {
  id: string;
  name: string;
  displayName: string;
  service: string;
  isQueuePaused: boolean;
};

type GraphQLError = { message?: string };
type GraphQLResponse<T> = { data?: T; errors?: GraphQLError[] };

type OrganizationsQuery = { account: { organizations: { id: string; name: string }[] } };
type ChannelsQuery = { channels: BufferChannel[] };
type PostsQuery = {
  posts: { edges: { node: { id: string; text: string } }[] };
};
type CreatePostQuery = {
  createPost: { post: { id: string; text: string; dueAt: string } } | { message: string };
};

async function bufferQuery<T>(query: string): Promise<T> {
  const token = process.env.BUFFER_ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      "BUFFER_ACCESS_TOKEN não configurado. Veja marketing/AUTOMACAO.md (token em .env.local).",
    );
  }
  const res = await fetch("https://api.buffer.com", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`Buffer HTTP ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as GraphQLResponse<T>;
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  if (!json.data) throw new Error("Buffer retornou sem dados.");
  return json.data;
}

export async function listOrganizations(): Promise<{ id: string; name: string }[]> {
  const data = await bufferQuery<OrganizationsQuery>(
    `query { account { organizations { id name } } }`,
  );
  return data.account?.organizations ?? [];
}

export async function listChannels(organizationId: string): Promise<BufferChannel[]> {
  const data = await bufferQuery<ChannelsQuery>(
    `query GetChannels {
      channels(input: { organizationId: "${organizationId}" }) {
        id
        name
        displayName
        service
        isQueuePaused
      }
    }`,
  );
  return data.channels ?? [];
}

// Textos dos posts já agendados em um canal — usado para não duplicar numa re-rodada.
export async function listScheduledTexts(
  organizationId: string,
  channelId: string,
): Promise<string[]> {
  return (await listScheduledPosts(organizationId, channelId)).map((p) => p.text);
}

export async function listScheduledPosts(
  organizationId: string,
  channelId: string,
): Promise<{ id: string; text: string }[]> {
  const data = await bufferQuery<PostsQuery>(
    `query GetScheduled {
      posts(first: 100, input: {
        organizationId: "${organizationId}"
        filter: { status: [scheduled], channelIds: ["${channelId}"] }
      }) {
        edges { node { id text } }
      }
    }`,
  );
  return data.posts?.edges?.map((e) => e.node) ?? [];
}

export async function deletePost(id: string): Promise<void> {
  const query = `mutation DeletePost {
    deletePost(input: { id: "${id}" }) {
      __typename
      ... on MutationError { message }
    }
  }`;
  const data = await bufferQuery<{ deletePost: { __typename: string; message?: string } }>(query);
  const result = data.deletePost;
  if (result?.message) throw new Error(result.message);
}

export async function createScheduledPost(args: {
  channelId: string;
  text: string;
  dueAt: string;
  media?: string | null;
}): Promise<{ id: string; dueAt: string; text: string }> {
  const { channelId, text, dueAt, media } = args;
  const escapedText = text
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")
    .replace(/"/g, '\\"');
  const assets =
    media && media.startsWith("https://")
      ? `assets: [{ image: { url: "${media.replace(/"/g, '\\"')}" } }]`
      : "";
  const query = `mutation CreatePost {
    createPost(input: {
      text: "${escapedText}"
      channelId: "${channelId}"
      schedulingType: automatic
      mode: customScheduled
      dueAt: "${dueAt}"
      ${assets}
    }) {
      ... on PostActionSuccess {
        post { id text dueAt }
      }
      ... on MutationError { message }
    }
  }`;
  const data = await bufferQuery<CreatePostQuery>(query);
  const result = data.createPost;
  if ("message" in result && result.message) throw new Error(result.message);
  if ("post" in result) return result.post;
  throw new Error("Resposta inesperada do Buffer.");
}

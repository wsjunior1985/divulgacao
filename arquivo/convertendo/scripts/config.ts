export const BASE_URL = "https://convertendo.app.br";
export const TIMEZONE = "America/Sao_Paulo";

export type Adapter = "buffer" | "manual";

export type ChannelDef = {
  label: string;
  adapter: Adapter;
  service: string;
  times: string[];
  needsMedia: boolean;
};

export const CHANNELS: Record<string, ChannelDef> = {
  x: {
    label: "X (Twitter)",
    adapter: "buffer",
    service: "twitter",
    times: ["09:00", "13:00", "18:00"],
    needsMedia: false,
  },
  facebook: {
    label: "Facebook",
    adapter: "buffer",
    service: "facebook",
    times: ["10:00", "17:00"],
    needsMedia: false,
  },
  instagram: {
    label: "Instagram",
    adapter: "buffer",
    service: "instagram",
    times: ["11:00"],
    needsMedia: true,
  },
  tiktok: {
    label: "TikTok",
    adapter: "manual",
    service: "tiktok",
    times: ["12:00", "19:00"],
    needsMedia: true,
  },
};

// Dias da semana por canal (0 = domingo ... 6 = sábado).
export const WEEKDAYS: Record<string, number[]> = {
  x: [1, 2, 3, 4, 5, 6],
  facebook: [1, 3, 5],
  instagram: [1, 3, 5],
  tiktok: [2, 4, 6],
};

export function channelList(): string[] {
  return Object.keys(CHANNELS);
}

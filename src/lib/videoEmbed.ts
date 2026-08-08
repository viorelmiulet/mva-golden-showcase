/**
 * Normalizes property video links coming from the Immoflux feed (or admin input).
 *
 * Accepts full YouTube/Vimeo URLs, youtu.be short links and bare video IDs.
 * Returns the raw value plus a privacy-friendly embed URL
 * (youtube-nocookie.com for YouTube, player.vimeo.com with dnt for Vimeo).
 * Unrecognized or empty values yield null.
 */
export interface NormalizedVideo {
  raw: string;
  embedUrl: string;
  provider: "youtube" | "vimeo";
}

const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_ID = /^\d{6,12}$/;

const youtubeEmbed = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
const vimeoEmbed = (id: string) => `https://player.vimeo.com/video/${id}?dnt=1`;

export function normalizeVideoUrl(input: unknown): NormalizedVideo | null {
  if (typeof input !== "string") return null;
  const raw = input.trim();
  if (!raw) return null;

  // Bare IDs
  if (YT_ID.test(raw)) return { raw, embedUrl: youtubeEmbed(raw), provider: "youtube" };
  if (VIMEO_ID.test(raw)) return { raw, embedUrl: vimeoEmbed(raw), provider: "vimeo" };

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./i, "").toLowerCase();
  const segments = url.pathname.split("/").filter(Boolean);

  if (host === "youtu.be") {
    const id = segments[0];
    if (id && YT_ID.test(id)) return { raw, embedUrl: youtubeEmbed(id), provider: "youtube" };
    return null;
  }

  if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
    const v = url.searchParams.get("v");
    if (v && YT_ID.test(v)) return { raw, embedUrl: youtubeEmbed(v), provider: "youtube" };
    // /embed/ID, /v/ID, /shorts/ID, /live/ID
    const idx = segments.findIndex((s) => ["embed", "v", "shorts", "live"].includes(s));
    const id = idx >= 0 ? segments[idx + 1] : undefined;
    if (id && YT_ID.test(id)) return { raw, embedUrl: youtubeEmbed(id), provider: "youtube" };
    return null;
  }

  if (host.endsWith("vimeo.com")) {
    const id = segments.find((s) => VIMEO_ID.test(s));
    if (id) return { raw, embedUrl: vimeoEmbed(id), provider: "vimeo" };
    return null;
  }

  return null;
}

/** Convenience: embed URL only, or null. */
export const videoEmbedUrl = (input: unknown): string | null =>
  normalizeVideoUrl(input)?.embedUrl ?? null;

/** True when a catalog row has a usable video. */
export const hasVideo = (row: any): boolean =>
  Boolean(row?.video_embed_url || videoEmbedUrl(row?.video));

/** Embed URL for a catalog row (prefers the stored normalized column). */
export const rowVideoEmbedUrl = (row: any): string | null =>
  (typeof row?.video_embed_url === "string" && row.video_embed_url) || videoEmbedUrl(row?.video);

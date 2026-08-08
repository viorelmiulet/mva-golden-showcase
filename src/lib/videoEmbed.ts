/**
 * Video helpers for property/development pages.
 *
 * Two sources exist:
 *  - manual admin entry (YouTube only) → `video_manual` (raw) + `video_id` (11-char ID)
 *  - the Immoflux feed → `video` (raw) + `video_embed_url` (normalized YouTube/Vimeo)
 *
 * Resolution order when rendering: the property's own video first, then its
 * development's. Property-level always wins.
 */
export interface NormalizedVideo {
  raw: string;
  embedUrl: string;
  provider: "youtube" | "vimeo";
}

const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_ID = /^\d{6,12}$/;

/** Embed URL for a bare YouTube ID (nocookie, no end-screen suggestions, inline on iOS). */
export const youtubeEmbedFromId = (id: string, autoplay = false) =>
  `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1${autoplay ? "&autoplay=1" : ""}`;

export const youtubeWatchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;

export const youtubeThumb = (id: string, quality: "hqdefault" | "maxresdefault" = "hqdefault") =>
  `https://img.youtube.com/vi/${id}/${quality}.jpg`;

const vimeoEmbed = (id: string) => `https://player.vimeo.com/video/${id}?dnt=1`;

function toUrl(raw: string): URL | null {
  try {
    return new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
}

/**
 * Extracts a bare 11-character YouTube ID from watch/youtu.be/embed/shorts URLs
 * or from a bare ID. Extra query params (t=, list=, si=) are ignored.
 * Returns null when the value does not resolve to a valid ID.
 */
export function extractYouTubeId(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const raw = input.trim();
  if (!raw) return null;
  if (YT_ID.test(raw)) return raw;

  const url = toUrl(raw);
  if (!url) return null;

  const host = url.hostname.replace(/^www\./i, "").toLowerCase();
  const segments = url.pathname.split("/").filter(Boolean);

  if (host === "youtu.be") {
    const id = segments[0];
    return id && YT_ID.test(id) ? id : null;
  }

  if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
    const v = url.searchParams.get("v");
    if (v && YT_ID.test(v)) return v;
    const idx = segments.findIndex((s) => ["embed", "v", "shorts", "live"].includes(s));
    const id = idx >= 0 ? segments[idx + 1] : undefined;
    if (id && YT_ID.test(id)) return id;
  }

  return null;
}

export function normalizeVideoUrl(input: unknown): NormalizedVideo | null {
  if (typeof input !== "string") return null;
  const raw = input.trim();
  if (!raw) return null;

  const ytId = extractYouTubeId(raw);
  if (ytId) return { raw, embedUrl: youtubeEmbedFromId(ytId), provider: "youtube" };

  if (VIMEO_ID.test(raw)) return { raw, embedUrl: vimeoEmbed(raw), provider: "vimeo" };

  const url = toUrl(raw);
  if (!url) return null;
  const host = url.hostname.replace(/^www\./i, "").toLowerCase();
  if (host.endsWith("vimeo.com")) {
    const id = url.pathname.split("/").filter(Boolean).find((s) => VIMEO_ID.test(s));
    if (id) return { raw, embedUrl: vimeoEmbed(id), provider: "vimeo" };
  }
  return null;
}

/** Convenience: embed URL only, or null. */
export const videoEmbedUrl = (input: unknown): string | null =>
  normalizeVideoUrl(input)?.embedUrl ?? null;

export interface ResolvedVideo {
  embedUrl: string;
  /** Present for YouTube videos; enables thumbnails and watch URLs. */
  youtubeId: string | null;
  thumbnailUrl: string | null;
  watchUrl: string | null;
}

function fromRow(row: any): ResolvedVideo | null {
  if (!row) return null;
  const localThumb = typeof row.video_thumb_url === "string" && row.video_thumb_url ? row.video_thumb_url : null;
  const manualId = extractYouTubeId(row.video_id) || extractYouTubeId(row.video_manual);
  if (manualId) {
    return {
      // Only our own copy is referenced; img.youtube.com is never called before the user clicks play.
      embedUrl: youtubeEmbedFromId(manualId),
      youtubeId: manualId,
      thumbnailUrl: localThumb,
      watchUrl: youtubeWatchUrl(manualId),
    };
  }
  const feed =
    (typeof row.video_embed_url === "string" && row.video_embed_url) || videoEmbedUrl(row.video);
  if (!feed) return null;
  const feedId = extractYouTubeId(row.video);
  return {
    embedUrl: feed,
    youtubeId: feedId,
    thumbnailUrl: localThumb,
    watchUrl: feedId ? youtubeWatchUrl(feedId) : typeof row.video === "string" ? row.video : null,
  };
}

/** Property video first, then its development's. */
export function resolvePropertyVideo(row: any, development?: any): ResolvedVideo | null {
  return fromRow(row) || fromRow(development) || null;
}

/** True when a catalog row (optionally with its development) has a usable video. */
export const hasVideo = (row: any, development?: any): boolean =>
  Boolean(resolvePropertyVideo(row, development));

/** Embed URL for a catalog row. */
export const rowVideoEmbedUrl = (row: any, development?: any): string | null =>
  resolvePropertyVideo(row, development)?.embedUrl ?? null;

/**
 * Self-hosted YouTube thumbnails.
 *
 * The public site must not hit img.youtube.com before the user clicks play,
 * so the thumbnail is fetched once (during sync or an admin save) and stored
 * in our own Storage bucket. Pages then reference our copy only.
 */
const BUCKET = "project-images";
const PREFIX = "video-thumbs";

const publicUrl = (path: string) =>
  `${process.env["SUPABASE_URL"]}/storage/v1/object/public/${BUCKET}/${path}`;

/**
 * Ensures a locally stored copy of the YouTube thumbnail and returns its URL.
 * Returns null when the video ID is missing or YouTube has no image for it.
 */
export async function ensureVideoThumb(videoId: unknown): Promise<string | null> {
  const id = typeof videoId === "string" ? videoId.trim() : "";
  if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return null;

  const path = `${PREFIX}/${id}.jpg`;
  const url = publicUrl(path);

  try {
    // Already cached? A HEAD on the public URL is cheaper than a re-upload.
    const head = await fetch(url, { method: "HEAD" });
    if (head.ok) return url;

    const source =
      (await fetchImage(`https://img.youtube.com/vi/${id}/maxresdefault.jpg`)) ||
      (await fetchImage(`https://img.youtube.com/vi/${id}/hqdefault.jpg`));
    if (!source) return null;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, source, { contentType: "image/jpeg", upsert: true });
    if (error) return null;
    return url;
  } catch {
    return null;
  }
}

async function fetchImage(src: string): Promise<ArrayBuffer | null> {
  const res = await fetch(src);
  if (!res.ok) return null;
  const buf = await res.arrayBuffer();
  // YouTube answers 404-as-120x90 placeholder for missing maxresdefault.
  return buf.byteLength > 2000 ? buf : null;
}

/** Fills `video_thumb_url` on mapped rows that carry a YouTube video. */
export async function attachVideoThumbs<T extends Record<string, any>>(rows: T[]): Promise<T[]> {
  await Promise.all(
    rows.map(async (row) => {
      const id = extractIdFromRow(row);
      if (!id) return;
      const thumb = await ensureVideoThumb(id);
      if (thumb) (row as any).video_thumb_url = thumb;
    })
  );
  return rows;
}

function extractIdFromRow(row: Record<string, any>): string | null {
  const candidates = [row["video_id"], row["video_manual"], row["video"], row["video_embed_url"]];
  for (const value of candidates) {
    if (typeof value !== "string") continue;
    const direct = value.trim().match(/^[A-Za-z0-9_-]{11}$/)?.[0];
    if (direct) return direct;
    const match = value.match(/(?:v=|\/embed\/|youtu\.be\/|\/shorts\/)([A-Za-z0-9_-]{11})/);
    if (match) return match[1]!;
  }
  return null;
}

/** Utilitare pentru detectarea și curățarea conținutului HTML din emailuri. */

/** True dacă șirul conține markup HTML real (nu doar text simplu). */
export function looksLikeHtml(value?: string | null): boolean {
  if (!value) return false;
  return /<\s*(p|div|br|span|table|a|img|ul|ol|li|h[1-6]|strong|em|b|i|body|html)\b[^>]*>/i.test(
    value,
  );
}

/** Transformă HTML (sau text) într-un preview text simplu. */
export function toPreviewText(value?: string | null): string {
  if (!value) return "";
  if (!looksLikeHtml(value)) return value.trim();
  return value
    .replace(/<\s*(style|script)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, " ")
    .replace(/<\s*br\s*\/?\s*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

type PreviewSource = {
  body_html?: string | null;
  body_plain?: string | null;
  stripped_text?: string | null;
};

/**
 * Sursa unică pentru preview-ul unui email: preferăm mereu body_html curățat,
 * apoi textul derivat (body_plain / stripped_text).
 */
export function getEmailPreview(email: PreviewSource, maxLength = 90): string {
  const raw =
    (looksLikeHtml(email.body_html) ? email.body_html : null) ||
    email.body_plain ||
    email.stripped_text ||
    email.body_html ||
    "";
  const text = toPreviewText(raw);
  if (!maxLength || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trimEnd() + "…";
}

/** Conținutul HTML afișabil (body_html sau body_plain dacă e de fapt HTML). */
export function getDisplayHtml(email: PreviewSource): string | null {
  if (looksLikeHtml(email.body_html)) return email.body_html as string;
  if (looksLikeHtml(email.body_plain)) return email.body_plain as string;
  return null;
}

type InlineAttachment = {
  url?: string | null;
  name?: string | null;
  filename?: string | null;
  path?: string | null;
  storage_path?: string | null;
  content_id?: string | null;
  contentId?: string | null;
  cid?: string | null;
  content?: string | null;
  contentType?: string | null;
  type?: string | null;
};

const normalizeCid = (value?: string | null) =>
  (value || "").replace(/^<|>$/g, "").trim().toLowerCase();

/**
 * Înlocuiește referințele `cid:` din HTML-ul emailului cu URL-uri reale
 * (din storage) sau data-URI (base64), ca imaginile inline să se vadă.
 */
export function resolveInlineImages(
  html: string,
  attachments?: InlineAttachment[] | null,
  resolveUrl?: (attachment: InlineAttachment) => string | null,
): string {
  if (!html || !attachments?.length) return html;

  const map = new Map<string, string>();
  for (const att of attachments) {
    const keys = [
      normalizeCid(att.content_id),
      normalizeCid(att.contentId),
      normalizeCid(att.cid),
      normalizeCid(att.filename),
      normalizeCid(att.name),
    ].filter(Boolean);
    if (!keys.length) continue;

    let src: string | null = null;
    const resolved = resolveUrl?.(att);
    if (resolved && resolved !== "inline-base64") {
      src = resolved;
    } else if (att.url) {
      src = att.url;
    } else if (att.content) {
      const mime = att.contentType || att.type || "image/png";
      const base64 = att.content.includes(",") ? att.content.split(",")[1] : att.content;
      src = `data:${mime};base64,${base64}`;
    }
    if (!src) continue;

    for (const key of keys) if (!map.has(key)) map.set(key, src);
  }

  if (!map.size) return html;

  return html.replace(
    /(src\s*=\s*["'])cid:([^"']+)(["'])/gi,
    (match, prefix: string, cid: string, suffix: string) => {
      const src = map.get(normalizeCid(decodeURIComponent(cid)));
      return src ? `${prefix}${src}${suffix}` : match;
    },
  );
}

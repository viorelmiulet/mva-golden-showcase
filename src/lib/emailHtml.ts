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

import type { ReactNode } from "react";

/**
 * Feed descriptions (Immoflux) contain light markdown. Strip the markers for
 * plain-text contexts (meta tags, Facebook posts) and render them properly in UI.
 */
export function stripMarkdown(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/\*\*\*(.+?)\*\*\*/gs, "$1")
    .replace(/\*\*(.+?)\*\*/gs, "$1")
    .replace(/(?<!\w)\*(?!\s)(.+?)(?<!\s)\*(?!\w)/gs, "$1")
    .replace(/(?<!\w)_{2}(?!\s)(.+?)(?<!\s)_{2}(?!\w)/gs, "$1")
    .replace(/(?<!\w)_(?!\s)(.+?)(?<!\s)_(?!\w)/gs, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/`{1,3}/g, "");
}

const TOKEN = /(\*\*\*.+?\*\*\*|\*\*.+?\*\*|\*[^*\s].*?[^*\s]\*|\*[^*\s]\*)/gs;

/** Renders **bold** and *italic* inline markers as real markup. */
export function renderMarkdownText(text: string | null | undefined): ReactNode {
  if (!text) return null;
  const cleaned = text.replace(/^#{1,6}\s+/gm, "").replace(/`{1,3}/g, "");
  const parts = cleaned.split(TOKEN);
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith("***") && part.endsWith("***") && part.length > 6) {
      return (
        <strong key={i}>
          <em>{part.slice(3, -3)}</em>
        </strong>
      );
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return <span key={i}>{part}</span>;
  });
}

import { useEffect, useRef, useState } from "react";

interface Props {
  html: string;
  className?: string;
}

/**
 * Renders email HTML inside a sandboxed iframe so that broken/desktop-only
 * markup (fixed widths, huge tables, inline styles) doesn't blow out the
 * layout on mobile. Auto-resizes to content height.
 */
export function EmailHtmlFrame({ html, className }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(400);

  const srcDoc = `<!DOCTYPE html>
<html lang="ro">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
<base target="_blank" />
<style>
  html, body {
    margin: 0;
    padding: 12px;
    background: transparent;
    color: #1a1a1a;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    font-size: 15px;
    line-height: 1.55;
    word-wrap: break-word;
    overflow-wrap: anywhere;
    overflow-x: hidden !important;
    -webkit-text-size-adjust: 100%;
    max-width: 100vw;
  }
  * { max-width: 100% !important; box-sizing: border-box !important; }
  img, video { max-width: 100% !important; height: auto !important; display: inline-block; }
  table, tbody, thead, tfoot, tr {
    max-width: 100% !important; width: auto !important; height: auto !important;
    table-layout: auto !important; border-collapse: collapse;
  }
  td, th {
    max-width: 100% !important; width: auto !important;
    word-break: break-word; white-space: normal !important;
    display: block !important;
  }
  /* Restore side-by-side for small tables */
  @media (min-width: 480px) {
    td, th { display: table-cell !important; }
  }
  pre, code { white-space: pre-wrap !important; word-break: break-word; }
  a { color: #DAA520; word-break: break-word; }
  blockquote { border-left: 3px solid #DAA520; margin: 8px 0; padding: 4px 12px; color: #555; }
  div, span, p, section, article, header, footer, main {
    max-width: 100% !important;
  }
  [style*="width"] { max-width: 100% !important; }
  [width] { max-width: 100% !important; width: auto !important; }
</style>
</head>
<body>${html}</body>
</html>`;

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const resize = () => {
      try {
        const doc = iframe.contentDocument;
        if (!doc) return;
        const h = Math.max(
          doc.documentElement.scrollHeight,
          doc.body?.scrollHeight ?? 0
        );
        setHeight(h + 8);
      } catch {
        /* noop */
      }
    };

    const onLoad = () => {
      resize();
      try {
        const doc = iframe.contentDocument;
        if (!doc) return;
        // Force all images to fully load then re-measure
        const imgs = Array.from(doc.images);
        imgs.forEach((img) => {
          if (!img.complete) img.addEventListener("load", resize);
        });
        const ro = new ResizeObserver(resize);
        if (doc.body) ro.observe(doc.body);
      } catch {
        /* noop */
      }
    };

    iframe.addEventListener("load", onLoad);
    return () => iframe.removeEventListener("load", onLoad);
  }, [srcDoc]);

  return (
    <div className="w-full max-w-full overflow-hidden">
      <iframe
        ref={iframeRef}
        title="Email content"
        srcDoc={srcDoc}
        sandbox="allow-same-origin allow-popups"
        className={className}
        style={{ width: "100%", maxWidth: "100%", border: 0, display: "block", height }}
      />
    </div>
  );
}

export default EmailHtmlFrame;

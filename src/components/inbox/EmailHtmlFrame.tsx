import { useEffect, useRef, useState } from "react";

interface Props {
  html: string;
  className?: string;
}

/**
 * Renders email HTML inside a sandboxed iframe. On narrow viewports we render
 * the email at a wider virtual width and scale it down with CSS `zoom`, so the
 * text stays readable instead of wrapping into unreadable slivers. We also
 * bump the base font on small screens.
 */
export function EmailHtmlFrame({ html, className }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(500);

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
    font-size: 16px;
    line-height: 1.6;
    word-wrap: break-word;
    overflow-wrap: anywhere;
    overflow-x: hidden !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch;
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
  }
  pre, code { white-space: pre-wrap !important; word-break: break-word; font-size: 14px; }
  a { color: #DAA520; word-break: break-word; }
  blockquote { border-left: 3px solid #DAA520; margin: 8px 0; padding: 4px 12px; color: #555; }
  div, span, p, section, article, header, footer, main {
    max-width: 100% !important;
  }
  [style*="width"] { max-width: 100% !important; }
  [width] { max-width: 100% !important; width: auto !important; }
  p, li { font-size: 1rem; }
  h1 { font-size: 1.4rem; } h2 { font-size: 1.25rem; } h3 { font-size: 1.1rem; }
</style>
</head>
<body>${html}</body>
</html>`;

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const applyLayout = () => {
      try {
        const doc = iframe.contentDocument;
        const wrapper = wrapperRef.current;
        if (!doc || !doc.body || !wrapper) return;

        const containerWidth = wrapper.clientWidth || iframe.clientWidth;

        // Reset any prior zoom to measure natural width
        doc.body.style.zoom = "1";
        (doc.body.style as any).minWidth = "";

        // Natural content width (respecting any elements that couldn't shrink)
        const naturalWidth = Math.max(
          doc.body.scrollWidth,
          doc.documentElement.scrollWidth
        );

        // On narrow screens, if content is still wider than the container,
        // scale it down with `zoom` so text is legible without side-scrolling.
        let zoom = 1;
        if (containerWidth > 0 && naturalWidth > containerWidth) {
          zoom = Math.max(0.55, containerWidth / naturalWidth);
        }

        // On very narrow screens, render at a slightly wider virtual width so
        // paragraphs don't collapse into 1-2 words per line, then scale down.
        if (containerWidth > 0 && containerWidth < 420 && naturalWidth < 420) {
          const virtualWidth = 480;
          zoom = containerWidth / virtualWidth;
          (doc.body.style as any).minWidth = virtualWidth + "px";
        }

        doc.body.style.zoom = String(zoom);

        // Height must account for the applied zoom
        const h = Math.max(
          doc.documentElement.scrollHeight,
          doc.body.scrollHeight
        ) * zoom;
        setHeight(Math.ceil(h) + 8);
      } catch {
        /* noop */
      }
    };

    const onLoad = () => {
      applyLayout();
      try {
        const doc = iframe.contentDocument;
        if (!doc) return;
        const imgs = Array.from(doc.images);
        imgs.forEach((img) => {
          if (!img.complete) img.addEventListener("load", applyLayout);
        });
        const ro = new ResizeObserver(applyLayout);
        if (doc.body) ro.observe(doc.body);
      } catch {
        /* noop */
      }
    };

    iframe.addEventListener("load", onLoad);
    const onResize = () => applyLayout();
    window.addEventListener("resize", onResize);
    return () => {
      iframe.removeEventListener("load", onLoad);
      window.removeEventListener("resize", onResize);
    };
  }, [srcDoc]);

  return (
    <div ref={wrapperRef} className="w-full max-w-full overflow-hidden">
      <iframe
        ref={iframeRef}
        title="Email content"
        srcDoc={srcDoc}
        sandbox="allow-same-origin allow-popups"
        className={className}
        style={{
          width: "100%",
          maxWidth: "100%",
          border: 0,
          display: "block",
          height,
          maxHeight: "calc(100dvh - 220px)",
        }}
      />
    </div>
  );
}

export default EmailHtmlFrame;

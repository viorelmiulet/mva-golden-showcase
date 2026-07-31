import { setResponseStatus } from "@tanstack/react-start/server";

/** Server-only helper: force the HTTP status of the current SSR response. */
export function setSsrStatus(code: number) {
  try {
    setResponseStatus(code);
  } catch (e) {
    console.error('[setSsrStatus] failed', e);
    // no active request context (e.g. prerender) — ignore
  }
}

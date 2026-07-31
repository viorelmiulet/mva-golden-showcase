/**
 * Structured logging + error envelope for /api/public/* routes.
 *
 * Every request emits two JSON lines on the server console:
 *   {"lvl":"info","evt":"api.request", ...}
 *   {"lvl":"info|error","evt":"api.response", ...,"status":200,"ms":12}
 *
 * The request id is echoed back to the caller in the `x-request-id` header so
 * an external service (Make.com, Mailgun, Immoflux, the Chrome extension) can
 * quote it when reporting a failure.
 */

export type ApiLogFields = Record<string, unknown>;

function emit(level: "info" | "warn" | "error", payload: ApiLogFields) {
  const line = JSON.stringify({
    lvl: level,
    ts: new Date().toISOString(),
    ...payload,
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export function newRequestId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

export interface ApiLogger {
  requestId: string;
  route: string;
  info: (evt: string, fields?: ApiLogFields) => void;
  warn: (evt: string, fields?: ApiLogFields) => void;
  error: (evt: string, fields?: ApiLogFields) => void;
}

export function createApiLogger(route: string, requestId = newRequestId()): ApiLogger {
  const base = { route, req: requestId };
  return {
    requestId,
    route,
    info: (evt, fields) => emit("info", { evt, ...base, ...fields }),
    warn: (evt, fields) => emit("warn", { evt, ...base, ...fields }),
    error: (evt, fields) => emit("error", { evt, ...base, ...fields }),
  };
}

type Handler<TCtx extends { request: Request }> = (
  ctx: TCtx & { logger: ApiLogger },
) => Response | Promise<Response>;

/**
 * Wraps a server route handler with structured request/response logging,
 * an `x-request-id` response header, and a JSON error envelope so an
 * unexpected throw never returns an opaque 500 to an external caller.
 */
export function withApiLogging<TCtx extends { request: Request }>(
  route: string,
  handler: Handler<TCtx>,
  options: { errorHeaders?: Record<string, string> } = {},
) {
  return async (ctx: TCtx): Promise<Response> => {
    const { request } = ctx;
    const requestId = request.headers.get("x-request-id") || newRequestId();
    const logger = createApiLogger(route, requestId);
    const started = Date.now();
    let url: URL | null = null;
    try {
      url = new URL(request.url);
    } catch {
      /* ignore */
    }

    logger.info("api.request", {
      method: request.method,
      path: url?.pathname,
      query: url ? Object.fromEntries(url.searchParams) : undefined,
      ua: request.headers.get("user-agent") || undefined,
      ip:
        request.headers.get("cf-connecting-ip") ||
        request.headers.get("x-forwarded-for") ||
        undefined,
    });

    try {
      const response = await handler({ ...ctx, logger });
      const ms = Date.now() - started;
      const status = response.status;
      logger[status >= 500 ? "error" : status >= 400 ? "warn" : "info"]("api.response", {
        method: request.method,
        status,
        ms,
      });
      const headers = new Headers(response.headers);
      headers.set("x-request-id", requestId);
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error) {
      const ms = Date.now() - started;
      const message = error instanceof Error ? error.message : String(error);
      logger.error("api.unhandled_error", {
        method: request.method,
        status: 500,
        ms,
        error: message,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return new Response(
        JSON.stringify({ ok: false, error: message, requestId, route }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "x-request-id": requestId,
            ...(options.errorHeaders ?? {}),
          },
        },
      );
    }
  };
}

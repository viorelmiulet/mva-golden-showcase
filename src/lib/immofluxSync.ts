/**
 * Client helpers for the background Immoflux sync.
 *
 * The sync runs on the server route `/api/public/immoflux-sync`. The UI only
 * fires the trigger (without awaiting completion) and then polls the status,
 * so long syncs can never time out the admin panel.
 */

export const IMMOFLUX_SYNC_URL = "/api/public/immoflux-sync";

export interface ImmofluxSyncStatus {
  status?: "running" | "done" | "error" | string;
  stage?: string;
  started_at?: string;
  finished_at?: string;
  synced?: number;
  failed?: number;
  total?: number;
  error?: string;
}

/** Fire-and-forget: starts the sync on the server, resolves immediately. */
export function triggerImmofluxSync(): void {
  void fetch(IMMOFLUX_SYNC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
    keepalive: true,
  }).catch((e) => console.error("[triggerImmofluxSync]", e));
}

/** Reads the current sync status persisted by the server. */
export async function fetchImmofluxSyncStatus(): Promise<ImmofluxSyncStatus | null> {
  try {
    const res = await fetch(IMMOFLUX_SYNC_URL, { headers: { Accept: "application/json" } });
    const body = (await res.json()) as { status?: ImmofluxSyncStatus | null };
    return body?.status ?? null;
  } catch (e) {
    console.error("[fetchImmofluxSyncStatus]", e);
    return null;
  }
}

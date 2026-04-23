import { useEffect, useRef, useState } from "react";
import { Home, Loader2, ExternalLink, RefreshCw, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { syncToHomedirect, type HDAction } from "@/lib/homedirect";
import { cn } from "@/lib/utils";

interface HomedirectMeta {
  homedirect_id: string | null;
  homedirect_short_id: string | null;
  homedirect_status: string | null;
  homedirect_synced_at: string | null;
}

interface Props {
  listingId: string;
}

type Feedback = { type: "success" | "error"; message: string } | null;

export default function HomedirectSyncButton({ listingId }: Props) {
  const [open, setOpen] = useState(false);
  const [meta, setMeta] = useState<HomedirectMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const fetchMeta = async () => {
    const { data } = await supabase
      .from("catalog_offers")
      .select("homedirect_id, homedirect_short_id, homedirect_status, homedirect_synced_at")
      .eq("id", listingId)
      .maybeSingle();
    if (data) setMeta(data as HomedirectMeta);
  };

  useEffect(() => {
    fetchMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirmDelete(false);
        setFeedback(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const isPublished =
    !!meta?.homedirect_id && meta?.homedirect_status !== "deleted";

  const runAction = async (action: HDAction) => {
    setLoading(true);
    setFeedback(null);
    try {
      const result = await syncToHomedirect(listingId, action);
      if (result.success) {
        setFeedback({
          type: "success",
          message:
            result.message ||
            (action === "publish"
              ? "Publicat cu succes pe HomeDirect"
              : action === "update"
              ? "Modificările au fost sincronizate"
              : "Anunțul a fost retras"),
        });
        await fetchMeta();
      } else {
        setFeedback({
          type: "error",
          message: result.error || result.message || "Operație eșuată",
        });
      }
    } catch (e: any) {
      setFeedback({ type: "error", message: e?.message || "Eroare de rețea" });
    } finally {
      setLoading(false);
      setConfirmDelete(false);
    }
  };

  const formattedDate = meta?.homedirect_synced_at
    ? new Date(meta.homedirect_synced_at).toLocaleString("ro-RO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={isPublished ? "Publicat pe HomeDirect" : "Nepublicat pe HomeDirect"}
        className={cn(
          "relative inline-flex items-center justify-center h-9 w-9 rounded-md border transition-colors",
          isPublished
            ? "border-green-500/40 bg-green-500/10 hover:bg-green-500/20 text-green-500"
            : "border-border bg-background hover:bg-accent text-muted-foreground"
        )}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Home className="w-4 h-4" />
        )}
        {isPublished && !loading && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-background" />
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 rounded-lg border border-border bg-popover text-popover-foreground shadow-2xl z-[100] p-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-foreground" />
              <span className="font-semibold text-sm">HomeDirect</span>
            </div>
            <span
              className={cn(
                "text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full font-medium",
                isPublished
                  ? "bg-green-500/15 text-green-500 border border-green-500/30"
                  : "bg-muted text-muted-foreground border border-border"
              )}
            >
              {isPublished ? "Publicat" : "Nepublicat"}
            </span>
          </div>

          {/* Info section */}
          {isPublished && meta?.homedirect_short_id && (
            <div className="space-y-2 mb-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID:</span>
                <span className="font-mono text-foreground">{meta.homedirect_short_id}</span>
              </div>
              {formattedDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sincronizat:</span>
                  <span className="text-foreground">{formattedDate}</span>
                </div>
              )}
              <a
                href={`https://homedirect.ro/post/${meta.homedirect_short_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Vezi anunțul pe HomeDirect
              </a>
            </div>
          )}

          {/* Feedback */}
          {feedback && (
            <div
              className={cn(
                "mb-3 px-3 py-2 rounded-md text-xs border",
                feedback.type === "success"
                  ? "bg-green-500/10 border-green-500/30 text-green-400"
                  : "bg-red-500/10 border-red-500/30 text-red-400"
              )}
            >
              {feedback.message}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            {!isPublished && (
              <button
                type="button"
                disabled={loading}
                onClick={() => runAction("publish")}
                className="w-full inline-flex items-center justify-center gap-2 h-9 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Publică pe HomeDirect
              </button>
            )}

            {isPublished && !confirmDelete && (
              <>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => runAction("update")}
                  className="w-full inline-flex items-center justify-center gap-2 h-9 rounded-md bg-secondary hover:bg-secondary/80 disabled:opacity-60 text-secondary-foreground text-sm font-medium transition-colors border border-border"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Resync modificări
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setConfirmDelete(true)}
                  className="w-full inline-flex items-center justify-center gap-2 h-9 rounded-md bg-red-600/90 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-medium transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Retrage
                </button>
              </>
            )}

            {isPublished && confirmDelete && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Confirmi retragerea anunțului de pe HomeDirect?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 h-9 rounded-md border border-border bg-background hover:bg-accent text-sm font-medium transition-colors"
                  >
                    Anulează
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => runAction("delete")}
                    className="flex-1 inline-flex items-center justify-center gap-2 h-9 rounded-md bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-sm font-medium transition-colors"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Confirmă retragerea
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

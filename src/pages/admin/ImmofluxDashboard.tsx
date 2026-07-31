import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { RefreshCw, CheckCircle2, AlertCircle, Loader2, Database, Clock, TrendingUp, XCircle } from "lucide-react";
import { invokeImmofluxFn } from "@/lib/immofluxInvoke";

interface SyncStatus {
  status?: "running" | "done" | "error" | string;
  success?: boolean;
  started_at?: string;
  finished_at?: string;
  stage?: string;
  synced?: number;
  failed?: number;
  total?: number;
  error?: string;
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("ro-RO", { dateStyle: "medium", timeStyle: "medium" });
  } catch {
    return iso;
  }
}

function durationMs(a?: string, b?: string) {
  if (!a || !b) return null;
  const ms = new Date(b).getTime() - new Date(a).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  return ms;
}

const ImmofluxDashboard = () => {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);

  // Last sync status from site_settings
  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ["immoflux-sync-status"],
    queryFn: async (): Promise<SyncStatus | null> => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "immoflux_sync_status")
        .maybeSingle();
      if (error) throw error;
      if (!data?.value) return null;
      try {
        return typeof data.value === "string" ? JSON.parse(data.value) : (data.value as SyncStatus);
      } catch {
        return null;
      }
    },
    refetchInterval: 5000,
  });

  // Total Immoflux offers in DB
  const { data: counts, isLoading: countsLoading } = useQuery({
    queryKey: ["immoflux-counts"],
    queryFn: async () => {
      const [total, available, sold] = await Promise.all([
        supabase.from("catalog_offers").select("*", { count: "exact", head: true }).eq("crm_source", "immoflux"),
        supabase.from("catalog_offers").select("*", { count: "exact", head: true }).eq("crm_source", "immoflux").eq("availability_status", "available"),
        supabase.from("catalog_offers").select("*", { count: "exact", head: true }).eq("crm_source", "immoflux").eq("availability_status", "sold"),
      ]);
      return {
        total: total.count ?? 0,
        available: available.count ?? 0,
        sold: sold.count ?? 0,
      };
    },
    refetchInterval: 30000,
  });

  const isRunning = status?.status === "running";
  const hasError = status?.status === "error" || (status?.failed ?? 0) > 0;
  const duration = durationMs(status?.started_at, status?.finished_at);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await invokeImmofluxFn("sync-immoflux", { body: {} });
      if (error) throw error;
      if (data?.alreadyRunning) {
        toast({ title: "Sincronizare deja activă", description: "O sincronizare este în curs." });
      } else {
        toast({ title: "Sincronizare pornită", description: "Rulează în fundal." });
      }
      // Refresh polling
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["immoflux-sync-status"] }), 1000);
    } catch (e: any) {
      toast({ title: "Eroare", description: e?.message || "Eșec pornire sincronizare", variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  const statusBadge = () => {
    if (statusLoading) return <Badge variant="outline">Se încarcă...</Badge>;
    if (!status) return <Badge variant="outline">Nicio sincronizare</Badge>;
    if (status.status === "running")
      return (
        <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" /> În curs {status.stage ? `· ${status.stage}` : ""}
        </Badge>
      );
    if (status.status === "error")
      return (
        <Badge className="bg-red-500/15 text-red-400 border-red-500/30">
          <XCircle className="h-3 w-3 mr-1" /> Eroare
        </Badge>
      );
    if (status.status === "done")
      return (
        <Badge className="bg-green-500/15 text-green-400 border-green-500/30">
          <CheckCircle2 className="h-3 w-3 mr-1" /> Reușit
        </Badge>
      );
    return <Badge variant="outline">{status.status}</Badge>;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            Immoflux Sync Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitorizare integrare CRM Immoflux
          </p>
        </div>
        <Button onClick={handleSync} disabled={syncing || isRunning}>
          {syncing || isRunning ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          {isRunning ? "Se sincronizează..." : "Sincronizează acum"}
        </Button>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">{statusBadge()}</div>
            {status?.error && (
              <p className="text-xs text-red-400 mt-2 line-clamp-2" title={status.error}>
                {status.error}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal flex items-center gap-2">
              <Clock className="h-4 w-4" /> Ultima sincronizare
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{formatDate(status?.finished_at || status?.started_at)}</p>
            {duration !== null && (
              <p className="text-xs text-muted-foreground mt-1">Durată: {(duration / 1000).toFixed(1)}s</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Total oferte Immoflux
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{countsLoading ? "—" : counts?.total ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {counts?.available ?? 0} disponibile · {counts?.sold ?? 0} vândute
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal">Ultima rulare</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {status?.synced ?? 0}
              <span className="text-sm text-muted-foreground font-normal"> / {status?.total ?? 0}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              sincronizate{" "}
              {(status?.failed ?? 0) > 0 && (
                <span className="text-red-400">· {status?.failed} eșuate</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error / details panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {hasError ? (
              <AlertCircle className="h-5 w-5 text-red-400" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-green-400" />
            )}
            Detalii ultimă sincronizare
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!status ? (
            <p className="text-sm text-muted-foreground">
              Nicio sincronizare înregistrată încă. Apasă „Sincronizează acum" pentru a porni.
            </p>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <p className="text-muted-foreground text-xs">Început</p>
                  <p className="font-mono">{formatDate(status.started_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Terminat</p>
                  <p className="font-mono">{formatDate(status.finished_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Etapă</p>
                  <p className="font-mono">{status.stage || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Rezultat</p>
                  <p className="font-mono">
                    {status.synced ?? 0} ok · {status.failed ?? 0} fail · {status.total ?? 0} total
                  </p>
                </div>
              </div>

              {status.error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md">
                  <p className="text-xs font-semibold text-red-400 mb-1">Mesaj eroare</p>
                  <pre className="text-xs text-red-300 whitespace-pre-wrap break-words font-mono">
                    {status.error}
                  </pre>
                </div>
              )}

              <details className="mt-4">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                  Răspuns brut (JSON)
                </summary>
                <pre className="mt-2 p-3 bg-muted/30 rounded-md text-xs overflow-auto font-mono">
                  {JSON.stringify(status, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Statusul se reîmprospătează automat la 5 secunde. Sincronizarea automată rulează programat în fundal.
      </p>
    </div>
  );
};

export default ImmofluxDashboard;

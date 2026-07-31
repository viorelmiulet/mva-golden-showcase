import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMailgunEvents } from "@/lib/mailgunEvents.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, AlertTriangle, CheckCircle2, MailX, Search } from "lucide-react";

type Item = {
  id: string;
  event: string;
  timestamp: number;
  recipient: string;
  sender: string | null;
  subject: string | null;
  severity: string | null;
  reason: string | null;
  code: string | number | null;
  description: string | null;
  message: string | null;
  logLevel: string | null;
};

const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "Toate" },
  { key: "failed", label: "Eșuate / Bounce" },
  { key: "rejected", label: "Respinse" },
  { key: "complained", label: "Reclamații spam" },
  { key: "delivered", label: "Livrate" },
  { key: "accepted", label: "Acceptate" },
  { key: "opened", label: "Deschise" },
];

const EVENT_LABEL: Record<string, string> = {
  failed: "Eșuat",
  rejected: "Respins",
  complained: "Spam",
  delivered: "Livrat",
  accepted: "Acceptat",
  opened: "Deschis",
  unsubscribed: "Dezabonat",
};

function eventVariant(event: string): "default" | "secondary" | "destructive" | "outline" {
  if (event === "failed" || event === "rejected" || event === "complained") return "destructive";
  if (event === "delivered") return "default";
  return "secondary";
}

function formatDate(ts: number) {
  if (!ts) return "-";
  return new Date(ts * 1000).toLocaleString("ro-RO");
}

export default function EmailMonitorPage() {
  const [filter, setFilter] = useState("failed");
  const [recipientInput, setRecipientInput] = useState("");
  const [recipient, setRecipient] = useState("");

  const query = useQuery({
    queryKey: ["mailgun-events", filter, recipient],
    queryFn: () =>
      getMailgunEvents({
        data: { event: filter, recipient: recipient || undefined, limit: 150 },
      }) as Promise<{
        success: boolean;
        error?: string;
        items: Item[];
        counts: Record<string, number>;
        domain?: string | null;
      }>,
    staleTime: 30_000,
  });

  const items = query.data?.items ?? [];
  const counts = query.data?.counts ?? {};

  const problems = useMemo(
    () => (counts.failed ?? 0) + (counts.rejected ?? 0) + (counts.complained ?? 0),
    [counts],
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Monitorizare email</h1>
          <p className="text-sm text-muted-foreground">
            Livrări, bounce-uri și motive de eșec raportate de furnizorul de email
            {query.data?.domain ? ` (${query.data.domain})` : ""}. Istoric ultimele ~30 de zile.
          </p>
        </div>
        <Button onClick={() => query.refetch()} disabled={query.isFetching} className="min-h-11">
          <RefreshCw className={`mr-2 h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} />
          Reîmprospătează
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="h-4 w-4 text-destructive" /> Probleme
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{problems}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <MailX className="h-4 w-4" /> Eșuate
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{counts.failed ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" /> Livrate
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{counts.delivered ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total evenimente</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{items.length}</CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? "default" : "outline"}
            size="sm"
            className="min-h-10"
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setRecipient(recipientInput.trim());
        }}
      >
        <Input
          value={recipientInput}
          onChange={(e) => setRecipientInput(e.target.value)}
          placeholder="Caută după destinatar (email exact)"
          className="max-w-sm"
        />
        <Button type="submit" variant="outline" className="min-h-11">
          <Search className="mr-2 h-4 w-4" /> Caută
        </Button>
        {recipient && (
          <Button
            type="button"
            variant="ghost"
            className="min-h-11"
            onClick={() => {
              setRecipientInput("");
              setRecipient("");
            }}
          >
            Resetează
          </Button>
        )}
      </form>

      {query.data && !query.data.success && (
        <Card className="border-destructive">
          <CardContent className="p-4 text-sm text-destructive">
            Nu am putut citi evenimentele: {query.data.error}
          </CardContent>
        </Card>
      )}

      {query.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Niciun eveniment pentru filtrele selectate.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <Card key={it.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={eventVariant(it.event)}>{EVENT_LABEL[it.event] ?? it.event}</Badge>
                    {it.severity && <Badge variant="outline">{it.severity}</Badge>}
                    {it.code ? <Badge variant="outline">cod {it.code}</Badge> : null}
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(it.timestamp)}</span>
                </div>
                <div className="text-sm font-medium break-all">{it.recipient || "-"}</div>
                {it.subject && <div className="text-sm text-muted-foreground break-words">{it.subject}</div>}
                {(it.reason || it.description || it.message) && (
                  <div className="rounded-md bg-muted p-2 text-xs break-words">
                    {it.reason && <div>Motiv: {it.reason}</div>}
                    {it.description && <div>Detalii: {it.description}</div>}
                    {it.message && <div>Răspuns server: {it.message}</div>}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

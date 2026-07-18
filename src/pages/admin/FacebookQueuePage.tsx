import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Loader2,
  Trash2,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  AlertCircle,
  MessageSquare,
  Facebook,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { generatePropertySlug } from "@/lib/propertySlug";
import { regenerateQueuedMessages } from "@/lib/facebookQueue";

type QueueRow = {
  id: string;
  offer_id: string;
  message: string;
  offer_url: string;
  status: "pending" | "posting" | "done" | "error";
  groups_done: string[];
  errors: string[];
  attempts: number;
  created_at: string;
  offer?: {
    id: string;
    title: string | null;
    slug: string | null;
    rooms: number | null;
    project_name: string | null;
    zone: string | null;
    location: string | null;
    surface_min: number | null;
    floor: number | null;
    city: string | null;
  } | null;
};

const statusStyles: Record<QueueRow["status"], string> = {
  pending: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  posting: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  done: "bg-green-500/20 text-green-500 border-green-500/30",
  error: "bg-red-500/20 text-red-500 border-red-500/30",
};

const statusLabel: Record<QueueRow["status"], string> = {
  pending: "În așteptare",
  posting: "Se postează",
  done: "Finalizat",
  error: "Eroare",
};

const publicOfferPath = (row: QueueRow): string => {
  const slug = row.offer?.slug?.trim();
  if (slug) return `/proprietate/${slug}`;
  if (row.offer) {
    return `/proprietate/${generatePropertySlug({
      id: row.offer.id,
      rooms: row.offer.rooms,
      project_name: row.offer.project_name,
      zone: row.offer.zone,
      location: row.offer.location,
      surface_min: row.offer.surface_min,
      floor: row.offer.floor,
      city: row.offer.city,
    })}`;
  }
  return row.offer_url;
};

const FacebookQueuePage = () => {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<Record<string, { errors?: boolean; msg?: boolean }>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | QueueRow["status"]>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const { data: rows, isLoading } = useQuery({
    queryKey: ["fb_post_queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fb_post_queue")
        .select(
          "id, offer_id, message, offer_url, status, groups_done, errors, attempts, created_at, offer:catalog_offers(id, title, slug, rooms, project_name, zone, location, surface_min, floor, city)"
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as QueueRow[];
    },
    refetchInterval: 30_000,
  });

  useEffect(() => {
    const channel = supabase
      .channel("fb_post_queue_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "fb_post_queue" },
        () => queryClient.invalidateQueries({ queryKey: ["fb_post_queue"] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const toggle = (id: string, key: "errors" | "msg") => {
    setExpanded((prev) => ({
      ...prev,
      [id]: { ...prev[id], [key]: !prev[id]?.[key] },
    }));
  };

  const deleteRow = async (id: string) => {
    setBusyId(id);
    const { error } = await supabase.from("fb_post_queue").delete().eq("id", id);
    setBusyId(null);
    if (error) {
      toast.error("Nu am putut șterge intrarea", { description: error.message });
      return;
    }
    toast.success("Intrarea a fost ștearsă");
    queryClient.invalidateQueries({ queryKey: ["fb_post_queue"] });
  };

  const retryRow = async (id: string) => {
    setBusyId(id);
    const { error } = await supabase
      .from("fb_post_queue")
      .update({ status: "pending", attempts: 0, errors: [] })
      .eq("id", id);
    setBusyId(null);
    if (error) {
      toast.error("Nu am putut relua postarea", { description: error.message });
      return;
    }
    toast.success("Intrarea va fi reluată");
    queryClient.invalidateQueries({ queryKey: ["fb_post_queue"] });
  };

  const filteredRows = useMemo(() => {
    if (!rows) return [];
    const q = search.trim().toLowerCase();
    const fromTs = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toTs = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      const ts = new Date(r.created_at).getTime();
      if (fromTs !== null && ts < fromTs) return false;
      if (toTs !== null && ts > toTs) return false;
      if (q) {
        const title = (r.offer?.title || "").toLowerCase();
        const project = (r.offer?.project_name || "").toLowerCase();
        if (!title.includes(q) && !project.includes(q)) return false;
      }
      return true;
    });
  }, [rows, statusFilter, dateFrom, dateTo, search]);

  const hasActiveFilters =
    statusFilter !== "all" || dateFrom !== "" || dateTo !== "" || search.trim() !== "";

  const clearFilters = () => {
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
    setSearch("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5">
          <Facebook className="h-6 w-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Coadă Facebook</h1>
          <p className="text-sm text-muted-foreground">
            Postări programate către grupurile Facebook. Se reîmprospătează automat la 30s.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["fb_post_queue"] })}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reîmprospătează
        </Button>
      </div>

      <Card className="admin-glass-card">
        <CardContent className="pt-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5 lg:col-span-1 sm:col-span-2">
              <Label htmlFor="fb-search" className="text-xs">Caută după titlu</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="fb-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ex: garsonieră Militari"
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fb-status" className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                <SelectTrigger id="fb-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate statusurile</SelectItem>
                  <SelectItem value="pending">În așteptare</SelectItem>
                  <SelectItem value="posting">Se postează</SelectItem>
                  <SelectItem value="done">Finalizat</SelectItem>
                  <SelectItem value="error">Eroare</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fb-from" className="text-xs">De la</Label>
              <Input
                id="fb-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                max={dateTo || undefined}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fb-to" className="text-xs">Până la</Label>
              <Input
                id="fb-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                min={dateFrom || undefined}
              />
            </div>
          </div>
          {hasActiveFilters && (
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {filteredRows.length} din {rows?.length ?? 0} intrări
              </span>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">
                <X className="w-3.5 h-3.5 mr-1" />
                Șterge filtrele
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="admin-glass-card">
        <CardHeader>
          <CardTitle className="text-base">
            {rows ? `${filteredRows.length} intrări afișate` : "Coadă"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-10">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-gold" />
            </div>
          ) : !filteredRows || filteredRows.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              {hasActiveFilters
                ? "Nicio intrare nu corespunde filtrelor active."
                : "Nu există postări în coadă."}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRows.map((row) => (
                <div
                  key={row.id}
                  className="rounded-lg border border-border/40 bg-muted/20 p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        to={publicOfferPath(row)}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-gold transition-colors"
                      >
                        <span className="truncate">
                          {row.offer?.title || "Ofertă ștearsă"}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </Link>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className={statusStyles[row.status]}>
                          {statusLabel[row.status]}
                        </Badge>
                        <span>{row.groups_done?.length ?? 0} grupuri postate</span>
                        <span>·</span>
                        <span>{row.attempts} încercări</span>
                        <span>·</span>
                        <span>{format(new Date(row.created_at), "dd.MM.yyyy HH:mm")}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {row.status === "error" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => retryRow(row.id)}
                          disabled={busyId === row.id}
                          className="h-8 text-xs"
                        >
                          {busyId === row.id ? (
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                          )}
                          Reîncearcă
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/30"
                            disabled={busyId === row.id}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Ștergi intrarea?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Postarea nu va mai fi trimisă către grupurile Facebook.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Anulează</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteRow(row.id)}>
                              Șterge
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  {row.errors && row.errors.length > 0 && (
                    <Collapsible
                      open={!!expanded[row.id]?.errors}
                      onOpenChange={() => toggle(row.id, "errors")}
                    >
                      <CollapsibleTrigger asChild>
                        <button className="inline-flex items-center gap-1.5 text-xs text-red-500 hover:text-red-400">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {row.errors.length} erori
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${
                              expanded[row.id]?.errors ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        <ul className="rounded-md border border-red-500/20 bg-red-500/5 p-3 space-y-1 text-xs text-red-400">
                          {row.errors.map((e, i) => (
                            <li key={i} className="break-words">
                              • {e}
                            </li>
                          ))}
                        </ul>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  <Collapsible
                    open={!!expanded[row.id]?.msg}
                    onOpenChange={() => toggle(row.id, "msg")}
                  >
                    <CollapsibleTrigger asChild>
                      <button className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Vezi mesajul generat
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform ${
                            expanded[row.id]?.msg ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <pre className="rounded-md border border-border/40 bg-background/50 p-3 text-xs whitespace-pre-wrap font-sans text-foreground/90">
                        {row.message}
                      </pre>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FacebookQueuePage;

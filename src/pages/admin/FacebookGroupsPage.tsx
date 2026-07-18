import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Facebook, Plus, Trash2, ExternalLink, Download, Chrome, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";

type FbGroup = {
  id: string;
  name: string;
  url: string;
  active: boolean;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
};

const fbGroupsTable = () => (supabase as any).from("fb_groups");

const isValidFacebookUrl = (url: string) =>
  /^https?:\/\/(www\.|m\.|web\.)?facebook\.com\/(groups\/[^\s]+|[^\s]+)/i.test(url.trim());

export default function FacebookGroupsPage() {
  const queryClient = useQueryClient();
  const [editingNames, setEditingNames] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<{ name: string; url: string; notes: string }>({
    name: "",
    url: "",
    notes: "",
  });

  const { data: groups = [], isLoading } = useQuery<FbGroup[]>({
    queryKey: ["fb_groups"],
    queryFn: async () => {
      const { data, error } = await fbGroupsTable()
        .select("id, name, url, active, notes, created_at, updated_at")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as FbGroup[];
    },
  });

  useEffect(() => {
    setEditingNames(
      Object.fromEntries(groups.map((group) => [group.id, group.name]))
    );
  }, [groups]);

  const addMutation = useMutation({
    mutationFn: async (payload: { name: string; url: string; notes: string }) => {
      const { error } = await fbGroupsTable()
        .insert({
          name: payload.name,
          url: payload.url,
          active: true,
          notes: payload.notes || null,
        })
        .select("id")
        .single();
      if (error) {
        throw new Error(error.message || "Nu s-a putut adăuga grupul");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fb_groups"] });
      setDraft({ name: "", url: "", notes: "" });
      toast.success("Grupul a fost salvat");
    },
    onError: (err) => {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Nu s-a putut adăuga grupul");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Pick<FbGroup, "name" | "active" | "notes">> }) => {
      const { error } = await fbGroupsTable()
        .update(patch)
        .eq("id", id)
        .select("id")
        .single();
      if (error) {
        throw new Error(error.message || "Nu s-a putut actualiza grupul");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fb_groups"] });
      toast.success("Grupul a fost actualizat");
    },
    onError: (err) => {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Nu s-a putut actualiza grupul");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await fbGroupsTable()
        .delete()
        .eq("id", id);
      if (error) {
        throw new Error(error.message || "Nu s-a putut șterge grupul");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fb_groups"] });
      toast.success("Grupul a fost șters");
    },
    onError: (err) => {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Nu s-a putut șterge grupul");
    },
  });

  const handleAdd = () => {
    const name = draft.name.trim();
    const url = draft.url.trim();
    if (!name || !url) {
      toast.error("Completează numele și URL-ul grupului");
      return;
    }
    if (!isValidFacebookUrl(url)) {
      toast.error("URL-ul trebuie să fie un link Facebook valid");
      return;
    }
    if (groups.some((g) => g.url.toLowerCase() === url.toLowerCase())) {
      toast.error("Acest grup există deja în listă");
      return;
    }
    addMutation.mutate({ name, url, notes: draft.notes.trim() });
  };

  const handleToggle = (id: string, active: boolean) =>
    updateMutation.mutate({ id, patch: { active } });

  const handleRename = (group: FbGroup) => {
    const name = (editingNames[group.id] ?? "").trim();
    if (!name) {
      setEditingNames((prev) => ({ ...prev, [group.id]: group.name }));
      toast.error("Numele grupului nu poate fi gol");
      return;
    }
    if (name !== group.name) {
      updateMutation.mutate({ id: group.id, patch: { name } });
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Ștergi acest grup din listă?")) return;
    deleteMutation.mutate(id);
  };

  const activeCount = groups.filter((g) => g.active).length;
  const isSaving = addMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 space-y-6">
      <Helmet>
        <title>Grupuri Facebook – Admin MVA</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Facebook className="h-6 w-6" />
            Grupuri Facebook
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestionează lista de grupuri unde vor fi publicate ofertele din coada Facebook.
          </p>
        </div>
        {isSaving && (
          <Badge variant="secondary" className="min-h-10 gap-2 px-3">
            <Loader2 className="h-4 w-4 animate-spin" />
            Se salvează…
          </Badge>
        )}
      </div>

      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Chrome className="h-5 w-5" />
            Extensie Chrome — MVA Facebook Poster
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Extensia postează automat în grupurile de mai jos ofertele adăugate în coada Facebook.
            Descarc-o oricând ai nevoie și instaleaz-o din <code className="bg-muted px-1 py-0.5 rounded text-xs">chrome://extensions</code> (Developer mode → Load unpacked).
          </p>
          <Button
            onClick={async () => {
              try {
                const res = await fetch("/mva-fb-poster-extension.zip");
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "mva-fb-poster-extension.zip";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                toast.success("Extensia a fost descărcată");
              } catch (e: any) {
                toast.error("Eroare la descărcare: " + (e?.message ?? "necunoscută"));
              }
            }}
            className="min-h-10"
          >
            <Download className="mr-2 h-4 w-4" />
            Descarcă extensia (.zip)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Adaugă grup nou</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="fb-name">Nume grup</Label>
            <Input
              id="fb-name"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="Ex: Apartamente București"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fb-url">URL grup</Label>
            <Input
              id="fb-url"
              value={draft.url}
              onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))}
              placeholder="https://www.facebook.com/groups/..."
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="fb-notes">Notițe (opțional)</Label>
            <Input
              id="fb-notes"
              value={draft.notes}
              onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
              placeholder="Ex: doar chirii, admin aprobă postările"
            />
          </div>
          <div className="sm:col-span-2">
            <Button onClick={handleAdd} disabled={addMutation.isPending} className="w-full sm:w-auto min-h-10">
              <Plus className="mr-2 h-4 w-4" />
              {addMutation.isPending ? "Se adaugă…" : "Adaugă în listă"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-lg">Lista grupurilor</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={activeCount === 0}
              onClick={async () => {
                const urls = groups.filter((g) => g.active).map((g) => g.url).join("\n");
                try {
                  await navigator.clipboard.writeText(urls);
                  toast.success(`${activeCount} URL-uri copiate — lipește-le în Setări extensie`);
                } catch {
                  toast.error("Nu s-a putut copia în clipboard");
                }
              }}
            >
              Copiază URL-uri active
            </Button>
            <Badge variant="secondary">
              {activeCount} active / {groups.length} total
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Se încarcă…</p>
          ) : groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nu ai adăugat încă niciun grup. Folosește formularul de mai sus.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {groups.map((g) => (
                <li key={g.id} className="py-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex-1 min-w-0 space-y-1">
                    <Input
                      value={editingNames[g.id] ?? g.name}
                      onChange={(e) =>
                        setEditingNames((prev) => ({ ...prev, [g.id]: e.target.value }))
                      }
                      onBlur={() => handleRename(g)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.currentTarget.blur();
                        }
                      }}
                      className="font-medium"
                    />
                    <a
                      href={g.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 break-all"
                    >
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      {g.url}
                    </a>
                    {g.notes && (
                      <p className="text-xs text-muted-foreground italic">{g.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={g.active}
                        onCheckedChange={(v) => handleToggle(g.id, v)}
                        disabled={updateMutation.isPending}
                        aria-label={`Activează ${g.name}`}
                      />
                      <span className="text-xs text-muted-foreground w-14">
                        {g.active ? "Activ" : "Inactiv"}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(g.id)}
                      disabled={deleteMutation.isPending}
                      className="h-10 w-10 text-destructive hover:text-destructive"
                      aria-label={`Șterge ${g.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

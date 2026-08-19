import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Facebook, Plus, Trash2, ExternalLink, Download, Chrome, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Helmet } from "@/lib/helmet-compat";
import { adminDb } from "@/lib/adminDb";

type FbGroup = {
  id: string;
  name: string;
  url: string;
  active: boolean;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
};

const EMPTY_GROUPS: FbGroup[] = [];
const fbGroupsTable = () => (supabase as any).from("fb_groups");
const fbGroupsWrite = () => adminDb.from("fb_groups");

const isValidFacebookUrl = (url: string) =>
  /^https?:\/\/(www\.|m\.|web\.)?facebook\.com\/(groups\/[^\s]+|[^\s]+)/i.test(url.trim());

export default function FacebookGroupsPage() {
  const queryClient = useQueryClient();
  const [editingNames, setEditingNames] = useState<Record<string, string>>({});
  const [editingUrls, setEditingUrls] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<{ name: string; url: string }>({
    name: "",
    url: "",
  });

  const { data: groupsData, isLoading } = useQuery<FbGroup[]>({
    queryKey: ["fb_groups"],
    queryFn: async () => {
      const { data, error } = await fbGroupsTable()
        .select("id, name, url, active, notes, created_at, updated_at")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as FbGroup[];
    },
  });
  const groups = groupsData ?? EMPTY_GROUPS;

  useEffect(() => {
    setEditingNames(Object.fromEntries(groups.map((group) => [group.id, group.name])));
    setEditingUrls(Object.fromEntries(groups.map((group) => [group.id, group.url])));
  }, [groups]);

  const addMutation = useMutation({
    mutationFn: async (payload: { name: string; url: string }) => {
      const { error } = await fbGroupsWrite()
        .insert({
          name: payload.name,
          url: payload.url,
          active: true,
          notes: null,
        })
        .select("id")
        .single();
      if (error) {
        throw new Error(error.message || "Nu s-a putut adăuga grupul");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fb_groups"] });
      setDraft({ name: "", url: "" });
      toast.success("Grupul a fost salvat");
    },
    onError: (err) => {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Nu s-a putut adăuga grupul");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Pick<FbGroup, "name" | "url" | "active">> }) => {
      const { error } = await fbGroupsWrite()
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
      const { error } = await fbGroupsWrite().delete().eq("id", id);
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

  const handleAdd = async () => {
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
    try {
      await addMutation.mutateAsync({ name, url });
    } catch {
      // Error toast is handled by the mutation.
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    try {
      await updateMutation.mutateAsync({ id, patch: { active } });
    } catch {
      // Error toast is handled by the mutation.
    }
  };

  const handleNameBlur = async (group: FbGroup) => {
    const name = (editingNames[group.id] ?? "").trim();
    if (!name) {
      setEditingNames((prev) => ({ ...prev, [group.id]: group.name }));
      toast.error("Numele grupului nu poate fi gol");
      return;
    }
    if (name !== group.name) {
      try {
        await updateMutation.mutateAsync({ id: group.id, patch: { name } });
      } catch {
        setEditingNames((prev) => ({ ...prev, [group.id]: group.name }));
      }
    }
  };

  const handleUrlBlur = async (group: FbGroup) => {
    const url = (editingUrls[group.id] ?? "").trim();
    if (!url) {
      setEditingUrls((prev) => ({ ...prev, [group.id]: group.url }));
      toast.error("URL-ul grupului nu poate fi gol");
      return;
    }
    if (!isValidFacebookUrl(url)) {
      setEditingUrls((prev) => ({ ...prev, [group.id]: group.url }));
      toast.error("URL-ul trebuie să fie un link Facebook valid");
      return;
    }
    if (url.toLowerCase() !== group.url.toLowerCase()) {
      if (groups.some((g) => g.id !== group.id && g.url.toLowerCase() === url.toLowerCase())) {
        setEditingUrls((prev) => ({ ...prev, [group.id]: group.url }));
        toast.error("Acest grup există deja în listă");
        return;
      }
      try {
        await updateMutation.mutateAsync({ id: group.id, patch: { url } });
      } catch {
        setEditingUrls((prev) => ({ ...prev, [group.id]: group.url }));
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Ștergi acest grup din listă?")) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch {
      // Error toast is handled by the mutation.
    }
  };

  const activeCount = groups.filter((g) => g.active).length;
  const isSaving =
    addMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 space-y-6">
      <Helmet>
        <title>Grupuri Facebook – Admin MVA</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Grupuri Facebook</h1>
          <p className="text-sm text-muted-foreground">
            Grupurile active apar în dialogul „Adaugă la coada Facebook”.
          </p>
        </div>
        {isSaving && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Se salvează…
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-end">
        <div className="flex-1 w-full space-y-1">
          <Label htmlFor="fb-name" className="sr-only">
            Nume grup
          </Label>
          <Input
            id="fb-name"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="Nume grup"
          />
        </div>
        <div className="flex-[2] w-full space-y-1">
          <Label htmlFor="fb-url" className="sr-only">
            URL grup
          </Label>
          <Input
            id="fb-url"
            value={draft.url}
            onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))}
            placeholder="https://www.facebook.com/groups/..."
          />
        </div>
        <Button
          onClick={handleAdd}
          disabled={addMutation.isPending}
          className="w-full lg:w-auto min-h-10 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          {addMutation.isPending ? "Se adaugă…" : "Adaugă grup"}
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Se încarcă…</p>
        ) : groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nu ai adăugat încă niciun grup. Folosește formularul de mai sus.
          </p>
        ) : (
          groups.map((g, idx) => (
            <div
              key={g.id}
              className="flex flex-col lg:flex-row gap-3 items-start lg:items-center rounded-sm border border-border bg-card p-3"
            >
              <div className="flex-1 w-full">
                <Label htmlFor={`fb-name-${g.id}`} className="sr-only">
                  Nume grup
                </Label>
                <Input
                  id={`fb-name-${g.id}`}
                  value={editingNames[g.id] ?? g.name}
                  onChange={(e) =>
                    setEditingNames((prev) => ({ ...prev, [g.id]: e.target.value }))
                  }
                  onBlur={() => handleNameBlur(g)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.currentTarget.blur();
                    }
                  }}
                />
              </div>
              <div className="flex-[2] w-full">
                <Label htmlFor={`fb-url-${g.id}`} className="sr-only">
                  URL grup
                </Label>
                <Input
                  id={`fb-url-${g.id}`}
                  value={editingUrls[g.id] ?? g.url}
                  onChange={(e) =>
                    setEditingUrls((prev) => ({ ...prev, [g.id]: e.target.value }))
                  }
                  onBlur={() => handleUrlBlur(g)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.currentTarget.blur();
                    }
                  }}
                />
              </div>
              <div className="flex items-center gap-2 w-full lg:w-auto">
                <Button variant="outline" size="icon" asChild className="shrink-0">
                  <a
                    href={g.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Deschide ${g.name}`}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <div className="w-14 shrink-0">
                  <Label htmlFor={`fb-order-${g.id}`} className="sr-only">
                    Ordine
                  </Label>
                  <Input
                    id={`fb-order-${g.id}`}
                    type="number"
                    value={idx + 1}
                    readOnly
                    className="text-center"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm shrink-0">
                  <Checkbox
                    checked={g.active}
                    onCheckedChange={(v) => handleToggle(g.id, v === true)}
                    disabled={updateMutation.isPending}
                    aria-label={`Activează ${g.name}`}
                  />
                  Activ
                </label>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDelete(g.id)}
                  disabled={deleteMutation.isPending}
                  className="shrink-0 text-destructive hover:text-destructive"
                  aria-label={`Șterge ${g.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
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
            Extensia postează automat în grupurile de mai sus ofertele adăugate în coada Facebook.
            Descarc-o oricând ai nevoie și instaleaz-o din{" "}
            <code className="bg-muted px-1 py-0.5 rounded text-xs">chrome://extensions</code>{" "}
            (Developer mode → Load unpacked).
          </p>
          <div className="flex flex-wrap items-center gap-3">
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
            <span className="text-xs text-muted-foreground">
              {activeCount} grupuri active din {groups.length}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

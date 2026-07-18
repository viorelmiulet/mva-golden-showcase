import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Facebook, Plus, Trash2, ExternalLink, Save } from "lucide-react";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";

const SETTINGS_KEY = "facebook_groups";

type FbGroup = {
  id: string;
  name: string;
  url: string;
  active: boolean;
  notes?: string;
};

const isValidFacebookUrl = (url: string) =>
  /^https?:\/\/(www\.|m\.|web\.)?facebook\.com\/(groups\/[^\s]+|[^\s]+)/i.test(url.trim());

const genId = () =>
  (globalThis.crypto?.randomUUID?.() ?? `g_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);

const parseGroups = (raw: string | null | undefined): FbGroup[] => {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((g) => g && typeof g === "object" && typeof g.url === "string")
      .map((g: any) => ({
        id: String(g.id ?? genId()),
        name: String(g.name ?? "").trim() || "Grup fără nume",
        url: String(g.url).trim(),
        active: g.active !== false,
        notes: g.notes ? String(g.notes) : undefined,
      }));
  } catch {
    return [];
  }
};

export default function FacebookGroupsPage() {
  const queryClient = useQueryClient();
  const [groups, setGroups] = useState<FbGroup[]>([]);
  const [dirty, setDirty] = useState(false);
  const [draft, setDraft] = useState<{ name: string; url: string; notes: string }>({
    name: "",
    url: "",
    notes: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["site_settings", SETTINGS_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", SETTINGS_KEY)
        .maybeSingle();
      if (error) throw error;
      return data?.value ?? null;
    },
  });

  useEffect(() => {
    setGroups(parseGroups(data));
    setDirty(false);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (next: FbGroup[]) => {
      const { error } = await supabase
        .from("site_settings")
        .upsert(
          { key: SETTINGS_KEY, value: JSON.stringify(next), updated_at: new Date().toISOString() },
          { onConflict: "key" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site_settings", SETTINGS_KEY] });
      setDirty(false);
      toast.success("Lista de grupuri a fost salvată");
    },
    onError: (err) => {
      console.error(err);
      toast.error("Nu s-a putut salva lista");
    },
  });

  const updateGroups = (next: FbGroup[]) => {
    setGroups(next);
    setDirty(true);
  };

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
    updateGroups([
      ...groups,
      { id: genId(), name, url, active: true, notes: draft.notes.trim() || undefined },
    ]);
    setDraft({ name: "", url: "", notes: "" });
  };

  const handleToggle = (id: string, active: boolean) =>
    updateGroups(groups.map((g) => (g.id === id ? { ...g, active } : g)));

  const handleRename = (id: string, name: string) =>
    updateGroups(groups.map((g) => (g.id === id ? { ...g, name } : g)));

  const handleDelete = (id: string) => {
    if (!confirm("Ștergi acest grup din listă?")) return;
    updateGroups(groups.filter((g) => g.id !== id));
  };

  const activeCount = groups.filter((g) => g.active).length;

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
        <Button
          onClick={() => saveMutation.mutate(groups)}
          disabled={!dirty || saveMutation.isPending}
          className="min-h-10"
        >
          <Save className="mr-2 h-4 w-4" />
          {saveMutation.isPending ? "Se salvează…" : "Salvează lista"}
        </Button>
      </div>

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
            <Button onClick={handleAdd} className="w-full sm:w-auto min-h-10">
              <Plus className="mr-2 h-4 w-4" />
              Adaugă în listă
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Lista grupurilor</CardTitle>
          <Badge variant="secondary">
            {activeCount} active / {groups.length} total
          </Badge>
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
                      value={g.name}
                      onChange={(e) => handleRename(g.id, e.target.value)}
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

      {dirty && (
        <p className="text-xs text-muted-foreground text-center">
          Ai modificări nesalvate. Apasă „Salvează lista" pentru a le trimite pe server.
        </p>
      )}
    </div>
  );
}

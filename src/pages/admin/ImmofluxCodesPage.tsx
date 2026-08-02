import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Search } from "lucide-react";
import { listImmofluxCodes, updateImmofluxCode, type ImmofluxCodeRow } from "@/lib/immofluxCodes.functions";

const SOURCES = [
  { value: "all", label: "Toate" },
  { value: "unmapped", label: "Nemapate" },
  { value: "docs", label: "Din documentație" },
  { value: "manual", label: "Editate manual" },
];

function CodeRow({ row, onSave, saving }: { row: ImmofluxCodeRow; onSave: (label: string) => void; saving: boolean }) {
  const [value, setValue] = useState(row.label ?? "");
  const dirty = (row.label ?? "") !== value;

  return (
    <div className="grid grid-cols-1 gap-2 border-b border-border/60 px-3 py-3 md:grid-cols-[110px_170px_1fr_110px_120px] md:items-center">
      <div className="font-mono text-sm">{row.code}</div>
      <div className="text-sm text-muted-foreground">{row.group_label}</div>
      <div className="flex gap-2">
        <Input
          value={value}
          placeholder="Denumire (necompletat = ascuns pe site)"
          onChange={(e) => setValue(e.target.value)}
          className="h-9"
        />
        {dirty && (
          <Button size="sm" className="h-9" disabled={saving} onClick={() => onSave(value.trim())}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          </Button>
        )}
      </div>
      <div className="text-sm text-muted-foreground">{row.usage_count} propr.</div>
      <div>
        <Badge variant={row.source === "unmapped" ? "destructive" : row.source === "manual" ? "default" : "secondary"}>
          {row.source === "unmapped" ? "nemapat" : row.source === "manual" ? "manual" : "docs"}
        </Badge>
      </div>
    </div>
  );
}

export default function ImmofluxCodesPage() {
  const qc = useQueryClient();
  const fetchCodes = useServerFn(listImmofluxCodes);
  const saveCode = useServerFn(updateImmofluxCode);
  const [source, setSource] = useState("all");
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["immoflux-codes"],
    queryFn: () => fetchCodes(),
  });

  const mutation = useMutation({
    mutationFn: (vars: { code: number; label: string }) =>
      saveCode({ data: { code: vars.code, label: vars.label || null } }),
    onSuccess: () => {
      toast.success("Denumire salvată");
      qc.invalidateQueries({ queryKey: ["immoflux-codes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = useMemo(() => {
    const all = data?.codes ?? [];
    const needle = q.trim().toLowerCase();
    return all.filter((r) => {
      if (source !== "all" && r.source !== source) return false;
      if (!needle) return true;
      return (
        String(r.code).includes(needle) ||
        (r.label ?? "").toLowerCase().includes(needle) ||
        r.group_label.toLowerCase().includes(needle)
      );
    });
  }, [data, source, q]);

  const unmapped = (data?.codes ?? []).filter((r) => !r.label).length;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold">Coduri Immoflux</h1>
        <p className="text-sm text-muted-foreground">
          Traducerea codurilor numerice primite de la Immoflux. Codurile fără denumire nu se afișează pe site.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {data?.codes.length ?? 0} coduri · {unmapped} nemapate
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Caută cod, denumire sau grup" className="pl-9" />
            </div>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger className="md:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOURCES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Niciun cod găsit.</p>
          ) : (
            <div className="rounded-md border">
              {rows.map((row) => (
                <CodeRow
                  key={row.code}
                  row={row}
                  saving={mutation.isPending && mutation.variables?.code === row.code}
                  onSave={(label) => mutation.mutate({ code: row.code, label })}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

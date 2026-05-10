import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { adminApi } from "@/lib/adminApi";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { CheckCircle2, XCircle, RefreshCw, Plus, Trash2, ShieldAlert, Activity } from "lucide-react";

type Target = {
  id: string;
  url: string;
  expected_status: number;
  expected_location_pattern: string | null;
  is_active: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
};

type Check = {
  id: string;
  target_id: string | null;
  url_tested: string;
  expected_status: number;
  actual_status: number | null;
  actual_location: string | null;
  is_healthy: boolean;
  response_time_ms: number | null;
  error_message: string | null;
  alert_sent: boolean;
  checked_at: string;
};

const emptyTarget: Partial<Target> = {
  url: "",
  expected_status: 301,
  expected_location_pattern: "",
  is_active: true,
  note: "",
};

export default function RedirectMonitor() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Target> | null>(null);
  const [running, setRunning] = useState(false);

  const { data: targets } = useQuery({
    queryKey: ["redirect-targets"],
    staleTime: 0,
    queryFn: async () => {
      const r = await adminApi.select<Target>("redirect_monitor_targets", {
        orderBy: "created_at",
        ascending: true,
      });
      return r.data ?? [];
    },
  });

  const { data: checks } = useQuery({
    queryKey: ["redirect-checks"],
    staleTime: 0,
    queryFn: async () => {
      const r = await adminApi.select<Check>("redirect_monitor_checks", {
        orderBy: "checked_at",
        ascending: false,
      });
      return (r.data ?? []).slice(0, 200);
    },
  });

  // Latest check per target
  const latestByUrl = new Map<string, Check>();
  for (const c of checks ?? []) {
    if (!latestByUrl.has(c.url_tested)) latestByUrl.set(c.url_tested, c);
  }

  const totalActive = (targets ?? []).filter((t) => t.is_active).length;
  const healthyCount = (targets ?? []).filter((t) => {
    const last = latestByUrl.get(t.url);
    return last?.is_healthy === true;
  }).length;
  const brokenCount = (targets ?? []).filter((t) => {
    const last = latestByUrl.get(t.url);
    return last && !last.is_healthy;
  }).length;
  const healthPct = totalActive > 0 ? Math.round((healthyCount / totalActive) * 100) : 0;

  // 7-day chart data
  const chartData = (() => {
    const buckets: Record<string, { date: string; healthy: number; broken: number }> = {};
    const now = Date.now();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const key = format(d, "yyyy-MM-dd");
      buckets[key] = { date: format(d, "dd MMM", { locale: ro }), healthy: 0, broken: 0 };
    }
    for (const c of checks ?? []) {
      const key = format(new Date(c.checked_at), "yyyy-MM-dd");
      if (buckets[key]) {
        if (c.is_healthy) buckets[key].healthy++;
        else buckets[key].broken++;
      }
    }
    return Object.values(buckets);
  })();

  const runNow = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("monitor-redirects", { body: {} });
      if (error) throw error;
      toast.success(
        `Verificare completă: ${data?.summary?.healthy ?? 0}/${data?.summary?.total ?? 0} OK`
      );
      qc.invalidateQueries({ queryKey: ["redirect-checks"] });
    } catch (e) {
      toast.error(`Eroare: ${(e as Error).message}`);
    } finally {
      setRunning(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (t: Partial<Target>) => {
      const payload = {
        url: t.url?.trim(),
        expected_status: Number(t.expected_status) || 301,
        expected_location_pattern: t.expected_location_pattern?.trim() || null,
        is_active: t.is_active ?? true,
        note: t.note?.trim() || null,
      };
      if (t.id) return adminApi.update<Target>("redirect_monitor_targets", t.id, payload);
      return adminApi.insert<Target>("redirect_monitor_targets", payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["redirect-targets"] });
      setEditing(null);
      toast.success("Salvat");
    },
    onError: (e) => toast.error(`Eroare: ${(e as Error).message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => adminApi.delete("redirect_monitor_targets", id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["redirect-targets"] });
      toast.success("Șters");
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="text-primary" /> Monitor Redirecturi SEO
          </h1>
          <p className="text-sm text-muted-foreground">
            Verifică automat la fiecare 6h că URL-urile vechi returnează 301 spre slug-urile canonice.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runNow} disabled={running} variant="default">
            <RefreshCw className={`mr-2 h-4 w-4 ${running ? "animate-spin" : ""}`} />
            {running ? "Verific..." : "Rulează acum"}
          </Button>
          <Button onClick={() => setEditing({ ...emptyTarget })} variant="outline">
            <Plus className="mr-2 h-4 w-4" /> Adaugă URL
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">URL-uri active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalActive}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Sănătoase</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 flex items-center gap-2">
              <CheckCircle2 /> {healthyCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Defecte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive flex items-center gap-2">
              <XCircle /> {brokenCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-20">
              <ResponsiveContainer>
                <RadialBarChart
                  innerRadius="70%"
                  outerRadius="100%"
                  data={[{ value: healthPct, fill: healthPct >= 90 ? "hsl(142 71% 45%)" : healthPct >= 50 ? "hsl(38 92% 50%)" : "hsl(0 72% 51%)" }]}
                  startAngle={90}
                  endAngle={-270}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar background dataKey="value" cornerRadius={8} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center -mt-14 text-xl font-bold pointer-events-none">{healthPct}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" /> Verificări ultimele 7 zile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Area type="monotone" dataKey="healthy" stackId="1" stroke="hsl(142 71% 45%)" fill="hsl(142 71% 45% / 0.5)" />
                <Area type="monotone" dataKey="broken" stackId="1" stroke="hsl(0 72% 51%)" fill="hsl(0 72% 51% / 0.5)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Targets table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">URL-uri monitorizate</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>URL</TableHead>
                <TableHead>Așteptat</TableHead>
                <TableHead>Status real</TableHead>
                <TableHead>Ultimul check</TableHead>
                <TableHead>Activ</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(targets ?? []).map((t) => {
                const last = latestByUrl.get(t.url);
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs max-w-md truncate">{t.url}</TableCell>
                    <TableCell><Badge variant="outline">{t.expected_status}</Badge></TableCell>
                    <TableCell>
                      {last ? (
                        <Badge variant={last.is_healthy ? "default" : "destructive"}>
                          {last.actual_status ?? "ERR"}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {last ? format(new Date(last.checked_at), "dd MMM HH:mm", { locale: ro }) : "—"}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={t.is_active}
                        onCheckedChange={(v) => saveMutation.mutate({ ...t, is_active: v })}
                      />
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => setEditing(t)}>Edit</Button>
                      <Button size="sm" variant="ghost" onClick={() => {
                        if (confirm("Ștergi acest URL?")) deleteMutation.mutate(t.id);
                      }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent checks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Istoric verificări</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Când</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Latency</TableHead>
                <TableHead>Eroare</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(checks ?? []).slice(0, 50).map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-xs whitespace-nowrap">
                    {format(new Date(c.checked_at), "dd MMM HH:mm", { locale: ro })}
                  </TableCell>
                  <TableCell className="font-mono text-xs max-w-xs truncate">{c.url_tested}</TableCell>
                  <TableCell>
                    <Badge variant={c.is_healthy ? "default" : "destructive"}>
                      {c.actual_status ?? "ERR"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-[11px] max-w-xs truncate text-muted-foreground">
                    {c.actual_location ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs">{c.response_time_ms ?? "—"}ms</TableCell>
                  <TableCell className="text-xs text-destructive max-w-xs truncate">
                    {c.error_message ?? ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editează URL" : "Adaugă URL"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>URL complet</Label>
              <Input
                value={editing?.url ?? ""}
                onChange={(e) => setEditing({ ...editing, url: e.target.value })}
                placeholder="https://mvaimobiliare.ro/proprietati/..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status așteptat</Label>
                <Input
                  type="number"
                  value={editing?.expected_status ?? 301}
                  onChange={(e) => setEditing({ ...editing, expected_status: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-end gap-2">
                <Switch
                  checked={editing?.is_active ?? true}
                  onCheckedChange={(v) => setEditing({ ...editing, is_active: v })}
                />
                <Label>Activ</Label>
              </div>
            </div>
            <div>
              <Label>Pattern Location (regex, opțional)</Label>
              <Input
                value={editing?.expected_location_pattern ?? ""}
                onChange={(e) => setEditing({ ...editing, expected_location_pattern: e.target.value })}
                placeholder="/proprietati/.+-7c0f"
              />
            </div>
            <div>
              <Label>Notă</Label>
              <Input
                value={editing?.note ?? ""}
                onChange={(e) => setEditing({ ...editing, note: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Anulează</Button>
            <Button onClick={() => editing && saveMutation.mutate(editing)} disabled={saveMutation.isPending}>
              Salvează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

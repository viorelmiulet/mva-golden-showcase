import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, RefreshCw, FileSpreadsheet, Download, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const FEED_URL = `https://fdpandnzblzvamhsoukt.supabase.co/functions/v1/facebook-catalog-feed`;
const PREVIEW_URL = `${FEED_URL}?preview=1&limit=5`;

interface ExcludedRow { id: string; external_id: string | null; title: string; reason: string }
interface Preview {
  total: number;
  total_input: number;
  excluded_count: number;
  excluded: ExcludedRow[];
  preview: number;
  size_bytes: number;
  generated_at: string;
  headers: string[];
  rows: string[][];
}

const FacebookCatalogFeedPage = () => {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);

  const loadPreview = async () => {
    setLoading(true);
    try {
      const res = await fetch(PREVIEW_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPreview(data);
    } catch (e: any) {
      toast({ title: "Eroare preview", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPreview(); }, []);

  const copyLink = async () => {
    await navigator.clipboard.writeText(FEED_URL);
    toast({ title: "Link copiat", description: "URL-ul feed-ului a fost copiat în clipboard." });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const downloadExcludedCsv = () => {
    if (!preview) return;
    const header = ['id', 'external_id', 'title', 'reason'];
    const escape = (v: any) => {
      const s = (v ?? '').toString().replace(/\r?\n/g, ' ');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [header.join(','), ...preview.excluded.map(r => header.map(h => escape((r as any)[h])).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `facebook-feed-excluse-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <FileSpreadsheet className="h-7 w-7 text-gold" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Feed Facebook Catalog</h1>
          <p className="text-sm text-muted-foreground">CSV automat pentru import în Meta Commerce Manager</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">URL feed CSV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col md:flex-row gap-2">
            <input
              readOnly
              value={FEED_URL}
              className="flex-1 px-3 py-2 text-sm bg-muted rounded-md border border-border font-mono text-foreground"
              onFocus={(e) => e.target.select()}
            />
            <Button onClick={copyLink} className="gap-2">
              <Copy className="h-4 w-4" /> Copiază link
            </Button>
            <Button variant="outline" asChild className="gap-2">
              <a href={FEED_URL} target="_blank" rel="noreferrer">
                <Download className="h-4 w-4" /> Descarcă CSV
              </a>
            </Button>
          </div>
          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
            <p className="font-semibold text-foreground">Cum îl folosești în Facebook:</p>
            <ol className="list-decimal pl-5 space-y-0.5">
              <li>Deschide <a className="text-gold hover:underline" href="https://business.facebook.com/commerce" target="_blank" rel="noreferrer">Meta Commerce Manager <ExternalLink className="inline h-3 w-3" /></a></li>
              <li>Catalog → <strong>Data Sources</strong> → <strong>Add Items</strong> → <strong>Use Bulk Upload</strong> → <strong>Scheduled Feed</strong></li>
              <li>Lipește URL-ul de mai sus și setează frecvența la <strong>Daily</strong></li>
              <li>Facebook va prelua automat fiecare proprietate publicată (excludem ansamblurile rezidențiale)</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Produse exportate</div>
            <div className="text-3xl font-bold text-foreground mt-1">{preview?.total ?? "—"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Mărime fișier</div>
            <div className="text-3xl font-bold text-foreground mt-1">{preview ? formatSize(preview.size_bytes) : "—"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Generat</div>
            <div className="text-sm font-medium text-foreground mt-2 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              {preview ? new Date(preview.generated_at).toLocaleString("ro-RO") : "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Preview primele {preview?.preview ?? 5} produse</CardTitle>
          <Button variant="outline" size="sm" onClick={loadPreview} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Reîmprospătează
          </Button>
        </CardHeader>
        <CardContent>
          {preview && preview.rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    {preview.headers.slice(0, 7).map((h) => (
                      <th key={h} className="text-left p-2 font-semibold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row, i) => (
                    <tr key={i} className="border-b border-border/50">
                      {row.slice(0, 7).map((cell, j) => (
                        <td key={j} className="p-2 max-w-[200px] truncate text-foreground" title={cell}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <Badge variant="outline" className="mt-3">Afișate primele 7 coloane din 12</Badge>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Niciun produs disponibil.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FacebookCatalogFeedPage;

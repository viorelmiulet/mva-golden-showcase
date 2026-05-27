import { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Play, Gauge, Smartphone, Monitor } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

interface AuditItem {
  id: string;
  title: string;
  description: string;
  score: number | null;
  displayValue?: string;
}
interface StrategyReport {
  strategy: 'mobile' | 'desktop';
  performance: number | null;
  seo: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  metrics: Record<string, string | undefined>;
  opportunities: AuditItem[];
  diagnostics: AuditItem[];
  fetchTime: string;
  finalUrl: string;
}
interface ReportData {
  url: string;
  timestamp: string;
  mobile: StrategyReport;
  desktop: StrategyReport;
}

const RECOMMENDATIONS: Record<string, string> = {
  'render-blocking-resources': 'Mută CSS/JS critic inline și încarcă restul cu defer/async.',
  'unused-css-rules': 'Elimină CSS nefolosit (PurgeCSS via Tailwind este deja activ – verifică componentele lazy).',
  'unused-javascript': 'Code-splitting cu React.lazy() pe rute admin/secundare.',
  'uses-optimized-images': 'Folosește WebP/AVIF (vite-imagetools) și transformările Supabase.',
  'modern-image-formats': 'Servește imaginile ca AVIF/WebP cu fallback JPG.',
  'offscreen-images': 'Adaugă loading="lazy" și decoding="async" pe imagini sub fold.',
  'uses-responsive-images': 'Furnizează srcSet/sizes pentru hero și galerii.',
  'efficient-animated-content': 'Convertește GIF-urile în MP4/WebM.',
  'uses-text-compression': 'Verifică headerele Cloudflare – gzip/brotli ar trebui active.',
  'uses-rel-preconnect': 'Adaugă <link rel="preconnect"> pentru Supabase, fonts, GA.',
  'font-display': 'Adaugă font-display: swap pe @font-face.',
  'server-response-time': 'Reduce TTFB: cache CDN agresiv pe HTML SPA.',
  'largest-contentful-paint-element': 'Optimizează imaginea hero (preload + dimensiuni explicite).',
  'layout-shift-elements': 'Setează width/height pe imagini și rezervă spațiu pentru carduri.',
  'total-byte-weight': 'Reduce greutatea paginii sub 1.5MB (split bundles).',
  'dom-size': 'Reduce DOM-ul (paginare/virtualizare pe liste lungi).',
  'critical-request-chains': 'Scurtează lanțul de cereri critice prin preload/prefetch.',
  'mainthread-work-breakdown': 'Mută munca grea pe Web Workers sau debounce + useTransition.',
  'bootup-time': 'Reduce JS executat la load: amână librării terțe (analytics, chat).',
  'uses-long-cache-ttl': 'Setează Cache-Control: max-age=31536000, immutable pe asset-uri.',
  'third-party-summary': 'Lazy-load scripturile terțe (GA, Facebook Pixel) după interaction.',
  'lcp-lazy-loaded': 'Elimină loading="lazy" pe imaginea LCP – folosește fetchpriority="high".',
  'prioritize-lcp-image': 'Preload LCP image cu rel="preload" as="image" fetchpriority="high".',
  'image-size-responsive': 'Servește imagini la dimensiunea reală afișată.',
  'unminified-css': 'Vite minifică implicit – verifică build de producție.',
  'unminified-javascript': 'Vite minifică implicit – verifică build de producție.',
  'duplicated-javascript': 'Deduplică pachete (verifică npm dedupe / aliasuri).',
  'legacy-javascript': 'Setează target ES2020+ în vite.config.ts pentru bundle mai mic.',
  'non-composited-animations': 'Animează doar transform/opacity (GPU).',
  'uses-passive-event-listeners': 'Adaugă { passive: true } pe scroll/touch.',
  'no-document-write': 'Elimină document.write din scripturile terțe.',
  'meta-viewport': 'Verifică <meta name="viewport"> în index.html.',
};

function scoreColor(s: number | null) {
  if (s === null) return 'text-muted-foreground';
  if (s >= 0.9) return 'text-green-600';
  if (s >= 0.5) return 'text-orange-500';
  return 'text-red-600';
}
function scorePct(s: number | null) {
  return s === null ? '–' : Math.round(s * 100).toString();
}

function ScoreCard({ label, score }: { label: string; score: number | null }) {
  return (
    <div className="rounded-lg border bg-card p-4 text-center">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 text-3xl font-bold ${scoreColor(score)}`}>{scorePct(score)}</div>
    </div>
  );
}

function StrategyBlock({ report }: { report: StrategyReport }) {
  const Icon = report.strategy === 'mobile' ? Smartphone : Monitor;
  const allAudits = [...report.opportunities, ...report.diagnostics];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 capitalize">
          <Icon className="h-5 w-5" />
          {report.strategy === 'mobile' ? 'Mobile' : 'Desktop'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <ScoreCard label="Performance" score={report.performance} />
          <ScoreCard label="SEO" score={report.seo} />
          <ScoreCard label="Accessibility" score={report.accessibility} />
          <ScoreCard label="Best Practices" score={report.bestPractices} />
        </div>

        <div>
          <h4 className="mb-2 text-sm font-semibold">Core Web Vitals</h4>
          <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
            {[
              ['LCP', report.metrics.lcp],
              ['FCP', report.metrics.fcp],
              ['CLS', report.metrics.cls],
              ['TBT', report.metrics.tbt],
              ['Speed Index', report.metrics.si],
              ['TTFB', report.metrics.ttfb],
              ['INP', report.metrics.inp],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="rounded border bg-muted/30 p-2">
                  <div className="text-xs text-muted-foreground">{k}</div>
                  <div className="font-mono font-semibold">{v}</div>
                </div>
              ))}
          </div>
        </div>

        {allAudits.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-semibold">
              Constatări &amp; recomandări ({allAudits.length})
            </h4>
            <div className="space-y-2">
              {allAudits.map((a) => {
                const rec = RECOMMENDATIONS[a.id];
                return (
                  <div key={a.id} className="rounded border bg-card p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium">{a.title}</div>
                      <Badge variant={a.score && a.score >= 0.5 ? 'secondary' : 'destructive'}>
                        {a.displayValue ?? scorePct(a.score)}
                      </Badge>
                    </div>
                    {rec && (
                      <div className="mt-2 rounded bg-primary/5 p-2 text-sm">
                        <span className="font-semibold text-primary">Recomandare: </span>
                        {rec}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {allAudits.length === 0 && (
          <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            Niciun audit problematic – continuă așa! 🎉
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function LighthouseReportPage() {
  const [url, setUrl] = useState('https://www.mvaimobiliare.ro/');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const runReport = async () => {
    setLoading(true);
    setReport(null);
    try {
      const { data, error } = await supabase.functions.invoke('lighthouse-report', {
        body: { url },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setReport(data);
      toast.success('Audit complet');
    } catch (e: any) {
      toast.error('Eroare audit: ' + (e?.message ?? 'unknown'));
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    if (!reportRef.current || !report) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 1.5,
        backgroundColor: '#ffffff',
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      const ts = new Date(report.timestamp).toISOString().replace(/[:.]/g, '-');
      pdf.save(`lighthouse-${ts}.pdf`);
      toast.success('PDF descărcat');
    } catch (e: any) {
      toast.error('Eroare PDF: ' + (e?.message ?? 'unknown'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-2">
        <Gauge className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Raport Lighthouse</h1>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium">URL de auditat</label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.mvaimobiliare.ro/"
            />
          </div>
          <Button onClick={runReport} disabled={loading || !url} className="md:w-auto">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Rulez audit (60s)…
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" /> Rulează audit
              </>
            )}
          </Button>
          {report && (
            <Button onClick={exportPDF} disabled={exporting} variant="secondary">
              {exporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Descarcă PDF
            </Button>
          )}
        </CardContent>
      </Card>

      {report && (
        <div ref={reportRef} className="space-y-6 bg-background p-4">
          <div className="rounded border bg-card p-4">
            <div className="text-sm text-muted-foreground">URL auditat</div>
            <div className="font-medium">{report.url}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {new Date(report.timestamp).toLocaleString('ro-RO')}
            </div>
          </div>
          <StrategyBlock report={report.mobile} />
          <StrategyBlock report={report.desktop} />
        </div>
      )}
    </div>
  );
}

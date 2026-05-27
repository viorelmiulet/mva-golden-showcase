// Lighthouse / PageSpeed Insights report edge function
// Calls Google PageSpeed Insights API for both mobile + desktop
// and returns metrics + opportunities + diagnostics.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const PSI_ENDPOINT = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

interface AuditItem {
  id: string;
  title: string;
  description: string;
  score: number | null;
  displayValue?: string;
  scoreDisplayMode?: string;
}

interface StrategyReport {
  strategy: 'mobile' | 'desktop';
  performance: number | null;
  seo: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  metrics: {
    lcp?: string;
    fcp?: string;
    cls?: string;
    tbt?: string;
    si?: string;
    ttfb?: string;
    inp?: string;
  };
  opportunities: AuditItem[];
  diagnostics: AuditItem[];
  fetchTime: string;
  finalUrl: string;
}

async function runPSI(url: string, strategy: 'mobile' | 'desktop'): Promise<StrategyReport> {
  const params = new URLSearchParams({
    url,
    strategy,
    locale: 'ro',
  });
  ['performance', 'seo', 'accessibility', 'best-practices'].forEach((c) =>
    params.append('category', c)
  );
  const apiKey = Deno.env.get('GOOGLE_PAGESPEED_API_KEY');
  if (apiKey) params.set('key', apiKey);

  const res = await fetch(`${PSI_ENDPOINT}?${params.toString()}`);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`PSI ${strategy} failed: ${res.status} - ${txt.slice(0, 300)}`);
  }
  const data = await res.json();
  const lr = data.lighthouseResult ?? {};
  const audits = lr.audits ?? {};
  const cats = lr.categories ?? {};

  const pickAudits = (groupPrefix: string): AuditItem[] => {
    return Object.values(audits)
      .filter((a: any) => {
        if (!a) return false;
        if (a.scoreDisplayMode === 'notApplicable' || a.scoreDisplayMode === 'manual') return false;
        if (a.score === 1 || a.score === null) {
          // for diagnostics we still want score=null informational items only if relevant group
        }
        return true;
      })
      .map((a: any) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        score: a.score,
        displayValue: a.displayValue,
        scoreDisplayMode: a.scoreDisplayMode,
      }))
      .filter((a) => {
        // opportunities = those with numericValue savings in original
        const orig: any = audits[a.id];
        if (groupPrefix === 'opportunity') {
          return orig?.details?.type === 'opportunity' && (orig?.details?.overallSavingsMs ?? 0) > 0;
        }
        if (groupPrefix === 'diagnostic') {
          return (
            orig?.details?.type !== 'opportunity' &&
            a.score !== null &&
            a.score < 0.9 &&
            a.scoreDisplayMode !== 'informative'
          );
        }
        return false;
      });
  };

  return {
    strategy,
    performance: cats.performance?.score ?? null,
    seo: cats.seo?.score ?? null,
    accessibility: cats.accessibility?.score ?? null,
    bestPractices: cats['best-practices']?.score ?? null,
    metrics: {
      lcp: audits['largest-contentful-paint']?.displayValue,
      fcp: audits['first-contentful-paint']?.displayValue,
      cls: audits['cumulative-layout-shift']?.displayValue,
      tbt: audits['total-blocking-time']?.displayValue,
      si: audits['speed-index']?.displayValue,
      ttfb: audits['server-response-time']?.displayValue,
      inp: audits['interaction-to-next-paint']?.displayValue,
    },
    opportunities: pickAudits('opportunity').sort((a, b) => (a.score ?? 1) - (b.score ?? 1)),
    diagnostics: pickAudits('diagnostic').sort((a, b) => (a.score ?? 1) - (b.score ?? 1)),
    fetchTime: lr.fetchTime,
    finalUrl: lr.finalUrl,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const url: string = body.url || 'https://www.mvaimobiliare.ro/';

    const [mobile, desktop] = await Promise.all([
      runPSI(url, 'mobile'),
      runPSI(url, 'desktop'),
    ]);

    return new Response(
      JSON.stringify({
        url,
        timestamp: new Date().toISOString(),
        mobile,
        desktop,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

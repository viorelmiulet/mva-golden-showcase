const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INDEXNOW_KEY = 'eigr05fz1t3k1y20luvs3bh4yqd7u73d';
const SITE_URL = 'https://mvaimobiliare.ro';
const DEFAULT_URLS = [
  SITE_URL,
  `${SITE_URL}/proprietati`,
  `${SITE_URL}/complexe`,
  `${SITE_URL}/despre-noi`,
  `${SITE_URL}/servicii`,
  `${SITE_URL}/contact`,
  `${SITE_URL}/blog`,
  `${SITE_URL}/calculator-credit`,
  `${SITE_URL}/intrebari-frecvente`,
];

const normalizeUrls = (input: unknown): string[] => {
  if (!Array.isArray(input)) return DEFAULT_URLS;

  const validUrls = input
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter((value) => value.startsWith(SITE_URL));

  return validUrls.length > 0 ? [...new Set(validUrls)] : DEFAULT_URLS;
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const targetUrls = normalizeUrls(requestBody?.targetUrls);

    console.log('Notifying Google and Bing about sitemap update');
    console.log('Target URLs:', targetUrls.length);

    const staticSitemapUrl = `${SITE_URL}/sitemap.xml`;

    // 1. Notify Google via ping
    const googlePingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(staticSitemapUrl)}`;
    const googleResponse = await fetch(googlePingUrl, { method: 'GET' });
    console.log('Google:', googleResponse.status);

    // 2. Bing - Submit sitemap via URL Submission API (POST)
    const bingApiKey = Deno.env.get('BING_WEBMASTER_API_KEY');
    let bingResult = { success: false, message: 'No API key' };

    if (bingApiKey) {
      try {
        // SubmitUrlbatch with sitemap URLs
        const bingSubmitUrl = `https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlbatch?apikey=${encodeURIComponent(bingApiKey)}`;
        const bingResponse = await fetch(bingSubmitUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({
            siteUrl: SITE_URL,
            urlList: targetUrls,
          })
        });
        const bingBody = await bingResponse.text();
        console.log('Bing SubmitUrlbatch:', bingResponse.status, bingBody);
        bingResult = { success: bingResponse.ok, message: `Status: ${bingResponse.status}` };
      } catch (bingError) {
        console.error('Bing error:', bingError);
        bingResult = { success: false, message: bingError.message };
      }
    }

    // 3. IndexNow for Bing
    let indexNowResult = { success: false, message: 'not_sent' };
    try {
      const indexNowResponse = await fetch('https://www.bing.com/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          host: 'mvaimobiliare.ro',
          key: INDEXNOW_KEY,
          keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
          urlList: targetUrls,
        })
      });
      const indexNowBody = await indexNowResponse.text();
      console.log('IndexNow:', indexNowResponse.status, indexNowBody);
      indexNowResult = {
        success: indexNowResponse.ok || indexNowResponse.status === 202,
        message: `Status: ${indexNowResponse.status}`,
      };
    } catch (inError) {
      console.error('IndexNow error:', inError);
      indexNowResult = { success: false, message: inError.message };
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        google: { success: googleResponse.ok, status: googleResponse.status },
        bing: bingResult,
        indexNow: indexNowResult,
        urls: targetUrls,
        sitemap: staticSitemapUrl
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error notifying search engines:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

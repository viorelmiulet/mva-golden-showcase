import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Notifying Google and Bing about sitemap update');

    const siteUrl = 'https://mvaimobiliare.ro';
    const sitemapUrl = 'https://fdpandnzblzvamhsoukt.supabase.co/functions/v1/generate-sitemap-index';
    const staticSitemapUrl = `${siteUrl}/sitemap.xml`;

    // 1. Notify Google
    const googlePingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
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
            siteUrl: siteUrl,
            urlList: [
              siteUrl,
              `${siteUrl}/proprietati`,
              `${siteUrl}/complexe`,
              `${siteUrl}/despre-noi`,
              `${siteUrl}/servicii`,
              `${siteUrl}/contact`,
              `${siteUrl}/blog`,
            ]
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

    // 3. IndexNow (accepted by Bing, Yandex, Seznam)
    let indexNowResult = { success: false, message: 'skipped' };
    if (bingApiKey) {
      try {
        const indexNowResponse = await fetch('https://api.indexnow.org/indexnow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({
            host: 'mvaimobiliare.ro',
            key: bingApiKey,
            keyLocation: `${siteUrl}/${bingApiKey}.txt`,
            urlList: [
              siteUrl,
              `${siteUrl}/proprietati`,
              `${siteUrl}/complexe`,
              `${siteUrl}/despre-noi`,
              `${siteUrl}/servicii`,
              `${siteUrl}/contact`,
              `${siteUrl}/blog`,
              `${siteUrl}/calculator-credit`,
              `${siteUrl}/faq`,
            ]
          })
        });
        console.log('IndexNow:', indexNowResponse.status);
        indexNowResult = { success: indexNowResponse.ok || indexNowResponse.status === 202, message: `Status: ${indexNowResponse.status}` };
      } catch (inError) {
        console.error('IndexNow error:', inError);
        indexNowResult = { success: false, message: inError.message };
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        google: { success: googleResponse.ok, status: googleResponse.status },
        bing: bingResult,
        indexNow: indexNowResult,
        sitemaps: { dynamic: sitemapUrl, static: staticSitemapUrl }
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

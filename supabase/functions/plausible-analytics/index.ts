import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const PLAUSIBLE_API_KEY = Deno.env.get('PLAUSIBLE_API_KEY');
const SITE_ID = 'mvaimobiliare.ro';
const PLAUSIBLE_API_URL = 'https://plausible.io/api/v1/stats';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get('days') || '7');
    
    // Plausible uses "Last 7 days" which excludes today and counts 7 complete days back
    // So for "7 days" we want: yesterday - 6 days back = 7 complete days
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() - 1); // Yesterday (last complete day)
    
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - (days - 1)); // Go back (days - 1) more days
    
    const period = `${startDate.toISOString().split('T')[0]},${endDate.toISOString().split('T')[0]}`;
    
    console.log(`Fetching Plausible data for ${SITE_ID}, period: ${period}`);

    // Aggregate stats
    const aggregateResponse = await fetch(
      `${PLAUSIBLE_API_URL}/aggregate?site_id=${SITE_ID}&period=custom&date=${period}&metrics=visitors,pageviews,bounce_rate,visit_duration`,
      {
        headers: {
          'Authorization': `Bearer ${PLAUSIBLE_API_KEY}`,
        },
      }
    );

    if (!aggregateResponse.ok) {
      throw new Error(`Plausible API error: ${aggregateResponse.status}`);
    }

    const aggregateData = await aggregateResponse.json();
    console.log('Aggregate data:', aggregateData);

    // Timeseries data
    const timeseriesResponse = await fetch(
      `${PLAUSIBLE_API_URL}/timeseries?site_id=${SITE_ID}&period=custom&date=${period}&metrics=visitors,pageviews`,
      {
        headers: {
          'Authorization': `Bearer ${PLAUSIBLE_API_KEY}`,
        },
      }
    );
    const timeseriesData = await timeseriesResponse.json();

    // Top pages
    const pagesResponse = await fetch(
      `${PLAUSIBLE_API_URL}/breakdown?site_id=${SITE_ID}&period=custom&date=${period}&property=event:page&metrics=visitors,pageviews&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${PLAUSIBLE_API_KEY}`,
        },
      }
    );
    const pagesData = await pagesResponse.json();

    // Top sources
    const sourcesResponse = await fetch(
      `${PLAUSIBLE_API_URL}/breakdown?site_id=${SITE_ID}&period=custom&date=${period}&property=visit:source&metrics=visitors&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${PLAUSIBLE_API_KEY}`,
        },
      }
    );
    const sourcesData = await sourcesResponse.json();

    // Devices
    const devicesResponse = await fetch(
      `${PLAUSIBLE_API_URL}/breakdown?site_id=${SITE_ID}&period=custom&date=${period}&property=visit:device&metrics=visitors`,
      {
        headers: {
          'Authorization': `Bearer ${PLAUSIBLE_API_KEY}`,
        },
      }
    );
    const devicesData = await devicesResponse.json();

    // Countries
    const countriesResponse = await fetch(
      `${PLAUSIBLE_API_URL}/breakdown?site_id=${SITE_ID}&period=custom&date=${period}&property=visit:country&metrics=visitors&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${PLAUSIBLE_API_KEY}`,
        },
      }
    );
    const countriesData = await countriesResponse.json();

    // Transform to expected format
    const result = {
      visitors: aggregateData.results.visitors.value || 0,
      pageviews: aggregateData.results.pageviews.value || 0,
      sessionDuration: Math.round(aggregateData.results.visit_duration.value || 0),
      bounceRate: Math.round(aggregateData.results.bounce_rate.value || 0),
      dailyData: timeseriesData.results?.map((item: any) => ({
        date: item.date,
        visitors: item.visitors || 0,
        pageviews: item.pageviews || 0,
      })) || [],
      topPages: pagesData.results?.map((item: any) => ({
        page: item.page,
        visitors: item.visitors || 0,
        pageviews: item.pageviews || 0,
      })) || [],
      topSources: sourcesData.results?.map((item: any) => ({
        source: item.source || 'Direct',
        visitors: item.visitors || 0,
      })) || [],
      devices: devicesData.results?.map((item: any) => ({
        device: item.device,
        visitors: item.visitors || 0,
      })) || [],
      countries: countriesData.results?.map((item: any) => ({
        country: item.country,
        visitors: item.visitors || 0,
      })) || [],
    };

    console.log('Formatted result:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching Plausible analytics:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to fetch analytics data from Plausible'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

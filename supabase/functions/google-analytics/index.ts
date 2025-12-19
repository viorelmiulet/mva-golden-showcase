import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Google Analytics Data API v1
const GA_API_BASE = 'https://analyticsdata.googleapis.com/v1beta';

interface GACredentials {
  client_email: string;
  private_key: string;
}

async function getAccessToken(credentials: GACredentials): Promise<string> {
  console.log('Getting access token for:', credentials.client_email);
  
  if (!credentials.client_email || !credentials.private_key) {
    console.error('Invalid credentials:', {
      hasClientEmail: !!credentials.client_email,
      hasPrivateKey: !!credentials.private_key,
      credentialsKeys: Object.keys(credentials || {})
    });
    throw new Error('Invalid service account credentials: missing client_email or private_key');
  }

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  // Create JWT
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const claimB64 = btoa(JSON.stringify(claim)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const unsignedToken = `${headerB64}.${claimB64}`;

  // Import private key and sign
  const privateKey = credentials.private_key.replace(/\\n/g, '\n');
  const pemHeader = '-----BEGIN PRIVATE KEY-----';
  const pemFooter = '-----END PRIVATE KEY-----';
  const pemContents = privateKey.replace(pemHeader, '').replace(pemFooter, '').replace(/\s/g, '');
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(unsignedToken)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const jwt = `${unsignedToken}.${signatureB64}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error('Token exchange failed:', errorText);
    throw new Error('Failed to get access token');
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

async function runReport(propertyId: string, accessToken: string, startDate: string, endDate: string) {
  const response = await fetch(`${GA_API_BASE}/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
      ],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('GA Report error:', errorText);
    throw new Error('Failed to fetch GA report');
  }

  return response.json();
}

async function getTopPages(propertyId: string, accessToken: string, startDate: string, endDate: string) {
  const response = await fetch(`${GA_API_BASE}/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
      ],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('GA Pages error:', errorText);
    throw new Error('Failed to fetch top pages');
  }

  return response.json();
}

async function getTrafficSources(propertyId: string, accessToken: string, startDate: string, endDate: string) {
  const response = await fetch(`${GA_API_BASE}/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'sessionSource' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 10,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('GA Sources error:', errorText);
    throw new Error('Failed to fetch traffic sources');
  }

  return response.json();
}

async function getDevices(propertyId: string, accessToken: string, startDate: string, endDate: string) {
  const response = await fetch(`${GA_API_BASE}/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('GA Devices error:', errorText);
    throw new Error('Failed to fetch devices');
  }

  return response.json();
}

async function getCountries(propertyId: string, accessToken: string, startDate: string, endDate: string) {
  const response = await fetch(`${GA_API_BASE}/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'country' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 10,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('GA Countries error:', errorText);
    throw new Error('Failed to fetch countries');
  }

  return response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get('days') || '7');
    
    const propertyId = Deno.env.get('GA4_PROPERTY_ID');
    const serviceAccountKey = Deno.env.get('GA4_SERVICE_ACCOUNT_KEY');
    
    console.log('Property ID:', propertyId);
    console.log('Service Account Key exists:', !!serviceAccountKey);
    console.log('Service Account Key length:', serviceAccountKey?.length);
    
    if (!propertyId || !serviceAccountKey) {
      throw new Error('GA4_PROPERTY_ID or GA4_SERVICE_ACCOUNT_KEY not configured');
    }

    let credentials: GACredentials;
    try {
      credentials = JSON.parse(serviceAccountKey);
      console.log('Parsed credentials - client_email:', credentials.client_email);
      console.log('Parsed credentials - has private_key:', !!credentials.private_key);
    } catch (parseError) {
      console.error('Failed to parse service account key as JSON:', parseError);
      console.error('Service account key first 50 chars:', serviceAccountKey.substring(0, 50));
      throw new Error('Invalid GA4_SERVICE_ACCOUNT_KEY: not valid JSON. Please paste the entire content of the JSON key file.');
    }
    
    const accessToken = await getAccessToken(credentials);

    const endDate = 'today';
    const startDate = `${days}daysAgo`;

    console.log(`Fetching GA4 data for property ${propertyId}, last ${days} days`);

    // Fetch all reports in parallel
    const [mainReport, topPages, sources, devices, countries] = await Promise.all([
      runReport(propertyId, accessToken, startDate, endDate),
      getTopPages(propertyId, accessToken, startDate, endDate),
      getTrafficSources(propertyId, accessToken, startDate, endDate),
      getDevices(propertyId, accessToken, startDate, endDate),
      getCountries(propertyId, accessToken, startDate, endDate),
    ]);

    // Process main report data
    const dailyData = mainReport.rows?.map((row: any) => ({
      date: row.dimensionValues[0].value,
      visitors: parseInt(row.metricValues[0].value) || 0,
      pageviews: parseInt(row.metricValues[1].value) || 0,
    })) || [];

    // Calculate totals
    const totals = mainReport.rows?.reduce((acc: any, row: any) => ({
      visitors: acc.visitors + (parseInt(row.metricValues[0].value) || 0),
      pageviews: acc.pageviews + (parseInt(row.metricValues[1].value) || 0),
      sessionDuration: acc.sessionDuration + (parseFloat(row.metricValues[2].value) || 0),
      bounceRate: acc.bounceRate + (parseFloat(row.metricValues[3].value) || 0),
      count: acc.count + 1,
    }), { visitors: 0, pageviews: 0, sessionDuration: 0, bounceRate: 0, count: 0 }) || { visitors: 0, pageviews: 0, sessionDuration: 0, bounceRate: 0, count: 1 };

    // Process top pages
    const topPagesData = topPages.rows?.map((row: any) => ({
      page: row.dimensionValues[0].value,
      visitors: parseInt(row.metricValues[0].value) || 0,
      pageviews: parseInt(row.metricValues[1].value) || 0,
    })) || [];

    // Process sources
    const sourcesData = sources.rows?.map((row: any) => ({
      source: row.dimensionValues[0].value || 'direct',
      visitors: parseInt(row.metricValues[0].value) || 0,
    })) || [];

    // Process devices
    const devicesData = devices.rows?.map((row: any) => ({
      device: row.dimensionValues[0].value,
      visitors: parseInt(row.metricValues[0].value) || 0,
    })) || [];

    // Process countries
    const countriesData = countries.rows?.map((row: any) => ({
      country: row.dimensionValues[0].value,
      visitors: parseInt(row.metricValues[0].value) || 0,
    })) || [];

    const analyticsData = {
      visitors: totals.visitors,
      pageviews: totals.pageviews,
      sessionDuration: Math.round(totals.sessionDuration / totals.count),
      bounceRate: Math.round((totals.bounceRate / totals.count) * 100) / 100,
      dailyData,
      topPages: topPagesData,
      sources: sourcesData,
      devices: devicesData,
      countries: countriesData,
    };

    console.log('GA4 data fetched successfully:', {
      visitors: analyticsData.visitors,
      pageviews: analyticsData.pageviews,
      daysCount: dailyData.length,
    });

    return new Response(JSON.stringify(analyticsData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Google Analytics error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch analytics' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

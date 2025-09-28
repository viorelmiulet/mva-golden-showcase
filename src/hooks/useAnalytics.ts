import { useState, useEffect } from 'react';

interface AnalyticsData {
  visitors: { [key: string]: number };
  pageviews: { [key: string]: number };
  pageviewsPerVisit: { [key: string]: number };
  sessionDuration: { [key: string]: number };
  bounceRate: { [key: string]: number };
  topPages: Array<{ page: string; views: number }>;
  topSources: Array<{ source: string; visitors: number }>;
  devices: Array<{ device: string; visitors: number }>;
  countries: Array<{ country: string; visitors: number }>;
}

export const useAnalytics = (days: number = 7) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);

        const response = await fetch('/api/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            startdate: startDate.toISOString().split('T')[0],
            enddate: endDate.toISOString().split('T')[0],
            granularity: 'daily'
          })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }

        const rawData = await response.text();
        
        // Parse the analytics response format
        const lines = rawData.split('\n');
        const analyticsLine = lines.find(line => line.includes('visitors'));
        
        if (!analyticsLine) {
          throw new Error('Invalid analytics response format');
        }

        // Extract data using regex patterns
        const visitorsMatch = analyticsLine.match(/(\d+) visitors \[(.*?)\]/);
        const pageviewsMatch = analyticsLine.match(/(\d+) pageviews \[(.*?)\]/);
        const sessionDurationMatch = analyticsLine.match(/(\d+(?:\.\d+)?) sessionDuration \[(.*?)\]/);
        const bounceRateMatch = analyticsLine.match(/(\d+(?:\.\d+)?) bounceRate \[(.*?)\]/);
        
        // Parse details section
        const detailsMatch = rawData.match(/{page \[(.*?)\]} {source \[(.*?)\]} {device \[(.*?)\]} {country \[(.*?)\]}/);

        if (!visitorsMatch || !pageviewsMatch || !detailsMatch) {
          throw new Error('Could not parse analytics data');
        }

        // Parse daily data
        const parseDaily = (dataStr: string) => {
          const dailyData: { [key: string]: number } = {};
          const matches = dataStr.matchAll(/{(\d{4}-\d{2}-\d{2}) (\d+(?:\.\d+)?)}/g);
          for (const match of matches) {
            dailyData[match[1]] = parseFloat(match[2]);
          }
          return dailyData;
        };

        // Parse list data
        const parseList = (dataStr: string) => {
          const items: Array<{ name: string; value: number }> = [];
          const matches = dataStr.matchAll(/{([^}]+) (\d+)}/g);
          for (const match of matches) {
            items.push({ name: match[1], value: parseInt(match[2]) });
          }
          return items;
        };

        const visitors = parseDaily(visitorsMatch[2]);
        const pageviews = parseDaily(pageviewsMatch[2]);
        const sessionDuration = sessionDurationMatch ? parseDaily(sessionDurationMatch[2]) : {};
        const bounceRate = bounceRateMatch ? parseDaily(bounceRateMatch[2]) : {};

        const pages = parseList(detailsMatch[1]);
        const sources = parseList(detailsMatch[2]);
        const devices = parseList(detailsMatch[3]);
        const countries = parseList(detailsMatch[4]);

        // Calculate pageviews per visit
        const pageviewsPerVisit: { [key: string]: number } = {};
        Object.keys(visitors).forEach(date => {
          pageviewsPerVisit[date] = visitors[date] > 0 ? pageviews[date] / visitors[date] : 0;
        });

        setData({
          visitors,
          pageviews,
          pageviewsPerVisit,
          sessionDuration,
          bounceRate,
          topPages: pages.map(p => ({ page: p.name, views: p.value })),
          topSources: sources.map(s => ({ source: s.name, visitors: s.value })),
          devices: devices.map(d => ({ device: d.name, visitors: d.value })),
          countries: countries.map(c => ({ country: c.name, visitors: c.value }))
        });

      } catch (err) {
        console.error('Analytics fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch analytics');

        // Fallback with mock data for development
        setData({
          visitors: {
            '2025-09-21': 4,
            '2025-09-22': 5,
            '2025-09-23': 2,
            '2025-09-24': 3,
            '2025-09-25': 3,
            '2025-09-26': 5,
            '2025-09-27': 1,
            '2025-09-28': 4
          },
          pageviews: {
            '2025-09-21': 4,
            '2025-09-22': 8,
            '2025-09-23': 2,
            '2025-09-24': 4,
            '2025-09-25': 4,
            '2025-09-26': 9,
            '2025-09-27': 1,
            '2025-09-28': 27
          },
          pageviewsPerVisit: {
            '2025-09-21': 1,
            '2025-09-22': 1.6,
            '2025-09-23': 1,
            '2025-09-24': 1.33,
            '2025-09-25': 1.33,
            '2025-09-26': 1.8,
            '2025-09-27': 1,
            '2025-09-28': 6.75
          },
          sessionDuration: {
            '2025-09-21': 0,
            '2025-09-22': 14802.2,
            '2025-09-23': 0,
            '2025-09-24': 0,
            '2025-09-25': 235,
            '2025-09-26': 89.2,
            '2025-09-27': 0,
            '2025-09-28': 458.5
          },
          bounceRate: {
            '2025-09-21': 100,
            '2025-09-22': 60,
            '2025-09-23': 100,
            '2025-09-24': 100,
            '2025-09-25': 67,
            '2025-09-26': 80,
            '2025-09-27': 100,
            '2025-09-28': 0
          },
          topPages: [
            { page: '/', views: 23 },
            { page: '/proprietati', views: 7 },
            { page: '/admin', views: 4 },
            { page: '/de-ce-sa-ne-alegi', views: 1 }
          ],
          topSources: [
            { source: 'Direct', visitors: 17 },
            { source: 'l.wl.co', visitors: 2 },
            { source: 'l.facebook.com', visitors: 2 },
            { source: 'bing.com', visitors: 1 },
            { source: 'google.com', visitors: 1 }
          ],
          devices: [
            { device: 'desktop', visitors: 11 },
            { device: 'mobile-ios', visitors: 9 },
            { device: 'mobile-android', visitors: 4 },
            { device: 'bot', visitors: 1 }
          ],
          countries: [
            { country: 'RO', visitors: 19 },
            { country: 'US', visitors: 2 },
            { country: 'Unknown', visitors: 1 },
            { country: 'AT', visitors: 1 },
            { country: 'MD', visitors: 1 }
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [days]);

  return { data, loading, error };
};
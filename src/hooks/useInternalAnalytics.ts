import { useEffect, useCallback } from 'react';
import { useLocation } from '@/lib/router-compat';
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';

const postTrack = (payload: Record<string, unknown>) => {
  void fetch('/api/public/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch((err) => console.error('[Analytics] track error:', err));
};

const SESSION_KEY = 'mva_session_id';
let trackedPath = '';
let trackedPathStartTime = Date.now();

const getSessionId = () => {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
};

const getDeviceType = () => {
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
};

const getBrowser = () => {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  return 'Other';
};

export const useInternalAnalytics = () => {
  const location = useLocation();
  const { trackPageView, trackEvent: trackGA4 } = useGoogleAnalytics();
  const isAdmin = location.pathname.startsWith('/admin');

  useEffect(() => {
    if (trackedPath === location.pathname) return;

    const sessionId = getSessionId();

    // Update duration for previous page
    if (trackedPath) {
      const duration = Math.round((Date.now() - trackedPathStartTime) / 1000);
      postTrack({
        type: 'duration',
        session_id: sessionId,
        page_path: trackedPath,
        duration_seconds: duration,
      });
    }

    trackedPathStartTime = Date.now();
    trackedPath = location.pathname;

    // Track pageview in GA4 (skip admin)
    if (!isAdmin) {
      trackPageView(document.title, location.pathname);
    }

    // Track pageview in Supabase (all pages for internal dashboard)
    const params = new URLSearchParams(window.location.search);
    postTrack({
      type: 'pageview',
      session_id: sessionId,
      page_path: location.pathname,
      page_title: document.title,
      referrer: document.referrer || '',
      utm_source: params.get('utm_source') || '',
      utm_medium: params.get('utm_medium') || '',
      device_type: getDeviceType(),
      browser: getBrowser(),
    });
  }, [location.pathname]);

  const trackEvent = useCallback((eventType: string, eventData?: Record<string, any>) => {
    // GA4 - skip admin
    if (!location.pathname.startsWith('/admin')) {
      trackGA4(eventType, 'engagement', eventData ? JSON.stringify(eventData) : undefined);
    }

    // Supabase - always track
    postTrack({
      type: 'event',
      session_id: getSessionId(),
      event_type: eventType,
      event_data: eventData || {},
      page_path: location.pathname,
    });
  }, [location.pathname, trackGA4]);

  return { trackEvent };
};

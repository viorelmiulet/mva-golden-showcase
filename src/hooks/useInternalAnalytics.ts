import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';
import { supabase } from '@/integrations/supabase/client';

const SESSION_KEY = 'mva_session_id';

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
  const prevPath = useRef('');
  const startTime = useRef(Date.now());

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) return;
    if (prevPath.current === location.pathname) return;

    const sessionId = getSessionId();

    // Update duration for previous page
    if (prevPath.current) {
      const duration = Math.round((Date.now() - startTime.current) / 1000);
      supabase.from('page_views').update({ duration_seconds: duration })
        .eq('session_id', sessionId)
        .eq('page_path', prevPath.current)
        .order('created_at', { ascending: false })
        .limit(1)
        .then(() => {});
    }

    startTime.current = Date.now();
    prevPath.current = location.pathname;

    // Track pageview in GA4
    trackPageView(document.title, location.pathname);

    // Track pageview in Supabase
    const params = new URLSearchParams(window.location.search);
    supabase.from('page_views').insert({
      session_id: sessionId,
      page_path: location.pathname,
      page_title: document.title,
      referrer: document.referrer || null,
      utm_source: params.get('utm_source') || null,
      utm_medium: params.get('utm_medium') || null,
      device_type: getDeviceType(),
      browser: getBrowser(),
      duration_seconds: 0,
    }).then(() => {});
  }, [location.pathname]);

  const trackEvent = useCallback((eventType: string, eventData?: Record<string, any>) => {
    if (location.pathname.startsWith('/admin')) return;

    // GA4
    trackGA4(eventType, 'engagement', eventData ? JSON.stringify(eventData) : undefined);

    // Supabase
    supabase.from('events').insert({
      session_id: getSessionId(),
      event_type: eventType,
      event_data: eventData || {},
      page_path: location.pathname,
    }).then(() => {});
  }, [location.pathname, trackGA4]);

  return { trackEvent };
};

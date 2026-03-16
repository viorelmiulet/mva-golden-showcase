import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

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
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  return 'Other';
};

const trackUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track`;

const track = async (payload: object) => {
  try {
    await fetch(trackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // Silent fail - analytics should never break the app
  }
};

export const useInternalAnalytics = () => {
  const location = useLocation();
  const startTime = useRef(Date.now());
  const prevPath = useRef('');

  useEffect(() => {
    // Skip admin routes from tracking
    if (location.pathname.startsWith('/admin')) return;

    const sessionId = getSessionId();

    // Track duration on previous page
    if (prevPath.current && !prevPath.current.startsWith('/admin')) {
      const duration = Math.round((Date.now() - startTime.current) / 1000);
      if (duration > 0) {
        track({
          type: 'duration',
          session_id: sessionId,
          page_path: prevPath.current,
          duration_seconds: duration,
        });
      }
    }

    startTime.current = Date.now();
    prevPath.current = location.pathname;

    // Track pageview
    const params = new URLSearchParams(window.location.search);
    track({
      type: 'pageview',
      session_id: sessionId,
      page_path: location.pathname,
      page_title: document.title,
      referrer: document.referrer,
      utm_source: params.get('utm_source') || '',
      utm_medium: params.get('utm_medium') || '',
      device_type: getDeviceType(),
      browser: getBrowser(),
    });
  }, [location.pathname]);

  const trackEvent = useCallback((eventType: string, eventData?: object) => {
    if (location.pathname.startsWith('/admin')) return;
    track({
      type: 'event',
      session_id: getSessionId(),
      page_path: location.pathname,
      event_type: eventType,
      event_data: eventData || {},
    });
  }, [location.pathname]);

  return { trackEvent };
};

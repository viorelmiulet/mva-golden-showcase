import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';

/**
 * Hook that automatically tracks page views and provides event tracking via GA4.
 * Must be used inside a Router context.
 */
export const useInternalAnalytics = () => {
  const location = useLocation();
  const { trackPageView, trackEvent } = useGoogleAnalytics();
  const prevPath = useRef('');

  useEffect(() => {
    // Skip admin routes
    if (location.pathname.startsWith('/admin')) return;

    // Avoid duplicate tracking on same path
    if (prevPath.current === location.pathname) return;
    prevPath.current = location.pathname;

    // Track pageview via GA4
    trackPageView(document.title, location.pathname);
  }, [location.pathname]);

  const trackGA4Event = useCallback((eventType: string, eventData?: Record<string, any>) => {
    if (location.pathname.startsWith('/admin')) return;
    trackEvent(eventType, 'engagement', eventData ? JSON.stringify(eventData) : undefined);
  }, [location.pathname, trackEvent]);

  return { trackEvent: trackGA4Event };
};

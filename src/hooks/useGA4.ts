import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useGA4 = () => {
  const location = useLocation();

  useEffect(() => {
    // Don't track admin routes in GA4
    if (location.pathname.startsWith('/admin')) return;

    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'page_view', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: location.pathname,
      });
    }
  }, [location.pathname]);

  const trackContact = (method: string) => {
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'contact', {
        method,
        page_path: window.location.pathname,
      });
    }
  };

  const trackPropertyView = (propertyId: string, propertyName: string, projectName: string) => {
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'view_item', {
        item_id: propertyId,
        item_name: propertyName,
        item_category: projectName,
      });
    }
  };

  const trackSearch = (searchTerm: string) => {
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'search', {
        search_term: searchTerm,
      });
    }
  };

  return { trackContact, trackPropertyView, trackSearch };
};

/**
 * Hook pentru Plausible Analytics - Event Tracking
 * Oferă funcții pentru tracking evenimente personalizate
 */

declare global {
  interface Window {
    plausible?: (eventName: string, options?: { props?: Record<string, string | number | boolean> }) => void;
  }
}

type ContactMethod = 'phone' | 'whatsapp' | 'email' | 'form';
type PropertyAction = 'view' | 'click_details' | 'favorite' | 'share' | 'schedule_viewing' | 'click_storia';
type ComplexAction = 'view' | 'click_details' | 'favorite' | 'filter';

export const usePlausible = () => {
  /**
   * Trimite un eveniment custom către Plausible
   */
  const trackEvent = (eventName: string, props?: Record<string, string | number | boolean>) => {
    if (typeof window !== 'undefined' && window.plausible) {
      window.plausible(eventName, { props });
      console.log(`📊 Plausible event: ${eventName}`, props);
    } else {
      console.warn('Plausible not loaded, event not tracked:', eventName);
    }
  };

  /**
   * Trackează click-uri pe butoane de contact
   */
  const trackContact = (method: ContactMethod, source: string, propertyId?: string) => {
    trackEvent('Contact', {
      method,
      source,
      ...(propertyId && { property_id: propertyId })
    });
  };

  /**
   * Trackează vizualizări și interacțiuni cu proprietăți
   */
  const trackProperty = (action: PropertyAction, propertyId: string, propertyTitle?: string) => {
    trackEvent('Property', {
      action,
      property_id: propertyId,
      ...(propertyTitle && { property_title: propertyTitle })
    });
  };

  /**
   * Trackează vizualizări și interacțiuni cu complexe rezidențiale
   */
  const trackComplex = (action: ComplexAction, complexId: string, complexName?: string) => {
    trackEvent('Complex', {
      action,
      complex_id: complexId,
      ...(complexName && { complex_name: complexName })
    });
  };

  /**
   * Trackează utilizarea calculatorului de credit
   */
  const trackMortgageCalculator = (price: number, downPayment: number, years: number) => {
    trackEvent('MortgageCalculator', {
      price: Math.round(price),
      down_payment: Math.round(downPayment),
      loan_years: years
    });
  };

  /**
   * Trackează programări vizionări
   */
  const trackViewingScheduled = (propertyId: string, propertyTitle: string) => {
    trackEvent('ViewingScheduled', {
      property_id: propertyId,
      property_title: propertyTitle
    });
  };

  /**
   * Trackează utilizarea chat-ului AI
   */
  const trackChat = (action: 'open' | 'message_sent' | 'close') => {
    trackEvent('Chat', { action });
  };

  /**
   * Trackează căutări și filtrări
   */
  const trackSearch = (filters: { rooms?: number; priceMin?: number; priceMax?: number; location?: string }) => {
    trackEvent('Search', {
      ...(filters.rooms && { rooms: filters.rooms }),
      ...(filters.priceMin && { price_min: filters.priceMin }),
      ...(filters.priceMax && { price_max: filters.priceMax }),
      ...(filters.location && { location: filters.location })
    });
  };

  /**
   * Trackează acțiuni de colaborare/parteneriat
   */
  const trackCollaboration = (action: 'form_open' | 'form_submit' | 'form_success') => {
    trackEvent('Collaboration', { action });
  };

  /**
   * Trackează descărcări (PDF-uri, planuri de etaj, etc.)
   */
  const trackDownload = (type: 'floor_plan' | 'brochure' | 'price_list', itemId: string) => {
    trackEvent('Download', { type, item_id: itemId });
  };

  return {
    trackEvent,
    trackContact,
    trackProperty,
    trackComplex,
    trackMortgageCalculator,
    trackViewingScheduled,
    trackChat,
    trackSearch,
    trackCollaboration,
    trackDownload
  };
};

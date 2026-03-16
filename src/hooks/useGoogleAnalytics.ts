import { useEffect } from 'react';

// Declare gtag function for TypeScript
declare global {
  interface Window {
    dataLayer?: any[];
    gtag: (command: string, ...args: any[]) => void;
  }
}

/**
 * Hook pentru Google Analytics 4
 * Oferă funcții pentru tracking evenimente și configurare
 */
export const useGoogleAnalytics = () => {
  
  /**
   * Trimite un eveniment către Google Analytics
   * @param action - Acțiunea executată (ex: 'click', 'view', 'submit')
   * @param category - Categoria evenimentului (ex: 'engagement', 'ecommerce')  
   * @param label - Eticheta evenimentului (opțional)
   * @param value - Valoarea numerică a evenimentului (opțional)
   */
  const trackEvent = (
    action: string, 
    category: string, 
    label?: string, 
    value?: number
  ) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
      });
    }
  };

  /**
   * Trimite un eveniment pentru vizualizarea unei pagini
   * @param pageTitle - Titlul paginii
   * @param pagePath - Path-ul paginii
   */
  const trackPageView = (pageTitle: string, pagePath: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', 'G-HLZFTKHC80', {
        page_title: pageTitle,
        page_location: window.location.href,
        page_path: pagePath,
      });
    }
  };

  /**
   * Trackează contactul cu agenția (telefon, WhatsApp, email)
   * @param method - Metoda de contact ('phone', 'whatsapp', 'email', 'form')
   * @param source - Sursa contactului (ex: 'header', 'footer', 'property_card')
   */
  const trackContact = (method: 'phone' | 'whatsapp' | 'email' | 'form', source: string) => {
    trackEvent('contact', 'engagement', `${method}_${source}`);
  };

  /**
   * Trackează interacțiunea cu o proprietate
   * @param propertyId - ID-ul proprietății
   * @param action - Acțiunea ('view', 'click_details', 'click_storia')
   */
  const trackPropertyInteraction = (propertyId: string, action: string) => {
    trackEvent(action, 'property', `property_${propertyId}`);
  };

  /**
   * Trackează utilizarea chat-ului
   * @param action - Acțiunea ('open', 'message_sent', 'close')
   */
  const trackChatUsage = (action: string) => {
    trackEvent(action, 'chat', 'assistant_interaction');
  };

  /**
   * Testează dacă Google Analytics este activ și funcționează
   */
  const testGoogleAnalytics = () => {
    if (typeof window !== 'undefined') {
      console.log('🔍 Testing Google Analytics...');
      
      // Verifică dacă gtag este disponibil
      if (window.gtag) {
        console.log('✅ gtag function is available');
        
        // Trimite un eveniment de test
        window.gtag('event', 'test_event', {
          event_category: 'testing',
          event_label: 'analytics_test',
          value: 1
        });
        
        console.log('📊 Test event sent to GA4: G-HLZFTKHC80');
        console.log('💡 Verifică în GA4 Real-Time reports pentru evenimentul "test_event"');
        
        return true;
      } else {
        console.warn('❌ gtag function not available - GA4 may not be loaded');
        return false;
      }
    }
    return false;
  };

  return {
    trackEvent,
    trackPageView,
    trackContact,
    trackPropertyInteraction,
    trackChatUsage,
    testGoogleAnalytics,
  };
};

/**
 * Hook pentru tracking automatizat al vizualizărilor de pagină
 * Se folosește în componente pentru tracking automat
 */
export const usePageTracking = (pageTitle: string, pagePath: string) => {
  const { trackPageView } = useGoogleAnalytics();
  
  useEffect(() => {
    trackPageView(pageTitle, pagePath);
  }, [pageTitle, pagePath, trackPageView]);
};
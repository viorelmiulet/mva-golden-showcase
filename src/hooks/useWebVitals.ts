import { useEffect } from 'react';

/**
 * Hook for reporting Core Web Vitals metrics
 * Sends metrics to Google Analytics for monitoring
 */
export const useWebVitals = () => {
  useEffect(() => {
    const reportWebVitals = async () => {
      try {
        const { onCLS, onFCP, onLCP, onTTFB, onINP } = await import('web-vitals');

        const sendToAnalytics = (metric: { name: string; value: number; id: string }) => {
          // Send to Google Analytics
          if (typeof window !== 'undefined' && 'gtag' in window) {
            (window as any).gtag('event', metric.name, {
              event_category: 'Web Vitals',
              event_label: metric.id,
              value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
              non_interaction: true,
            });
          }

          // Log to console in development
          if (import.meta.env.DEV) {
            console.log(`[Web Vitals] ${metric.name}:`, metric.value);
          }
        };

        // Core Web Vitals (2024 metrics)
        onCLS(sendToAnalytics);   // Cumulative Layout Shift
        onLCP(sendToAnalytics);   // Largest Contentful Paint
        onINP(sendToAnalytics);   // Interaction to Next Paint
        
        // Additional metrics
        onFCP(sendToAnalytics);   // First Contentful Paint
        onTTFB(sendToAnalytics);  // Time to First Byte
      } catch (error) {
        // web-vitals not available
        console.warn('Web Vitals not available:', error);
      }
    };

    // Only run on client and after hydration
    if (typeof window !== 'undefined') {
      // Delay to not interfere with initial load
      if ('requestIdleCallback' in window) {
        (window as Window).requestIdleCallback(() => reportWebVitals());
      } else {
        setTimeout(reportWebVitals, 2000);
      }
    }
  }, []);
};

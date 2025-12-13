import { useEffect, useCallback } from 'react';

// Preload functions for critical routes
const preloadMap = {
  properties: () => import('@/pages/Properties'),
  propertyDetail: () => import('@/pages/PropertyDetail'),
  complexe: () => import('@/pages/Complexe'),
  complexDetail: () => import('@/pages/ComplexDetail'),
  calculatorCredit: () => import('@/pages/CalculatorCredit'),
  whyChooseUs: () => import('@/pages/WhyChooseUs'),
  faq: () => import('@/pages/FAQ'),
};

type PreloadKey = keyof typeof preloadMap;

// Track which modules have been preloaded
const preloadedModules = new Set<string>();

export const usePrefetch = () => {
  const prefetch = useCallback((key: PreloadKey) => {
    if (preloadedModules.has(key)) return;
    
    preloadedModules.add(key);
    preloadMap[key]();
  }, []);

  const prefetchOnHover = useCallback((key: PreloadKey) => {
    return {
      onMouseEnter: () => prefetch(key),
      onFocus: () => prefetch(key),
    };
  }, [prefetch]);

  return { prefetch, prefetchOnHover };
};

// Preload critical routes after initial render
export const usePreloadCriticalRoutes = () => {
  useEffect(() => {
    // Wait for idle time to preload critical routes
    const preloadCritical = () => {
      // Most likely navigation paths from homepage
      const criticalRoutes: PreloadKey[] = ['properties', 'complexe', 'calculatorCredit'];
      
      criticalRoutes.forEach((route, index) => {
        // Stagger preloading to avoid blocking
        setTimeout(() => {
          if (!preloadedModules.has(route)) {
            preloadedModules.add(route);
            preloadMap[route]();
          }
        }, 1000 + (index * 500));
      });
    };

    // Use requestIdleCallback if available, otherwise setTimeout
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(preloadCritical, { timeout: 3000 });
    } else {
      setTimeout(preloadCritical, 2000);
    }
  }, []);
};

// Prefetch based on intersection observer (for link visibility)
export const usePrefetchOnVisible = (key: PreloadKey, ref: React.RefObject<HTMLElement>) => {
  useEffect(() => {
    if (!ref.current || preloadedModules.has(key)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !preloadedModules.has(key)) {
            preloadedModules.add(key);
            preloadMap[key]();
            observer.disconnect();
          }
        });
      },
      { rootMargin: '100px' }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [key, ref]);
};

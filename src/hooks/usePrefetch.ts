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

// Preload critical routes after initial render - optimized for INP
export const usePreloadCriticalRoutes = () => {
  useEffect(() => {
    // Wait for idle time to preload critical routes
    const preloadCritical = () => {
      // Most likely navigation paths from homepage
      const criticalRoutes: PreloadKey[] = ['properties', 'complexe', 'calculatorCredit'];
      
      criticalRoutes.forEach((route, index) => {
        // Stagger preloading to avoid blocking main thread
        setTimeout(() => {
          if (!preloadedModules.has(route)) {
            preloadedModules.add(route);
            preloadMap[route]();
          }
        }, 2000 + (index * 1000)); // Increased delay for better INP
      });
    };

    // Use requestIdleCallback if available, otherwise setTimeout
    if ('requestIdleCallback' in window) {
      (window as Window).requestIdleCallback(preloadCritical, { timeout: 5000 });
    } else {
      setTimeout(preloadCritical, 3000);
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
      { rootMargin: '200px' } // Increased margin for earlier preload
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [key, ref]);
};

// Preload image for better LCP
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

// Preload multiple images in parallel
export const preloadImages = (srcs: string[]): Promise<void[]> => {
  return Promise.all(srcs.map(preloadImage));
};

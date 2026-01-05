import { useEffect } from 'react';
import { getOptimizedImageUrl } from '@/lib/imageOptimization';

interface PreloadOptions {
  width?: number;
  quality?: number;
  priority?: 'high' | 'low';
}

/**
 * Preload a single image with optional optimization
 */
export const preloadImage = (
  src: string | undefined | null,
  options: PreloadOptions = {}
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!src) {
      resolve();
      return;
    }

    const { width = 800, quality = 80 } = options;
    
    // Use optimized URL for Supabase images
    const optimizedSrc = src.includes('supabase.co/storage')
      ? getOptimizedImageUrl(src, width, quality)
      : src;

    // Check if already in cache
    if (typeof window !== 'undefined' && 'caches' in window) {
      caches.match(optimizedSrc).then(response => {
        if (response) {
          resolve();
          return;
        }
      }).catch(() => {
        // Continue with preload if cache check fails
      });
    }

    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to preload: ${src}`));
    img.src = optimizedSrc;
  });
};

/**
 * Preload multiple images in parallel
 */
export const preloadImages = (
  urls: (string | undefined | null)[],
  options: PreloadOptions = {}
): Promise<void[]> => {
  const validUrls = urls.filter((url): url is string => Boolean(url));
  return Promise.all(validUrls.map(url => preloadImage(url, options)));
};

/**
 * Hook to preload critical images on mount
 * Use for hero images and above-the-fold content
 */
export const useImagePreload = (
  urls: (string | undefined | null)[],
  options: PreloadOptions = {}
) => {
  useEffect(() => {
    const validUrls = urls.filter((url): url is string => Boolean(url));
    
    if (validUrls.length === 0) return;

    // Use requestIdleCallback if available, otherwise setTimeout
    const schedulePreload = () => {
      preloadImages(validUrls, options).catch(err => {
        console.warn('Image preload failed:', err);
      });
    };

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(schedulePreload, { timeout: 100 });
    } else {
      // For browsers without requestIdleCallback, preload immediately
      schedulePreload();
    }
  }, [urls.join(','), options.width, options.quality]);
};

/**
 * Add preload link to document head for critical images
 * This is the most effective method for LCP optimization
 */
export const addPreloadLink = (
  src: string,
  options: PreloadOptions = {}
): HTMLLinkElement | null => {
  if (typeof document === 'undefined') return null;
  
  const { width = 800, quality = 80, priority = 'high' } = options;
  
  // Optimize URL for Supabase images
  const optimizedSrc = src.includes('supabase.co/storage')
    ? getOptimizedImageUrl(src, width, quality)
    : src;

  // Check if preload link already exists
  const existingLink = document.querySelector(`link[href="${optimizedSrc}"]`);
  if (existingLink) return existingLink as HTMLLinkElement;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = optimizedSrc;
  link.fetchPriority = priority;
  
  // Add type hint for WebP
  if (optimizedSrc.includes('format=webp') || optimizedSrc.includes('.webp')) {
    link.type = 'image/webp';
  }

  document.head.appendChild(link);
  return link;
};

/**
 * Hook to add preload links for critical LCP images
 */
export const useCriticalImagePreload = (
  urls: (string | undefined | null)[],
  options: PreloadOptions = {}
) => {
  useEffect(() => {
    const links: HTMLLinkElement[] = [];
    
    urls.forEach(url => {
      if (url) {
        const link = addPreloadLink(url, options);
        if (link) links.push(link);
      }
    });

    // Cleanup on unmount
    return () => {
      links.forEach(link => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      });
    };
  }, [urls.join(','), options.width, options.quality, options.priority]);
};

export default useImagePreload;

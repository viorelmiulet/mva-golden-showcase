import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  getOptimizedImageUrl, 
  generateSrcSet, 
  defaultSrcSetSizes,
  supportsWebP 
} from '@/lib/imageOptimization';

interface UseOptimizedImageOptions {
  src: string;
  width?: number;
  height?: number;
  quality?: number;
  priority?: boolean;
  rootMargin?: string;
  threshold?: number;
  sizes?: number[];
}

interface UseOptimizedImageReturn {
  optimizedSrc: string;
  srcSet: string | undefined;
  isLoaded: boolean;
  isInView: boolean;
  hasError: boolean;
  isSupabaseImage: boolean;
  supportsWebP: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  imgRef: React.RefObject<HTMLImageElement>;
  handleLoad: () => void;
  handleError: () => void;
  blurDataUrl: string;
}

/**
 * Custom hook for optimized image loading with WebP conversion and lazy loading
 * 
 * Features:
 * - Automatic WebP conversion for Supabase images
 * - Lazy loading with IntersectionObserver
 * - Responsive srcset generation
 * - Error handling with fallback
 * - Loading state management
 * - Blur placeholder data URL
 * 
 * @example
 * ```tsx
 * const { optimizedSrc, srcSet, isLoaded, containerRef, imgRef, handleLoad } = useOptimizedImage({
 *   src: imageUrl,
 *   width: 800,
 *   quality: 80
 * });
 * ```
 */
export const useOptimizedImage = ({
  src,
  width,
  height,
  quality = 80,
  priority = false,
  rootMargin = '200px',
  threshold = 0.01,
  sizes = defaultSrcSetSizes,
}: UseOptimizedImageOptions): UseOptimizedImageReturn => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Check if image is from Supabase storage
  const isSupabaseImage = src?.includes('supabase.co/storage') ?? false;

  // Check WebP support
  const webPSupported = supportsWebP();

  // Generate optimized URLs
  const optimizedSrc = isSupabaseImage 
    ? getOptimizedImageUrl(src, width || 1920, quality)
    : src || '';

  const srcSet = isSupabaseImage 
    ? generateSrcSet(src, sizes)
    : undefined;

  // Generate a simple blur placeholder (1x1 gray pixel as base64)
  const blurDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (priority || !containerRef.current) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [priority, rootMargin, threshold]);

  // Reset states when src changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  // Handle successful load
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  // Handle error with fallback to original src
  const handleError = useCallback(() => {
    setHasError(true);
    // Fallback to original src if WebP fails
    if (imgRef.current && isSupabaseImage && src) {
      imgRef.current.src = src;
      imgRef.current.srcset = '';
    }
  }, [isSupabaseImage, src]);

  return {
    optimizedSrc,
    srcSet,
    isLoaded,
    isInView,
    hasError,
    isSupabaseImage,
    supportsWebP: webPSupported,
    containerRef,
    imgRef,
    handleLoad,
    handleError,
    blurDataUrl,
  };
};

/**
 * Preload an image for faster display
 */
export const preloadImage = (src: string, width?: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const optimizedSrc = src?.includes('supabase.co/storage')
      ? getOptimizedImageUrl(src, width || 1920)
      : src;
    
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to preload: ${src}`));
    img.src = optimizedSrc;
  });
};

/**
 * Preload multiple images
 */
export const preloadImages = (urls: string[], width?: number): Promise<void[]> => {
  return Promise.all(urls.map(url => preloadImage(url, width)));
};

export default useOptimizedImage;

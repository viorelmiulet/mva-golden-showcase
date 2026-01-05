import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { getOptimizedImageUrl, generateSrcSet, defaultSrcSetSizes } from '@/lib/imageOptimization';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  onLoad?: () => void;
  sizes?: string;
  quality?: number;
}

/**
 * Optimized Image component with automatic WebP conversion
 * - Lazy loading with IntersectionObserver
 * - Automatic WebP conversion for Supabase images
 * - Responsive srcset generation
 * - Placeholder to prevent CLS
 * - Priority loading for LCP images
 */
const OptimizedImage = ({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  placeholder = 'blur',
  onLoad,
  sizes = '100vw',
  quality = 80,
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if image is from Supabase storage
  const isSupabaseImage = src?.includes('supabase.co/storage');

  // Generate optimized URLs
  const optimizedSrc = isSupabaseImage 
    ? getOptimizedImageUrl(src, width || 1920, quality)
    : src;

  const srcSet = isSupabaseImage 
    ? generateSrcSet(src, defaultSrcSetSizes)
    : undefined;

  useEffect(() => {
    if (priority || !containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '200px', // Start loading 200px before visible
        threshold: 0.01,
      }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    // Fallback to original src if WebP fails
    if (imgRef.current && isSupabaseImage) {
      imgRef.current.src = src;
      imgRef.current.srcset = '';
    }
  };

  const aspectRatio = width && height ? width / height : undefined;

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden',
        !isLoaded && placeholder === 'blur' && 'bg-muted animate-pulse',
        className
      )}
      style={{
        aspectRatio: aspectRatio ? `${width} / ${height}` : undefined,
      }}
    >
      {isInView && (
        <picture>
          {/* WebP source for browsers that support it */}
          {isSupabaseImage && srcSet && (
            <source
              type="image/webp"
              srcSet={srcSet}
              sizes={sizes}
            />
          )}
          <img
            ref={imgRef}
            src={optimizedSrc}
            srcSet={!isSupabaseImage ? undefined : srcSet}
            sizes={sizes}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              'w-full h-full object-cover transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0'
            )}
          />
        </picture>
      )}
      {!isLoaded && placeholder === 'blur' && (
        <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/10" />
      )}
    </div>
  );
};

export default OptimizedImage;

import { cn } from '@/lib/utils';
import { useOptimizedImage } from '@/hooks/useOptimizedImage';
import { Home } from 'lucide-react';

interface OptimizedPropertyImageProps {
  src: string | undefined | null;
  alt: string;
  title?: string;
  className?: string;
  containerClassName?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  showPlaceholder?: boolean;
  aspectRatio?: 'video' | 'square' | '4/3' | '3/2' | 'auto';
}

/**
 * Optimized Property Image component with automatic WebP conversion
 * - Uses useOptimizedImage hook for WebP conversion
 * - Lazy loading with IntersectionObserver
 * - Blur placeholder while loading
 * - Fallback placeholder for missing images
 */
const OptimizedPropertyImage = ({
  src,
  alt,
  title,
  className,
  containerClassName,
  width,
  height,
  priority = false,
  quality = 80,
  sizes = '100vw',
  showPlaceholder = true,
  aspectRatio = 'video',
}: OptimizedPropertyImageProps) => {
  const {
    optimizedSrc,
    srcSet,
    isLoaded,
    isInView,
    hasError,
    isSupabaseImage,
    containerRef,
    imgRef,
    handleLoad,
    handleError,
    blurDataUrl,
  } = useOptimizedImage({
    src: src || '',
    width,
    height,
    quality,
    priority,
  });

  const aspectRatioClass = {
    'video': 'aspect-video',
    'square': 'aspect-square',
    '4/3': 'aspect-[4/3]',
    '3/2': 'aspect-[3/2]',
    'auto': '',
  }[aspectRatio];

  // Show placeholder if no image
  if (!src && showPlaceholder) {
    return (
      <div 
        className={cn(
          'relative overflow-hidden bg-muted flex items-center justify-center',
          aspectRatioClass,
          containerClassName
        )}
      >
        <Home className="w-8 h-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden',
        aspectRatioClass,
        !isLoaded && 'bg-muted animate-pulse',
        containerClassName
      )}
    >
      {isInView && src && (
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
            srcSet={isSupabaseImage ? srcSet : undefined}
            sizes={sizes}
            alt={alt}
            title={title}
            width={width}
            height={height}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              'w-full h-full object-cover transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0',
              className
            )}
          />
        </picture>
      )}
      
      {/* Blur placeholder */}
      {!isLoaded && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/10"
          style={{
            backgroundImage: `url(${blurDataUrl})`,
            backgroundSize: 'cover',
          }}
        />
      )}
    </div>
  );
};

export default OptimizedPropertyImage;

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  onLoad?: () => void;
}

/**
 * Optimized Image component for better Core Web Vitals
 * - Lazy loading with IntersectionObserver
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
  placeholder = 'empty',
  onLoad,
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (priority || !imgRef.current) return;

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

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const aspectRatio = width && height ? width / height : undefined;

  return (
    <div
      ref={imgRef}
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
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={handleLoad}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}
      {!isLoaded && placeholder === 'blur' && (
        <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/10" />
      )}
    </div>
  );
};

export default OptimizedImage;

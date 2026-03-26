import { useState, useRef, useEffect, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Image as ImageIcon,
  Grid3X3,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";

import { getOptimizedImageUrl } from "@/lib/imageOptimization";

// Simplified gallery image component - always renders, uses native lazy loading
interface OptimizedGalleryImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  priority?: boolean;
  width?: number;
  quality?: number;
  sizes?: string;
}

const OptimizedGalleryImage = ({ 
  src, 
  alt, 
  className, 
  style, 
  onLoad, 
  priority = false,
  width,
  quality = 80,
  sizes = '100vw'
}: OptimizedGalleryImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // Check if image is from Supabase storage
  const isSupabaseImage = src?.includes('supabase.co/storage') ?? false;
  
  // Use the original URL directly - no transformations that might break
  // The getOptimizedImageUrl was causing issues with Supabase render endpoint
  const optimizedSrc = src || '';

  const handleImageLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    console.warn('Image failed to load:', src);
  };

  if (!src) {
    return (
      <div className="relative w-full h-full overflow-hidden bg-muted flex items-center justify-center">
        <ImageIcon className="w-8 h-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Blur placeholder with gradient */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted/80 to-muted-foreground/20 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
        </div>
      )}
      
      {hasError ? (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-muted-foreground" />
        </div>
      ) : (
        <img
          src={optimizedSrc}
          alt={alt}
          width={width || 800}
          height={Math.round((width || 800) * 0.667)}
          className={cn(
            className, 
            'transition-all duration-500 ease-out',
            isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.02]'
          )}
          style={style}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          onLoad={handleImageLoad}
          onError={handleError}
        />
      )}
    </div>
  );
};

// Custom hook for responsive image sizing
const useResponsiveImageSize = () => {
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  
  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setScreenSize('mobile');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  
  const imageSizes = useMemo(() => {
    switch (screenSize) {
      case 'mobile':
        return { main: 400, thumbnail: 100, lightbox: 800 };
      case 'tablet':
        return { main: 600, thumbnail: 150, lightbox: 1200 };
      default:
        return { main: 800, thumbnail: 200, lightbox: 1920 };
    }
  }, [screenSize]);
  
  return { screenSize, imageSizes };
};

interface PropertyImageDetails {
  rooms?: number | null;
  zone?: string | null;
  city?: string | null;
  surface?: number | null;
  transactionType?: string | null;
}

interface ApartmentImageGalleryProps {
  images: string[];
  title?: string;
  className?: string;
  propertyDetails?: PropertyImageDetails;
}

export const ApartmentImageGallery = ({ 
  images, 
  title = "Apartament",
  className,
  propertyDetails
}: ApartmentImageGalleryProps) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGridView, setIsGridView] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [imageLoaded, setImageLoaded] = useState<Record<number, boolean>>({});
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);
  const mainImageRef = useRef<HTMLDivElement>(null);
  const { imageSizes, screenSize } = useResponsiveImageSize();
  const preloadedImages = useRef<Set<string>>(new Set());

  // Minimum swipe distance
  const minSwipeDistance = 50;

  const validImages = images?.filter(img => img && img.trim() !== '') || [];

  // Generate descriptive alt text for SEO
  const getImageAlt = (index: number) => {
    const d = propertyDetails;
    const base = d
      ? `Apartament ${d.rooms || ''} camere ${d.transactionType || 'vânzare'} ${d.zone || ''} ${d.city || 'București'}${d.surface ? ` ${d.surface}mp` : ''}`
      : title;
    return index === 0 ? base : `${base} - imagine ${index + 1}`;
  };

  // Preload adjacent images for faster navigation
  useEffect(() => {
    if (!isLightboxOpen || validImages.length === 0) return;

    const imagesToPreload = [
      validImages[(currentIndex + 1) % validImages.length],
      validImages[(currentIndex - 1 + validImages.length) % validImages.length],
      validImages[(currentIndex + 2) % validImages.length],
    ].filter(img => img && !preloadedImages.current.has(img));

    imagesToPreload.forEach(src => {
      if (src) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = getOptimizedImageUrl(src, imageSizes.lightbox, 90);
        document.head.appendChild(link);
        preloadedImages.current.add(src);
        
        // Also load via Image constructor for caching
        const img = new Image();
        img.src = getOptimizedImageUrl(src, imageSizes.lightbox, 90);
      }
    });
  }, [currentIndex, isLightboxOpen, validImages, imageSizes.lightbox]);

  // Preload only the first image on mount (rest use native lazy loading)
  useEffect(() => {
    const first = validImages[0];
    if (first && !preloadedImages.current.has(first)) {
      const img = new Image();
      img.src = getOptimizedImageUrl(first, imageSizes.main, 85);
      preloadedImages.current.add(first);
    }
  }, [validImages, imageSizes.main]);

  useEffect(() => {
    if (!isLightboxOpen) {
      setZoomLevel(1);
      setIsGridView(false);
    }
  }, [isLightboxOpen]);

  // Parallax effect for desktop
  useEffect(() => {
    if (screenSize !== 'desktop') return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!mainImageRef.current) return;
      
      const rect = mainImageRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Calculate distance from center (-1 to 1)
      const x = (e.clientX - centerX) / (rect.width / 2);
      const y = (e.clientY - centerY) / (rect.height / 2);
      
      // Apply subtle parallax (max 15px movement)
      setParallax({
        x: x * 15,
        y: y * 10
      });
    };

    const handleMouseLeave = () => {
      setParallax({ x: 0, y: 0 });
    };

    const element = mainImageRef.current;
    if (element) {
      element.addEventListener('mousemove', handleMouseMove);
      element.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (element) {
        element.removeEventListener('mousemove', handleMouseMove);
        element.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [screenSize]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;
      
      if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      } else if (e.key === "Escape") {
        setIsLightboxOpen(false);
      } else if (e.key === "+" || e.key === "=") {
        handleZoomIn();
      } else if (e.key === "-") {
        handleZoomOut();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, currentIndex]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % validImages.length);
    setZoomLevel(1);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
    setZoomLevel(1);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.5, 1));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setSwipeOffset(0);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);
    
    // Calculate swipe offset for visual feedback
    if (touchStart !== null) {
      const offset = currentTouch - touchStart;
      // Limit offset to prevent excessive movement
      setSwipeOffset(Math.max(-100, Math.min(100, offset)));
    }
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setSwipeOffset(0);
      return;
    }
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
    
    // Reset swipe offset
    setSwipeOffset(0);
  };

  if (validImages.length === 0) {
    return (
      <div className={cn("aspect-video bg-muted rounded-lg flex items-center justify-center", className)}>
        <div className="text-center text-muted-foreground">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Fără imagini</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Gallery Preview - Desktop Optimized */}
      <div className={cn("relative", className)}>
        {/* Desktop Layout: Main + Side Grid */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-2">
          {/* Main Image - Takes 8 columns */}
          <div 
            ref={mainImageRef}
            className="col-span-8 aspect-[16/10] rounded-xl overflow-hidden cursor-pointer relative bg-muted group"
            onClick={() => setIsLightboxOpen(true)}
          >
            <OptimizedGalleryImage
              src={validImages[0]}
              width={imageSizes.main}
              quality={85}
              sizes="(min-width: 1024px) 66vw, 100vw"
              alt={getImageAlt(0)}
              className="w-full h-full object-cover transition-transform duration-500 ease-out"
              style={{
                transform: `translate(${parallax.x}px, ${parallax.y}px) scale(1.05)`,
              }}
              priority={true}
              onLoad={() => setImageLoaded(prev => ({ ...prev, [0]: true }))}
            />
            
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center pointer-events-none">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Maximize2 className="w-10 h-10 text-white drop-shadow-lg" />
              </div>
            </div>

            {/* Image count badge */}
            {validImages.length > 5 && (
              <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
                <ImageIcon className="w-3.5 h-3.5" />
                <span className="font-medium">{validImages.length} imagini</span>
              </div>
            )}
          </div>

          {/* Side Grid - 4 columns, 2x2 layout */}
          <div className="col-span-4 grid grid-cols-2 grid-rows-2 gap-2">
            {validImages.slice(1, 5).map((img, idx) => {
              const isLast = idx === 3 && validImages.length > 5;
              return (
                <button
                  key={idx + 1}
                  onClick={() => {
                    setCurrentIndex(idx + 1);
                    setIsLightboxOpen(true);
                  }}
                  className={cn(
                    "relative w-full h-full overflow-hidden group",
                    idx === 0 && "rounded-tr-xl",
                    idx === 1 && "rounded-tl-none",
                    idx === 2 && "rounded-bl-none",
                    idx === 3 && "rounded-br-xl",
                    "rounded-lg"
                  )}
                >
                  <OptimizedGalleryImage
                    src={img}
                    width={400}
                    quality={75}
                    alt={getImageAlt(idx + 1)}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200" />
                  
                  {/* Show "+N" overlay on last image if more exist */}
                  {isLast && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center group-hover:bg-black/60 transition-colors">
                      <span className="text-white font-semibold text-xl">+{validImages.length - 5}</span>
                    </div>
                  )}
                </button>
              );
            })}

            {/* Fill empty slots */}
            {validImages.length < 5 && Array.from({ length: 5 - Math.max(validImages.length, 1) }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="rounded-lg bg-muted/30 flex items-center justify-center"
              >
                <ImageIcon className="w-6 h-6 text-muted-foreground/40" />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile/Tablet Layout */}
        <div className="lg:hidden">
          {/* Main Image */}
          <div 
            className="aspect-[4/3] rounded-lg overflow-hidden cursor-pointer relative bg-muted group"
            onClick={() => setIsLightboxOpen(true)}
          >
            <OptimizedGalleryImage
              src={validImages[0]}
              width={imageSizes.main}
              quality={85}
              sizes="100vw"
              alt={getImageAlt(0)}
              className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
              priority={true}
              onLoad={() => setImageLoaded(prev => ({ ...prev, [0]: true }))}
            />
            
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Maximize2 className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Image count badge */}
            {validImages.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                {validImages.length}
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {validImages.length > 1 && (
            <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
              {validImages.slice(0, 5).map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setIsLightboxOpen(true);
                  }}
                  className={cn(
                    "flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-md overflow-hidden border-2 transition-all duration-200",
                    "hover:border-primary hover:scale-105",
                    "border-transparent"
                  )}
                >
                  <OptimizedGalleryImage
                    src={img}
                    width={imageSizes.thumbnail}
                    quality={60}
                    alt={getImageAlt(idx)}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
              {validImages.length > 5 && (
                <button
                  onClick={() => {
                    setCurrentIndex(5);
                    setIsGridView(false);
                    setIsLightboxOpen(true);
                  }}
                  className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-md bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors"
                >
                  <span className="text-sm font-medium">+{validImages.length - 5}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox - Fullscreen */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent 
          hideCloseButton
          className="fixed inset-0 max-w-none w-screen p-0 m-0 bg-black border-none rounded-none overflow-hidden z-[100]"
          style={{ 
            transform: 'none', 
            left: 0, 
            top: 0, 
            translate: 'none',
            height: '100dvh',
            maxHeight: '100dvh'
          }}
          aria-describedby={undefined}
        >
          <div className="w-full flex flex-col relative z-10" style={{ height: '100dvh', maxHeight: '100dvh' }}>
            {/* Close Button - Fixed top right, always visible */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsLightboxOpen(false)}
              className="fixed top-3 right-3 sm:top-4 sm:right-4 z-[60] text-white h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 shadow-lg"
              aria-label="Închide galeria"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </Button>

            {/* Header - Counter and controls */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 flex-shrink-0 z-50">
              {/* Title & Counter - Left */}
              <div className="text-white min-w-0 flex-1 pr-12 sm:pr-16">
                <h3 className="font-semibold text-sm sm:text-lg truncate">
                  {title}
                </h3>
                <p className="text-xs sm:text-sm text-white/70">
                  {currentIndex + 1} / {validImages.length}
                </p>
              </div>
              
              {/* Controls - Right (except close) */}
              <div className="hidden sm:flex items-center gap-1 flex-shrink-0 mr-14">
                {/* Zoom Controls */}
                {!isGridView && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleZoomOut}
                      disabled={zoomLevel <= 1}
                      className="text-white hover:bg-white/20 h-10 w-10 rounded-full disabled:opacity-30"
                      aria-label="Micșorează imaginea"
                    >
                      <ZoomOut className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleZoomIn}
                      disabled={zoomLevel >= 3}
                      className="text-white hover:bg-white/20 h-10 w-10 rounded-full disabled:opacity-30"
                      aria-label="Mărește imaginea"
                    >
                      <ZoomIn className="w-5 h-5" />
                    </Button>
                  </>
                )}

                {/* Download Button */}
                {!isGridView && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = validImages[currentIndex];
                      link.download = `${title}-${currentIndex + 1}.jpg`;
                      link.target = '_blank';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="text-white hover:bg-white/20 h-10 w-10 rounded-full"
                    title="Descarcă imaginea"
                    aria-label="Descarcă imaginea"
                  >
                    <Download className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Main Content */}
            {isGridView ? (
              /* Grid View */
              <div className="flex-1 overflow-y-auto px-4 pb-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {validImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentIndex(idx);
                        setIsGridView(false);
                      }}
                      className={cn(
                        "aspect-square rounded-lg overflow-hidden transition-all duration-200",
                        "hover:ring-2 hover:ring-gold hover:scale-[1.02]",
                        currentIndex === idx && "ring-2 ring-gold"
                      )}
                    >
                      <OptimizedGalleryImage
                        src={img}
                        width={300}
                        quality={70}
                        alt={getImageAlt(idx)}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Single Image View */
              <>
                <div 
                  ref={imageRef}
                  className="flex-1 relative overflow-hidden min-h-0"
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                >
                   {/* Navigation Arrows - desktop only */}
                  {validImages.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={goToPrevious}
                        className="hidden sm:flex absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 text-white hover:bg-white/30 h-12 w-12 lg:h-14 lg:w-14 rounded-full bg-black/60 hover:bg-black/80 z-40 shadow-2xl border border-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-110"
                        aria-label="Imaginea anterioară"
                      >
                        <ChevronLeft className="w-7 h-7 lg:w-8 lg:h-8" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={goToNext}
                        className="hidden sm:flex absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 text-white hover:bg-white/30 h-12 w-12 lg:h-14 lg:w-14 rounded-full bg-black/60 hover:bg-black/80 z-40 shadow-2xl border border-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-110"
                        aria-label="Imaginea următoare"
                      >
                        <ChevronRight className="w-7 h-7 lg:w-8 lg:h-8" />
                      </Button>
                    </>
                  )}
                  
                  {/* Image container - uses all available space */}
                  <div 
                    className="w-full h-full flex items-center justify-center px-0 sm:px-16 lg:px-24 py-0 sm:py-4"
                    style={{
                      transform: `translateX(${swipeOffset}px)`,
                      transition: swipeOffset === 0 ? 'transform 0.3s ease-out' : 'none'
                    }}
                  >
                    <img
                      key={currentIndex}
                      src={getOptimizedImageUrl(validImages[currentIndex], imageSizes.lightbox, 90)}
                      alt={`${title} - Imagine ${currentIndex + 1}`}
                      className="max-w-full max-h-full w-auto h-auto object-contain select-none animate-fade-in"
                      style={{ 
                        transform: `scale(${zoomLevel})`,
                        transition: 'transform 0.3s ease-out'
                      }}
                      loading="eager"
                      decoding="async"
                    />
                  </div>
                </div>

                {/* Bottom Thumbnail Strip */}
                {validImages.length > 1 && (
                <div className="flex-shrink-0 py-1.5 pb-4 sm:py-3 sm:pb-6 px-1 sm:px-4">
                    <div className="flex gap-1 sm:gap-2 justify-center overflow-x-auto max-w-full pb-1 px-1">
                      {validImages.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setCurrentIndex(idx);
                            setZoomLevel(1);
                          }}
                          className={cn(
                            "flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-md sm:rounded-lg overflow-hidden border-2 transition-all duration-200 touch-manipulation",
                            currentIndex === idx
                              ? "border-gold scale-105"
                              : "border-white/30 opacity-70 hover:opacity-100"
                          )}
                        >
                          <OptimizedGalleryImage
                            src={img}
                            width={imageSizes.thumbnail}
                            quality={60}
                            alt={getImageAlt(idx)}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

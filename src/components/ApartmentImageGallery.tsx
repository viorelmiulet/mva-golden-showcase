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
import { useOptimizedImage } from "@/hooks/useOptimizedImage";
import { getOptimizedImageUrl } from "@/lib/imageOptimization";

// Optimized image component using the centralized hook
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
  const {
    optimizedSrc,
    srcSet,
    isLoaded,
    isInView,
    isSupabaseImage,
    containerRef,
    imgRef,
    handleLoad: hookHandleLoad,
    handleError,
  } = useOptimizedImage({
    src,
    width,
    quality,
    priority,
  });

  const handleImageLoad = () => {
    hookHandleLoad();
    onLoad?.();
  };

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      {isInView && (
        <picture>
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
            className={cn(
              className, 
              'transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0'
            )}
            style={style}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={priority ? "high" : "auto"}
            onLoad={handleImageLoad}
            onError={handleError}
          />
        </picture>
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

interface ApartmentImageGalleryProps {
  images: string[];
  title?: string;
  className?: string;
}

export const ApartmentImageGallery = ({ 
  images, 
  title = "Apartament",
  className 
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

  // Minimum swipe distance
  const minSwipeDistance = 50;

  const validImages = images?.filter(img => img && img.trim() !== '') || [];

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
        {/* Desktop Layout: Main + Side Thumbnails */}
        <div className="hidden lg:grid lg:grid-cols-4 lg:gap-3">
          {/* Main Image - Takes 3 columns with Parallax */}
          <div 
            ref={mainImageRef}
            className="col-span-3 aspect-[16/10] rounded-xl overflow-hidden cursor-pointer relative bg-muted group"
            onClick={() => setIsLightboxOpen(true)}
          >
            <OptimizedGalleryImage
              src={validImages[0]}
              width={imageSizes.main}
              quality={85}
              sizes="(min-width: 1024px) 75vw, 100vw"
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 ease-out"
              style={{
                transform: `translate(${parallax.x}px, ${parallax.y}px) scale(1.1)`,
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
          </div>

          {/* Side Thumbnails Column */}
          <div className="col-span-1 flex flex-col gap-3">
            {validImages.slice(1, 4).map((img, idx) => (
              <button
                key={idx + 1}
                onClick={() => {
                  setCurrentIndex(idx + 1);
                  setIsLightboxOpen(true);
                }}
                className="relative aspect-[4/3] rounded-lg overflow-hidden group"
              >
                <OptimizedGalleryImage
                  src={img}
                  width={300}
                  quality={70}
                  alt={`${title} - ${idx + 2}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200" />
              </button>
            ))}
            
            {/* Show More Button */}
            {validImages.length > 4 && (
              <button
                onClick={() => {
                  setIsGridView(true);
                  setIsLightboxOpen(true);
                }}
                className="relative aspect-[4/3] rounded-lg overflow-hidden group"
              >
                <OptimizedGalleryImage
                  src={validImages[4]}
                  width={300}
                  quality={70}
                  alt={`${title} - mai multe`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center group-hover:bg-black/70 transition-colors">
                  <span className="text-white font-semibold text-lg">+{validImages.length - 4}</span>
                </div>
              </button>
            )}
            
            {/* Fill empty slots with smaller images if needed */}
            {validImages.length === 2 && (
              <button
                onClick={() => setIsLightboxOpen(true)}
                className="flex-1 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              >
                <ImageIcon className="w-6 h-6" />
              </button>
            )}
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
              alt={title}
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
                    alt={`${title} - ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
              {validImages.length > 5 && (
                <button
                  onClick={() => {
                    setIsGridView(true);
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
          className="fixed inset-0 max-w-none w-screen h-screen h-[100dvh] p-0 m-0 bg-black border-none rounded-none overflow-hidden z-[100]"
          style={{ 
            transform: 'none', 
            left: 0, 
            top: 0, 
            translate: 'none',
            maxHeight: '100dvh'
          }}
          aria-describedby={undefined}
        >
          {/* Blurred Background */}
          <div 
            className="absolute inset-0 bg-cover bg-center scale-110 transition-all duration-500 ease-out"
            style={{ 
              backgroundImage: `url(${validImages[currentIndex]})`,
              filter: 'blur(15px) brightness(0.6)'
            }}
          />
          
          <div className="w-full h-full h-[100dvh] flex flex-col relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 flex-shrink-0 z-50 bg-gradient-to-b from-black/70 via-black/40 to-transparent">
              {/* Title & Counter - Left */}
              <div className="text-white min-w-0 flex-1 pr-2">
                <h3 className="font-semibold text-sm sm:text-lg truncate">
                  {title}
                </h3>
                <p className="text-xs sm:text-sm text-white/70">
                  {currentIndex + 1} / {validImages.length}
                </p>
              </div>
              
              {/* Controls - Right */}
              <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                {/* Grid View Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsGridView(!isGridView)}
                  className={cn(
                    "text-white h-9 w-9 sm:h-10 sm:w-10 rounded-md border transition-colors",
                    isGridView 
                      ? "border-gold bg-gold/10 text-gold" 
                      : "border-white/30 hover:bg-white/10"
                  )}
                >
                  <Grid3X3 className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                
                {/* Zoom Controls - Hidden on mobile */}
                {!isGridView && (
                  <div className="hidden sm:flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleZoomOut}
                      disabled={zoomLevel <= 1}
                      className="text-white hover:bg-white/10 h-10 w-10 disabled:opacity-30"
                    >
                      <ZoomOut className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleZoomIn}
                      disabled={zoomLevel >= 3}
                      className="text-white hover:bg-white/10 h-10 w-10 disabled:opacity-30"
                    >
                      <ZoomIn className="w-5 h-5" />
                    </Button>
                  </div>
                )}

                {/* Download Button - Hidden on mobile */}
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
                    className="hidden sm:flex text-white hover:bg-white/10 h-10 w-10"
                    title="Descarcă imaginea"
                  >
                    <Download className="w-5 h-5" />
                  </Button>
                )}
                
                {/* Close Button - Always visible and prominent on mobile */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsLightboxOpen(false)}
                  className="text-white hover:bg-white/10 h-10 w-10 bg-black/60 rounded-full ml-2 flex-shrink-0"
                >
                  <X className="w-6 h-6" />
                </Button>
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
                        alt={`${title} - ${idx + 1}`}
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
                  className="flex-1 flex items-center justify-center relative overflow-hidden min-h-0"
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                >
                  {/* Floating Close Button for mobile - easy access */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsLightboxOpen(false)}
                    className="absolute top-4 right-4 sm:hidden text-white h-10 w-10 bg-black/70 rounded-full z-30 shadow-lg"
                  >
                    <X className="w-6 h-6" />
                  </Button>

                  {/* Navigation Arrows - hidden on mobile, only visible on desktop */}
                  {validImages.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={goToPrevious}
                        className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12 rounded-full bg-black/60 z-20"
                      >
                        <ChevronLeft className="w-8 h-8" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={goToNext}
                        className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12 rounded-full bg-black/60 z-20"
                      >
                        <ChevronRight className="w-8 h-8" />
                      </Button>
                    </>
                  )}
                  
                  {/* Image container - centered */}
                  <div 
                    className="flex items-center justify-center w-full h-full"
                    style={{
                      transform: `translateX(${swipeOffset}px)`,
                      transition: swipeOffset === 0 ? 'transform 0.3s ease-out' : 'none'
                    }}
                  >
                    <img
                      key={currentIndex}
                      src={getOptimizedImageUrl(validImages[currentIndex], imageSizes.lightbox, 90)}
                      alt={`${title} - Imagine ${currentIndex + 1}`}
                      className="max-w-[92vw] sm:max-w-[85vw] max-h-[55vh] sm:max-h-[75vh] w-auto h-auto object-contain select-none animate-fade-in rounded-lg shadow-2xl"
                      style={{ 
                        transform: `scale(${zoomLevel})`,
                        transition: 'transform 0.3s ease-out'
                      }}
                      loading="eager"
                      decoding="async"
                    />
                  </div>
                  
                  {/* Swipe indicator on mobile */}
                  {validImages.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 sm:hidden flex items-center gap-2 text-white/60 text-xs bg-black/40 px-3 py-1 rounded-full">
                      <ChevronLeft className="w-3 h-3" />
                      <span>Swipe pentru navigare</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  )}
                </div>

                {/* Bottom Thumbnail Strip */}
                {validImages.length > 1 && (
                  <div className="flex-shrink-0 py-2 sm:py-6 pb-4 sm:pb-12 px-2 sm:px-4 bg-gradient-to-t from-black/50 to-transparent">
                    <div className="flex gap-1.5 sm:gap-2 justify-center overflow-x-auto max-w-full pb-1">
                      {validImages.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setCurrentIndex(idx);
                            setZoomLevel(1);
                          }}
                          className={cn(
                            "flex-shrink-0 w-12 h-12 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all duration-200",
                            currentIndex === idx
                              ? "border-gold scale-105"
                              : "border-transparent opacity-70 hover:opacity-100"
                          )}
                        >
                          <OptimizedGalleryImage
                            src={img}
                            width={imageSizes.thumbnail}
                            quality={60}
                            alt={`Thumbnail ${idx + 1}`}
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

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

import { 
  getOptimizedImageUrl, 
  generateSrcSet 
} from "@/lib/imageOptimization";

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
  const [imageLoaded, setImageLoaded] = useState<Record<number, boolean>>({});
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);
  const mainImageRef = useRef<HTMLDivElement>(null);
  const { imageSizes, screenSize } = useResponsiveImageSize();

  // Minimum swipe distance
  const minSwipeDistance = 50;

  const validImages = images?.filter(img => img && img.trim() !== '') || [];
  
  // Memoize optimized image URLs
  const optimizedImages = useMemo(() => ({
    main: validImages.map(img => getOptimizedImageUrl(img, imageSizes.main)),
    thumbnails: validImages.map(img => getOptimizedImageUrl(img, imageSizes.thumbnail, 60)),
    lightbox: validImages.map(img => getOptimizedImageUrl(img, imageSizes.lightbox, 90)),
    grid: validImages.map(img => getOptimizedImageUrl(img, 300, 70))
  }), [validImages, imageSizes]);

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
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
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
            {!imageLoaded[0] && (
              <div className="absolute inset-0 bg-muted animate-pulse" />
            )}
            <img
              src={optimizedImages.main[0]}
              srcSet={`
                ${getOptimizedImageUrl(validImages[0], 600)} 600w,
                ${getOptimizedImageUrl(validImages[0], 900)} 900w,
                ${getOptimizedImageUrl(validImages[0], 1200)} 1200w
              `}
              sizes="(min-width: 1024px) 75vw, 100vw"
              alt={title}
              className={cn(
                "w-full h-full object-cover transition-transform duration-300 ease-out",
                !imageLoaded[0] && "opacity-0"
              )}
              style={{
                transform: `translate(${parallax.x}px, ${parallax.y}px) scale(1.1)`,
              }}
              loading="eager"
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
                <img
                  src={getOptimizedImageUrl(img, 300)}
                  alt={`${title} - ${idx + 2}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  loading="lazy"
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
                <img
                  src={getOptimizedImageUrl(validImages[4], 300)}
                  alt={`${title} - mai multe`}
                  className="w-full h-full object-cover"
                  loading="lazy"
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
            {!imageLoaded[0] && (
              <div className="absolute inset-0 bg-muted animate-pulse" />
            )}
            <img
              src={optimizedImages.main[0]}
              srcSet={`
                ${getOptimizedImageUrl(validImages[0], 400)} 400w,
                ${getOptimizedImageUrl(validImages[0], 600)} 600w,
                ${getOptimizedImageUrl(validImages[0], 800)} 800w
              `}
              sizes="100vw"
              alt={title}
              className={cn(
                "w-full h-full object-cover transition-all duration-500 group-hover:scale-105",
                !imageLoaded[0] && "opacity-0"
              )}
              loading="eager"
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
              {optimizedImages.thumbnails.slice(0, 5).map((img, idx) => (
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
                  <img
                    src={img}
                    alt={`${title} - ${idx + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
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
          className="!fixed !inset-0 !max-w-none !w-screen !h-screen !p-0 !m-0 !translate-x-0 !translate-y-0 !left-0 !top-0 bg-transparent border-none rounded-none [&>button]:hidden data-[state=open]:!slide-in-from-bottom-0 data-[state=open]:!slide-in-from-left-0 overflow-hidden" 
          aria-describedby={undefined}
        >
          {/* Blurred Background */}
          {/* Blurred Background */}
          <div 
            className="absolute inset-0 bg-cover bg-center scale-110 transition-all duration-500 ease-out"
            style={{ 
              backgroundImage: `url(${validImages[currentIndex]})`,
              filter: 'blur(15px) brightness(0.6)'
            }}
          />
          
          <div className="w-full h-full flex flex-col relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 z-10">
              {/* Title & Counter - Left */}
              <div className="text-white">
                <h3 className="font-semibold text-base sm:text-lg">
                  {title}
                </h3>
                <p className="text-sm text-white/70">
                  {currentIndex + 1} / {validImages.length}
                </p>
              </div>
              
              {/* Controls - Right */}
              <div className="flex items-center gap-1">
                {/* Grid View Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsGridView(!isGridView)}
                  className={cn(
                    "text-white h-10 w-10 rounded-md border transition-colors",
                    isGridView 
                      ? "border-gold bg-gold/10 text-gold" 
                      : "border-white/30 hover:bg-white/10"
                  )}
                >
                  <Grid3X3 className="w-5 h-5" />
                </Button>
                
                {/* Zoom Controls */}
                {!isGridView && (
                  <>
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
                    className="text-white hover:bg-white/10 h-10 w-10"
                    title="Descarcă imaginea"
                  >
                    <Download className="w-5 h-5" />
                  </Button>
                )}
                
                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsLightboxOpen(false)}
                  className="text-white hover:bg-white/10 h-10 w-10"
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
                  {optimizedImages.grid.map((img, idx) => (
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
                      <img
                        src={img}
                        alt={`${title} - ${idx + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
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
                  className="flex-1 flex items-center justify-center px-8 relative"
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                >
                  <img
                    key={currentIndex}
                    src={optimizedImages.lightbox[currentIndex]}
                    srcSet={`
                      ${getOptimizedImageUrl(validImages[currentIndex], 800)} 800w,
                      ${getOptimizedImageUrl(validImages[currentIndex], 1200)} 1200w,
                      ${getOptimizedImageUrl(validImages[currentIndex], 1920)} 1920w
                    `}
                    sizes="100vw"
                    alt={`${title} - Imagine ${currentIndex + 1}`}
                    className="max-w-[90vw] max-h-[75vh] object-contain select-none animate-fade-in"
                    style={{ 
                      transform: `scale(${zoomLevel})`,
                      transition: 'transform 0.3s ease-out'
                    }}
                    draggable={false}
                  />

                  {/* Navigation Arrows */}
                  {validImages.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={goToPrevious}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 h-12 w-12 rounded-full"
                      >
                        <ChevronLeft className="w-8 h-8" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={goToNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 h-12 w-12 rounded-full"
                      >
                        <ChevronRight className="w-8 h-8" />
                      </Button>
                    </>
                  )}
                </div>

                {/* Bottom Thumbnail Strip */}
                {validImages.length > 1 && (
                  <div className="flex-shrink-0 py-6 pb-12 px-4">
                    <div className="flex gap-2 justify-center overflow-x-auto max-w-full">
                      {optimizedImages.thumbnails.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setCurrentIndex(idx);
                            setZoomLevel(1);
                          }}
                          className={cn(
                            "flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all duration-200",
                            currentIndex === idx
                              ? "border-gold scale-105"
                              : "border-transparent opacity-70 hover:opacity-100"
                          )}
                        >
                          <img
                            src={img}
                            alt={`Thumbnail ${idx + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
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

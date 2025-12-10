import { useState, useRef, useEffect } from "react";
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
  Grid3X3
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const imageRef = useRef<HTMLDivElement>(null);

  // Minimum swipe distance
  const minSwipeDistance = 50;

  const validImages = images?.filter(img => img && img.trim() !== '') || [];

  useEffect(() => {
    if (!isLightboxOpen) {
      setZoomLevel(1);
      setIsGridView(false);
    }
  }, [isLightboxOpen]);

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
      {/* Gallery Preview */}
      <div className={cn("relative group", className)}>
        {/* Main Image */}
        <div 
          className="aspect-[4/3] rounded-lg overflow-hidden cursor-pointer relative"
          onClick={() => setIsLightboxOpen(true)}
        >
          <img
            src={validImages[0]}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
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

        {/* Thumbnail strip (if more than 1 image) */}
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
                  "flex-shrink-0 w-12 h-12 rounded-md overflow-hidden border-2 transition-all duration-200",
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
                className="flex-shrink-0 w-12 h-12 rounded-md bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                <span className="text-xs font-medium">+{validImages.length - 5}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-[98vw] w-full h-[98vh] p-0 bg-black/98 border-none">
          <div className="relative w-full h-full flex flex-col">
            {/* Header Controls */}
            <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-3 sm:p-4 bg-gradient-to-b from-black/80 to-transparent">
              <div className="text-white">
                <h3 className="font-semibold text-sm sm:text-base truncate max-w-[200px] sm:max-w-none">
                  {title}
                </h3>
                <p className="text-xs text-white/70">
                  {currentIndex + 1} / {validImages.length}
                </p>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Grid View Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsGridView(!isGridView)}
                  className="text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10"
                >
                  <Grid3X3 className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                
                {/* Zoom Controls */}
                {!isGridView && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleZoomOut}
                      disabled={zoomLevel <= 1}
                      className="text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10 disabled:opacity-30"
                    >
                      <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleZoomIn}
                      disabled={zoomLevel >= 3}
                      className="text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10 disabled:opacity-30"
                    >
                      <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                  </>
                )}
                
                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsLightboxOpen(false)}
                  className="text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </Button>
              </div>
            </div>

            {/* Main Content */}
            {isGridView ? (
              /* Grid View */
              <div className="flex-1 overflow-y-auto pt-20 pb-4 px-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                  {validImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentIndex(idx);
                        setIsGridView(false);
                      }}
                      className={cn(
                        "aspect-square rounded-lg overflow-hidden transition-all duration-200",
                        "hover:ring-2 hover:ring-primary hover:scale-[1.02]",
                        currentIndex === idx && "ring-2 ring-primary"
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
              <div 
                ref={imageRef}
                className="flex-1 flex items-center justify-center pt-16 pb-24 px-4 overflow-hidden"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                <img
                  src={validImages[currentIndex]}
                  alt={`${title} - Imagine ${currentIndex + 1}`}
                  className="max-w-full max-h-full object-contain transition-transform duration-300 select-none"
                  style={{ transform: `scale(${zoomLevel})` }}
                  draggable={false}
                />

                {/* Navigation Arrows */}
                {validImages.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={goToPrevious}
                      className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/30"
                    >
                      <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={goToNext}
                      className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/30"
                    >
                      <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Bottom Thumbnail Strip */}
            {!isGridView && validImages.length > 1 && (
              <div className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/80 to-transparent py-4 px-4">
                <div className="flex gap-2 justify-center overflow-x-auto max-w-full pb-2">
                  {validImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentIndex(idx);
                        setZoomLevel(1);
                      }}
                      className={cn(
                        "flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all duration-200",
                        currentIndex === idx
                          ? "border-primary scale-110 shadow-lg shadow-primary/30"
                          : "border-white/30 opacity-60 hover:opacity-100 hover:border-white/60"
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
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

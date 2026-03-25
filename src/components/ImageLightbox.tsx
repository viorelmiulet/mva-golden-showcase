import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface ImageLightboxProps {
  images: string[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
}

export const ImageLightbox = ({ images, isOpen, onClose, initialIndex = 0 }: ImageLightboxProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
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
    if (distance > minSwipeDistance) {
      goToNext();
    } else if (distance < -minSwipeDistance) {
      goToPrevious();
    }
  };

  if (!images || images.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed inset-0 !translate-x-0 !translate-y-0 !top-0 !left-0 max-w-none w-screen h-[100dvh] p-0 m-0 bg-black border-none rounded-none z-[200] overflow-hidden [&>button]:hidden" aria-describedby={undefined}>
        <VisuallyHidden>
          <DialogTitle>Galerie imagini</DialogTitle>
        </VisuallyHidden>
        
        <div className="relative flex flex-col h-[100dvh] w-full overflow-hidden">
          {/* Close Button - Fixed top right */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="fixed top-3 right-3 sm:top-4 sm:right-4 z-[60] text-white h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 shadow-lg"
            aria-label="Închide imaginea"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>

          {/* Counter - Top left */}
          <div className="fixed top-3 left-3 sm:top-4 sm:left-4 z-50 text-white text-xs sm:text-sm bg-black/50 px-3 py-2 rounded-full">
            {currentIndex + 1} / {images.length}
          </div>

          {/* Main Image Container */}
          <div 
            className="flex-1 min-h-0 flex items-center justify-center px-2 sm:px-20 py-2 sm:py-4"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Navigation Buttons - desktop only */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPrevious}
                  className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 h-12 w-12 rounded-full bg-black/60"
                  aria-label="Imaginea anterioară"
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNext}
                  className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 h-12 w-12 rounded-full bg-black/60"
                  aria-label="Imaginea următoare"
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>
              </>
            )}

            {/* Main Image */}
            <img
              src={images[currentIndex]}
              alt={`Imagine ${currentIndex + 1} din ${images.length}`}
              className="max-w-full max-h-full w-auto h-auto object-contain"
              loading="eager"
            />
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex-shrink-0 py-2 pb-3 sm:py-3 sm:pb-6 px-2 sm:px-4">
              <div className="flex gap-1.5 sm:gap-2 justify-start sm:justify-center overflow-x-auto max-w-full scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`flex-shrink-0 w-11 h-11 sm:w-16 sm:h-16 rounded-md sm:rounded-lg overflow-hidden border-2 transition-all touch-manipulation ${
                      currentIndex === idx
                        ? "border-gold scale-110"
                        : "border-white/30 opacity-70 hover:opacity-100"
                    }`}
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
  );
};

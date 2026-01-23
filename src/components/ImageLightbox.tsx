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

  if (!images || images.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed inset-0 max-w-none w-screen h-screen p-0 m-0 bg-black border-none rounded-none z-[100] [&>button]:hidden" aria-describedby={undefined}>
        <VisuallyHidden>
          <DialogTitle>Galerie imagini</DialogTitle>
        </VisuallyHidden>
        
        <div className="relative flex flex-col h-full w-full">
          {/* Close Button - Fixed top right */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="fixed top-4 right-4 z-[60] text-white h-12 w-12 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 shadow-lg"
          >
            <X className="w-6 h-6" />
          </Button>

          {/* Counter - Top left */}
          <div className="fixed top-4 left-4 z-50 text-white text-sm bg-black/50 px-3 py-2 rounded-full">
            {currentIndex + 1} / {images.length}
          </div>

          {/* Main Image Container */}
          <div className="flex-1 flex items-center justify-center px-12 sm:px-20 py-16">
            {/* Navigation Buttons */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPrevious}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/50 touch-manipulation"
                >
                  <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNext}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/50 touch-manipulation"
                >
                  <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
                </Button>
              </>
            )}

            {/* Main Image */}
            <img
              src={images[currentIndex]}
              alt={`Imagine ${currentIndex + 1} din ${images.length}`}
              className="max-w-full max-h-[65vh] sm:max-h-[75vh] w-auto h-auto object-contain rounded-lg shadow-2xl animate-fade-in"
              loading="eager"
            />
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex-shrink-0 py-3 pb-8 px-2 sm:px-4">
              <div className="flex gap-2 justify-center overflow-x-auto max-w-full">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all touch-manipulation ${
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

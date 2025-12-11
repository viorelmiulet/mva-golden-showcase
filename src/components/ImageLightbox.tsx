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
      <DialogContent className="max-w-5xl w-[95vw] p-0 bg-black/95 border-none [&>button]:hidden" aria-describedby={undefined}>
        <VisuallyHidden>
          <DialogTitle>Galerie imagini</DialogTitle>
        </VisuallyHidden>
        
        <div className="relative flex flex-col">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-2 right-2 z-50 text-white hover:bg-white/20 h-10 w-10 rounded-full"
          >
            <X className="w-6 h-6" />
          </Button>

          {/* Main Image Container */}
          <div className="relative flex items-center justify-center bg-black min-h-[50vh] max-h-[70vh]">
            {/* Previous Button */}
            {images.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPrevious}
                className="absolute left-2 z-50 text-white hover:bg-white/20 h-12 w-12 rounded-full"
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
            )}

            <img
              src={images[currentIndex]}
              alt={`Imagine ${currentIndex + 1} din ${images.length}`}
              className="max-w-full max-h-[70vh] object-contain animate-fade-in"
              loading="eager"
            />

            {/* Next Button */}
            {images.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={goToNext}
                className="absolute right-2 z-50 text-white hover:bg-white/20 h-12 w-12 rounded-full"
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            )}
          </div>

          {/* Bottom Section: Counter + Thumbnails */}
          <div className="bg-black/80 py-3 px-4">
            {/* Image Counter */}
            <div className="text-center text-white text-sm mb-2">
              {currentIndex + 1} / {images.length}
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex gap-2 justify-center overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
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
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

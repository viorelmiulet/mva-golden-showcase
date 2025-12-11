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
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 bg-transparent border-none [&>button]:hidden fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" aria-describedby={undefined}>
        <VisuallyHidden>
          <DialogTitle>Galerie imagini</DialogTitle>
        </VisuallyHidden>
        
        <div className="relative flex flex-col items-center">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute -top-12 right-0 z-50 text-white hover:bg-white/20 h-10 w-10 rounded-full"
          >
            <X className="w-6 h-6" />
          </Button>

          {/* Navigation Buttons */}
          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevious}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-14 z-50 text-white hover:bg-white/20 h-12 w-12 rounded-full"
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
          )}

          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-14 z-50 text-white hover:bg-white/20 h-12 w-12 rounded-full"
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          )}

          {/* Main Image */}
          <img
            src={images[currentIndex]}
            alt={`Imagine ${currentIndex + 1} din ${images.length}`}
            className="max-w-[85vw] max-h-[75vh] object-contain rounded-lg shadow-2xl animate-fade-in"
            loading="eager"
          />

          {/* Counter */}
          <div className="mt-4 text-white text-sm bg-black/60 px-4 py-2 rounded-full">
            {currentIndex + 1} / {images.length}
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 justify-center overflow-x-auto max-w-[85vw] bg-black/40 p-2 rounded-lg">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`flex-shrink-0 w-12 h-12 rounded-md overflow-hidden border-2 transition-all ${
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
      </DialogContent>
    </Dialog>
  );
};

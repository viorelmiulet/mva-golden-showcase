import { useState, useRef, useCallback, useEffect } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ZoomableFloorPlanProps {
  src: string;
  alt: string;
}

export const ZoomableFloorPlan = ({ src, alt }: ZoomableFloorPlanProps) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [lastDistance, setLastDistance] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const minScale = 0.5;
  const maxScale = 4;

  const handleReset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev * 1.3, maxScale));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev / 1.3, minScale));
  }, []);

  // Calculate distance between two touch points
  const getDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Touch handlers for pinch-to-zoom and pan
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      setLastDistance(getDistance(e.touches));
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      setStartPos({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  }, [position, scale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastDistance !== null) {
      e.preventDefault();
      const newDistance = getDistance(e.touches);
      const scaleFactor = newDistance / lastDistance;
      
      setScale(prev => {
        const newScale = prev * scaleFactor;
        return Math.min(Math.max(newScale, minScale), maxScale);
      });
      
      setLastDistance(newDistance);
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      const newX = e.touches[0].clientX - startPos.x;
      const newY = e.touches[0].clientY - startPos.y;
      
      // Limit panning based on scale
      const container = containerRef.current;
      const image = imageRef.current;
      if (container && image) {
        const maxX = (image.offsetWidth * scale - container.offsetWidth) / 2;
        const maxY = (image.offsetHeight * scale - container.offsetHeight) / 2;
        
        setPosition({
          x: Math.min(Math.max(newX, -maxX), maxX),
          y: Math.min(Math.max(newY, -maxY), maxY)
        });
      }
    }
  }, [isDragging, lastDistance, scale, startPos]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setLastDistance(null);
  }, []);

  // Mouse handlers for desktop
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setStartPos({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  }, [position, scale]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    
    const newX = e.clientX - startPos.x;
    const newY = e.clientY - startPos.y;
    
    const container = containerRef.current;
    const image = imageRef.current;
    if (container && image) {
      const maxX = (image.offsetWidth * scale - container.offsetWidth) / 2;
      const maxY = (image.offsetHeight * scale - container.offsetHeight) / 2;
      
      setPosition({
        x: Math.min(Math.max(newX, -maxX), maxX),
        y: Math.min(Math.max(newY, -maxY), maxY)
      });
    }
  }, [isDragging, scale, startPos]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle wheel zoom on desktop
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.min(Math.max(prev * delta, minScale), maxScale));
  }, []);

  // Reset position when scale goes back to 1
  useEffect(() => {
    if (scale <= 1) {
      setPosition({ x: 0, y: 0 });
    }
  }, [scale]);

  return (
    <div className="relative w-full">
      {/* Zoom controls */}
      <div className="absolute top-2 right-2 z-10 flex gap-1 sm:gap-2">
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 sm:h-9 sm:w-9 bg-background/90 backdrop-blur-sm shadow-md"
          onClick={handleZoomOut}
          aria-label="Micșorează schița"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 sm:h-9 sm:w-9 bg-background/90 backdrop-blur-sm shadow-md"
          onClick={handleZoomIn}
          aria-label="Mărește schița"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 sm:h-9 sm:w-9 bg-background/90 backdrop-blur-sm shadow-md"
          onClick={handleReset}
          aria-label="Resetează zoom-ul"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Zoom indicator */}
      {scale !== 1 && (
        <div className="absolute bottom-2 left-2 z-10 px-2 py-1 bg-background/90 backdrop-blur-sm rounded text-xs font-medium shadow-md">
          {Math.round(scale * 100)}%
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-2 right-2 z-10 px-2 py-1 bg-background/90 backdrop-blur-sm rounded text-[10px] sm:text-xs text-muted-foreground shadow-md">
        <span className="hidden sm:inline">Scroll pentru zoom • Trage pentru pan</span>
        <span className="sm:hidden">Ciupește pentru zoom • Trage pentru pan</span>
      </div>

      {/* Image container */}
      <div
        ref={containerRef}
        className="w-full max-h-[60vh] sm:max-h-[70vh] overflow-hidden bg-muted/30 rounded-lg cursor-grab active:cursor-grabbing touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          className="w-full h-auto object-contain max-h-[60vh] sm:max-h-[70vh] select-none transition-transform duration-100"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transformOrigin: 'center center'
          }}
          draggable={false}
        />
      </div>
    </div>
  );
};

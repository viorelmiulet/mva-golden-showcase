import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Loader2, Image as ImageIcon, GripVertical, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Download } from "lucide-react";

interface RentalImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
}

const RentalImageUpload = ({ images, onChange }: RentalImageUploadProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setZoomLevel(1);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setZoomLevel(1);
  };

  const goToNext = () => {
    setLightboxIndex((prev) => (prev + 1) % images.length);
    setZoomLevel(1);
  };

  const goToPrevious = () => {
    setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
    setZoomLevel(1);
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.5, 1));
  const handleZoomReset = () => setZoomLevel(1);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = images[lightboxIndex];
    link.download = `imagine-${lightboxIndex + 1}.jpg`;
    link.click();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && zoomLevel === 1) {
      goToNext();
    } else if (isRightSwipe && zoomLevel === 1) {
      goToPrevious();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (!file.type.startsWith("image/")) {
          toast({
            title: "Eroare",
            description: `${file.name} nu este o imagine validă`,
            variant: "destructive",
          });
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "Eroare",
            description: `${file.name} depășește 5MB`,
            variant: "destructive",
          });
          continue;
        }

        const fileExt = file.name.split(".").pop();
        const fileName = `rental-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `rentals/${fileName}`;

        const { data, error: uploadError } = await supabase.storage
          .from("project-images")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast({
            title: "Eroare upload",
            description: typeof uploadError.message === 'string' ? uploadError.message : "Eroare la încărcarea imaginii",
            variant: "destructive",
          });
          continue;
        }

        if (!data?.path) {
          console.error("Upload failed: no path returned");
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("project-images")
          .getPublicUrl(filePath);

        newImages.push(publicUrl);
      }

      if (newImages.length > 0) {
        onChange([...images, ...newImages]);
        toast({
          title: "Succes",
          description: `${newImages.length} imagine${newImages.length > 1 ? "i" : ""} încărcată${newImages.length > 1 ? "e" : ""}`,
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Eroare",
        description: "A apărut o eroare la încărcare",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = async (imageUrl: string) => {
    const urlParts = imageUrl.split("/project-images/");
    if (urlParts.length > 1) {
      const filePath = urlParts[1];
      await supabase.storage
        .from("project-images")
        .remove([filePath])
        .catch(() => {});
    }
    onChange(images.filter(img => img !== imageUrl));
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newImages = [...images];
    const [draggedImage] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);
    
    onChange(newImages);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex-1"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Se încarcă...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Încarcă imagini
            </>
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {images.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {images.map((imageUrl, index) => (
            <div
              key={imageUrl}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative group aspect-video transition-all duration-200 ${
                draggedIndex === index ? "opacity-50 scale-95" : ""
              } ${
                dragOverIndex === index && draggedIndex !== index
                  ? "ring-2 ring-primary ring-offset-2"
                  : ""
              }`}
            >
              <img
                src={imageUrl}
                alt={`Imagine ${index + 1}`}
                className="w-full h-full object-cover rounded-md border cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => openLightbox(index)}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
              <div 
                className="absolute top-1 left-1 p-1 bg-background/80 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-move"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <GripVertical className="w-3 h-3 text-muted-foreground" />
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(imageUrl);
                }}
                className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => openLightbox(index)}
                className="absolute bottom-1 right-1 p-1 bg-background/80 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ZoomIn className="w-3 h-3 text-muted-foreground" />
              </button>
              {index === 0 && (
                <span className="absolute bottom-1 left-1 text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                  Principal
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nicio imagine încărcată
          </p>
        </div>
      )}

      {images.length > 1 && (
        <p className="text-xs text-muted-foreground text-center">
          Trage imaginile pentru a le reordona. Click pe imagine pentru mărire.
        </p>
      )}

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={closeLightbox}>
        <DialogContent 
          className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 bg-black/95 border-none [&>button]:text-white [&>button]:hover:bg-white/20"
          aria-describedby={undefined}
        >
          <VisuallyHidden>
            <DialogTitle>Previzualizare imagine</DialogTitle>
          </VisuallyHidden>
          
          <div 
            className="relative flex flex-col items-center justify-center min-h-[50vh] p-4"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Zoom Controls */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 px-3 py-2 rounded-full z-50">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                className="h-8 w-8 text-white hover:bg-white/20"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-white text-sm min-w-[50px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 4}
                className="h-8 w-8 text-white hover:bg-white/20"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomReset}
                className="h-8 w-8 text-white hover:bg-white/20"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                className="h-8 w-8 text-white hover:bg-white/20"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>

            {/* Navigation Buttons */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPrevious}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 h-12 w-12 rounded-full"
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 h-12 w-12 rounded-full"
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>
              </>
            )}

            {/* Main Image */}
            <div className="overflow-auto max-w-full max-h-[70vh] mt-12">
              <img
                src={images[lightboxIndex]}
                alt={`Imagine ${lightboxIndex + 1}`}
                className="max-w-full max-h-[70vh] object-contain transition-transform duration-200"
                style={{ transform: `scale(${zoomLevel})` }}
                draggable={false}
              />
            </div>

            {/* Counter */}
            <div className="mt-4 text-white text-sm bg-black/60 px-4 py-2 rounded-full">
              {lightboxIndex + 1} / {images.length}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 justify-center overflow-x-auto max-w-[90vw] bg-black/40 p-2 rounded-lg">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setLightboxIndex(idx);
                      setZoomLevel(1);
                    }}
                    className={`flex-shrink-0 w-12 h-12 rounded-md overflow-hidden border-2 transition-all ${
                      lightboxIndex === idx
                        ? "border-primary scale-110"
                        : "border-white/30 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RentalImageUpload;

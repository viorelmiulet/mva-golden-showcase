import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useImageValidation } from "@/hooks/useImageValidation";
import {
  Loader2,
  Upload,
  X,
  ImageIcon,
  GripVertical,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  RefreshCw,
  Trash2,
} from "lucide-react";

interface PropertyImageEditorProps {
  images: string[];
  onChange: (images: string[]) => void;
  label?: string;
}

const PropertyImageEditor = ({
  images,
  onChange,
  label = "Imagini Proprietate",
}: PropertyImageEditorProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const { toast } = useToast();
  
  const { 
    isImageValid, 
    isImageLoading, 
    hasInvalidImages, 
    invalidCount,
    getInvalidImages,
    revalidate 
  } = useImageValidation(images);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newImageUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `properties/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("property-images")
          .upload(filePath, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast({
            title: "Eroare la upload",
            description: `Nu am putut încărca ${file.name}`,
            variant: "destructive",
          });
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("property-images")
          .getPublicUrl(filePath);

        if (urlData?.publicUrl) {
          newImageUrls.push(urlData.publicUrl);
        }
      }

      if (newImageUrls.length > 0) {
        onChange([...images, ...newImageUrls]);
        toast({
          title: "Succes!",
          description: `${newImageUrls.length} imagin${newImageUrls.length === 1 ? "e încărcată" : "i încărcate"}`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message || "Eroare la încărcarea imaginilor",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const removeInvalidImages = () => {
    const invalidUrls = getInvalidImages();
    const validImages = images.filter(url => !invalidUrls.includes(url));
    onChange(validImages);
    toast({
      title: "Imagini șterse",
      description: `${invalidUrls.length} imagin${invalidUrls.length === 1 ? "e coruptă ștearsă" : "i corupte șterse"}`,
    });
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    onChange(newImages);
  };

  // Drag and drop handlers
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

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = draggedIndex;
    if (fromIndex !== null && fromIndex !== toIndex) {
      moveImage(fromIndex, toIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const inputId = `property-images-upload-${Math.random().toString(36).substring(7)}`;

  return (
    <div className="space-y-3">
      <Label>{label}</Label>

      {/* Invalid images warning */}
      {hasInvalidImages && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">
              {invalidCount} imagin{invalidCount === 1 ? "e coruptă" : "i corupte"} detectat{invalidCount === 1 ? "ă" : "e"}
            </p>
            <p className="text-xs text-muted-foreground">
              Aceste imagini nu pot fi afișate și trebuie reîncărcate
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={revalidate}
              className="border-destructive/30 hover:bg-destructive/10"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Reverifică
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={removeInvalidImages}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Șterge corupte
            </Button>
          </div>
        </div>
      )}

      {/* Upload button */}
      <div className="flex items-center gap-2">
        <input
          type="file"
          id={inputId}
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById(inputId)?.click()}
          disabled={isUploading}
          className="border-gold/30"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Se încarcă...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Încarcă Imagini
            </>
          )}
        </Button>
        <span className="text-xs text-muted-foreground">
          {images.length} imagin{images.length === 1 ? "e" : "i"} • Trage pentru a reordona
        </span>
      </div>

      {/* Images grid with drag & drop */}
      {images.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {images.map((url, index) => {
            const imageValid = isImageValid(url);
            const imageLoading = isImageLoading(url);
            
            return (
              <div
                key={`${url}-${index}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`relative group cursor-move rounded-lg overflow-hidden border-2 transition-all ${
                  !imageValid && !imageLoading
                    ? "border-destructive bg-destructive/10"
                    : draggedIndex === index
                    ? "opacity-50 border-gold"
                    : dragOverIndex === index
                    ? "border-gold border-dashed"
                    : "border-border hover:border-gold/50"
                }`}
              >
                {imageLoading ? (
                  <div className="w-full h-20 flex items-center justify-center bg-muted">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : !imageValid ? (
                  <div className="w-full h-20 flex flex-col items-center justify-center bg-destructive/10">
                    <AlertTriangle className="w-6 h-6 text-destructive mb-1" />
                    <span className="text-[10px] text-destructive font-medium">Coruptă</span>
                  </div>
                ) : (
                  <img
                    src={url}
                    alt={`Imagine ${index + 1}`}
                    className="w-full h-20 object-cover"
                    draggable={false}
                  />
                )}

                {/* Position indicator */}
                {index === 0 && imageValid && !imageLoading && (
                  <div className="absolute top-1 left-1 bg-gold text-black text-[10px] font-bold px-1.5 py-0.5 rounded">
                    Principal
                  </div>
                )}

                {/* Drag handle indicator */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <GripVertical className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Action buttons */}
                <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => moveImage(index, index - 1)}
                    disabled={index === 0}
                    className="bg-background/90 hover:bg-background text-foreground rounded p-0.5 disabled:opacity-30"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(index, index + 1)}
                    disabled={index === images.length - 1}
                    className="bg-background/90 hover:bg-background text-foreground rounded p-0.5 disabled:opacity-30"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                {/* Index indicator */}
                <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                  {index + 1}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center text-muted-foreground">
          <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nicio imagine încărcată</p>
          <p className="text-xs mt-1">Click pe butonul de mai sus pentru a adăuga imagini</p>
        </div>
      )}
    </div>
  );
};

export default PropertyImageEditor;
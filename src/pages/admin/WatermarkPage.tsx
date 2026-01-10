import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  Upload, 
  Download, 
  Trash2, 
  Image as ImageIcon,
  X,
  Loader2,
  CheckCircle2,
  Stamp
} from "lucide-react";
import JSZip from "jszip";

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  watermarked?: string;
  status: "pending" | "processing" | "done";
}

const DEFAULT_WATERMARK = "/mva-watermark-exact.svg";

export default function WatermarkPage() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [watermarkOpacity, setWatermarkOpacity] = useState([0.3]);
  const [watermarkSize, setWatermarkSize] = useState([25]); // percentage of image width
  const [useCustomWatermark, setUseCustomWatermark] = useState(false);
  const [customWatermark, setCustomWatermark] = useState<string | null>(null);
  const [customWatermarkName, setCustomWatermarkName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith("image/"));
    
    if (imageFiles.length === 0) {
      toast.error("Selectați doar fișiere imagine");
      return;
    }

    const newImages: UploadedImage[] = imageFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      status: "pending" as const
    }));

    setImages(prev => [...prev, ...newImages]);
    toast.success(`${imageFiles.length} imagini adăugate`);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleWatermarkSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selectați un fișier imagine pentru watermark");
      return;
    }

    // Revoke previous custom watermark URL
    if (customWatermark && customWatermark !== DEFAULT_WATERMARK) {
      URL.revokeObjectURL(customWatermark);
    }

    const url = URL.createObjectURL(file);
    setCustomWatermark(url);
    setCustomWatermarkName(file.name);
    setUseCustomWatermark(true);
    toast.success("Watermark personalizat încărcat");

    if (watermarkInputRef.current) {
      watermarkInputRef.current.value = "";
    }
  }, [customWatermark]);

  const clearCustomWatermark = useCallback(() => {
    if (customWatermark && customWatermark !== DEFAULT_WATERMARK) {
      URL.revokeObjectURL(customWatermark);
    }
    setCustomWatermark(null);
    setCustomWatermarkName("");
    setUseCustomWatermark(false);
    toast.info("Watermark personalizat șters");
  }, [customWatermark]);

  const removeImage = useCallback((id: string) => {
    setImages(prev => {
      const image = prev.find(img => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.preview);
        if (image.watermarked) {
          URL.revokeObjectURL(image.watermarked);
        }
      }
      return prev.filter(img => img.id !== id);
    });
  }, []);

  const clearAllImages = useCallback(() => {
    images.forEach(img => {
      URL.revokeObjectURL(img.preview);
      if (img.watermarked) {
        URL.revokeObjectURL(img.watermarked);
      }
    });
    setImages([]);
    toast.info("Toate imaginile au fost șterse");
  }, [images]);

  const applyWatermark = useCallback(async (
    imageFile: File,
    opacity: number,
    sizePercent: number,
    watermarkSrc: string
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        // Load and draw watermark
        const watermark = new Image();
        watermark.crossOrigin = "anonymous";
        
        watermark.onload = () => {
          const wmWidth = (img.width * sizePercent) / 100;
          const wmHeight = (watermark.height / watermark.width) * wmWidth;
          
          // Position watermark in bottom-right corner with padding
          const padding = Math.min(img.width, img.height) * 0.03;
          const x = img.width - wmWidth - padding;
          const y = img.height - wmHeight - padding;
          
          ctx.globalAlpha = opacity;
          ctx.drawImage(watermark, x, y, wmWidth, wmHeight);
          ctx.globalAlpha = 1;
          
          canvas.toBlob(
            blob => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error("Failed to create blob"));
              }
            },
            "image/jpeg",
            0.92
          );
        };
        
        watermark.onerror = () => reject(new Error("Failed to load watermark"));
        watermark.src = watermarkSrc;
      };
      
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(imageFile);
    });
  }, []);

  const processImages = useCallback(async () => {
    if (images.length === 0) {
      toast.error("Adăugați imagini pentru a aplica watermark");
      return;
    }

    const watermarkSrc = useCustomWatermark && customWatermark ? customWatermark : DEFAULT_WATERMARK;

    setIsProcessing(true);
    const opacity = watermarkOpacity[0];
    const size = watermarkSize[0];

    try {
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        
        setImages(prev => prev.map(img => 
          img.id === image.id ? { ...img, status: "processing" as const } : img
        ));

        try {
          const watermarkedBlob = await applyWatermark(image.file, opacity, size, watermarkSrc);
          const watermarkedUrl = URL.createObjectURL(watermarkedBlob);
          
          setImages(prev => prev.map(img => 
            img.id === image.id 
              ? { ...img, watermarked: watermarkedUrl, status: "done" as const } 
              : img
          ));
        } catch (error) {
          console.error("Error processing image:", image.file.name, error);
          toast.error(`Eroare la procesarea: ${image.file.name}`);
        }
      }

      toast.success("Watermark aplicat cu succes!");
    } catch (error) {
      console.error("Error processing images:", error);
      toast.error("Eroare la procesarea imaginilor");
    } finally {
      setIsProcessing(false);
    }
  }, [images, watermarkOpacity, watermarkSize, applyWatermark, useCustomWatermark, customWatermark]);

  const downloadZip = useCallback(async () => {
    const processedImages = images.filter(img => img.watermarked);
    
    if (processedImages.length === 0) {
      toast.error("Nu există imagini procesate pentru descărcare");
      return;
    }

    setIsProcessing(true);
    
    try {
      const zip = new JSZip();
      
      for (const image of processedImages) {
        if (image.watermarked) {
          const response = await fetch(image.watermarked);
          const blob = await response.blob();
          const fileName = image.file.name.replace(/\.[^/.]+$/, "") + "_watermark.jpg";
          zip.file(fileName, blob);
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      
      const link = document.createElement("a");
      link.href = url;
      link.download = `imagini_watermark_${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      toast.success("Arhiva ZIP a fost descărcată");
    } catch (error) {
      console.error("Error creating ZIP:", error);
      toast.error("Eroare la crearea arhivei ZIP");
    } finally {
      setIsProcessing(false);
    }
  }, [images]);

  const processedCount = images.filter(img => img.status === "done").length;
  const currentWatermarkSrc = useCustomWatermark && customWatermark ? customWatermark : DEFAULT_WATERMARK;

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Watermark Imagini</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Adaugă watermark pe imagini și descarcă-le ca arhivă ZIP
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Settings Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Setări Watermark</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Custom Watermark Section */}
            <div className="space-y-3 pb-4 border-b">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Watermark personalizat</Label>
                <Switch
                  checked={useCustomWatermark}
                  onCheckedChange={setUseCustomWatermark}
                  disabled={!customWatermark}
                />
              </div>
              
              {/* Watermark Preview */}
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg border bg-muted/50 flex items-center justify-center overflow-hidden">
                  <img 
                    src={currentWatermarkSrc} 
                    alt="Watermark preview" 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">
                    {useCustomWatermark && customWatermarkName ? customWatermarkName : "MVA Logo (implicit)"}
                  </p>
                  <div className="flex gap-1 mt-1">
                    <Input
                      ref={watermarkInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleWatermarkSelect}
                      className="hidden"
                      id="watermark-upload"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => watermarkInputRef.current?.click()}
                      className="h-7 text-xs"
                    >
                      <Stamp className="h-3 w-3 mr-1" />
                      Încarcă
                    </Button>
                    {customWatermark && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={clearCustomWatermark}
                        className="h-7 text-xs text-destructive hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm">Opacitate: {Math.round(watermarkOpacity[0] * 100)}%</Label>
              <Slider
                value={watermarkOpacity}
                onValueChange={setWatermarkOpacity}
                min={0.1}
                max={1}
                step={0.05}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm">Dimensiune: {watermarkSize[0]}% din lățime</Label>
              <Slider
                value={watermarkSize}
                onValueChange={setWatermarkSize}
                min={10}
                max={50}
                step={5}
                className="w-full"
              />
            </div>

            <div className="pt-2 space-y-2">
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="image-upload"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                Adaugă Imagini
              </Button>

              <Button
                onClick={processImages}
                disabled={images.length === 0 || isProcessing}
                className="w-full bg-gold hover:bg-gold/90 text-black"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ImageIcon className="h-4 w-4 mr-2" />
                )}
                Aplică Watermark
              </Button>

              <Button
                onClick={downloadZip}
                disabled={processedCount === 0 || isProcessing}
                className="w-full"
                variant="default"
              >
                <Download className="h-4 w-4 mr-2" />
                Descarcă ZIP ({processedCount})
              </Button>

              {images.length > 0 && (
                <Button
                  onClick={clearAllImages}
                  variant="destructive"
                  className="w-full"
                  disabled={isProcessing}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Șterge Toate
                </Button>
              )}
            </div>

            {images.length > 0 && (
              <div className="text-sm text-muted-foreground text-center pt-2 border-t">
                {images.length} imagini • {processedCount} procesate
              </div>
            )}
          </CardContent>
        </Card>

        {/* Images Grid */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Imagini</CardTitle>
          </CardHeader>
          <CardContent>
            {images.length === 0 ? (
              <div 
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-gold/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground text-sm">
                  Click pentru a adăuga imagini sau drag & drop
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {images.map(image => (
                  <div 
                    key={image.id} 
                    className="relative group aspect-square rounded-lg overflow-hidden bg-muted"
                  >
                    <img
                      src={image.watermarked || image.preview}
                      alt={image.file.name}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Status overlay */}
                    {image.status === "processing" && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                      </div>
                    )}
                    
                    {image.status === "done" && (
                      <div className="absolute top-2 left-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 drop-shadow-md" />
                      </div>
                    )}
                    
                    {/* Remove button */}
                    <button
                      onClick={() => removeImage(image.id)}
                      className="absolute top-2 right-2 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={isProcessing}
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                    
                    {/* File name */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <p className="text-white text-xs truncate">
                        {image.file.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

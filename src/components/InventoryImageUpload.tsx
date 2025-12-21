import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Camera, Loader2, X, ImagePlus } from "lucide-react";
import { compressImageToFile } from "@/lib/imageOptimization";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface InventoryImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  itemName: string;
}

const InventoryImageUpload = ({ images, onImagesChange, itemName }: InventoryImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (files: FileList) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages: string[] = [];

    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Upload session check:', { hasSession: !!session, userId: session?.user?.id });
      
      if (!session) {
        toast.error('Trebuie să fii autentificat pentru a încărca imagini');
        setUploading(false);
        return;
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} nu este o imagine validă`);
          continue;
        }

        // Compress the image
        const compressedFile = await compressImageToFile(file, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.8,
          format: 'jpeg'
        });

        // Upload to storage - use floor-plans folder which has working policies
        const fileName = `floor-plans/inventory-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        
        console.log('Attempting upload to:', fileName);
        
        const { error: uploadError } = await supabase.storage
          .from('project-images')
          .upload(fileName, compressedFile, {
            cacheControl: '31536000',
            contentType: 'image/jpeg'
          });

        if (uploadError) {
          console.error('Upload error details:', uploadError);
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('project-images')
          .getPublicUrl(fileName);

        newImages.push(publicUrl);
      }

      onImagesChange([...images, ...newImages]);
      toast.success(`${newImages.length} imagine${newImages.length > 1 ? 'i' : ''} adăugată`);
    } catch (error: any) {
      console.error('Error uploading:', error);
      toast.error(`Eroare la încărcare: ${error?.message || 'Eroare necunoscută'}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await processFiles(e.target.files);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    toast.success("Imagine eliminată");
  };

  const openPreview = (url: string) => {
    setSelectedImage(url);
    setPreviewOpen(true);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {images.map((url, index) => (
          <div 
            key={index} 
            className="relative group w-16 h-16 rounded-md overflow-hidden border border-border cursor-pointer"
            onClick={() => openPreview(url)}
          >
            <img 
              src={url} 
              alt={`${itemName} - ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveImage(index);
              }}
              className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        
        {/* Camera button - captures directly from camera on mobile */}
        <label className="w-16 h-16 border-2 border-dashed border-primary/40 rounded-md flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <Camera className="h-5 w-5 text-primary" />
          )}
        </label>
        
        {/* Gallery button - opens file picker / gallery */}
        <label className="w-16 h-16 border-2 border-dashed border-muted-foreground/30 rounded-md flex items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <ImagePlus className="h-5 w-5 text-muted-foreground" />
          )}
        </label>
      </div>

      {/* Image preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{itemName}</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="relative">
              <img 
                src={selectedImage} 
                alt={itemName}
                className="w-full max-h-[60vh] object-contain rounded-lg"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Închide
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryImageUpload;

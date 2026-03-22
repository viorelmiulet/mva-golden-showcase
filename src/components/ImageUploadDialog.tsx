import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, Loader2, X, ImageIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { compressImageToFile } from "@/lib/imageOptimization";

interface ImageUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyIds: string[];
  onSuccess: () => void;
}

const ImageUploadDialog = ({ open, onOpenChange, propertyIds, onSuccess }: ImageUploadDialogProps) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Te rog selectează o imagine validă");
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Te rog selectează o imagine");
      return;
    }

    setUploading(true);
    try {
      // Compress the image before upload
      const compressedFile = await compressImageToFile(selectedFile, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.85,
        format: 'jpeg'
      });

      // Upload to storage
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const filePath = `properties/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(filePath, compressedFile, {
          cacheControl: '31536000',
          contentType: 'image/jpeg'
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('project-images')
        .getPublicUrl(filePath);

      // Update properties with new image
      for (const propertyId of propertyIds) {
        // Get existing images
        const { data: property } = await supabase
          .from('catalog_offers')
          .select('images')
          .eq('id', propertyId)
          .single();

        const existingImages = property?.images || [];
        const newImages = [...existingImages, publicUrl];

        // Update with new image
        const { error: updateError } = await supabase
          .from('catalog_offers')
          .update({ images: newImages })
          .eq('id', propertyId);

        if (updateError) throw updateError;
      }

      toast.success(`Imagine adăugată cu succes la ${propertyIds.length} ${propertyIds.length === 1 ? 'proprietate' : 'proprietăți'}`);
      onSuccess();
      onOpenChange(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error: any) {
      console.error('Error uploading:', error);
      const errorMessage = error?.message || "Eroare necunoscută";
      toast.error(`Eroare la încărcarea imaginii: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      onOpenChange(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Adaugă Imagine
            {propertyIds.length > 1 && (
              <span className="text-sm text-muted-foreground ml-2">
                ({propertyIds.length} proprietăți selectate)
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image-upload">Selectează imagine</Label>
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </div>

          {previewUrl && (
            <div className="relative">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg border-2 border-border"
              />
              {!uploading && (
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                aria-label="Elimină imaginea selectată"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {!previewUrl && (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Nicio imagine selectată
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Anulează
          </Button>
          <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Se încarcă...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Încarcă
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageUploadDialog;

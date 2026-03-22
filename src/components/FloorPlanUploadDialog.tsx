import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, Loader2, X, FileText } from "lucide-react";
import { Label } from "@/components/ui/label";
import { compressImageToFile } from "@/lib/imageOptimization";

interface FloorPlanUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  propertyTitle: string;
  currentFloorPlan?: string;
  onSuccess: () => void;
}

const FloorPlanUploadDialog = ({ 
  open, 
  onOpenChange, 
  propertyId, 
  propertyTitle,
  currentFloorPlan,
  onSuccess 
}: FloorPlanUploadDialogProps) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentFloorPlan || null);

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
      toast.error("Te rog selectează o schiță");
      return;
    }

    setUploading(true);
    try {
      // Compress the image before upload (higher quality for floor plans)
      const compressedFile = await compressImageToFile(selectedFile, {
        maxWidth: 2048,
        maxHeight: 2048,
        quality: 0.9,
        format: 'jpeg'
      });

      // Upload to storage
      const fileName = `floor-plan-${propertyId}-${Date.now()}.jpg`;
      const filePath = `floor-plans/${fileName}`;

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

      // Update property with floor plan using edge function
      const { data, error: updateError } = await supabase.functions.invoke('update-floor-plan', {
        body: {
          propertyId,
          floor_plan: publicUrl
        }
      });

      if (updateError || !data?.success) {
        throw new Error(updateError?.message || data?.error || 'Failed to update property');
      }

      toast.success("Schiță încărcată cu succes");
      onSuccess();
      onOpenChange(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error: any) {
      console.error('Error uploading floor plan:', error);
      const errorMessage = error?.message || "Eroare necunoscută";
      toast.error(`Eroare la încărcarea schiței: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentFloorPlan) return;

    if (!confirm("Sigur vrei să ștergi schița?")) return;

    setUploading(true);
    try {
      // Use edge function to bypass RLS
      const { data, error } = await supabase.functions.invoke('update-floor-plan', {
        body: {
          propertyId,
          floor_plan: null
        }
      });

      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || 'Failed to delete floor plan');
      }

      toast.success("Schiță ștearsă cu succes");
      onSuccess();
      onOpenChange(false);
      setPreviewUrl(null);
    } catch (error: any) {
      console.error('Error deleting floor plan:', error);
      toast.error(`Eroare la ștergerea schiței: ${error?.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      onOpenChange(false);
      setSelectedFile(null);
      setPreviewUrl(currentFloorPlan || null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Schiță - {propertyTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="floor-plan-upload">Selectează schiță</Label>
            <Input
              id="floor-plan-upload"
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
                alt="Schiță"
                className="w-full h-64 object-contain rounded-lg border-2 border-border bg-muted"
              />
              {!uploading && currentFloorPlan && !selectedFile && (
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={handleDelete}
                  aria-label="Șterge schița"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {!previewUrl && (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Nicio schiță selectată
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
                Încarcă Schiță
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FloorPlanUploadDialog;
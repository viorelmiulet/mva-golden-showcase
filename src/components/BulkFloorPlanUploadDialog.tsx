import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, Loader2, X, FileText } from "lucide-react";
import { Label } from "@/components/ui/label";

interface BulkFloorPlanUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyIds: string[];
  onSuccess: () => void;
}

const BulkFloorPlanUploadDialog = ({ 
  open, 
  onOpenChange, 
  propertyIds,
  onSuccess 
}: BulkFloorPlanUploadDialogProps) => {
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
      toast.error("Te rog selectează o schiță");
      return;
    }

    if (propertyIds.length === 0) {
      toast.error("Te rog selectează cel puțin o proprietate");
      return;
    }

    setUploading(true);
    try {
      // Upload to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `bulk-floor-plan-${Date.now()}.${fileExt}`;
      const filePath = `floor-plans/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('project-images')
        .getPublicUrl(filePath);

      // Update all selected properties with the same floor plan
      let successCount = 0;
      let failCount = 0;

      for (const propertyId of propertyIds) {
        try {
          const { data, error } = await supabase.functions.invoke('update-floor-plan', {
            body: {
              propertyId,
              floor_plan: publicUrl
            }
          });

          if (error || !data?.success) {
            console.error(`Failed to update property ${propertyId}:`, error || data?.error);
            failCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          console.error(`Error updating property ${propertyId}:`, err);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Schiță încărcată cu succes la ${successCount} ${successCount === 1 ? 'proprietate' : 'proprietăți'}`);
      }
      if (failCount > 0) {
        toast.error(`Eroare la ${failCount} ${failCount === 1 ? 'proprietate' : 'proprietăți'}`);
      }

      onSuccess();
      onOpenChange(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error: any) {
      console.error('Error uploading bulk floor plan:', error);
      const errorMessage = error?.message || "Eroare necunoscută";
      toast.error(`Eroare la încărcarea schiței: ${errorMessage}`);
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
            Încarcă Schiță pentru Multiple Proprietăți
            <span className="text-sm text-muted-foreground ml-2">
              ({propertyIds.length} proprietăți selectate)
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bulk-floor-plan-upload">Selectează schiță</Label>
            <Input
              id="bulk-floor-plan-upload"
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
              {!uploading && (
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
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

export default BulkFloorPlanUploadDialog;

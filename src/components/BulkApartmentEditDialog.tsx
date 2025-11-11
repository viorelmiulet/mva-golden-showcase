import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface BulkApartmentEditDialogProps {
  apartmentIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const BulkApartmentEditDialog = ({ 
  apartmentIds, 
  open, 
  onOpenChange, 
  onSuccess 
}: BulkApartmentEditDialogProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [enableFields, setEnableFields] = useState({
    surface: false,
    rooms: false,
    priceMin: false,
    priceMax: false,
  });

  const [formData, setFormData] = useState({
    surface_min: 0,
    rooms: 1,
    price_min: 0,
    price_max: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!Object.values(enableFields).some(v => v)) {
      toast.error("Selectează cel puțin un câmp de actualizat");
      return;
    }

    setIsUpdating(true);

    try {
      // Build update object with only enabled fields
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (enableFields.surface) {
        updateData.surface_min = parseInt(String(formData.surface_min)) || 0;
        updateData.surface_max = parseInt(String(formData.surface_min)) || 0;
      }
      if (enableFields.rooms) {
        updateData.rooms = parseInt(String(formData.rooms)) || 1;
      }
      if (enableFields.priceMin) {
        updateData.price_min = parseInt(String(formData.price_min)) || 0;
      }
      if (enableFields.priceMax) {
        updateData.price_max = parseInt(String(formData.price_max)) || 0;
      }

      const { error } = await supabase
        .from('catalog_offers')
        .update(updateData)
        .in('id', apartmentIds);

      if (error) throw error;

      toast.success(`${apartmentIds.length} ${apartmentIds.length === 1 ? 'apartament actualizat' : 'apartamente actualizate'} cu succes`);

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setEnableFields({
        surface: false,
        rooms: false,
        priceMin: false,
        priceMax: false,
      });
    } catch (error: any) {
      toast.error(error.message || "Nu am putut actualiza apartamentele");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Editare Bulk - {apartmentIds.length} {apartmentIds.length === 1 ? 'Apartament' : 'Apartamente'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Selectează câmpurile pe care vrei să le actualizezi pentru toate apartamentele selectate.
          </p>

          {/* Surface */}
          <div className="space-y-2 p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <Checkbox
                id="enable-surface"
                checked={enableFields.surface}
                onCheckedChange={(checked) => 
                  setEnableFields({ ...enableFields, surface: checked as boolean })
                }
              />
              <Label htmlFor="enable-surface" className="cursor-pointer">
                Actualizează Suprafață
              </Label>
            </div>
            {enableFields.surface && (
              <Input
                type="number"
                value={formData.surface_min}
                onChange={(e) => setFormData({ ...formData, surface_min: parseInt(e.target.value) || 0 })}
                placeholder="Suprafață (mp)"
              />
            )}
          </div>

          {/* Rooms */}
          <div className="space-y-2 p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <Checkbox
                id="enable-rooms"
                checked={enableFields.rooms}
                onCheckedChange={(checked) => 
                  setEnableFields({ ...enableFields, rooms: checked as boolean })
                }
              />
              <Label htmlFor="enable-rooms" className="cursor-pointer">
                Actualizează Număr Camere
              </Label>
            </div>
            {enableFields.rooms && (
              <Input
                type="number"
                min="1"
                value={formData.rooms}
                onChange={(e) => setFormData({ ...formData, rooms: parseInt(e.target.value) || 1 })}
                placeholder="Număr camere"
              />
            )}
          </div>

          {/* Price Min */}
          <div className="space-y-2 p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <Checkbox
                id="enable-price-min"
                checked={enableFields.priceMin}
                onCheckedChange={(checked) => 
                  setEnableFields({ ...enableFields, priceMin: checked as boolean })
                }
              />
              <Label htmlFor="enable-price-min" className="cursor-pointer">
                Actualizează Preț Cash
              </Label>
            </div>
            {enableFields.priceMin && (
              <Input
                type="number"
                value={formData.price_min}
                onChange={(e) => setFormData({ ...formData, price_min: parseInt(e.target.value) || 0 })}
                placeholder="Preț Cash (EUR)"
              />
            )}
          </div>

          {/* Price Max */}
          <div className="space-y-2 p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <Checkbox
                id="enable-price-max"
                checked={enableFields.priceMax}
                onCheckedChange={(checked) => 
                  setEnableFields({ ...enableFields, priceMax: checked as boolean })
                }
              />
              <Label htmlFor="enable-price-max" className="cursor-pointer">
                Actualizează Preț Credit
              </Label>
            </div>
            {enableFields.priceMax && (
              <Input
                type="number"
                value={formData.price_max}
                onChange={(e) => setFormData({ ...formData, price_max: parseInt(e.target.value) || 0 })}
                placeholder="Preț Credit (EUR)"
              />
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
              className="flex-1"
            >
              Anulează
            </Button>
            <Button
              type="submit"
              disabled={isUpdating}
              className="flex-1"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvare...
                </>
              ) : (
                'Actualizează Toate'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

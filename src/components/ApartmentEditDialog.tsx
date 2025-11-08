import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ApartmentEditDialogProps {
  apartment: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ApartmentEditDialog = ({ apartment, open, onOpenChange, onSuccess }: ApartmentEditDialogProps) => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [formData, setFormData] = useState({
    title: apartment?.title || '',
    surface_min: apartment?.surface_min || 0,
    rooms: apartment?.rooms || 1,
    price_min: apartment?.price_min || 0,
    price_max: apartment?.price_max || 0,
    availability_status: apartment?.availability_status || 'available',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from('catalog_offers')
        .update({
          title: formData.title,
          surface_min: parseInt(String(formData.surface_min)) || 0,
          surface_max: parseInt(String(formData.surface_min)) || 0,
          rooms: parseInt(String(formData.rooms)) || 1,
          price_min: parseInt(String(formData.price_min)) || 0,
          price_max: parseInt(String(formData.price_max)) || 0,
          availability_status: formData.availability_status,
          updated_at: new Date().toISOString()
        })
        .eq('id', apartment.id);

      if (error) throw error;

      toast({
        title: "Succes!",
        description: "Apartamentul a fost actualizat cu succes."
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message || "Nu am putut actualiza apartamentul.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editează Apartament</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titlu Apartament</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Apartament 1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="surface">Suprafață (mp)</Label>
            <Input
              id="surface"
              type="number"
              value={formData.surface_min}
              onChange={(e) => setFormData({ ...formData, surface_min: parseInt(e.target.value) || 0 })}
              placeholder="50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rooms">Număr Camere</Label>
            <Input
              id="rooms"
              type="number"
              min="1"
              value={formData.rooms}
              onChange={(e) => setFormData({ ...formData, rooms: parseInt(e.target.value) || 1 })}
              placeholder="2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price_min">Preț Cash (EUR)</Label>
            <Input
              id="price_min"
              type="number"
              value={formData.price_min}
              onChange={(e) => setFormData({ ...formData, price_min: parseInt(e.target.value) || 0 })}
              placeholder="50000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price_max">Preț Credit (EUR)</Label>
            <Input
              id="price_max"
              type="number"
              value={formData.price_max}
              onChange={(e) => setFormData({ ...formData, price_max: parseInt(e.target.value) || 0 })}
              placeholder="55000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status Disponibilitate</Label>
            <Select 
              value={formData.availability_status} 
              onValueChange={(value) => setFormData({ ...formData, availability_status: value })}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Selectează status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Disponibil</SelectItem>
                <SelectItem value="reserved">Rezervat</SelectItem>
                <SelectItem value="sold">Vândut</SelectItem>
              </SelectContent>
            </Select>
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
                'Salvează'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

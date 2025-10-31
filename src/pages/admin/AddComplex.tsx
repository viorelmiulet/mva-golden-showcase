import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Building2, ArrowLeft, Upload, X } from "lucide-react";
import { Link } from "react-router-dom";

const AddComplex = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    description: "",
    developer: "",
    price_range: "",
    surface_range: "",
    rooms_range: "",
    completion_date: "",
    status: "available",
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Imaginea nu poate depăși 5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;

    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `complexes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error("Eroare la încărcarea imaginii");
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.location.trim()) {
      toast.error("Numele și locația sunt obligatorii");
      return;
    }

    setIsLoading(true);

    try {
      // Upload image if selected
      const imageUrl = await uploadImage();

      // Create the complex
      const { data, error } = await supabase
        .from('real_estate_projects')
        .insert({
          name: formData.name.trim(),
          location: formData.location.trim(),
          description: formData.description.trim() || null,
          developer: formData.developer.trim() || null,
          price_range: formData.price_range.trim() || null,
          surface_range: formData.surface_range.trim() || null,
          rooms_range: formData.rooms_range.trim() || null,
          completion_date: formData.completion_date.trim() || null,
          status: formData.status,
          main_image: imageUrl,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Complexul a fost adăugat cu succes!");
      navigate(`/admin/complexe/${data.id}`);
    } catch (error) {
      console.error('Error creating complex:', error);
      toast.error("Eroare la crearea complexului");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-3 md:p-6">
      <div className="mb-6">
        <Link to="/admin/complexe">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Înapoi la complexe
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Adaugă Complex Nou
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Imagine Copertă</Label>
              <div className="flex flex-col gap-4">
                {imagePreview ? (
                  <div className="relative w-full h-64 rounded-lg overflow-hidden border">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <Upload className="h-12 w-12 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Click pentru a încărca imagine
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      Max 5MB
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageSelect}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nume Complex *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Renew Residence"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Locație *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Ex: Chiajna, Ilfov"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="developer">Dezvoltator</Label>
                <Input
                  id="developer"
                  value={formData.developer}
                  onChange={(e) => setFormData({ ...formData, developer: e.target.value })}
                  placeholder="Ex: Nordis Group"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="completion_date">Dată Finalizare</Label>
                <Input
                  id="completion_date"
                  value={formData.completion_date}
                  onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
                  placeholder="Ex: Decembrie 2024"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price_range">Interval Preț</Label>
                <Input
                  id="price_range"
                  value={formData.price_range}
                  onChange={(e) => setFormData({ ...formData, price_range: e.target.value })}
                  placeholder="Ex: 65.000 - 120.000 EUR"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="surface_range">Interval Suprafață</Label>
                <Input
                  id="surface_range"
                  value={formData.surface_range}
                  onChange={(e) => setFormData({ ...formData, surface_range: e.target.value })}
                  placeholder="Ex: 45 - 85 mp"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rooms_range">Interval Camere</Label>
                <Input
                  id="rooms_range"
                  value={formData.rooms_range}
                  onChange={(e) => setFormData({ ...formData, rooms_range: e.target.value })}
                  placeholder="Ex: 2-3 camere"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="available">Disponibil</option>
                  <option value="sold_out">Vândut</option>
                  <option value="coming_soon">În Curând</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descriere</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrierea complexului rezidențial..."
                rows={5}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Se creează..." : "Adaugă Complex"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/complexe")}
                disabled={isLoading}
              >
                Anulează
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddComplex;

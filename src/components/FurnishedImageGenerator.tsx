import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Wand2, Download, Loader2, Image } from "lucide-react";

const ROOM_TYPES = [
  { value: "living", label: "Living modern" },
  { value: "bedroom", label: "Dormitor" },
  { value: "kitchen", label: "Bucătărie" },
  { value: "bathroom", label: "Baie" },
  { value: "office", label: "Birou" },
  { value: "dining", label: "Sufragerie" },
  { value: "balcony", label: "Balcon/Terasă" },
  { value: "hallway", label: "Hol" },
];

const STYLES = [
  { value: "modern", label: "Modern" },
  { value: "minimalist", label: "Minimalist" },
  { value: "classic", label: "Clasic" },
  { value: "scandinavian", label: "Scandinav" },
  { value: "industrial", label: "Industrial" },
  { value: "luxury", label: "Luxos" },
];

export const FurnishedImageGenerator = () => {
  const [description, setDescription] = useState("");
  const [roomType, setRoomType] = useState("living");
  const [style, setStyle] = useState("modern");
  const [numberOfImages, setNumberOfImages] = useState("4");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<{ index: number; imageUrl: string; roomType: string }[]>([]);

  const generateImages = async () => {
    if (!description.trim()) {
      toast.error("Vă rugăm să adăugați o descriere");
      return;
    }

    setIsGenerating(true);
    setGeneratedImages([]);

    try {
      toast.info("Generez imaginile... (poate dura câteva minute)");

      const { data, error } = await supabase.functions.invoke('generate-furnished-images', {
        body: {
          description,
          roomType,
          style,
          numberOfImages: parseInt(numberOfImages)
        }
      });

      if (error) throw error;

      if (data?.success && data?.images) {
        setGeneratedImages(data.images);
        toast.success(`${data.totalGenerated} imagini generate cu succes!`);
      } else {
        throw new Error(data?.error || 'Failed to generate images');
      }

    } catch (error) {
      console.error('Error generating images:', error);
      toast.error("Eroare la generarea imaginilor");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `apartament-${index}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Imaginea ${index} descărcată`);
    } catch (error) {
      toast.error(`Eroare la descărcarea imaginii ${index}`);
    }
  };

  const downloadAllImages = async () => {
    for (let i = 0; i < generatedImages.length; i++) {
      await downloadImage(generatedImages[i].imageUrl, i + 1);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="w-5 h-5" />
          Generator Imagini Apartamente
        </CardTitle>
        <CardDescription>
          Generează imagini sugestive pentru anunțuri imobiliare bazate pe descriere
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tip Cameră</label>
              <Select value={roomType} onValueChange={setRoomType} disabled={isGenerating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROOM_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Stil Design</label>
              <Select value={style} onValueChange={setStyle} disabled={isGenerating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STYLES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Număr Imagini</label>
              <Select value={numberOfImages} onValueChange={setNumberOfImages} disabled={isGenerating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 imagine</SelectItem>
                  <SelectItem value="2">2 imagini</SelectItem>
                  <SelectItem value="4">4 imagini</SelectItem>
                  <SelectItem value="6">6 imagini</SelectItem>
                  <SelectItem value="8">8 imagini</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Descriere Apartament
            </label>
            <Textarea
              placeholder="Ex: apartament 3 camere, living spațios cu ferestre mari, bucătărie open-space, 80mp, vedere la parc..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isGenerating}
              rows={4}
            />
          </div>

          <Button 
            onClick={generateImages}
            disabled={!description.trim() || isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generez imagini...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generează Imagini
              </>
            )}
          </Button>
        </div>

        {generatedImages.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Imagini Generate ({generatedImages.length})
              </h3>
              <Button 
                variant="outline" 
                onClick={downloadAllImages}
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Descarcă Toate
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {generatedImages.map((img) => (
                <div key={img.index} className="relative group">
                  <img
                    src={img.imageUrl}
                    alt={`Apartament ${img.index}`}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => downloadImage(img.imageUrl, img.index)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs mt-1 text-center truncate text-muted-foreground">{img.roomType}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Wand2, Download, Loader2 } from "lucide-react";

export const FurnishedImageGenerator = () => {
  const [planFile, setPlanFile] = useState<File | null>(null);
  const [planPreview, setPlanPreview] = useState<string>("");
  const [apartmentDetails, setApartmentDetails] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Vă rugăm să încărcați o imagine");
        return;
      }
      setPlanFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPlanPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPlanToStorage = async (): Promise<string | null> => {
    if (!planFile) return null;

    const fileExt = planFile.name.split('.').pop();
    const fileName = `plan-${Date.now()}.${fileExt}`;
    const filePath = `plans/${fileName}`;

    const { data, error } = await supabase.storage
      .from('project-images')
      .upload(filePath, planFile);

    if (error) {
      console.error('Error uploading plan:', error);
      toast.error("Eroare la încărcarea planului");
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('project-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const generateImages = async () => {
    if (!planFile) {
      toast.error("Vă rugăm să încărcați un plan");
      return;
    }

    setIsGenerating(true);
    setGeneratedImages([]);
    setUploadProgress(0);

    try {
      toast.info("Încarc planul...");
      const planUrl = await uploadPlanToStorage();
      
      if (!planUrl) {
        throw new Error("Failed to upload plan");
      }

      setUploadProgress(20);
      toast.info("Generez imaginile mobilate... (poate dura câteva minute)");

      const { data, error } = await supabase.functions.invoke('generate-furnished-images', {
        body: {
          planImageUrl: planUrl,
          apartmentDetails: apartmentDetails
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
      setUploadProgress(0);
    }
  };

  const downloadImage = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mobilat-${index}.png`;
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
          <Wand2 className="w-5 h-5" />
          Generator Imagini Mobilate
        </CardTitle>
        <CardDescription>
          Încarcă un plan și generează automat 10 imagini de prezentare a apartamentului mobilat
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Plan Apartament</label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isGenerating}
              />
              <Button variant="outline" disabled={!planFile || isGenerating}>
                <Upload className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {planPreview && (
            <div className="border rounded-lg p-4">
              <img 
                src={planPreview} 
                alt="Plan preview" 
                className="max-w-full h-auto max-h-64 mx-auto"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Detalii Apartament (opțional)
            </label>
            <Textarea
              placeholder="Ex: apartament 3 camere, stil modern, 80mp, etaj 2..."
              value={apartmentDetails}
              onChange={(e) => setApartmentDetails(e.target.value)}
              disabled={isGenerating}
              rows={3}
            />
          </div>

          <Button 
            onClick={generateImages}
            disabled={!planFile || isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generez imagini... {uploadProgress > 0 && `${uploadProgress}%`}
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generează 10 Imagini Mobilate
              </>
            )}
          </Button>
        </div>

        {/* Results Section */}
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

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {generatedImages.map((img) => (
                <div key={img.index} className="relative group">
                  <img
                    src={img.imageUrl}
                    alt={`Mobilat ${img.index}`}
                    className="w-full h-32 object-cover rounded-lg"
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
                  <p className="text-xs mt-1 text-center truncate">{img.roomType}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
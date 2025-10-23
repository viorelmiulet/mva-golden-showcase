import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Wand2, Image as ImageIcon, Type, Download, Copy } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const FacebookContentGenerator = () => {
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [properties, setProperties] = useState<any[]>([]);
  const [generatedText, setGeneratedText] = useState("");
  const [generatedImage, setGeneratedImage] = useState("");
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);

  const loadProperties = async () => {
    setIsLoadingProperties(true);
    try {
      const { data, error } = await supabase
        .from('catalog_offers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error loading properties:', error);
      toast.error('Eroare la încărcarea proprietăților');
    } finally {
      setIsLoadingProperties(false);
    }
  };

  const generateText = async () => {
    setIsGeneratingText(true);
    try {
      const propertyData = selectedProperty 
        ? properties.find(p => p.id === selectedProperty)
        : null;

      const { data, error } = await supabase.functions.invoke('generate-facebook-content', {
        body: { 
          type: 'text',
          propertyData: propertyData ? {
            title: propertyData.title,
            location: propertyData.location,
            price: propertyData.price,
            rooms: propertyData.rooms,
            surface: propertyData.surface
          } : null
        }
      });

      if (error) throw error;
      setGeneratedText(data.text);
      toast.success('Text generat cu succes!');
    } catch (error) {
      console.error('Error generating text:', error);
      toast.error('Eroare la generarea textului');
    } finally {
      setIsGeneratingText(false);
    }
  };

  const generateImage = async () => {
    setIsGeneratingImage(true);
    try {
      const propertyData = selectedProperty 
        ? properties.find(p => p.id === selectedProperty)
        : null;

      const { data, error } = await supabase.functions.invoke('generate-facebook-content', {
        body: { 
          type: 'image',
          propertyData: propertyData ? {
            title: propertyData.title,
            location: propertyData.location,
            rooms: propertyData.rooms
          } : null
        }
      });

      if (error) throw error;
      setGeneratedImage(data.image);
      toast.success('Imagine generată cu succes!');
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Eroare la generarea imaginii');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedText);
      toast.success('Text copiat în clipboard!');
    } catch (error) {
      toast.error('Eroare la copierea textului');
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `mva-facebook-promo-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Imagine descărcată!');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          Generator AI pentru Facebook
        </CardTitle>
        <CardDescription>
          Generează conținut promoțional pentru agenția MVA IMOBILIARE
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Property Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Selectează proprietatea (opțional)</label>
          <div className="flex gap-2">
            <Select value={selectedProperty} onValueChange={setSelectedProperty}>
              <SelectTrigger>
                <SelectValue placeholder="Proprietate generică sau selectează una..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Promovare generică MVA</SelectItem>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.title} - {property.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={loadProperties}
              disabled={isLoadingProperties}
            >
              {isLoadingProperties ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Încarcă"
              )}
            </Button>
          </div>
        </div>

        {/* Text Generation */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Text Promoțional</label>
            <Button
              onClick={generateText}
              disabled={isGeneratingText}
              size="sm"
            >
              {isGeneratingText ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generare...
                </>
              ) : (
                <>
                  <Type className="h-4 w-4 mr-2" />
                  Generează Text
                </>
              )}
            </Button>
          </div>
          
          {generatedText && (
            <div className="space-y-2">
              <Textarea
                value={generatedText}
                onChange={(e) => setGeneratedText(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiază Text
              </Button>
            </div>
          )}
        </div>

        {/* Image Generation */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Imagine Promoțională</label>
            <Button
              onClick={generateImage}
              disabled={isGeneratingImage}
              size="sm"
            >
              {isGeneratingImage ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generare...
                </>
              ) : (
                <>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Generează Imagine
                </>
              )}
            </Button>
          </div>
          
          {generatedImage && (
            <div className="space-y-2">
              <div className="relative rounded-lg overflow-hidden border">
                <img
                  src={generatedImage}
                  alt="Generated promotional content"
                  className="w-full h-auto"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadImage}
              >
                <Download className="h-4 w-4 mr-2" />
                Descarcă Imagine
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Wand2, Download, Loader2, Image, Upload, X, Settings2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const ROOM_TYPES = [
  { value: "living", label: "Living modern" },
  { value: "bedroom", label: "Dormitor" },
  { value: "kitchen", label: "Bucătărie" },
  { value: "bathroom", label: "Baie" },
  { value: "office", label: "Birou" },
  { value: "dining", label: "Sufragerie" },
  { value: "balcony", label: "Balcon/Terasă" },
  { value: "hallway", label: "Hol" },
  { value: "exterior", label: "Exterior clădire" },
  { value: "pool", label: "Piscină" },
  { value: "garden", label: "Grădină" },
];

const STYLES = [
  { value: "modern", label: "Modern" },
  { value: "minimalist", label: "Minimalist" },
  { value: "classic", label: "Clasic" },
  { value: "scandinavian", label: "Scandinav" },
  { value: "industrial", label: "Industrial" },
  { value: "luxury", label: "Luxos" },
  { value: "bohemian", label: "Boho" },
  { value: "art_deco", label: "Art Deco" },
  { value: "rustic", label: "Rustic" },
  { value: "coastal", label: "Mediteranean" },
];

const ASPECT_RATIOS = [
  { value: "1:1", label: "1:1 (Pătrat)" },
  { value: "16:9", label: "16:9 (Landscape)" },
  { value: "9:16", label: "9:16 (Portrait/Stories)" },
  { value: "4:3", label: "4:3 (Standard)" },
  { value: "3:2", label: "3:2 (Foto)" },
];

const LIGHTING_OPTIONS = [
  { value: "natural", label: "Lumină naturală" },
  { value: "warm", label: "Caldă (golden hour)" },
  { value: "bright", label: "Luminoasă" },
  { value: "dramatic", label: "Dramatică" },
  { value: "soft", label: "Soft/Difuză" },
  { value: "evening", label: "Seară/Noapte" },
];

const PHOTO_STYLES = [
  { value: "professional", label: "Profesional imobiliar" },
  { value: "magazine", label: "Stil revistă" },
  { value: "cozy", label: "Atmosferă caldă" },
  { value: "staging", label: "Home staging" },
  { value: "3d_render", label: "Render 3D" },
  { value: "architectural", label: "Arhitectural" },
];

const LOGO_POSITIONS = [
  { value: "bottom-right", label: "Dreapta jos" },
  { value: "bottom-left", label: "Stânga jos" },
  { value: "top-right", label: "Dreapta sus" },
  { value: "top-left", label: "Stânga sus" },
  { value: "center", label: "Centru" },
];

export const FurnishedImageGenerator = () => {
  const [description, setDescription] = useState("");
  const [roomType, setRoomType] = useState("living");
  const [style, setStyle] = useState("modern");
  const [numberOfImages, setNumberOfImages] = useState("4");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [lighting, setLighting] = useState("natural");
  const [photoStyle, setPhotoStyle] = useState("professional");
  
  // Logo options
  const [includeLogo, setIncludeLogo] = useState(false);
  const [useCustomLogo, setUseCustomLogo] = useState(false);
  const [customLogoBase64, setCustomLogoBase64] = useState<string | null>(null);
  const [customLogoPreview, setCustomLogoPreview] = useState<string | null>(null);
  const [logoPosition, setLogoPosition] = useState("bottom-right");
  const [logoSize, setLogoSize] = useState("medium");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<{ index: number; imageUrl: string; roomType: string }[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Vă rugăm să încărcați doar imagini");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo-ul trebuie să fie sub 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setCustomLogoBase64(base64);
      setCustomLogoPreview(base64);
      setUseCustomLogo(true);
      toast.success("Logo încărcat cu succes");
    };
    reader.readAsDataURL(file);
  };

  const removeCustomLogo = () => {
    setCustomLogoBase64(null);
    setCustomLogoPreview(null);
    setUseCustomLogo(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
          numberOfImages: parseInt(numberOfImages),
          aspectRatio,
          lighting,
          photoStyle,
          includeLogo,
          useCustomLogo: includeLogo && useCustomLogo,
          customLogoBase64: includeLogo && useCustomLogo ? customLogoBase64 : null,
          logoPosition,
          logoSize
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
      a.download = `apartament-${roomType}-${style}-${index}.png`;
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
          Generează imagini sugestive pentru anunțuri imobiliare cu opțiuni avansate de personalizare
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {/* Basic Options */}
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

          {/* Advanced Options Collapsible */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between" disabled={isGenerating}>
                <span className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4" />
                  Opțiuni Avansate
                </span>
                <span className="text-muted-foreground text-xs">
                  {advancedOpen ? "Ascunde" : "Arată"}
                </span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              {/* Photo Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Aspect Ratio</label>
                  <Select value={aspectRatio} onValueChange={setAspectRatio} disabled={isGenerating}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASPECT_RATIOS.map((ar) => (
                        <SelectItem key={ar.value} value={ar.value}>
                          {ar.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Iluminare</label>
                  <Select value={lighting} onValueChange={setLighting} disabled={isGenerating}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LIGHTING_OPTIONS.map((l) => (
                        <SelectItem key={l.value} value={l.value}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Stil Foto</label>
                  <Select value={photoStyle} onValueChange={setPhotoStyle} disabled={isGenerating}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PHOTO_STYLES.map((ps) => (
                        <SelectItem key={ps.value} value={ps.value}>
                          {ps.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Logo Section */}
              <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="include-logo" className="text-sm font-medium">
                      Adaugă Logo pe Imagini
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Logo-ul va fi aplicat pe toate imaginile generate
                    </p>
                  </div>
                  <Switch
                    id="include-logo"
                    checked={includeLogo}
                    onCheckedChange={setIncludeLogo}
                    disabled={isGenerating}
                  />
                </div>

                {includeLogo && (
                  <div className="space-y-4 pt-2 border-t">
                    {/* Logo Type Selection */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="default-logo"
                          name="logo-type"
                          checked={!useCustomLogo}
                          onChange={() => setUseCustomLogo(false)}
                          disabled={isGenerating}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="default-logo" className="text-sm cursor-pointer">
                          Logo MVA Imobiliare
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="custom-logo"
                          name="logo-type"
                          checked={useCustomLogo}
                          onChange={() => setUseCustomLogo(true)}
                          disabled={isGenerating}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="custom-logo" className="text-sm cursor-pointer">
                          Logo personalizat
                        </Label>
                      </div>
                    </div>

                    {/* Custom Logo Upload */}
                    {useCustomLogo && (
                      <div className="space-y-2">
                        <Label className="text-sm">Încarcă Logo</Label>
                        <div className="flex items-center gap-3">
                          <Input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            disabled={isGenerating}
                            className="max-w-xs"
                          />
                          {customLogoPreview && (
                            <div className="relative">
                              <img
                                src={customLogoPreview}
                                alt="Custom logo preview"
                                className="h-12 w-auto rounded border bg-white p-1"
                              />
                              <button
                                onClick={removeCustomLogo}
                                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
                                disabled={isGenerating}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Format: PNG, JPG, WebP. Max 2MB. Recomandat: fundal transparent.
                        </p>
                      </div>
                    )}

                    {/* Logo Position & Size */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm">Poziție Logo</Label>
                        <Select value={logoPosition} onValueChange={setLogoPosition} disabled={isGenerating}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LOGO_POSITIONS.map((pos) => (
                              <SelectItem key={pos.value} value={pos.value}>
                                {pos.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm">Mărime Logo</Label>
                        <Select value={logoSize} onValueChange={setLogoSize} disabled={isGenerating}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Mic</SelectItem>
                            <SelectItem value="medium">Mediu</SelectItem>
                            <SelectItem value="large">Mare</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Description */}
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

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Wand2, Image as ImageIcon, Type, Download, Copy, Facebook, Instagram, Linkedin, Twitter, Share2, Send, ImagePlus, Check, FolderOpen, Zap } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { postToSocialMedia, getConfiguredPlatforms, postBulkToZapier } from "@/lib/socialDirectPost";

interface GalleryImage {
  name: string;
  url: string;
  createdAt: string;
}

type Platform = "facebook" | "instagram" | "linkedin" | "twitter" | "tiktok";

interface PlatformConfig {
  id: Platform;
  name: string;
  icon: React.ElementType;
  color: string;
  maxLength: number;
  hashtags: boolean;
  description: string;
  aspectRatio: string;
}

const platforms: PlatformConfig[] = [
  {
    id: "facebook",
    name: "Facebook",
    icon: Facebook,
    color: "text-blue-500",
    maxLength: 500,
    hashtags: true,
    description: "Postări pentru Facebook cu text detaliat și hashtag-uri",
    aspectRatio: "1:1 sau 16:9"
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    color: "text-pink-500",
    maxLength: 2200,
    hashtags: true,
    description: "Postări pentru Instagram cu descriere captivantă și multe hashtag-uri",
    aspectRatio: "1:1 sau 4:5"
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Linkedin,
    color: "text-blue-600",
    maxLength: 700,
    hashtags: true,
    description: "Conținut profesional pentru LinkedIn",
    aspectRatio: "1.91:1"
  },
  {
    id: "twitter",
    name: "X (Twitter)",
    icon: Twitter,
    color: "text-foreground",
    maxLength: 280,
    hashtags: true,
    description: "Tweet-uri scurte și captivante",
    aspectRatio: "16:9"
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: Share2,
    color: "text-pink-400",
    maxLength: 300,
    hashtags: true,
    description: "Descrieri pentru videoclipuri TikTok",
    aspectRatio: "9:16"
  }
];

export const SocialMediaContentGenerator = () => {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("facebook");
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [properties, setProperties] = useState<any[]>([]);
  const [generatedTexts, setGeneratedTexts] = useState<Record<Platform, string>>({
    facebook: "",
    instagram: "",
    linkedin: "",
    twitter: "",
    tiktok: ""
  });
  const [generatedImages, setGeneratedImages] = useState<Record<Platform, string>>({
    facebook: "",
    instagram: "",
    linkedin: "",
    twitter: "",
    tiktok: ""
  });
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<Platform | null>(null);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [configuredPlatforms, setConfiguredPlatforms] = useState<string[]>([]);
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [isBulkSending, setIsBulkSending] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ platform: string; current: number; total: number } | null>(null);
  const [bulkSendDialogOpen, setBulkSendDialogOpen] = useState(false);
  const [selectedImagesForBulk, setSelectedImagesForBulk] = useState<string[]>([]);

  useEffect(() => {
    loadProperties();
    loadConfiguredPlatforms();
  }, []);

  useEffect(() => {
    if (postDialogOpen) {
      loadGalleryImages();
    }
  }, [postDialogOpen]);

  const loadConfiguredPlatforms = async () => {
    const platforms = await getConfiguredPlatforms();
    setConfiguredPlatforms(platforms);
  };

  const loadGalleryImages = async () => {
    setIsLoadingGallery(true);
    try {
      const { data, error } = await supabase.storage
        .from('virtual-staging')
        .list('generated-images', {
          limit: 50,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;

      const images = await Promise.all(
        (data || []).map(async (file) => {
          const { data: urlData } = supabase.storage
            .from('virtual-staging')
            .getPublicUrl(`generated-images/${file.name}`);
          
          return {
            name: file.name,
            url: urlData.publicUrl,
            createdAt: file.created_at || new Date().toISOString()
          };
        })
      );

      setGalleryImages(images);
    } catch (error) {
      console.error('Error loading gallery images:', error);
    } finally {
      setIsLoadingGallery(false);
    }
  };

  const toggleGalleryImage = (url: string) => {
    if (imageUrls.includes(url)) {
      setImageUrls(imageUrls.filter(u => u !== url));
    } else {
      setImageUrls([...imageUrls, url]);
    }
  };

  const addImageUrl = () => {
    if (newImageUrl.trim() && !imageUrls.includes(newImageUrl.trim())) {
      setImageUrls([...imageUrls, newImageUrl.trim()]);
      setNewImageUrl("");
    }
  };

  const removeImageUrl = (url: string) => {
    setImageUrls(imageUrls.filter(u => u !== url));
  };

  const postToWebhook = async () => {
    const text = generatedTexts[selectedPlatform];
    if (!text.trim()) {
      toast.error("Nu există text pentru postare");
      return;
    }

    if (!configuredPlatforms.includes(selectedPlatform)) {
      toast.error(`Webhook-ul pentru ${platforms.find(p => p.id === selectedPlatform)?.name} nu este configurat`);
      return;
    }

    setIsPosting(true);
    try {
      const success = await postToSocialMedia({
        text,
        imageUrls,
        platform: selectedPlatform
      });

      if (success) {
        toast.success(`Conținut trimis către ${platforms.find(p => p.id === selectedPlatform)?.name}!`);
        setPostDialogOpen(false);
        setImageUrls([]);
      } else {
        toast.error("Nu s-a putut posta conținutul");
      }
    } catch (error) {
      console.error('Error posting:', error);
      toast.error("Eroare la postare");
    } finally {
    setIsPosting(false);
    }
  };

  const sendAllToZapier = async () => {
    const hasContent = Object.values(generatedTexts).some(text => text.trim());
    if (!hasContent) {
      toast.error("Nu există conținut generat pentru trimitere");
      return;
    }

    if (configuredPlatforms.length === 0) {
      toast.error("Nu ai configurat niciun webhook. Mergi la setările Social Media.");
      return;
    }

    setIsBulkSending(true);
    setBulkProgress({ platform: '', current: 0, total: configuredPlatforms.length });

    try {
      const results = await postBulkToZapier(
        {
          texts: generatedTexts,
          imageUrls: selectedImagesForBulk,
        },
        (platform, current, total) => {
          setBulkProgress({ platform, current, total });
        }
      );

      const successPlatforms = Object.entries(results)
        .filter(([_, success]) => success)
        .map(([platform]) => platforms.find(p => p.id === platform)?.name || platform);
      
      const failedPlatforms = Object.entries(results)
        .filter(([_, success]) => !success)
        .map(([platform]) => platforms.find(p => p.id === platform)?.name || platform);

      if (successPlatforms.length > 0) {
        toast.success(`Trimis cu succes către: ${successPlatforms.join(', ')}`);
      }
      if (failedPlatforms.length > 0) {
        toast.error(`Eroare la: ${failedPlatforms.join(', ')}`);
      }

      setBulkSendDialogOpen(false);
      setSelectedImagesForBulk([]);
    } catch (error) {
      console.error('Error sending to Zapier:', error);
      toast.error("Eroare la trimitere");
    } finally {
      setIsBulkSending(false);
      setBulkProgress(null);
    }
  };

  const toggleBulkImage = (url: string) => {
    if (selectedImagesForBulk.includes(url)) {
      setSelectedImagesForBulk(selectedImagesForBulk.filter(u => u !== url));
    } else {
      setSelectedImagesForBulk([...selectedImagesForBulk, url]);
    }
  };

  const loadGalleryForBulk = async () => {
    if (galleryImages.length === 0) {
      await loadGalleryImages();
    }
  };

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

  const getPlatformPrompt = (platform: Platform, propertyData: any | null) => {
    const baseInfo = propertyData 
      ? `Proprietate: ${propertyData.title}, Locație: ${propertyData.location}, Preț: ${propertyData.price_min || propertyData.price_max} EUR, Camere: ${propertyData.rooms}, Suprafață: ${propertyData.surface_min || propertyData.surface_max} mp`
      : "Promovare generală agenție imobiliară MVA IMOBILIARE din România, specializată în vânzări apartamente noi direct de la dezvoltator";

    const platformPrompts: Record<Platform, string> = {
      facebook: `Creează o postare captivantă pentru Facebook pentru o agenție imobiliară. ${baseInfo}. Folosește emoji-uri, un ton prietenos și profesional. Adaugă 3-5 hashtag-uri relevante la final. Max 500 caractere.`,
      instagram: `Creează o descriere pentru Instagram pentru o agenție imobiliară. ${baseInfo}. Folosește emoji-uri, ton aspirațional și vizual. IMPORTANT: Adaugă 20-30 hashtag-uri populare în imobiliare România la final. Max 2200 caractere.`,
      linkedin: `Creează o postare profesională pentru LinkedIn pentru o agenție imobiliară. ${baseInfo}. Ton profesional, focus pe investiție și oportunitate. Adaugă 3-5 hashtag-uri profesionale. Max 700 caractere.`,
      twitter: `Creează un tweet scurt și captivant pentru o agenție imobiliară. ${baseInfo}. Concis, cu impact, include call-to-action. Adaugă 2-3 hashtag-uri. Max 280 caractere.`,
      tiktok: `Creează o descriere pentru TikTok pentru un video imobiliar. ${baseInfo}. Gen Z friendly, trending, energic. Adaugă 5-10 hashtag-uri populare. Max 300 caractere.`
    };

    return platformPrompts[platform];
  };

  const generateText = async (platform: Platform) => {
    setIsGeneratingText(true);
    try {
      const isGeneric = !selectedProperty || selectedProperty === 'generic';
      const propertyData = isGeneric 
        ? null
        : properties.find(p => p.id === selectedProperty);

      const prompt = getPlatformPrompt(platform, propertyData);

      const { data, error } = await supabase.functions.invoke('generate-facebook-content', {
        body: { 
          type: 'text',
          customPrompt: prompt,
          propertyData: propertyData ? {
            title: propertyData.title,
            location: propertyData.location,
            price: propertyData.price_min || propertyData.price_max,
            rooms: propertyData.rooms,
            surface: propertyData.surface_min || propertyData.surface_max
          } : null
        }
      });

      if (error) throw error;
      
      setGeneratedTexts(prev => ({
        ...prev,
        [platform]: data.text
      }));
      toast.success(`Text pentru ${platforms.find(p => p.id === platform)?.name} generat cu succes!`);
    } catch (error) {
      console.error('Error generating text:', error);
      toast.error('Eroare la generarea textului');
    } finally {
      setIsGeneratingText(false);
    }
  };

  const generateAllPlatforms = async () => {
    setIsGeneratingText(true);
    try {
      const isGeneric = !selectedProperty || selectedProperty === 'generic';
      const propertyData = isGeneric 
        ? null
        : properties.find(p => p.id === selectedProperty);

      const results: Record<Platform, string> = {
        facebook: "",
        instagram: "",
        linkedin: "",
        twitter: "",
        tiktok: ""
      };

      for (const platform of platforms) {
        const prompt = getPlatformPrompt(platform.id, propertyData);
        
        const { data, error } = await supabase.functions.invoke('generate-facebook-content', {
          body: { 
            type: 'text',
            customPrompt: prompt,
            propertyData: propertyData ? {
              title: propertyData.title,
              location: propertyData.location,
              price: propertyData.price_min || propertyData.price_max,
              rooms: propertyData.rooms,
              surface: propertyData.surface_min || propertyData.surface_max
            } : null
          }
        });

        if (!error && data?.text) {
          results[platform.id] = data.text;
        }
      }

      setGeneratedTexts(results);
      toast.success('Conținut generat pentru toate platformele!');
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Eroare la generarea conținutului');
    } finally {
      setIsGeneratingText(false);
    }
  };

  const copyToClipboard = async (text: string, platformName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Text ${platformName} copiat în clipboard!`);
    } catch (error) {
      toast.error('Eroare la copierea textului');
    }
  };

  const getImagePromptForPlatform = (platform: Platform, propertyData: any | null) => {
    const aspectRatios: Record<Platform, string> = {
      facebook: "1200x630 (Facebook landscape)",
      instagram: "1080x1080 (Instagram square)",
      linkedin: "1200x627 (LinkedIn landscape)",
      twitter: "1600x900 (Twitter landscape)",
      tiktok: "1080x1920 (TikTok vertical/portrait)"
    };

    const baseInfo = propertyData 
      ? `Modern ${propertyData.rooms || '2'}-room apartment in ${propertyData.location || 'excellent location'}.`
      : "Professional real estate agency promotional image for MVA IMOBILIARE.";

    return `Create a professional real estate promotional image with a COMPLETE SCENE (NO WHITE BACKGROUND). 
      ${baseInfo}
      Style: Bright, modern, contemporary real estate photography with full environment and context.
      Include: Beautiful interior or exterior view with complete surroundings, professional composition.
      The entire image should be filled with content - show the property in its environment.
      NO WHITE OR PLAIN BACKGROUNDS - fill the entire frame with realistic real estate photography.
      Aspect ratio: ${aspectRatios[platform]}.
      High quality, ultra realistic, professional photography.
      DO NOT include the words "luxury" or "lux" in any form.
      
      CRITICAL - MVA LOGO PLACEMENT:
      Include the MVA IMOBILIARE logo in the TOP-LEFT or TOP-RIGHT corner.
      Logo: Golden hexagonal badge with "M" letter, "MVA" text below, "IMOBILIARE" below that.
      Golden color (#D4AF37 to #F4E4A6 gradient) with subtle glow.
      Size: approximately 15-20% of the image height.
      
      CRITICAL - TEXT OVERLAY (Romanian):
      Include overlay banner at bottom with:
      "Telefon: 0767.941.512"
      "Email: contact@mvaimobiliare.ro"
      "Web: mvaimobiliare.ro"
      Clear typography, good contrast, perfectly legible.`;
  };

  const generateImage = async (platform: Platform) => {
    setIsGeneratingImage(platform);
    try {
      const isGeneric = !selectedProperty || selectedProperty === 'generic';
      const propertyData = isGeneric 
        ? null
        : properties.find(p => p.id === selectedProperty);

      const imagePrompt = getImagePromptForPlatform(platform, propertyData);

      const { data, error } = await supabase.functions.invoke('generate-facebook-content', {
        body: { 
          type: 'image',
          customPrompt: imagePrompt,
          propertyData: propertyData ? {
            title: propertyData.title,
            location: propertyData.location,
            rooms: propertyData.rooms
          } : null
        }
      });

      if (error) throw error;
      
      setGeneratedImages(prev => ({
        ...prev,
        [platform]: data.image
      }));
      
      // Auto-add to bulk selection
      if (data.image && !selectedImagesForBulk.includes(data.image)) {
        setSelectedImagesForBulk(prev => [...prev, data.image]);
      }
      
      toast.success(`Imagine pentru ${platforms.find(p => p.id === platform)?.name} generată!`);
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Eroare la generarea imaginii');
    } finally {
      setIsGeneratingImage(null);
    }
  };

  const downloadImage = (imageUrl: string, platformName: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `mva-${platformName.toLowerCase()}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Imagine descărcată!');
  };

  const currentPlatform = platforms.find(p => p.id === selectedPlatform)!;
  const currentText = generatedTexts[selectedPlatform];
  const currentImage = generatedImages[selectedPlatform];

  return (
    <Card className="border-border/50 bg-gradient-to-br from-card to-card/80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-gold/10">
            <Wand2 className="h-5 w-5 text-primary" />
          </div>
          Generator Conținut Social Media
        </CardTitle>
        <CardDescription>
          Generează conținut optimizat pentru fiecare platformă socială
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Property Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Selectează proprietatea (opțional)</label>
          <div className="flex gap-2">
            <Select value={selectedProperty} onValueChange={setSelectedProperty}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Proprietate generică sau selectează una..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="generic">Promovare generică MVA</SelectItem>
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
                "Reîncarcă"
              )}
            </Button>
          </div>
        </div>

        {/* Generate All Button */}
        <div className="flex gap-3">
          <Button
            onClick={generateAllPlatforms}
            disabled={isGeneratingText}
            className="flex-1 bg-gradient-to-r from-primary to-gold hover:from-primary/90 hover:to-gold/90"
          >
            {isGeneratingText ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Generare în curs...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generează pentru Toate Platformele
              </>
            )}
          </Button>

          {/* Send All to Zapier Button */}
          <Dialog open={bulkSendDialogOpen} onOpenChange={(open) => {
            setBulkSendDialogOpen(open);
            if (open) loadGalleryForBulk();
          }}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                disabled={!Object.values(generatedTexts).some(t => t.trim()) || configuredPlatforms.length === 0}
                className="gap-2 border-gold/50 hover:bg-gold/10"
              >
                <Zap className="h-4 w-4 text-gold" />
                Trimite la Zapier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-gold" />
                  Trimite Tot la Zapier
                </DialogTitle>
                <DialogDescription>
                  Trimite conținutul generat pentru toate platformele către webhook-urile configurate
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Content Summary */}
                <div className="space-y-2">
                  <Label>Conținut de trimis:</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {platforms.map((platform) => {
                      const hasContent = generatedTexts[platform.id]?.trim();
                      const isConfigured = configuredPlatforms.includes(platform.id);
                      return (
                        <div 
                          key={platform.id}
                          className={`flex items-center gap-2 p-2 rounded-lg border ${
                            hasContent && isConfigured 
                              ? 'bg-green-500/10 border-green-500/30' 
                              : 'bg-muted/30 border-muted'
                          }`}
                        >
                          <platform.icon className={`h-4 w-4 ${platform.color}`} />
                          <span className="text-sm flex-1">{platform.name}</span>
                          {hasContent && isConfigured ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : !isConfigured ? (
                            <Badge variant="outline" className="text-xs">fără webhook</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">fără text</Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Image Selection */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <ImagePlus className="h-4 w-4" />
                    Imagini de inclus ({selectedImagesForBulk.length} selectate)
                  </Label>
                  
                  {isLoadingGallery ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : galleryImages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nu există imagini în galerie. Generează imagini mai întâi.
                    </p>
                  ) : (
                    <ScrollArea className="h-40 rounded-lg border p-2">
                      <div className="grid grid-cols-4 gap-2">
                        {galleryImages.map((img) => (
                          <div 
                            key={img.name}
                            className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                              selectedImagesForBulk.includes(img.url) 
                                ? 'border-gold ring-2 ring-gold/20' 
                                : 'border-transparent hover:border-muted-foreground/30'
                            }`}
                            onClick={() => toggleBulkImage(img.url)}
                          >
                            <img 
                              src={img.url} 
                              alt={img.name}
                              className="w-full h-16 object-cover"
                            />
                            {selectedImagesForBulk.includes(img.url) && (
                              <div className="absolute top-1 right-1 bg-gold text-gold-foreground rounded-full p-0.5">
                                <Check className="h-3 w-3" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}

                  {/* Selected Images Preview */}
                  {selectedImagesForBulk.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedImagesForBulk.map((url, i) => (
                        <div key={i} className="relative group">
                          <img 
                            src={url} 
                            alt={`Selected ${i + 1}`}
                            className="h-10 w-10 object-cover rounded-lg border"
                          />
                          <button 
                            onClick={() => toggleBulkImage(url)}
                            className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Progress */}
                {bulkProgress && (
                  <div className="space-y-2 p-3 rounded-lg bg-gold/10 border border-gold/30">
                    <div className="flex items-center justify-between text-sm">
                      <span>Trimitere în curs...</span>
                      <span className="font-medium">{bulkProgress.current}/{bulkProgress.total}</span>
                    </div>
                    <Progress value={(bulkProgress.current / bulkProgress.total) * 100} className="h-2" />
                    {bulkProgress.platform && (
                      <p className="text-xs text-muted-foreground">
                        Se trimite către {platforms.find(p => p.id === bulkProgress.platform)?.name}...
                      </p>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setBulkSendDialogOpen(false)} disabled={isBulkSending}>
                  Anulează
                </Button>
                <Button 
                  onClick={sendAllToZapier}
                  disabled={isBulkSending || !Object.values(generatedTexts).some(t => t.trim())}
                  className="bg-gradient-to-r from-gold to-primary gap-2"
                >
                  {isBulkSending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Se trimite...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Trimite Tot
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Platform Tabs */}
        <Tabs value={selectedPlatform} onValueChange={(v) => setSelectedPlatform(v as Platform)}>
          <TabsList className="w-full grid grid-cols-5 h-auto p-1 bg-muted/50">
            {platforms.map((platform) => (
              <TabsTrigger
                key={platform.id}
                value={platform.id}
                className="flex flex-col gap-1 py-2 data-[state=active]:bg-background"
              >
                <platform.icon className={`h-4 w-4 ${platform.color}`} />
                <span className="text-xs">{platform.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {platforms.map((platform) => (
            <TabsContent key={platform.id} value={platform.id} className="space-y-4 mt-4">
              {/* Platform Info */}
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <platform.icon className={`h-6 w-6 ${platform.color}`} />
                  <div>
                    <p className="font-medium text-sm">{platform.name}</p>
                    <p className="text-xs text-muted-foreground">{platform.description}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    Max {platform.maxLength} char
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {platform.aspectRatio}
                  </Badge>
                </div>
              </div>

              {/* Text Generation */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Text pentru {platform.name}</label>
                  <Button
                    onClick={() => generateText(platform.id)}
                    disabled={isGeneratingText}
                    size="sm"
                    variant="outline"
                  >
                    {isGeneratingText ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Generare...
                      </>
                    ) : (
                      <>
                        <Type className="h-4 w-4 mr-2" />
                        Generează
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Textarea
                    value={generatedTexts[platform.id]}
                    onChange={(e) => setGeneratedTexts(prev => ({
                      ...prev,
                      [platform.id]: e.target.value
                    }))}
                    rows={8}
                    placeholder={`Textul pentru ${platform.name} va apărea aici...`}
                    className="resize-none bg-background"
                  />
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs text-muted-foreground">
                      {generatedTexts[platform.id].length} / {platform.maxLength} caractere
                    </span>
                    {generatedTexts[platform.id] && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(generatedTexts[platform.id], platform.name)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copiază
                        </Button>
                        
                        <Dialog open={postDialogOpen && selectedPlatform === platform.id} onOpenChange={setPostDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              disabled={!configuredPlatforms.includes(platform.id)}
                              className="bg-gradient-to-r from-primary to-gold hover:from-primary/90 hover:to-gold/90"
                              onClick={() => setSelectedPlatform(platform.id)}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Postează
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <platform.icon className={`h-5 w-5 ${platform.color}`} />
                                Postează pe {platform.name}
                              </DialogTitle>
                              <DialogDescription>
                                Trimite conținutul către webhook-ul configurat pentru {platform.name}
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              {/* Text Preview */}
                              <div className="space-y-2">
                                <Label>Text</Label>
                                <div className="p-3 rounded-lg bg-muted/50 text-sm max-h-32 overflow-y-auto">
                                  {generatedTexts[platform.id]}
                                </div>
                              </div>
                              
                              {/* Image Selection */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <Label className="flex items-center gap-2">
                                    <ImagePlus className="h-4 w-4" />
                                    Imagini ({imageUrls.length} selectate)
                                  </Label>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setShowGallery(!showGallery)}
                                  >
                                    <FolderOpen className="h-4 w-4 mr-2" />
                                    {showGallery ? 'Ascunde Galeria' : 'Arată Galeria'}
                                  </Button>
                                </div>
                                
                                {/* Gallery Images */}
                                {showGallery && (
                                  <div className="space-y-2">
                                    <p className="text-xs text-muted-foreground">
                                      Selectează imagini din galeria generată:
                                    </p>
                                    {isLoadingGallery ? (
                                      <div className="flex items-center justify-center py-4">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                      </div>
                                    ) : galleryImages.length === 0 ? (
                                      <p className="text-sm text-muted-foreground text-center py-4">
                                        Nu există imagini în galerie. Generează imagini mai întâi.
                                      </p>
                                    ) : (
                                      <ScrollArea className="h-48 rounded-lg border p-2">
                                        <div className="grid grid-cols-3 gap-2">
                                          {galleryImages.map((img) => (
                                            <div 
                                              key={img.name}
                                              className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                                                imageUrls.includes(img.url) 
                                                  ? 'border-primary ring-2 ring-primary/20' 
                                                  : 'border-transparent hover:border-muted-foreground/30'
                                              }`}
                                              onClick={() => toggleGalleryImage(img.url)}
                                            >
                                              <img 
                                                src={img.url} 
                                                alt={img.name}
                                                className="w-full h-20 object-cover"
                                              />
                                              {imageUrls.includes(img.url) && (
                                                <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                                                  <Check className="h-3 w-3" />
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </ScrollArea>
                                    )}
                                  </div>
                                )}
                                
                                {/* Manual URL Input */}
                                <div className="space-y-2">
                                  <p className="text-xs text-muted-foreground">
                                    Sau adaugă URL manual:
                                  </p>
                                  <div className="flex gap-2">
                                    <Input
                                      value={newImageUrl}
                                      onChange={(e) => setNewImageUrl(e.target.value)}
                                      placeholder="https://example.com/image.jpg"
                                      onKeyDown={(e) => e.key === 'Enter' && addImageUrl()}
                                    />
                                    <Button variant="outline" size="sm" onClick={addImageUrl}>
                                      Adaugă
                                    </Button>
                                  </div>
                                </div>
                                
                                {/* Selected Images */}
                                {imageUrls.length > 0 && (
                                  <div className="space-y-2">
                                    <p className="text-xs font-medium">Imagini selectate:</p>
                                    <div className="flex flex-wrap gap-2">
                                      {imageUrls.map((url, i) => (
                                        <div key={i} className="relative group">
                                          <img 
                                            src={url} 
                                            alt={`Selected ${i + 1}`}
                                            className="h-12 w-12 object-cover rounded-lg border"
                                          />
                                          <button 
                                            onClick={() => removeImageUrl(url)}
                                            className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setPostDialogOpen(false)}>
                                Anulează
                              </Button>
                              <Button 
                                onClick={postToWebhook}
                                disabled={isPosting}
                                className="bg-gradient-to-r from-primary to-gold"
                              >
                                {isPosting ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Se trimite...
                                  </>
                                ) : (
                                  <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Trimite
                                  </>
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
                        {!configuredPlatforms.includes(platform.id) && (
                          <span className="text-xs text-muted-foreground">
                            (webhook neconfigurat)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Image Generation */}
              <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Imagine pentru {platform.name}
                  </label>
                  <Button
                    onClick={() => generateImage(platform.id)}
                    disabled={isGeneratingImage !== null}
                    size="sm"
                    variant="outline"
                    className="gap-2"
                  >
                    {isGeneratingImage === platform.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generare...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-4 w-4" />
                        Generează Imagine
                      </>
                    )}
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Format recomandat: {platform.aspectRatio}
                </p>

                {generatedImages[platform.id] && (
                  <div className="space-y-3">
                    <div className="relative rounded-lg overflow-hidden border bg-background">
                      <img
                        src={generatedImages[platform.id]}
                        alt={`Generated for ${platform.name}`}
                        className="w-full h-auto max-h-64 object-contain"
                      />
                      <Badge className="absolute top-2 right-2 bg-green-500/90">
                        <Check className="h-3 w-3 mr-1" />
                        Generată
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadImage(generatedImages[platform.id], platform.name)}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Descarcă
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!selectedImagesForBulk.includes(generatedImages[platform.id])) {
                            setSelectedImagesForBulk(prev => [...prev, generatedImages[platform.id]]);
                            toast.success('Imagine adăugată pentru trimitere Zapier');
                          } else {
                            toast.info('Imaginea este deja selectată');
                          }
                        }}
                        className="gap-2"
                      >
                        <Zap className="h-4 w-4 text-gold" />
                        Adaugă la Zapier
                      </Button>
                    </div>
                  </div>
                )}

                {!generatedImages[platform.id] && (
                  <div className="h-32 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Apasă "Generează Imagine" pentru a crea</p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

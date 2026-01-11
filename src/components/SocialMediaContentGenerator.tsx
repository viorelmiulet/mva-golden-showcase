import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Wand2, Image as ImageIcon, Type, Download, Copy, Facebook, Instagram, Linkedin, Twitter, Share2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);

  useEffect(() => {
    loadProperties();
  }, []);

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

  const currentPlatform = platforms.find(p => p.id === selectedPlatform)!;
  const currentText = generatedTexts[selectedPlatform];

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
        <Button
          onClick={generateAllPlatforms}
          disabled={isGeneratingText}
          className="w-full bg-gradient-to-r from-primary to-gold hover:from-primary/90 hover:to-gold/90"
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
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {generatedTexts[platform.id].length} / {platform.maxLength} caractere
                    </span>
                    {generatedTexts[platform.id] && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(generatedTexts[platform.id], platform.name)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copiază
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

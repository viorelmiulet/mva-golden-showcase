import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, Save, Loader2, Phone, Mail, MapPin, Facebook, Instagram, Globe, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface SiteSettings {
  companyName: string;
  phone: string;
  email: string;
  address: string;
  whatsappNumber: string;
  facebookUrl: string;
  instagramUrl: string;
  websiteUrl: string;
  aboutText: string;
  footerText: string;
}

const defaultSettings: SiteSettings = {
  companyName: "MVA Imobiliare",
  phone: "+40767941512",
  email: "mvaperfectbusiness@gmail.com",
  address: "Chiajna, Strada Tineretului 17, Ilfov",
  whatsappNumber: "+40767941512",
  facebookUrl: "https://facebook.com/mvaimobiliare",
  instagramUrl: "https://instagram.com/mvaimobiliare",
  websiteUrl: "https://mvaimobiliare.ro",
  aboutText: "MVA Imobiliare oferă servicii complete de intermediere imobiliară în zona de vest a Bucureștiului și Chiajna.",
  footerText: "© 2025 MVA Imobiliare. Toate drepturile rezervate."
};

const SettingsPage = () => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch settings from database
  const { data: dbSettings, isLoading } = useQuery({
    queryKey: ['site_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value');
      
      if (error) throw error;
      
      // Convert array to object
      const settingsObj: Record<string, string> = {};
      data?.forEach(item => {
        settingsObj[item.key] = item.value || '';
      });
      
      return settingsObj as unknown as SiteSettings;
    }
  });

  // Update settings when data is loaded
  useEffect(() => {
    if (dbSettings) {
      setSettings({ ...defaultSettings, ...dbSettings });
    }
  }, [dbSettings]);

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: async (newSettings: SiteSettings) => {
      const updates = Object.entries(newSettings).map(([key, value]) => ({
        key,
        value,
        updated_at: new Date().toISOString()
      }));

      // Upsert each setting
      for (const update of updates) {
        const { error } = await supabase
          .from('site_settings')
          .upsert(
            { key: update.key, value: update.value, updated_at: update.updated_at },
            { onConflict: 'key' }
          );
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site_settings'] });
      setHasChanges(false);
      toast({
        title: "Setări salvate",
        description: "Configurările au fost actualizate cu succes",
      });
    },
    onError: (error) => {
      console.error('Error saving settings:', error);
      toast({
        title: "Eroare",
        description: "Nu s-au putut salva setările",
        variant: "destructive",
      });
    }
  });

  const handleChange = (field: keyof SiteSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  const handleReset = () => {
    if (dbSettings) {
      setSettings({ ...defaultSettings, ...dbSettings });
    } else {
      setSettings(defaultSettings);
    }
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Setări Generale</h1>
          <p className="text-muted-foreground">Configurări pentru site și informații de contact</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-60" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map(j => (
                  <div key={j} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Setări Generale</h1>
          <p className="text-muted-foreground">Configurări pentru site și informații de contact</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Resetare
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending || !hasChanges}>
            {saveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Se salvează...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvează
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Informații Companie
            </CardTitle>
            <CardDescription>Date de identificare a companiei</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nume Companie</Label>
              <Input
                id="companyName"
                value={settings.companyName}
                onChange={(e) => handleChange("companyName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aboutText">Descriere</Label>
              <Textarea
                id="aboutText"
                value={settings.aboutText}
                onChange={(e) => handleChange("aboutText", e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="footerText">Text Footer</Label>
              <Input
                id="footerText"
                value={settings.footerText}
                onChange={(e) => handleChange("footerText", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact
            </CardTitle>
            <CardDescription>Informații de contact afișate pe site</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefon
              </Label>
              <Input
                id="phone"
                value={settings.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+40..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsappNumber" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                WhatsApp
              </Label>
              <Input
                id="whatsappNumber"
                value={settings.whatsappNumber}
                onChange={(e) => handleChange("whatsappNumber", e.target.value)}
                placeholder="+40..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Adresă
              </Label>
              <Input
                id="address"
                value={settings.address}
                onChange={(e) => handleChange("address", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Social Media */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Social Media
            </CardTitle>
            <CardDescription>Link-uri către rețelele sociale</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="websiteUrl" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Website
              </Label>
              <Input
                id="websiteUrl"
                type="url"
                value={settings.websiteUrl}
                onChange={(e) => handleChange("websiteUrl", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebookUrl" className="flex items-center gap-2">
                <Facebook className="h-4 w-4" />
                Facebook
              </Label>
              <Input
                id="facebookUrl"
                type="url"
                value={settings.facebookUrl}
                onChange={(e) => handleChange("facebookUrl", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagramUrl" className="flex items-center gap-2">
                <Instagram className="h-4 w-4" />
                Instagram
              </Label>
              <Input
                id="instagramUrl"
                type="url"
                value={settings.instagramUrl}
                onChange={(e) => handleChange("instagramUrl", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Previzualizare</CardTitle>
            <CardDescription>Cum vor apărea informațiile pe site</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
              <h3 className="font-bold text-lg">{settings.companyName}</h3>
              <p className="text-sm text-muted-foreground">{settings.aboutText}</p>
              <div className="space-y-1 text-sm">
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {settings.phone}
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {settings.email}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {settings.address}
                </p>
              </div>
              <div className="pt-2 border-t text-xs text-muted-foreground">
                {settings.footerText}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
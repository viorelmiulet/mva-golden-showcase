import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Facebook, Instagram, Linkedin, Twitter, Zap, Save, TestTube, ExternalLink, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WebhookSettings {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  enabled: boolean;
}

export const SocialAutoPostSettings = () => {
  const [settings, setSettings] = useState<WebhookSettings>({
    facebook: "",
    instagram: "",
    linkedin: "",
    twitter: "",
    enabled: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'social_webhooks')
        .single();

      if (data?.value) {
        setSettings(JSON.parse(data.value));
      }
    } catch (error) {
      console.log('No settings found, using defaults');
    }
  };

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key: 'social_webhooks',
          value: JSON.stringify(settings),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' });

      if (error) throw error;
      toast.success('Setările au fost salvate!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Eroare la salvare');
    } finally {
      setIsLoading(false);
    }
  };

  const testWebhooks = async () => {
    setIsTesting(true);
    try {
      console.log('Testing webhooks...');
      const { data, error } = await supabase.functions.invoke('social-auto-post', {
        body: { action: 'test' }
      });

      console.log('Test response:', data, error);

      if (error) throw error;
      
      if (data.success) {
        if (data.results && Object.keys(data.results).length > 0) {
          const successPlatforms = Object.entries(data.results)
            .filter(([_, result]: [string, any]) => result.success)
            .map(([platform]) => platform);
          const failedPlatforms = Object.entries(data.results)
            .filter(([_, result]: [string, any]) => !result.success)
            .map(([platform]) => platform);
          
          if (failedPlatforms.length > 0) {
            toast.error(`Eroare la: ${failedPlatforms.join(', ')}`);
          }
          if (successPlatforms.length > 0) {
            toast.success(`Funcționează: ${successPlatforms.join(', ')}`);
          }
        } else {
          toast.success(data.message || 'Webhook-urile sunt configurate!');
        }
      } else {
        toast.error(data.error || 'Eroare la testare');
      }
    } catch (error: any) {
      console.error('Test error:', error);
      toast.error(`Eroare: ${error.message || 'Eroare la testare'}`);
    } finally {
      setIsTesting(false);
    }
  };

  const platforms = [
    { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-500' },
    { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-500' },
    { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' },
    { id: 'twitter', label: 'Twitter/X', icon: Twitter, color: 'text-foreground' },
  ];

  return (
    <Card className="border-gold/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gold/10">
              <Zap className="h-5 w-5 text-gold" />
            </div>
            <div>
              <CardTitle>Auto-Posting Social Media</CardTitle>
              <CardDescription>
                Publică automat proprietățile noi pe rețelele sociale via Zapier
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="enabled">Activ</Label>
            <Switch
              id="enabled"
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Configurează webhook-uri Zapier pentru a posta automat când adaugi o proprietate nouă.{' '}
            <a 
              href="https://zapier.com/apps/webhook/integrations" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gold hover:underline inline-flex items-center gap-1"
            >
              Creează un Zap <ExternalLink className="h-3 w-3" />
            </a>
          </AlertDescription>
        </Alert>

        <div className="grid gap-4">
          {platforms.map((platform) => {
            const Icon = platform.icon;
            const webhookUrl = settings[platform.id as keyof WebhookSettings] as string || '';
            
            return (
              <div key={platform.id} className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${platform.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <Label htmlFor={platform.id} className="text-sm font-medium">
                    {platform.label} Webhook URL
                  </Label>
                  <Input
                    id={platform.id}
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                    value={webhookUrl}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      [platform.id]: e.target.value 
                    })}
                    className="mt-1"
                  />
                </div>
                {webhookUrl && (
                  <Badge variant="outline" className="text-green-500 border-green-500">
                    Configurat
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button onClick={saveSettings} disabled={isLoading} className="gap-2">
            <Save className="h-4 w-4" />
            {isLoading ? 'Se salvează...' : 'Salvează'}
          </Button>
          <Button 
            variant="outline" 
            onClick={testWebhooks} 
            disabled={isTesting}
            className="gap-2"
          >
            <TestTube className="h-4 w-4" />
            {isTesting ? 'Se testează...' : 'Testează Conexiunea'}
          </Button>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg space-y-2">
          <h4 className="font-medium text-sm">Cum funcționează:</h4>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Creează un Zap în Zapier cu trigger "Webhooks by Zapier"</li>
            <li>Selectează "Catch Hook" și copiază URL-ul generat</li>
            <li>Adaugă acțiunea dorită (ex: Facebook Pages - Create Page Post)</li>
            <li>Lipește URL-ul webhook-ului aici și salvează</li>
            <li>Când adaugi o proprietate nouă, se va trimite automat!</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Facebook, Instagram, Linkedin, Twitter, Zap, Save, TestTube, ExternalLink, Info, Send, History, CheckCircle, XCircle, RefreshCw, Clock, Calendar, MapPin, Building2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { adminApi } from "@/lib/adminApi";

interface WebhookSettings {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  google?: string;
  linkedin?: string;
  twitter?: string;
  enabled: boolean;
  scheduled?: boolean;
  scheduleInterval?: string;
  lastScheduledRun?: string;
  hashtags?: string;
}

interface AuditLog {
  id: string;
  created_at: string;
  record_title: string | null;
  metadata: {
    results?: Record<string, boolean>;
    webhooks?: string[];
    error?: string;
  } | null;
}

const defaultWebhookSettings: WebhookSettings = {
  facebook: "",
  instagram: "",
  google: "",
  linkedin: "",
  twitter: "",
  enabled: false,
  scheduled: false,
  scheduleInterval: "daily",
  hashtags: "#imobiliare #apartament #bucuresti #MVAImobiliare #militariresidence #apartamentdevanzare #proprietate #investitieimobiliara #acasa #locuinta #imobiliarebucuresti #apartamentnoi",
};

export const SocialAutoPostSettings = () => {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<WebhookSettings>(defaultWebhookSettings);
  const [siteSettingsId, setSiteSettingsId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isSending, setIsSending] = useState(false);
  const [isSendingProject, setIsSendingProject] = useState(false);

  const { data: properties } = useQuery({
    queryKey: ['properties-for-webhook'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog_offers')
        .select('id, title, location')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    }
  });

  const { data: projects } = useQuery({
    queryKey: ['projects-for-webhook'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('real_estate_projects')
        .select('id, name, location')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    }
  });

  const { data: postingHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['social-post-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id, created_at, record_title, metadata')
        .eq('action_type', 'social_auto_post')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as AuditLog[];
    }
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const normalizeSettings = (raw?: Partial<WebhookSettings> | null): WebhookSettings => ({
    ...defaultWebhookSettings,
    ...raw,
    facebook: raw?.facebook ?? "",
    instagram: raw?.instagram ?? "",
    google: raw?.google ?? "",
    linkedin: raw?.linkedin ?? "",
    twitter: raw?.twitter ?? "",
    hashtags: raw?.hashtags ?? defaultWebhookSettings.hashtags,
    enabled: raw?.enabled ?? false,
    scheduled: raw?.scheduled ?? false,
    scheduleInterval: raw?.scheduleInterval ?? "daily",
  });

  const getSocialSettingsRow = async () => {
    const result = await adminApi.select<{ id: string; key: string; value: string | null }>('site_settings');
    if (!result.success) throw new Error(result.error || 'Load failed');

    return result.data?.find((item) => item.key === 'social_webhooks') || null;
  };

  const loadSettings = async () => {
    try {
      const socialSettingsRow = await getSocialSettingsRow();
      setSiteSettingsId(socialSettingsRow?.id || null);

      if (socialSettingsRow?.value) {
        setSettings(normalizeSettings(JSON.parse(socialSettingsRow.value)));
      } else {
        setSettings(defaultWebhookSettings);
      }
    } catch (error) {
      console.log('No settings found, using defaults');
      setSettings(defaultWebhookSettings);
      setSiteSettingsId(null);
    }
  };

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      const normalizedSettings = normalizeSettings(settings);
      const existingRow = siteSettingsId
        ? { id: siteSettingsId }
        : await getSocialSettingsRow();
      const timestamp = new Date().toISOString();
      const payload = {
        key: 'social_webhooks',
        value: JSON.stringify(normalizedSettings),
        updated_at: timestamp,
      };

      const result = existingRow?.id
        ? await adminApi.update('site_settings', existingRow.id, payload)
        : await adminApi.insert('site_settings', {
            ...payload,
            created_at: timestamp,
          });

      if (!result.success) throw new Error(result.error || 'Save failed');

      const savedRow = result.data?.[0] as { id?: string } | undefined;
      if (savedRow?.id) {
        setSiteSettingsId(savedRow.id);
      } else if (existingRow?.id) {
        setSiteSettingsId(existingRow.id);
      }
      setSettings(normalizedSettings);
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

  const sendPropertyToWebhook = async () => {
    if (!selectedPropertyId) {
      toast.error('Selectează o proprietate');
      return;
    }

    setIsSending(true);
    try {
      console.log('Sending property to webhook:', selectedPropertyId);
      const { data, error } = await supabase.functions.invoke('social-auto-post', {
        body: { propertyId: selectedPropertyId }
      });

      console.log('Send response:', data, error);

      if (error) throw error;

      if (data.success) {
        const successPlatforms = Object.entries(data.results || {})
          .filter(([_, success]) => success)
          .map(([platform]) => platform);
        
        if (successPlatforms.length > 0) {
          toast.success(`Trimis cu succes către: ${successPlatforms.join(', ')}`);
        } else {
          toast.warning('Niciun webhook nu a răspuns cu succes');
        }
        // Refresh history after sending
        queryClient.invalidateQueries({ queryKey: ['social-post-history'] });
      } else {
        toast.error(data.error || 'Eroare la trimitere');
      }
    } catch (error: any) {
      console.error('Send error:', error);
      toast.error(`Eroare: ${error.message || 'Eroare la trimitere'}`);
    } finally {
      setIsSending(false);
    }
  };

  const refreshHistory = () => {
    queryClient.invalidateQueries({ queryKey: ['social-post-history'] });
  };

  const platforms = [
    { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-500' },
    { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-500' },
    { id: 'google', label: 'Google Business Profile', icon: MapPin, color: 'text-green-500' },
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

        {/* Scheduled Posting Section */}
        <div className="p-4 border rounded-lg space-y-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Programare Trimitere Automată
            </h4>
            <div className="flex items-center gap-2">
              <Label htmlFor="scheduled" className="text-sm">Activ</Label>
              <Switch
                id="scheduled"
                checked={settings.scheduled || false}
                onCheckedChange={(checked) => setSettings({ ...settings, scheduled: checked })}
              />
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Trimite automat proprietățile noi către Zapier la un interval prestabilit.
          </p>
          
          <div className="flex items-center gap-3">
            <Label htmlFor="interval" className="text-sm whitespace-nowrap">Interval:</Label>
            <Select 
              value={settings.scheduleInterval || 'daily'} 
              onValueChange={(value) => setSettings({ ...settings, scheduleInterval: value })}
              disabled={!settings.scheduled}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">La fiecare oră</SelectItem>
                <SelectItem value="every_3_hours">La fiecare 3 ore</SelectItem>
                <SelectItem value="every_6_hours">La fiecare 6 ore</SelectItem>
                <SelectItem value="every_12_hours">La fiecare 12 ore</SelectItem>
                <SelectItem value="daily">O dată pe zi (10:00)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {settings.lastScheduledRun && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Ultima rulare: {format(new Date(settings.lastScheduledRun), "d MMM yyyy, HH:mm", { locale: ro })}
            </p>
          )}
          
          <Alert className="bg-blue-500/10 border-blue-500/30">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-sm">
              Când este activată, funcția va trimite automat proprietățile adăugate de la ultima rulare către toate webhook-urile configurate.
            </AlertDescription>
          </Alert>
        </div>

        {/* Hashtags Section */}
        <div className="p-4 border rounded-lg space-y-3 bg-muted/30">
          <h4 className="font-medium text-sm flex items-center gap-2">
            # Hashtag-uri
          </h4>
          <p className="text-sm text-muted-foreground">
            Hashtag-urile care vor fi incluse în fiecare postare trimisă către Zapier.
          </p>
          <textarea
            value={settings.hashtags || ''}
            onChange={(e) => setSettings({ ...settings, hashtags: e.target.value })}
            className="w-full min-h-[80px] p-3 rounded-md border bg-background text-sm resize-y"
            placeholder="#imobiliare #apartament #bucuresti..."
          />
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

        {/* Manual Send Section */}
        <div className="p-4 border rounded-lg space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Send className="h-4 w-4" />
            Trimite Manual o Proprietate
          </h4>
          <p className="text-sm text-muted-foreground">
            Selectează o proprietate existentă pentru a o trimite către webhook-uri
          </p>
          <div className="flex gap-3">
            <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selectează o proprietate..." />
              </SelectTrigger>
              <SelectContent>
                {properties?.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.title} {property.location ? `- ${property.location}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={sendPropertyToWebhook} 
              disabled={isSending || !selectedPropertyId}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {isSending ? 'Se trimite...' : 'Trimite'}
            </Button>
          </div>
        </div>

        {/* Posting History */}
        <div className="p-4 border rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <History className="h-4 w-4" />
              Istoric Postări
            </h4>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={refreshHistory}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          
          {isLoadingHistory ? (
            <p className="text-sm text-muted-foreground">Se încarcă...</p>
          ) : postingHistory && postingHistory.length > 0 ? (
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {postingHistory.map((log) => {
                  const results = log.metadata?.results || {};
                  const successPlatforms = Object.entries(results)
                    .filter(([_, success]) => success)
                    .map(([platform]) => platform);
                  const failedPlatforms = Object.entries(results)
                    .filter(([_, success]) => !success)
                    .map(([platform]) => platform);
                  const hasError = log.metadata?.error;
                  
                  return (
                    <div 
                      key={log.id} 
                      className="p-3 rounded-lg bg-muted/50 text-sm space-y-1"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium truncate flex-1">
                          {log.record_title || 'Proprietate necunoscută'}
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(log.created_at), "d MMM, HH:mm", { locale: ro })}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {successPlatforms.map((platform) => (
                          <Badge 
                            key={platform} 
                            variant="outline" 
                            className="text-green-600 border-green-600 gap-1 text-xs"
                          >
                            <CheckCircle className="h-3 w-3" />
                            {platform}
                          </Badge>
                        ))}
                        {failedPlatforms.map((platform) => (
                          <Badge 
                            key={platform} 
                            variant="outline" 
                            className="text-red-600 border-red-600 gap-1 text-xs"
                          >
                            <XCircle className="h-3 w-3" />
                            {platform}
                          </Badge>
                        ))}
                        {hasError && (
                          <Badge variant="destructive" className="text-xs">
                            Eroare: {log.metadata?.error}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nu există postări înregistrate încă.
            </p>
          )}
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

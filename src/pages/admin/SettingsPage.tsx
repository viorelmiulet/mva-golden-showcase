import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { Settings, Save, Loader2, Phone, Mail, MapPin, Facebook, Instagram, Globe, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";

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

interface EmailFunctionSetting {
  id: string;
  function_name: string;
  function_label: string;
  from_email: string;
  from_name: string | null;
  is_active: boolean;
}

const MAIN_SITE_URLS = [
  "https://mvaimobiliare.ro",
  "https://mvaimobiliare.ro/proprietati",
  "https://mvaimobiliare.ro/complexe",
  "https://mvaimobiliare.ro/despre-noi",
  "https://mvaimobiliare.ro/servicii",
  "https://mvaimobiliare.ro/contact",
  "https://mvaimobiliare.ro/blog",
  "https://mvaimobiliare.ro/calculator-credit",
  "https://mvaimobiliare.ro/intrebari-frecvente",
];

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const SettingsPage = () => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [emailSettings, setEmailSettings] = useState<EmailFunctionSetting[]>([]);
  const [hasEmailChanges, setHasEmailChanges] = useState(false);
  const queryClient = useQueryClient();

  const { data: dbSettings, isLoading } = useQuery({
    queryKey: ['site_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value');
      
      if (error) throw error;
      
      const settingsObj: Record<string, string> = {};
      data?.forEach(item => {
        settingsObj[item.key] = item.value || '';
      });
      
      return settingsObj as unknown as SiteSettings;
    }
  });

  // Fetch email function settings
  const { data: dbEmailSettings, isLoading: isLoadingEmail } = useQuery({
    queryKey: ['email_function_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_function_settings')
        .select('*')
        .order('function_label');
      
      if (error) throw error;
      return data as EmailFunctionSetting[];
    }
  });

  useEffect(() => {
    if (dbSettings) {
      setSettings({ ...defaultSettings, ...dbSettings });
    }
  }, [dbSettings]);

  useEffect(() => {
    if (dbEmailSettings) {
      setEmailSettings(dbEmailSettings);
    }
  }, [dbEmailSettings]);

  const saveMutation = useMutation({
    mutationFn: async (newSettings: SiteSettings) => {
      const updates = Object.entries(newSettings).map(([key, value]) => ({
        key,
        value,
        updated_at: new Date().toISOString()
      }));

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
      toast.success("Setări salvate cu succes!");
    },
    onError: (error) => {
      console.error('Error saving settings:', error);
      toast.error("Nu s-au putut salva setările");
    }
  });

  // Save email function settings mutation
  const saveEmailSettingsMutation = useMutation({
    mutationFn: async (settings: EmailFunctionSetting[]) => {
      for (const setting of settings) {
        const { error } = await supabase
          .from('email_function_settings')
          .update({
            from_email: setting.from_email,
            from_name: setting.from_name,
            is_active: setting.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', setting.id);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email_function_settings'] });
      setHasEmailChanges(false);
      toast.success("Setări email salvate cu succes!");
    },
    onError: (error) => {
      console.error('Error saving email settings:', error);
      toast.error("Nu s-au putut salva setările email");
    }
  });

  const sendIndexNowMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('notify-google-sitemap', {
        body: {
          targetUrls: MAIN_SITE_URLS,
        },
      });

      if (error) {
        throw new Error(error.message || 'Nu s-a putut trimite notificarea către Bing');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Răspuns invalid de la funcția de notificare');
      }

      return data;
    },
    onSuccess: () => {
      toast.success('IndexNow a fost trimis către Bing cu succes!');
    },
    onError: (error) => {
      console.error('Error sending IndexNow notification:', error);
      toast.error(error instanceof Error ? error.message : 'Eroare la trimiterea IndexNow către Bing');
    }
  });

  const handleChange = (field: keyof SiteSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleEmailSettingChange = (id: string, field: keyof EmailFunctionSetting, value: string | boolean) => {
    setEmailSettings(prev => prev.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
    setHasEmailChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  const handleSaveEmailSettings = () => {
    saveEmailSettingsMutation.mutate(emailSettings);
  };

  const handleReset = () => {
    if (dbSettings) {
      setSettings({ ...defaultSettings, ...dbSettings });
    } else {
      setSettings(defaultSettings);
    }
    setHasChanges(false);
  };

  const handleResetEmailSettings = () => {
    if (dbEmailSettings) {
      setEmailSettings(dbEmailSettings);
    }
    setHasEmailChanges(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <div>
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-60" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-2xl border border-white/10 p-6">
              <Skeleton className="h-6 w-40 mb-4" />
              <div className="space-y-4">
                {[1, 2, 3].map(j => (
                  <div key={j} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const settingsSections = [
    {
      title: "Informații Companie",
      description: "Date de identificare a companiei",
      icon: Settings,
      gradient: "from-gold/20 to-amber-500/20",
      iconColor: "text-gold",
      fields: [
        { id: "companyName", label: "Nume Companie", type: "input", value: settings.companyName },
        { id: "aboutText", label: "Descriere", type: "textarea", value: settings.aboutText },
        { id: "footerText", label: "Text Footer", type: "input", value: settings.footerText },
      ]
    },
    {
      title: "Contact",
      description: "Informații de contact afișate pe site",
      icon: Phone,
      gradient: "from-blue-500/20 to-cyan-500/20",
      iconColor: "text-blue-400",
      fields: [
        { id: "phone", label: "Telefon", type: "input", icon: Phone, value: settings.phone, placeholder: "+40..." },
        { id: "whatsappNumber", label: "WhatsApp", type: "input", icon: Phone, value: settings.whatsappNumber, placeholder: "+40..." },
        { id: "email", label: "Email", type: "input", icon: Mail, value: settings.email },
        { id: "address", label: "Adresă", type: "input", icon: MapPin, value: settings.address },
      ]
    },
    {
      title: "Social Media",
      description: "Link-uri către rețelele sociale",
      icon: Globe,
      gradient: "from-purple-500/20 to-violet-500/20",
      iconColor: "text-purple-400",
      fields: [
        { id: "websiteUrl", label: "Website", type: "input", icon: Globe, value: settings.websiteUrl },
        { id: "facebookUrl", label: "Facebook", type: "input", icon: Facebook, value: settings.facebookUrl },
        { id: "instagramUrl", label: "Instagram", type: "input", icon: Instagram, value: settings.instagramUrl },
      ]
    },
  ];

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-gold/40 to-gold/10 rounded-2xl blur-xl" />
            <div className="relative p-3 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 shadow-lg shadow-gold/10">
              <Settings className="h-6 w-6 text-gold" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Setări Generale</h1>
            <p className="text-muted-foreground/70 text-sm">Configurări pentru site și informații de contact</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleReset} 
            disabled={!hasChanges}
            className="border-white/10 hover:bg-white/5"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Resetare
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saveMutation.isPending || !hasChanges}
            className="bg-gradient-to-r from-gold to-gold-light text-black hover:shadow-lg hover:shadow-gold/25"
          >
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
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {settingsSections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            variants={itemVariants}
            className="relative group"
          >
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${section.gradient} opacity-0 group-hover:opacity-50 transition-opacity blur-xl`} />
            <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent overflow-hidden backdrop-blur-sm">
              <div className="p-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl bg-white/5 ${section.iconColor}`}>
                    <section.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{section.title}</h3>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {section.fields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={field.id} className="flex items-center gap-2 text-sm">
                      {field.icon && <field.icon className="h-4 w-4 text-muted-foreground" />}
                      {field.label}
                    </Label>
                    {field.type === "textarea" ? (
                      <Textarea
                        id={field.id}
                        value={field.value}
                        onChange={(e) => handleChange(field.id as keyof SiteSettings, e.target.value)}
                        rows={3}
                        className="bg-white/5 border-white/10 focus:border-gold/50"
                      />
                    ) : (
                      <Input
                        id={field.id}
                        value={field.value}
                        onChange={(e) => handleChange(field.id as keyof SiteSettings, e.target.value)}
                        placeholder={field.placeholder}
                        className="bg-white/5 border-white/10 focus:border-gold/50"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}

        {/* Email Function Settings */}
        <motion.div variants={itemVariants} className="relative group lg:col-span-2">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 opacity-0 group-hover:opacity-50 transition-opacity blur-xl" />
          <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent overflow-hidden backdrop-blur-sm">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/5 text-orange-400">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Configurare Email pe Funcție</h3>
                  <p className="text-sm text-muted-foreground">Setează adresa de email de unde se trimite pentru fiecare funcție</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleResetEmailSettings} 
                  disabled={!hasEmailChanges}
                  className="border-white/10 hover:bg-white/5"
                >
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Resetare
                </Button>
                <Button 
                  size="sm"
                  onClick={handleSaveEmailSettings} 
                  disabled={saveEmailSettingsMutation.isPending || !hasEmailChanges}
                  className="bg-gradient-to-r from-gold to-gold-light text-black hover:shadow-lg hover:shadow-gold/25"
                >
                  {saveEmailSettingsMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="mr-2 h-3 w-3" />
                      Salvează
                    </>
                  )}
                </Button>
              </div>
            </div>
            <div className="p-6">
              {isLoadingEmail ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {emailSettings.map((setting) => (
                    <div 
                      key={setting.id} 
                      className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center">
                            <Mail className="h-5 w-5 text-gold" />
                          </div>
                          <div>
                            <h4 className="font-medium">{setting.function_label}</h4>
                            <p className="text-xs text-muted-foreground">{setting.function_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`active-${setting.id}`} className="text-sm text-muted-foreground">
                            Activ
                          </Label>
                          <Switch
                            id={`active-${setting.id}`}
                            checked={setting.is_active}
                            onCheckedChange={(checked) => handleEmailSettingChange(setting.id, 'is_active', checked)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Email Expeditor</Label>
                          <Input
                            value={setting.from_email}
                            onChange={(e) => handleEmailSettingChange(setting.id, 'from_email', e.target.value)}
                            placeholder="noreply@domeniu.ro"
                            className="bg-white/5 border-white/10 focus:border-gold/50 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Nume Expeditor</Label>
                          <Input
                            value={setting.from_name || ''}
                            onChange={(e) => handleEmailSettingChange(setting.id, 'from_name', e.target.value)}
                            placeholder="Nume Companie"
                            className="bg-white/5 border-white/10 focus:border-gold/50 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="relative group lg:col-span-2">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gold/20 to-gold-light/10 opacity-0 group-hover:opacity-50 transition-opacity blur-xl" />
          <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent overflow-hidden backdrop-blur-sm">
            <div className="p-6 border-b border-white/5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/5 text-gold">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">IndexNow către Bing</h3>
                  <p className="text-sm text-muted-foreground">Trimite manual URL-urile principale ale site-ului pentru reindexare rapidă.</p>
                </div>
              </div>
              <Button
                onClick={() => sendIndexNowMutation.mutate()}
                disabled={sendIndexNowMutation.isPending}
                className="bg-gradient-to-r from-gold to-gold-light text-black hover:shadow-lg hover:shadow-gold/25"
              >
                {sendIndexNowMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Se trimite...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Trimite IndexNow către Bing
                  </>
                )}
              </Button>
            </div>
            <div className="p-6">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="mb-3 text-sm text-muted-foreground">Vor fi notificate aceste URL-uri principale:</p>
                <div className="grid gap-2 md:grid-cols-2">
                  {MAIN_SITE_URLS.map((url) => (
                    <div key={url} className="rounded-lg border border-white/10 bg-background/30 px-3 py-2 text-xs text-muted-foreground break-all">
                      {url}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Preview */}
        <motion.div variants={itemVariants} className="relative group">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 opacity-0 group-hover:opacity-50 transition-opacity blur-xl" />
          <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent overflow-hidden backdrop-blur-sm">
            <div className="p-6 border-b border-white/5">
              <h3 className="font-semibold">Previzualizare</h3>
              <p className="text-sm text-muted-foreground">Cum vor apărea informațiile pe site</p>
            </div>
            <div className="p-6">
              <div className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-4">
                <h3 className="font-bold text-lg text-gold">{settings.companyName}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{settings.aboutText}</p>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {settings.phone}
                  </p>
                  <p className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {settings.email}
                  </p>
                  <p className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {settings.address}
                  </p>
                </div>
                <div className="pt-3 border-t border-white/10 text-xs text-muted-foreground">
                  {settings.footerText}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SettingsPage;

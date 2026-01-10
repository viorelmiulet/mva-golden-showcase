import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Settings, Save, Loader2, Phone, Mail, MapPin, Facebook, Instagram, Globe, RefreshCw } from "lucide-react";
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

  useEffect(() => {
    if (dbSettings) {
      setSettings({ ...defaultSettings, ...dbSettings });
    }
  }, [dbSettings]);

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
            <div className="relative p-3 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20">
              <Settings className="h-6 w-6 text-gold" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Setări Generale</h1>
            <p className="text-muted-foreground text-sm">Configurări pentru site și informații de contact</p>
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
            <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent overflow-hidden">
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

        {/* Preview */}
        <motion.div variants={itemVariants} className="relative group">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 opacity-0 group-hover:opacity-50 transition-opacity blur-xl" />
          <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent overflow-hidden">
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

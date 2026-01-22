import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mic, Settings, TestTube, ExternalLink, Info, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VoiceAgentWidget } from "@/components/VoiceAgentWidget";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

interface VoiceAgentSettings {
  agent_id: string;
  enabled: boolean;
  show_on_property_pages: boolean;
  show_on_homepage: boolean;
  custom_prompt: string;
}

const defaultSettings: VoiceAgentSettings = {
  agent_id: "",
  enabled: false,
  show_on_property_pages: true,
  show_on_homepage: false,
  custom_prompt: `Ești un asistent imobiliar virtual pentru MVA Imobiliare. Ajuți clienții să găsească proprietatea perfectă.

Poți răspunde la întrebări despre:
- Proprietăți disponibile (apartamente, case, terenuri)
- Prețuri și zone
- Programări pentru vizionări
- Procesul de achiziție/închiriere
- Caracteristici ale proprietăților

Fii prietenos, profesionist și concis. Răspunde în limba română.`
};

const VoiceAgentPage = () => {
  const [settings, setSettings] = useState<VoiceAgentSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "voice_agent_settings")
        .maybeSingle();

      if (data?.value) {
        try {
          const parsed = JSON.parse(data.value);
          setSettings({ ...defaultSettings, ...parsed });
        } catch {
          console.error("Failed to parse settings");
        }
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Check if setting exists
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("key", "voice_agent_settings")
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("site_settings")
          .update({
            value: JSON.stringify(settings),
            updated_at: new Date().toISOString()
          })
          .eq("key", "voice_agent_settings");

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("site_settings")
          .insert({
            key: "voice_agent_settings",
            value: JSON.stringify(settings),
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
      }
      
      toast.success("Setările au fost salvate");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Eroare la salvarea setărilor");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-accent/20 rounded-2xl blur-xl" />
          <div className="relative p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20">
            <Mic className="h-6 w-6 text-primary" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agent Vocal AI</h1>
          <p className="text-muted-foreground text-sm">Configurează asistentul vocal ElevenLabs pentru clienți</p>
        </div>
      </motion.div>

      {/* Info Alert */}
      <motion.div variants={itemVariants}>
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Cum funcționează</AlertTitle>
          <AlertDescription>
            Agentul vocal AI folosește ElevenLabs pentru a răspunde automat la întrebările clienților despre proprietăți.
            Pentru a-l configura, trebuie să creezi un agent în{" "}
            <a
              href="https://elevenlabs.io/conversational-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline inline-flex items-center gap-1"
            >
              ElevenLabs Dashboard <ExternalLink className="h-3 w-3" />
            </a>
          </AlertDescription>
        </Alert>
      </motion.div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Configurare
          </TabsTrigger>
          <TabsTrigger value="test" className="gap-2">
            <TestTube className="h-4 w-4" />
            Testare
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-2">
            {/* Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Setări Agent</CardTitle>
                <CardDescription>Configurează ID-ul agentului și opțiunile de afișare</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="agent_id">Agent ID</Label>
                  <Input
                    id="agent_id"
                    value={settings.agent_id}
                    onChange={(e) => setSettings({ ...settings, agent_id: e.target.value })}
                    placeholder="agent_xxxxxxxxxx"
                  />
                  <p className="text-xs text-muted-foreground">
                    Găsești ID-ul în ElevenLabs Dashboard → Conversational AI → Agents
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Activează agentul</Label>
                    <p className="text-xs text-muted-foreground">Afișează widget-ul pe site</p>
                  </div>
                  <Switch
                    checked={settings.enabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Pagini proprietăți</Label>
                    <p className="text-xs text-muted-foreground">Afișează pe detalii proprietate</p>
                  </div>
                  <Switch
                    checked={settings.show_on_property_pages}
                    onCheckedChange={(checked) => setSettings({ ...settings, show_on_property_pages: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Pagina principală</Label>
                    <p className="text-xs text-muted-foreground">Afișează pe homepage</p>
                  </div>
                  <Switch
                    checked={settings.show_on_homepage}
                    onCheckedChange={(checked) => setSettings({ ...settings, show_on_homepage: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Prompt Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Prompt Personalizat</CardTitle>
                <CardDescription>
                  Instrucțiuni pentru agentul AI (configurează în ElevenLabs Dashboard)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={settings.custom_prompt}
                  onChange={(e) => setSettings({ ...settings, custom_prompt: e.target.value })}
                  rows={12}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Acest prompt este doar pentru referință. Configurează prompt-ul direct în ElevenLabs Dashboard pentru ca agentul să-l folosească.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} className="flex justify-end mt-6">
            <Button onClick={saveSettings} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvează setările
            </Button>
          </motion.div>
        </TabsContent>

        <TabsContent value="test">
          <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-2">
            {/* Test Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Testează Agentul</CardTitle>
                <CardDescription>
                  Verifică funcționarea agentului vocal înainte de a-l activa pe site
                </CardDescription>
              </CardHeader>
              <CardContent>
                {settings.agent_id ? (
                  <VoiceAgentWidget
                    agentId={settings.agent_id}
                    variant="inline"
                  />
                ) : (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Introdu un Agent ID în tab-ul Configurare pentru a testa agentul.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Instructions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Instrucțiuni Setup</CardTitle>
                <CardDescription>Pași pentru configurarea agentului în ElevenLabs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="list-decimal list-inside space-y-3 text-sm">
                  <li>
                    Accesează{" "}
                    <a
                      href="https://elevenlabs.io/conversational-ai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      ElevenLabs Conversational AI
                    </a>
                  </li>
                  <li>Creează un agent nou sau selectează unul existent</li>
                  <li>Configurează vocea și limba (Română)</li>
                  <li>Adaugă prompt-ul de sistem cu instrucțiuni despre proprietăți</li>
                  <li>Copiază Agent ID și lipește-l în configurare</li>
                  <li>Testează agentul aici înainte de activare</li>
                </ol>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Voci recomandate pentru română:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Sarah - Voce feminină prietenoasă</li>
                    <li>• George - Voce masculină profesională</li>
                    <li>• Laura - Voce feminină caldă</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default VoiceAgentPage;

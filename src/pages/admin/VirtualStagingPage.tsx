import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { 
  Upload, 
  Wand2, 
  Download, 
  RefreshCw, 
  Sofa, 
  Bed, 
  ChefHat, 
  Bath, 
  Briefcase, 
  UtensilsCrossed,
  Loader2,
  ImageIcon,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";

const roomTypes = [
  { value: "living", label: "Living", icon: Sofa },
  { value: "bedroom", label: "Dormitor", icon: Bed },
  { value: "kitchen", label: "Bucătărie", icon: ChefHat },
  { value: "bathroom", label: "Baie", icon: Bath },
  { value: "office", label: "Birou", icon: Briefcase },
  { value: "dining", label: "Sufragerie", icon: UtensilsCrossed },
];

const styles = [
  { value: "modern", label: "Modern Minimalist", description: "Linii curate, culori neutre" },
  { value: "classic", label: "Clasic Elegant", description: "Mobilier tradițional, tonuri calde" },
  { value: "scandinavian", label: "Scandinav", description: "Lemn deschis, simplitate" },
  { value: "industrial", label: "Industrial", description: "Metal, cărămidă expusă" },
  { value: "bohemian", label: "Boho", description: "Colorat, eclectic" },
  { value: "luxury", label: "Lux", description: "Premium, design sofisticat" },
];

export default function VirtualStagingPage() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [stagedImage, setStagedImage] = useState<string | null>(null);
  const [roomType, setRoomType] = useState("living");
  const [style, setStyle] = useState("modern");
  const [additionalPrompt, setAdditionalPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Imaginea este prea mare. Maxim 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setOriginalImage(event.target?.result as string);
      setStagedImage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleStaging = async () => {
    if (!originalImage) {
      toast.error("Încarcă o imagine mai întâi");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("virtual-staging", {
        body: {
          imageBase64: originalImage,
          roomType,
          style,
          additionalPrompt,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      if (data.stagedImage) {
        setStagedImage(data.stagedImage);
        toast.success("Mobilare virtuală completă!");
      } else {
        toast.error("Nu s-a putut genera imaginea");
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Eroare la mobilarea virtuală: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!stagedImage) return;

    const link = document.createElement("a");
    link.href = stagedImage;
    link.download = `virtual-staging-${roomType}-${style}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Imagine descărcată!");
  };

  const handleReset = () => {
    setOriginalImage(null);
    setStagedImage(null);
    setAdditionalPrompt("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          Virtual Staging AI
        </h1>
        <p className="text-muted-foreground">
          Transformă camerele goale în spații mobilate folosind inteligența artificială
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload & Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Configurare</CardTitle>
            <CardDescription>Încarcă o imagine și selectează stilul dorit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-3">
              <Label>Imagine Cameră Goală</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              {originalImage ? (
                <div className="relative group">
                  <img
                    src={originalImage}
                    alt="Original"
                    className="w-full h-64 object-cover rounded-lg border"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Schimbă
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-64 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-3 hover:border-primary hover:bg-muted/50 transition-colors"
                >
                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  <div className="text-center">
                    <p className="font-medium">Click pentru a încărca</p>
                    <p className="text-sm text-muted-foreground">JPG, PNG sau WEBP (max 10MB)</p>
                  </div>
                </button>
              )}
            </div>

            {/* Room Type */}
            <div className="space-y-3">
              <Label>Tip Cameră</Label>
              <div className="grid grid-cols-3 gap-2">
                {roomTypes.map((room) => {
                  const Icon = room.icon;
                  return (
                    <button
                      key={room.value}
                      onClick={() => setRoomType(room.value)}
                      className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                        roomType === room.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "hover:border-muted-foreground/50"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{room.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Style */}
            <div className="space-y-3">
              <Label>Stil Design</Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectează stilul" />
                </SelectTrigger>
                <SelectContent>
                  {styles.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      <div className="flex flex-col">
                        <span>{s.label}</span>
                        <span className="text-xs text-muted-foreground">{s.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Additional Prompt */}
            <div className="space-y-3">
              <Label>Instrucțiuni Suplimentare (opțional)</Label>
              <Textarea
                value={additionalPrompt}
                onChange={(e) => setAdditionalPrompt(e.target.value)}
                placeholder="Ex: Adaugă plante verzi, preferință pentru culori calde..."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={handleStaging}
                disabled={!originalImage || isLoading}
                className="flex-1 gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Se procesează...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Generează Mobilare
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleReset} disabled={isLoading}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Result */}
        <Card>
          <CardHeader>
            <CardTitle>Rezultat</CardTitle>
            <CardDescription>Imaginea cu mobilare virtuală</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-96 rounded-lg border bg-muted/30 flex flex-col items-center justify-center gap-4">
                <div className="relative">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <Sparkles className="h-6 w-6 text-primary absolute -top-1 -right-1 animate-pulse" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Se generează mobilarea virtuală...</p>
                  <p className="text-sm text-muted-foreground">Acest proces poate dura 30-60 secunde</p>
                </div>
              </div>
            ) : stagedImage ? (
              <div className="space-y-4">
                <div className="relative group">
                  <img
                    src={stagedImage}
                    alt="Staged"
                    className="w-full rounded-lg border"
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" onClick={handleDownload} className="gap-1">
                      <Download className="h-4 w-4" />
                      Descarcă
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleDownload} className="flex-1 gap-2">
                    <Download className="h-4 w-4" />
                    Descarcă Imaginea
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleStaging}
                    disabled={isLoading}
                    className="flex-1 gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Regenerează
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-96 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <Wand2 className="h-12 w-12" />
                <div className="text-center">
                  <p className="font-medium">Nicio imagine generată</p>
                  <p className="text-sm">Încarcă o imagine și apasă "Generează Mobilare"</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sfaturi pentru rezultate mai bune</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid md:grid-cols-2 gap-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              Folosește imagini clare, bine luminate ale camerelor goale
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              Evită imaginile cu multe obiecte existente
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              Fotografiază din colțul camerei pentru perspectivă mai bună
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              Regenerează de mai multe ori pentru variații diferite
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

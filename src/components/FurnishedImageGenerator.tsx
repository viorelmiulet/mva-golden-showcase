import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Wand2, Download, Loader2, Image, Upload, X, Settings2, Layers, CheckSquare, Save, FolderOpen, Trash2, Search, Filter, Calendar, RefreshCw } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { ro } from "date-fns/locale";

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
  
  // Batch processing
  const [batchMode, setBatchMode] = useState(false);
  const [selectedRoomTypes, setSelectedRoomTypes] = useState<string[]>(["living"]);
  const [imagesPerRoom, setImagesPerRoom] = useState("2");
  const [batchProgress, setBatchProgress] = useState(0);
  const [currentBatchRoom, setCurrentBatchRoom] = useState("");
  
  // Logo options
  const [includeLogo, setIncludeLogo] = useState(false);
  const [useCustomLogo, setUseCustomLogo] = useState(false);
  const [customLogoBase64, setCustomLogoBase64] = useState<string | null>(null);
  const [customLogoPreview, setCustomLogoPreview] = useState<string | null>(null);
  const [logoPosition, setLogoPosition] = useState("bottom-right");
  const [logoSize, setLogoSize] = useState("medium");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<{ index: number; imageUrl: string; roomType: string }[]>([]);
  const [savedImages, setSavedImages] = useState<{ name: string; url: string; createdAt: string }[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("generator");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved images from storage on mount
  useEffect(() => {
    if (activeTab === "gallery") {
      loadSavedImages();
    }
  }, [activeTab]);

  const loadSavedImages = async () => {
    setIsLoadingGallery(true);
    try {
      const { data, error } = await supabase.storage
        .from('virtual-staging')
        .list('generated-images', {
          limit: 100,
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

      setSavedImages(images);
    } catch (error) {
      console.error('Error loading saved images:', error);
      toast.error("Eroare la încărcarea galeriei");
    } finally {
      setIsLoadingGallery(false);
    }
  };

  const saveImageToStorage = async (imageUrl: string, roomType: string, index: number) => {
    try {
      // Fetch the image and convert to blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedRoomType = roomType.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      const filename = `${sanitizedRoomType}-${timestamp}-${index}.png`;
      
      const { error } = await supabase.storage
        .from('virtual-staging')
        .upload(`generated-images/${filename}`, blob, {
          contentType: 'image/png',
          upsert: false
        });

      if (error) throw error;
      
      return filename;
    } catch (error) {
      console.error('Error saving image:', error);
      throw error;
    }
  };

  const saveAllImagesToStorage = async () => {
    if (generatedImages.length === 0) {
      toast.error("Nu există imagini de salvat");
      return;
    }

    setIsSaving(true);
    let savedCount = 0;

    try {
      toast.info(`Salvez ${generatedImages.length} imagini în galerie...`);

      for (const img of generatedImages) {
        try {
          await saveImageToStorage(img.imageUrl, img.roomType, img.index);
          savedCount++;
        } catch (err) {
          console.error(`Error saving image ${img.index}:`, err);
        }
      }

      if (savedCount > 0) {
        toast.success(`${savedCount} imagini salvate în galerie!`);
        loadSavedImages();
      } else {
        toast.error("Nu s-a putut salva nicio imagine");
      }
    } catch (error) {
      console.error('Error saving images:', error);
      toast.error("Eroare la salvarea imaginilor");
    } finally {
      setIsSaving(false);
    }
  };

  const saveSingleImage = async (img: { imageUrl: string; roomType: string; index: number }) => {
    setIsSaving(true);
    try {
      await saveImageToStorage(img.imageUrl, img.roomType, img.index);
      toast.success("Imaginea a fost salvată în galerie!");
      loadSavedImages();
    } catch (error) {
      toast.error("Eroare la salvarea imaginii");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleRoomType = (roomValue: string) => {
    setSelectedRoomTypes(prev => 
      prev.includes(roomValue)
        ? prev.filter(r => r !== roomValue)
        : [...prev, roomValue]
    );
  };

  const selectAllRooms = () => {
    setSelectedRoomTypes(ROOM_TYPES.map(r => r.value));
  };

  const clearAllRooms = () => {
    setSelectedRoomTypes([]);
  };

  const deleteFromGallery = async (filename: string) => {
    try {
      const { error } = await supabase.storage
        .from('virtual-staging')
        .remove([`generated-images/${filename}`]);

      if (error) throw error;

      setSavedImages(prev => prev.filter(img => img.name !== filename));
      toast.success("Imaginea a fost ștearsă");
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error("Eroare la ștergerea imaginii");
    }
  };

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

    if (batchMode && selectedRoomTypes.length === 0) {
      toast.error("Vă rugăm să selectați cel puțin un tip de cameră pentru batch processing");
      return;
    }

    setIsGenerating(true);
    setGeneratedImages([]);
    setBatchProgress(0);
    setCurrentBatchRoom("");

    try {
      if (batchMode) {
        // Batch processing - generate images for multiple room types
        const totalRooms = selectedRoomTypes.length;
        const allImages: { index: number; imageUrl: string; roomType: string }[] = [];
        let globalIndex = 1;

        toast.info(`Generez imagini pentru ${totalRooms} tipuri de camere...`);

        for (let roomIdx = 0; roomIdx < selectedRoomTypes.length; roomIdx++) {
          const currentRoom = selectedRoomTypes[roomIdx];
          const roomLabel = ROOM_TYPES.find(r => r.value === currentRoom)?.label || currentRoom;
          
          setCurrentBatchRoom(roomLabel);
          setBatchProgress(Math.round((roomIdx / totalRooms) * 100));

          const { data, error } = await supabase.functions.invoke('generate-furnished-images', {
            body: {
              description,
              roomType: currentRoom,
              style,
              numberOfImages: parseInt(imagesPerRoom),
              aspectRatio,
              lighting,
              photoStyle,
              includeLogo,
              useCustomLogo: includeLogo && useCustomLogo,
              customLogoBase64: includeLogo && useCustomLogo ? customLogoBase64 : null,
              logoPosition,
              logoSize,
              batchMode: true
            }
          });

          if (error) {
            console.error(`Error generating images for ${currentRoom}:`, error);
            toast.error(`Eroare la generarea imaginilor pentru ${roomLabel}`);
            continue;
          }

          if (data?.success && data?.images) {
            const roomImages = data.images.map((img: any) => ({
              ...img,
              index: globalIndex++,
              roomType: `${STYLES.find(s => s.value === style)?.label || style} - ${roomLabel}`
            }));
            allImages.push(...roomImages);
            setGeneratedImages([...allImages]);
          }
        }

        setBatchProgress(100);
        setCurrentBatchRoom("");
        toast.success(`${allImages.length} imagini generate pentru ${totalRooms} tipuri de camere!`);
      } else {
        // Single room type generation
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
      }

    } catch (error) {
      console.error('Error generating images:', error);
      toast.error("Eroare la generarea imaginilor");
    } finally {
      setIsGenerating(false);
      setBatchProgress(0);
      setCurrentBatchRoom("");
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
          {/* Batch Mode Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <Label htmlFor="batch-mode" className="text-sm font-medium">
                  Batch Processing
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Generează imagini pentru mai multe tipuri de camere simultan
              </p>
            </div>
            <Switch
              id="batch-mode"
              checked={batchMode}
              onCheckedChange={setBatchMode}
              disabled={isGenerating}
            />
          </div>

          {/* Batch Mode - Multiple Room Selection */}
          {batchMode ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium">
                  Selectează Tipurile de Camere ({selectedRoomTypes.length} selectate)
                </label>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={selectAllRooms}
                    disabled={isGenerating}
                  >
                    <CheckSquare className="w-3 h-3 mr-1" />
                    Toate
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearAllRooms}
                    disabled={isGenerating}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Niciunul
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {ROOM_TYPES.map((type) => (
                  <div
                    key={type.value}
                    className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                      selectedRoomTypes.includes(type.value)
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => !isGenerating && toggleRoomType(type.value)}
                  >
                    <Checkbox
                      checked={selectedRoomTypes.includes(type.value)}
                      onCheckedChange={() => toggleRoomType(type.value)}
                      disabled={isGenerating}
                    />
                    <span className="text-sm">{type.label}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium mb-2">Imagini per Cameră</label>
                  <Select value={imagesPerRoom} onValueChange={setImagesPerRoom} disabled={isGenerating}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 imagine</SelectItem>
                      <SelectItem value="2">2 imagini</SelectItem>
                      <SelectItem value="3">3 imagini</SelectItem>
                      <SelectItem value="4">4 imagini</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedRoomTypes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedRoomTypes.map(roomValue => {
                    const room = ROOM_TYPES.find(r => r.value === roomValue);
                    return (
                      <Badge key={roomValue} variant="secondary" className="gap-1">
                        {room?.label}
                        <X 
                          className="w-3 h-3 cursor-pointer hover:text-destructive" 
                          onClick={() => toggleRoomType(roomValue)}
                        />
                      </Badge>
                    );
                  })}
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                Total: {selectedRoomTypes.length * parseInt(imagesPerRoom)} imagini vor fi generate
              </p>
            </div>
          ) : (
            /* Single Room Mode - Basic Options */
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
          )}

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

          {/* Progress indicator for batch mode */}
          {isGenerating && batchMode && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progres: {currentBatchRoom}</span>
                <span>{batchProgress}%</span>
              </div>
              <Progress value={batchProgress} className="h-2" />
            </div>
          )}

          <Button 
            onClick={generateImages}
            disabled={
              !description.trim() || 
              isGenerating || 
              (batchMode && selectedRoomTypes.length === 0)
            }
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {batchMode ? `Generez ${currentBatchRoom}...` : "Generez imagini..."}
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                {batchMode 
                  ? `Generează ${selectedRoomTypes.length * parseInt(imagesPerRoom)} Imagini`
                  : "Generează Imagini"
                }
              </>
            )}
          </Button>
        </div>

        {generatedImages.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-lg font-semibold">
                Imagini Generate ({generatedImages.length})
              </h3>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={saveAllImagesToStorage}
                  size="sm"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Salvează în Galerie
                </Button>
                <Button 
                  variant="outline" 
                  onClick={downloadAllImages}
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descarcă Toate
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {generatedImages.map((img) => (
                <div key={img.index} className="relative group">
                  <img
                    src={img.imageUrl}
                    alt={`Apartament ${img.index}`}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => saveSingleImage(img)}
                      disabled={isSaving}
                    >
                      <Save className="w-4 h-4" />
                    </Button>
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

// Gallery Component
const ImageGallery = ({ 
  images, 
  isLoading, 
  onDelete,
  onRefresh 
}: { 
  images: { name: string; url: string; createdAt: string }[];
  isLoading: boolean;
  onDelete: (filename: string) => void;
  onRefresh: () => void;
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>("all");
  const [selectedStyleFilter, setSelectedStyleFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  
  // Multi-select state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  const toggleImageSelection = (imageName: string) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageName)) {
        newSet.delete(imageName);
      } else {
        newSet.add(imageName);
      }
      return newSet;
    });
  };

  const selectAllFiltered = () => {
    setSelectedImages(new Set(filteredImages.map(img => img.name)));
  };

  const clearSelection = () => {
    setSelectedImages(new Set());
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedImages(new Set());
  };

  // Extract room types and styles from filenames
  const extractRoomFromFilename = (filename: string): string => {
    const roomMappings: Record<string, string> = {
      'living': 'Living',
      'bedroom': 'Dormitor',
      'kitchen': 'Bucătărie',
      'bathroom': 'Baie',
      'office': 'Birou',
      'dining': 'Sufragerie',
      'balcony': 'Balcon/Terasă',
      'hallway': 'Hol',
      'exterior': 'Exterior',
      'pool': 'Piscină',
      'garden': 'Grădină',
    };

    const lowerFilename = filename.toLowerCase();
    for (const [key, label] of Object.entries(roomMappings)) {
      if (lowerFilename.includes(key)) {
        return label;
      }
    }
    return 'Altele';
  };

  const extractStyleFromFilename = (filename: string): string => {
    const styleMappings: Record<string, string> = {
      'modern': 'Modern',
      'minimalist': 'Minimalist',
      'classic': 'Clasic',
      'scandinavian': 'Scandinav',
      'industrial': 'Industrial',
      'luxury': 'Luxos',
      'bohemian': 'Boho',
      'art-deco': 'Art Deco',
      'rustic': 'Rustic',
      'coastal': 'Mediteranean',
    };

    const lowerFilename = filename.toLowerCase();
    for (const [key, label] of Object.entries(styleMappings)) {
      if (lowerFilename.includes(key)) {
        return label;
      }
    }
    return 'Altele';
  };

  // Get unique room types and styles from images
  const roomTypes = ['all', ...new Set(images.map(img => extractRoomFromFilename(img.name)))];
  const styles = ['all', ...new Set(images.map(img => extractStyleFromFilename(img.name)))];

  // Filter images
  const filteredImages = images.filter(img => {
    // Search filter
    if (searchQuery && !img.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Room type filter
    if (selectedRoomFilter !== 'all' && extractRoomFromFilename(img.name) !== selectedRoomFilter) {
      return false;
    }

    // Style filter
    if (selectedStyleFilter !== 'all' && extractStyleFromFilename(img.name) !== selectedStyleFilter) {
      return false;
    }

    // Date range filter
    const imageDate = new Date(img.createdAt);
    if (dateFrom && isBefore(imageDate, startOfDay(dateFrom))) {
      return false;
    }
    if (dateTo && isAfter(imageDate, endOfDay(dateTo))) {
      return false;
    }

    return true;
  });

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedRoomFilter("all");
    setSelectedStyleFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const hasActiveFilters = searchQuery || selectedRoomFilter !== 'all' || selectedStyleFilter !== 'all' || dateFrom || dateTo;

  const downloadFromGallery = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
      return true;
    } catch (error) {
      console.error('Error downloading:', error);
      return false;
    }
  };

  const downloadSelectedImages = async () => {
    if (selectedImages.size === 0) return;
    
    setIsProcessingBulk(true);
    let successCount = 0;
    
    try {
      toast.info(`Descărcare ${selectedImages.size} imagini...`);
      
      for (const imageName of selectedImages) {
        const img = images.find(i => i.name === imageName);
        if (img) {
          const success = await downloadFromGallery(img.url, img.name);
          if (success) successCount++;
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      toast.success(`${successCount} imagini descărcate`);
    } catch (error) {
      toast.error("Eroare la descărcarea imaginilor");
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const deleteSelectedImages = async () => {
    if (selectedImages.size === 0) return;
    
    setIsProcessingBulk(true);
    let successCount = 0;
    
    try {
      toast.info(`Ștergere ${selectedImages.size} imagini...`);
      
      for (const imageName of selectedImages) {
        try {
          await onDeleteBulk(imageName);
          successCount++;
        } catch (err) {
          console.error(`Error deleting ${imageName}:`, err);
        }
      }
      
      toast.success(`${successCount} imagini șterse`);
      clearSelection();
      onRefresh();
    } catch (error) {
      toast.error("Eroare la ștergerea imaginilor");
    } finally {
      setIsProcessingBulk(false);
    }
  };

  // Helper for bulk delete (we need to add this to props)
  const onDeleteBulk = async (filename: string) => {
    onDelete(filename);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Nu există imagini salvate în galerie</p>
        <p className="text-sm">Generează și salvează imagini pentru a le vedea aici</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Section */}
      <div className="space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Caută imagini..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-2">
          {/* Room type filter */}
          <Select value={selectedRoomFilter} onValueChange={setSelectedRoomFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Tip cameră" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate camerele</SelectItem>
              {roomTypes.filter(r => r !== 'all').map(room => (
                <SelectItem key={room} value={room}>{room}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Style filter */}
          <Select value={selectedStyleFilter} onValueChange={setSelectedStyleFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Stil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate stilurile</SelectItem>
              {styles.filter(s => s !== 'all').map(style => (
                <SelectItem key={style} value={style}>{style}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date from filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                <Calendar className="w-4 h-4 mr-2" />
                {dateFrom ? format(dateFrom, 'dd.MM.yyyy') : 'De la...'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={dateFrom}
                onSelect={setDateFrom}
                locale={ro}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Date to filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                <Calendar className="w-4 h-4 mr-2" />
                {dateTo ? format(dateTo, 'dd.MM.yyyy') : 'Până la...'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
                locale={ro}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-1" />
              Resetează
            </Button>
          )}
        </div>
      </div>

      {/* Selection Mode Toolbar */}
      {selectionMode && (
        <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">
              {selectedImages.size} selectate
            </span>
            <Button variant="ghost" size="sm" onClick={selectAllFiltered}>
              <CheckSquare className="w-4 h-4 mr-1" />
              Selectează toate ({filteredImages.length})
            </Button>
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              <X className="w-4 h-4 mr-1" />
              Deselectează
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadSelectedImages}
              disabled={selectedImages.size === 0 || isProcessingBulk}
            >
              {isProcessingBulk ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-1" />
              )}
              Descarcă
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={selectedImages.size === 0 || isProcessingBulk}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Șterge
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Șterge {selectedImages.size} imagini?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Această acțiune nu poate fi anulată. Toate imaginile selectate vor fi șterse permanent din galerie.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Anulează</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteSelectedImages}>
                    Șterge {selectedImages.size} imagini
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="ghost" size="sm" onClick={exitSelectionMode}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Results header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredImages.length === images.length 
            ? `${images.length} imagini salvate`
            : `${filteredImages.length} din ${images.length} imagini`
          }
        </p>
        <div className="flex items-center gap-2">
          {!selectionMode && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSelectionMode(true)}
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              Selectare
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reîncarcă
          </Button>
        </div>
      </div>

      {/* Images grid */}
      {filteredImages.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Nu s-au găsit imagini</p>
          <p className="text-sm">Încearcă să modifici filtrele sau să cauți altceva</p>
          <Button variant="link" onClick={clearFilters} className="mt-2">
            Resetează filtrele
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredImages.map((img) => (
            <div 
              key={img.name} 
              className={`relative group cursor-pointer ${
                selectionMode && selectedImages.has(img.name) 
                  ? 'ring-2 ring-primary ring-offset-2 rounded-lg' 
                  : ''
              }`}
              onClick={() => selectionMode && toggleImageSelection(img.name)}
            >
              {/* Selection checkbox */}
              {selectionMode && (
                <div className="absolute top-2 right-2 z-10">
                  <Checkbox
                    checked={selectedImages.has(img.name)}
                    onCheckedChange={() => toggleImageSelection(img.name)}
                    className="bg-background border-2"
                  />
                </div>
              )}
              
              <img
                src={img.url}
                alt={img.name}
                className="w-full h-40 object-cover rounded-lg"
              />
              <div className="absolute top-2 left-2 flex flex-wrap gap-1 max-w-[60%]">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                  {extractRoomFromFilename(img.name)}
                </Badge>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-background/80">
                  {extractStyleFromFilename(img.name)}
                </Badge>
              </div>
              
              {!selectionMode && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadFromGallery(img.url, img.name).then(success => {
                        if (success) toast.success("Imaginea a fost descărcată");
                        else toast.error("Eroare la descărcarea imaginii");
                      });
                    }}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive" onClick={(e) => e.stopPropagation()}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Șterge imaginea?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Această acțiune nu poate fi anulată. Imaginea va fi ștearsă permanent din galerie.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Anulează</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(img.name)}>
                          Șterge
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
              <p className="text-xs mt-1 text-center truncate text-muted-foreground">
                {format(new Date(img.createdAt), 'dd MMM yyyy, HH:mm', { locale: ro })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Main Export with Tabs
export const FurnishedImageGeneratorWithGallery = () => {
  return <FurnishedImageGenerator />;
};

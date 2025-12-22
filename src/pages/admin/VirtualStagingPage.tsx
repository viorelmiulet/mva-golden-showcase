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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Sparkles,
  Images,
  Save,
  FolderOpen,
  Trash2,
  Check,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn
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

interface UploadedImage {
  id: string;
  base64: string;
  name: string;
  roomType: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  result?: string;
  savedUrl?: string;
  error?: string;
}

interface SavedImage {
  name: string;
  url: string;
  createdAt: string;
}

export default function VirtualStagingPage() {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [defaultRoomType, setDefaultRoomType] = useState("living");
  const [style, setStyle] = useState("modern");
  const [additionalPrompt, setAdditionalPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedImages, setSavedImages] = useState<SavedImage[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Preview dialog state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'original' | 'result' | 'compare'>('compare');
  const [previewImageId, setPreviewImageId] = useState<string | null>(null);

  const openPreview = (imageId: string, mode: 'original' | 'result' | 'compare' = 'compare') => {
    setPreviewImageId(imageId);
    setPreviewMode(mode);
    setPreviewOpen(true);
  };

  const previewImage = uploadedImages.find(img => img.id === previewImageId);
  
  const navigatePreview = (direction: 'prev' | 'next') => {
    const imagesWithResults = uploadedImages.filter(img => img.result);
    const currentIndex = imagesWithResults.findIndex(img => img.id === previewImageId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'next' 
      ? (currentIndex + 1) % imagesWithResults.length
      : (currentIndex - 1 + imagesWithResults.length) % imagesWithResults.length;
    
    setPreviewImageId(imagesWithResults[newIndex].id);
  };

  const loadSavedImages = async () => {
    setIsLoadingSaved(true);
    try {
      const { data, error } = await supabase.storage
        .from('virtual-staging')
        .list('', { sortBy: { column: 'created_at', order: 'desc' } });

      if (error) throw error;

      const images = data
        .filter(file => file.name.endsWith('.png') || file.name.endsWith('.jpg') || file.name.endsWith('.webp'))
        .map(file => ({
          name: file.name,
          url: supabase.storage.from('virtual-staging').getPublicUrl(file.name).data.publicUrl,
          createdAt: file.created_at || new Date().toISOString(),
        }));

      setSavedImages(images);
    } catch (error: any) {
      console.error('Error loading saved images:', error);
      toast.error('Eroare la încărcarea imaginilor salvate');
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const handleSaveImage = async (imageId: string) => {
    const img = uploadedImages.find(i => i.id === imageId);
    if (!img?.result) return;

    setIsSaving(true);
    try {
      const response = await fetch(img.result);
      const blob = await response.blob();
      
      const fileName = `staging-${img.roomType}-${style}-${Date.now()}-${img.name}.png`;
      
      const { error } = await supabase.storage
        .from('virtual-staging')
        .upload(fileName, blob, {
          contentType: 'image/png',
          upsert: false
        });

      if (error) throw error;

      const publicUrl = supabase.storage.from('virtual-staging').getPublicUrl(fileName).data.publicUrl;
      
      setUploadedImages(prev => prev.map(i => 
        i.id === imageId ? { ...i, savedUrl: publicUrl } : i
      ));

      toast.success('Imagine salvată în cloud!');
    } catch (error: any) {
      console.error('Error saving image:', error);
      toast.error('Eroare la salvare: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAllImages = async () => {
    const imagesToSave = uploadedImages.filter(img => img.result && !img.savedUrl);
    if (imagesToSave.length === 0) return;

    setIsSaving(true);
    let savedCount = 0;
    
    for (const img of imagesToSave) {
      try {
        const response = await fetch(img.result!);
        const blob = await response.blob();
        
        const fileName = `staging-${img.roomType}-${style}-${Date.now()}-${img.name}.png`;
        
        const { error } = await supabase.storage
          .from('virtual-staging')
          .upload(fileName, blob, {
            contentType: 'image/png',
            upsert: false
          });

        if (!error) {
          const publicUrl = supabase.storage.from('virtual-staging').getPublicUrl(fileName).data.publicUrl;
          setUploadedImages(prev => prev.map(i => 
            i.id === img.id ? { ...i, savedUrl: publicUrl } : i
          ));
          savedCount++;
        }
      } catch (error) {
        console.error('Error saving image:', error);
      }
    }
    
    setIsSaving(false);
    if (savedCount > 0) {
      toast.success(`${savedCount} ${savedCount === 1 ? 'imagine salvată' : 'imagini salvate'}!`);
    }
  };

  const handleDeleteSavedImage = async (fileName: string) => {
    try {
      const { error } = await supabase.storage
        .from('virtual-staging')
        .remove([fileName]);

      if (error) throw error;

      setSavedImages(prev => prev.filter(img => img.name !== fileName));
      toast.success('Imagine ștearsă!');
    } catch (error: any) {
      console.error('Error deleting image:', error);
      toast.error('Eroare la ștergere: ' + error.message);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = 5 - uploadedImages.length;
    if (remainingSlots <= 0) {
      toast.error("Poți încărca maxim 5 imagini simultan");
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);
    
    filesToProcess.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}: Imaginea este prea mare. Maxim 10MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const newImage: UploadedImage = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          base64: event.target?.result as string,
          name: file.name.replace(/\.[^/.]+$/, ""),
          roomType: defaultRoomType,
          status: 'pending'
        };
        setUploadedImages(prev => [...prev, newImage]);
        if (!selectedImageId) {
          setSelectedImageId(newImage.id);
        }
      };
      reader.readAsDataURL(file);
    });

    if (files.length > remainingSlots) {
      toast.warning(`Doar ${remainingSlots} imagini au fost adăugate (maxim 5)`);
    }
  };

  const handleRemoveImage = (imageId: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
    if (selectedImageId === imageId) {
      const remaining = uploadedImages.filter(img => img.id !== imageId);
      setSelectedImageId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleRoomTypeChange = (imageId: string, newRoomType: string) => {
    setUploadedImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, roomType: newRoomType } : img
    ));
  };

  const handleStaging = async () => {
    const pendingImages = uploadedImages.filter(img => img.status === 'pending');
    if (pendingImages.length === 0) {
      toast.error("Nu ai imagini de procesat");
      return;
    }

    setIsProcessing(true);
    
    // Set all pending to processing
    setUploadedImages(prev => prev.map(img => 
      img.status === 'pending' ? { ...img, status: 'processing' as const } : img
    ));

    // Process images in parallel with delay to avoid rate limiting
    const processImage = async (img: UploadedImage, index: number) => {
      // Delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, index * 2000));
      
      try {
        const { data, error } = await supabase.functions.invoke("virtual-staging", {
          body: {
            imageBase64: img.base64,
            roomType: img.roomType,
            style,
            additionalPrompt,
            numberOfImages: 1,
          },
        });

        if (error) throw error;

        if (data.error) {
          throw new Error(data.error);
        }

        if (data.images && data.images.length > 0) {
          setUploadedImages(prev => prev.map(i => 
            i.id === img.id 
              ? { ...i, status: 'done' as const, result: data.images[0].imageUrl }
              : i
          ));
        } else {
          throw new Error("Nu s-a generat nicio imagine");
        }
      } catch (error: any) {
        console.error("Error processing image:", error);
        setUploadedImages(prev => prev.map(i => 
          i.id === img.id 
            ? { ...i, status: 'error' as const, error: error.message }
            : i
        ));
      }
    };

    // Process all images
    await Promise.all(pendingImages.map((img, index) => processImage(img, index)));
    
    setIsProcessing(false);
    
    const successCount = uploadedImages.filter(img => img.status === 'done').length + 
                         pendingImages.filter(img => img.status !== 'error').length;
    if (successCount > 0) {
      toast.success(`${successCount} ${successCount === 1 ? 'imagine procesată' : 'imagini procesate'}!`);
    }
  };

  const handleDownload = (imageUrl: string, name: string, imgRoomType?: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `virtual-staging-${imgRoomType || 'room'}-${style}-${name}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Imagine descărcată!");
  };

  const handleDownloadAll = () => {
    const completedImages = uploadedImages.filter(img => img.result);
    completedImages.forEach((img, idx) => {
      setTimeout(() => {
        handleDownload(img.result!, img.name, img.roomType);
      }, idx * 500);
    });
  };

  const handleReset = () => {
    setUploadedImages([]);
    setSelectedImageId(null);
    setAdditionalPrompt("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const selectedImage = uploadedImages.find(img => img.id === selectedImageId);
  const pendingCount = uploadedImages.filter(img => img.status === 'pending').length;
  const processingCount = uploadedImages.filter(img => img.status === 'processing').length;
  const doneCount = uploadedImages.filter(img => img.status === 'done').length;
  const hasResults = uploadedImages.some(img => img.result);

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
            <CardDescription>
              Încarcă până la 5 imagini diferite și selectează stilul dorit
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-3">
              <Label className="flex items-center justify-between">
                <span>Imagini Camere ({uploadedImages.length}/5)</span>
                {uploadedImages.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleReset}
                    className="text-xs h-6"
                  >
                    Șterge toate
                  </Button>
                )}
              </Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              
              {/* Uploaded Images Grid */}
              {uploadedImages.length > 0 && (
                <div className="space-y-2">
                  {uploadedImages.map((img) => {
                    const currentRoomType = roomTypes.find(r => r.value === img.roomType);
                    const RoomIcon = currentRoomType?.icon || Sofa;
                    return (
                      <div 
                        key={img.id}
                        onClick={() => setSelectedImageId(img.id)}
                        className={`relative flex items-center gap-3 p-2 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedImageId === img.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-transparent hover:border-muted-foreground/30 hover:bg-muted/30'
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                          <img
                            src={img.base64}
                            alt={img.name}
                            className="w-full h-full object-cover"
                          />
                          {/* Status badge */}
                          <div className={`absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center ${
                            img.status === 'done' ? 'bg-green-500' :
                            img.status === 'processing' ? 'bg-yellow-500' :
                            img.status === 'error' ? 'bg-red-500' :
                            'bg-muted-foreground/50'
                          }`}>
                            {img.status === 'processing' && (
                              <Loader2 className="h-2.5 w-2.5 text-white animate-spin" />
                            )}
                            {img.status === 'done' && (
                              <Check className="h-2.5 w-2.5 text-white" />
                            )}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{img.name}</p>
                          {/* Room type selector */}
                          <Select 
                            value={img.roomType} 
                            onValueChange={(value) => handleRoomTypeChange(img.id, value)}
                          >
                            <SelectTrigger 
                              className="h-7 w-full mt-1 text-xs"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center gap-1.5">
                                <RoomIcon className="h-3 w-3" />
                                <SelectValue />
                              </div>
                            </SelectTrigger>
                            <SelectContent className="bg-popover z-50">
                              {roomTypes.map((room) => {
                                const Icon = room.icon;
                                return (
                                  <SelectItem key={room.value} value={room.value}>
                                    <div className="flex items-center gap-2">
                                      <Icon className="h-3.5 w-3.5" />
                                      <span>{room.label}</span>
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Remove button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(img.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                  
                  {/* Add more button */}
                  {uploadedImages.length < 5 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-3 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 hover:border-primary hover:bg-muted/50 transition-colors text-muted-foreground"
                    >
                      <Upload className="h-4 w-4" />
                      <span className="text-sm">Adaugă imagine ({5 - uploadedImages.length} locuri)</span>
                    </button>
                  )}
                </div>
              )}

              {/* Empty state upload */}
              {uploadedImages.length === 0 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-3 hover:border-primary hover:bg-muted/50 transition-colors"
                >
                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  <div className="text-center">
                    <p className="font-medium">Click pentru a încărca imagini</p>
                    <p className="text-sm text-muted-foreground">Până la 5 imagini (max 10MB fiecare)</p>
                  </div>
                </button>
              )}
            </div>

            {/* Default Room Type for new uploads */}
            <div className="space-y-3">
              <Label>Tip Cameră Implicit (pentru imagini noi)</Label>
              <div className="grid grid-cols-3 gap-2">
                {roomTypes.map((room) => {
                  const Icon = room.icon;
                  return (
                    <button
                      key={room.value}
                      onClick={() => setDefaultRoomType(room.value)}
                      className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-all text-xs ${
                        defaultRoomType === room.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "hover:border-muted-foreground/50"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">{room.label}</span>
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
                disabled={pendingCount === 0 || isProcessing}
                className="flex-1 gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Se procesează {processingCount} imagini...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Procesează {pendingCount > 0 ? `${pendingCount} ${pendingCount === 1 ? 'Imagine' : 'Imagini'}` : 'Imaginile'}
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleReset} disabled={isProcessing}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {/* Status summary */}
            {uploadedImages.length > 0 && (
              <div className="flex gap-4 text-sm text-muted-foreground">
                {pendingCount > 0 && <span>⏳ {pendingCount} în așteptare</span>}
                {processingCount > 0 && <span>🔄 {processingCount} în procesare</span>}
                {doneCount > 0 && <span>✓ {doneCount} finalizate</span>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Result */}
        <Card>
          <CardHeader>
            <CardTitle>Rezultat</CardTitle>
            <CardDescription>
              {hasResults 
                ? `${doneCount} ${doneCount === 1 ? 'imagine procesată' : 'imagini procesate'}`
                : 'Imaginile cu mobilare virtuală'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isProcessing && !selectedImage?.result ? (
              <div className="h-96 rounded-lg border bg-muted/30 flex flex-col items-center justify-center gap-4">
                <div className="relative">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <Sparkles className="h-6 w-6 text-primary absolute -top-1 -right-1 animate-pulse" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Se generează mobilarea virtuală...</p>
                  <p className="text-sm text-muted-foreground">
                    Se procesează {processingCount} imagini (poate dura 1-3 minute)
                  </p>
                </div>
              </div>
            ) : selectedImage?.result ? (
              <div className="space-y-4">
                {/* Main Image - Before/After */}
                <div className="grid grid-cols-2 gap-2">
                  <div 
                    className="relative cursor-pointer group"
                    onClick={() => openPreview(selectedImage.id, 'original')}
                  >
                    <img
                      src={selectedImage.base64}
                      alt="Original"
                      className="w-full rounded-lg border transition-transform group-hover:scale-[1.02]"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                      Original
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="secondary" className="h-7 w-7">
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div 
                    className="relative group cursor-pointer"
                    onClick={() => openPreview(selectedImage.id, 'result')}
                  >
                    <img
                      src={selectedImage.result}
                      alt="Staged"
                      className="w-full rounded-lg border transition-transform group-hover:scale-[1.02]"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                      Mobilat
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button size="icon" variant="secondary" className="h-7 w-7">
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Full Preview Button */}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => openPreview(selectedImage.id, 'compare')}
                  className="w-full gap-2"
                >
                  <Maximize2 className="h-4 w-4" />
                  Previzualizare Completă (Before/After)
                </Button>

                {/* Thumbnails of all completed */}
                {doneCount > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {uploadedImages.filter(img => img.result).map((img) => (
                      <button
                        key={img.id}
                        onClick={() => setSelectedImageId(img.id)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                          img.id === selectedImageId 
                            ? 'border-primary ring-2 ring-primary/30' 
                            : 'border-transparent hover:border-muted-foreground/50'
                        }`}
                      >
                        <img
                          src={img.result}
                          alt={img.name}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => handleDownload(selectedImage.result!, selectedImage.name, selectedImage.roomType)} 
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Descarcă
                  </Button>
                  {doneCount > 1 && (
                    <Button
                      variant="outline"
                      onClick={handleDownloadAll}
                      className="gap-2"
                    >
                      <Images className="h-4 w-4" />
                      Toate ({doneCount})
                    </Button>
                  )}
                  <Button
                    variant="default"
                    onClick={() => handleSaveImage(selectedImage.id)}
                    disabled={isSaving || !!selectedImage.savedUrl}
                    className="gap-2"
                  >
                    {selectedImage.savedUrl ? (
                      <>
                        <Check className="h-4 w-4" />
                        Salvată
                      </>
                    ) : isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Se salvează...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Salvează
                      </>
                    )}
                  </Button>
                  {doneCount > 1 && uploadedImages.some(img => img.result && !img.savedUrl) && (
                    <Button
                      variant="secondary"
                      onClick={handleSaveAllImages}
                      disabled={isSaving}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Salvează Toate
                    </Button>
                  )}
                </div>
              </div>
            ) : selectedImage?.status === 'error' ? (
              <div className="h-96 rounded-lg border-2 border-dashed border-red-300 flex flex-col items-center justify-center gap-3 text-red-500">
                <Trash2 className="h-12 w-12" />
                <div className="text-center">
                  <p className="font-medium">Eroare la procesare</p>
                  <p className="text-sm">{selectedImage.error || 'A apărut o eroare'}</p>
                </div>
              </div>
            ) : (
              <div className="h-96 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <Wand2 className="h-12 w-12" />
                <div className="text-center">
                  <p className="font-medium">Nicio imagine procesată</p>
                  <p className="text-sm">Încarcă imagini și apasă "Procesează"</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Saved Images */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Imagini Salvate
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowSaved(!showSaved);
                if (!showSaved) loadSavedImages();
              }}
            >
              {showSaved ? 'Ascunde' : 'Vezi Toate'}
            </Button>
          </div>
        </CardHeader>
        {showSaved && (
          <CardContent>
            {isLoadingSaved ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : savedImages.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {savedImages.map((img) => (
                  <div key={img.name} className="group relative">
                    <img
                      src={img.url}
                      alt={img.name}
                      className="w-full aspect-square object-cover rounded-lg border"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = img.url;
                          link.download = img.name;
                          link.click();
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8"
                        onClick={() => handleDeleteSavedImage(img.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {new Date(img.createdAt).toLocaleDateString('ro-RO')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nu ai imagini salvate încă
              </p>
            )}
          </CardContent>
        )}
      </Card>

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
              Încarcă mai multe imagini pentru procesare batch eficientă
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ZoomIn className="h-5 w-5" />
                Previzualizare: {previewImage?.name || 'Imagine'}
              </span>
              <div className="flex items-center gap-2">
                {/* Mode Toggles */}
                <div className="flex rounded-lg border overflow-hidden">
                  <button
                    onClick={() => setPreviewMode('original')}
                    className={`px-3 py-1.5 text-xs transition-colors ${
                      previewMode === 'original' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    Original
                  </button>
                  <button
                    onClick={() => setPreviewMode('compare')}
                    className={`px-3 py-1.5 text-xs transition-colors ${
                      previewMode === 'compare' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    Compară
                  </button>
                  <button
                    onClick={() => setPreviewMode('result')}
                    className={`px-3 py-1.5 text-xs transition-colors ${
                      previewMode === 'result' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    Mobilat
                  </button>
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="relative flex-1 p-4 pt-2">
            {previewImage && (
              <>
                {/* Navigation Arrows */}
                {uploadedImages.filter(img => img.result).length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-6 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full shadow-lg"
                      onClick={() => navigatePreview('prev')}
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-6 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full shadow-lg"
                      onClick={() => navigatePreview('next')}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </>
                )}

                {/* Image Content */}
                <div className="flex items-center justify-center h-[calc(95vh-140px)]">
                  {previewMode === 'compare' ? (
                    <div className="grid grid-cols-2 gap-4 w-full h-full max-w-6xl">
                      <div className="relative flex items-center justify-center bg-muted/20 rounded-lg overflow-hidden">
                        <img
                          src={previewImage.base64}
                          alt="Original"
                          className="max-w-full max-h-full object-contain"
                        />
                        <div className="absolute bottom-3 left-3 bg-black/70 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                          Original
                        </div>
                      </div>
                      <div className="relative flex items-center justify-center bg-muted/20 rounded-lg overflow-hidden">
                        <img
                          src={previewImage.result}
                          alt="Staged"
                          className="max-w-full max-h-full object-contain"
                        />
                        <div className="absolute bottom-3 left-3 bg-black/70 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                          Mobilat
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative flex items-center justify-center bg-muted/20 rounded-lg overflow-hidden w-full h-full max-w-5xl">
                      <img
                        src={previewMode === 'original' ? previewImage.base64 : previewImage.result}
                        alt={previewMode === 'original' ? 'Original' : 'Staged'}
                        className="max-w-full max-h-full object-contain"
                      />
                      <div className="absolute bottom-3 left-3 bg-black/70 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                        {previewMode === 'original' ? 'Original' : 'Mobilat'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => previewImage.result && handleDownload(previewImage.result, previewImage.name, previewImage.roomType)}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Descarcă
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => handleSaveImage(previewImage.id)}
                    disabled={isSaving || !!previewImage.savedUrl}
                    className="gap-2"
                  >
                    {previewImage.savedUrl ? (
                      <>
                        <Check className="h-4 w-4" />
                        Salvată
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Salvează în Cloud
                      </>
                    )}
                  </Button>
                </div>

                {/* Thumbnails */}
                {uploadedImages.filter(img => img.result).length > 1 && (
                  <div className="flex justify-center gap-2 mt-4 overflow-x-auto pb-2">
                    {uploadedImages.filter(img => img.result).map((img) => (
                      <button
                        key={img.id}
                        onClick={() => setPreviewImageId(img.id)}
                        className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                          img.id === previewImageId 
                            ? 'border-primary ring-2 ring-primary/30' 
                            : 'border-transparent hover:border-muted-foreground/50 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={img.result}
                          alt={img.name}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

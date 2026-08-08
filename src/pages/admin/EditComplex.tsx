import { supabase } from "@/integrations/supabase/client";
import DevelopmentVideosField, { videoRowsFrom, type VideoEntry } from "@/components/admin/DevelopmentVideosField";
import { youtubeWatchUrl } from "@/lib/videoEmbed";
import { invokeAdminFn } from "@/lib/adminInvoke";
import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "@/lib/router-compat";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Building2, ArrowLeft, Upload, X, Loader2 } from "lucide-react";

// NOTE: the legacy `videos` jsonb column on real_estate_projects is no longer
// written to. One video per development lives in video_manual / video_id.
// The column can be dropped once the remaining legacy rows are migrated.

const EditComplex = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    description: "",
    developer: "",
    price_range: "",
    surface_range: "",
    rooms_range: "",
    completion_date: "",
    status: "available",
    main_image: "",
  });
  const [videos, setVideos] = useState<VideoEntry[]>([]);

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project-edit', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('real_estate_projects')
        .select('*, project_videos(youtube_id, title, position)')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || "",
        location: project.location || "",
        description: project.description || "",
        developer: project.developer || "",
        price_range: project.price_range || "",
        surface_range: project.surface_range || "",
        rooms_range: project.rooms_range || "",
        completion_date: project.completion_date || "",
        status: project.status || "available",
        main_image: project.main_image || "",
      });
      const rows = Array.isArray((project as any).project_videos) ? (project as any).project_videos : [];
      setVideos(
        [...rows]
          .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
          .map((v: any) => ({ url: youtubeWatchUrl(v.youtube_id), title: v.title || "" })),
      );
      setImagePreview(project.main_image);
    }
  }, [project]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Imaginea nu poate depăși 5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return formData.main_image;

    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });
      
      const imageData = await base64Promise;
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      
      // Use edge function to upload (bypasses RLS)
      const { data: response, error } = await invokeAdminFn('admin-complexes', {
        body: {
          action: 'upload_image',
          data: {
            imageData,
            fileName,
            folder: 'complexes'
          }
        }
      });
      
      if (error) throw error;
      
      if (!response?.success) {
        throw new Error(response?.error || "Nu s-a putut încărca imaginea");
      }
      
      return response.url;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error("Eroare la încărcarea imaginii");
      return formData.main_image;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.location.trim()) {
      toast.error("Numele și locația sunt obligatorii");
      return;
    }

    const videoRows = videoRowsFrom(videos);
    if (!videoRows) {
      toast.error("Link YouTube invalid — corectează lista de videoclipuri");
      return;
    }

    setIsLoading(true);

    try {
      // Upload new image if selected
      const imageUrl = await uploadImage();

      // Use edge function to update the complex (bypasses RLS)
      const { data: response, error } = await invokeAdminFn('admin-complexes', {
        body: {
          action: 'update_complex',
          id: id,
          data: {
            name: formData.name.trim(),
            location: formData.location.trim(),
            description: formData.description.trim() || null,
            developer: formData.developer.trim() || null,
            price_range: formData.price_range.trim() || null,
            surface_range: formData.surface_range.trim() || null,
            rooms_range: formData.rooms_range.trim() || null,
            completion_date: formData.completion_date.trim() || null,
            status: formData.status,
            main_image: imageUrl,
          }
        }
      });

      if (error) throw error;
      
      if (!response?.success) {
        throw new Error(response?.error || "Nu s-a putut actualiza complexul");
      }

      const { data: videoResponse, error: videoError } = await invokeAdminFn('admin-complexes', {
        body: { action: 'set_complex_videos', id, data: { videos: videoRows } },
      });
      if (videoError) throw videoError;
      if (!videoResponse?.success) {
        throw new Error(videoResponse?.error || "Videoclipurile nu au putut fi salvate");
      }
      const persisted = (videoResponse.data ?? []) as { youtube_id: string; title: string | null }[];
      if (persisted.length !== videoRows.length) {
        throw new Error("Serverul nu a confirmat salvarea videoclipurilor");
      }
      setVideos(persisted.map((v) => ({ url: youtubeWatchUrl(v.youtube_id), title: v.title || "" })));

      // Invalidate all related queries to refresh the data
      await queryClient.invalidateQueries({ queryKey: ['project-edit', id] });
      await queryClient.invalidateQueries({ queryKey: ['project', id] });
      await queryClient.invalidateQueries({ queryKey: ['public-project', id] });
      await queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
      await queryClient.invalidateQueries({ queryKey: ['public-projects'] });

      await queryClient.refetchQueries({ queryKey: ['project-edit', id] });

      toast.success(
        videoRows.length
          ? `Complexul a fost actualizat. ${videoRows.length} videoclip(uri) salvate.`
          : "Complexul a fost actualizat. Fără videoclipuri.",
      );
      navigate(`/admin/complexe/${id}`);
    } catch (error: any) {
      console.error('Error updating complex:', error);
      toast.error(`Salvarea a eșuat: ${error.message || "Eroare la actualizarea complexului"}`, {
        duration: 8000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Complexul nu a fost găsit</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 md:p-6">
      <div className="mb-6">
        <Link to={`/admin/complexe/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Înapoi la complex
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Editează Complex: {project.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Imagine Copertă</Label>
              <div className="flex flex-col gap-4">
                {imagePreview ? (
                  <div className="relative w-full h-64 rounded-lg overflow-hidden border">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    {/* Change image button */}
                    <label className="absolute bottom-2 left-2 cursor-pointer">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="pointer-events-none"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Schimbă imagine
                      </Button>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageSelect}
                      />
                    </label>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                        setFormData({ ...formData, main_image: "" });
                      }}
                      aria-label="Elimină imaginea"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <Upload className="h-12 w-12 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Click pentru a încărca imagine
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      Max 5MB
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageSelect}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nume Complex *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Renew Residence"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Locație *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Ex: Chiajna, Ilfov"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="developer">Dezvoltator</Label>
                <Input
                  id="developer"
                  value={formData.developer}
                  onChange={(e) => setFormData({ ...formData, developer: e.target.value })}
                  placeholder="Ex: Nordis Group"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="completion_date">Dată Finalizare</Label>
                <Input
                  id="completion_date"
                  value={formData.completion_date}
                  onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
                  placeholder="Ex: Decembrie 2024"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price_range">Interval Preț</Label>
                <Input
                  id="price_range"
                  value={formData.price_range}
                  onChange={(e) => setFormData({ ...formData, price_range: e.target.value })}
                  placeholder="Ex: 65.000 - 120.000 EUR"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="surface_range">Interval Suprafață</Label>
                <Input
                  id="surface_range"
                  value={formData.surface_range}
                  onChange={(e) => setFormData({ ...formData, surface_range: e.target.value })}
                  placeholder="Ex: 45 - 85 mp"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rooms_range">Interval Camere</Label>
                <Input
                  id="rooms_range"
                  value={formData.rooms_range}
                  onChange={(e) => setFormData({ ...formData, rooms_range: e.target.value })}
                  placeholder="Ex: 2-3 camere"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="available">Disponibil</option>
                  <option value="sold_out">Vândut</option>
                  <option value="coming_soon">În Curând</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descriere</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrierea complexului rezidențial..."
                rows={5}
              />
            </div>

            {/* Manual YouTube video — applies to every property in this complex */}
            <DevelopmentVideosField
              value={videos}
              onChange={setVideos}
              hint="Primul videoclip se afișează ca player principal și este moștenit de proprietățile din ansamblu (videoul proprietății are prioritate). Trage rândurile pentru a schimba ordinea."
            />

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Se salvează..." : "Salvează Modificări"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/admin/complexe/${id}`)}
                disabled={isLoading}
              >
                Anulează
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditComplex;

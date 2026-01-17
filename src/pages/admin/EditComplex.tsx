import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Building2, ArrowLeft, Upload, X, Loader2, Plus, Video, Trash2, ChevronUp, ChevronDown, Pencil, Check } from "lucide-react";

interface VideoItem {
  url: string;
  title: string;
}

const EditComplex = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [editingVideoIndex, setEditingVideoIndex] = useState<number | null>(null);
  const [editingVideoTitle, setEditingVideoTitle] = useState("");
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

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project-edit', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('real_estate_projects')
        .select('*')
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
      setImagePreview(project.main_image);
      // Load videos from database
      const projectVideos = (project as any).videos;
      if (projectVideos && Array.isArray(projectVideos)) {
        setVideos(projectVideos);
      }
    }
  }, [project]);

  const extractYouTubeId = (url: string): string | null => {
    // Support for regular YouTube videos and YouTube Shorts
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const addVideo = () => {
    if (!newVideoUrl.trim()) {
      toast.error("Introduceți URL-ul videoclipului");
      return;
    }
    
    const videoId = extractYouTubeId(newVideoUrl);
    if (!videoId) {
      toast.error("URL-ul nu este un link YouTube valid");
      return;
    }

    setVideos([...videos, { url: newVideoUrl.trim(), title: newVideoTitle.trim() || `Video ${videos.length + 1}` }]);
    setNewVideoUrl("");
    setNewVideoTitle("");
    toast.success("Video adăugat");
  };

  const removeVideo = (index: number) => {
    setVideos(videos.filter((_, i) => i !== index));
    toast.success("Video eliminat");
  };

  const moveVideoUp = (index: number) => {
    if (index === 0) return;
    const newVideos = [...videos];
    [newVideos[index - 1], newVideos[index]] = [newVideos[index], newVideos[index - 1]];
    setVideos(newVideos);
  };

  const moveVideoDown = (index: number) => {
    if (index === videos.length - 1) return;
    const newVideos = [...videos];
    [newVideos[index], newVideos[index + 1]] = [newVideos[index + 1], newVideos[index]];
    setVideos(newVideos);
  };

  const startEditingVideo = (index: number) => {
    setEditingVideoIndex(index);
    setEditingVideoTitle(videos[index].title);
  };

  const saveVideoTitle = () => {
    if (editingVideoIndex === null) return;
    const newVideos = [...videos];
    newVideos[editingVideoIndex] = { ...newVideos[editingVideoIndex], title: editingVideoTitle.trim() || `Video ${editingVideoIndex + 1}` };
    setVideos(newVideos);
    setEditingVideoIndex(null);
    setEditingVideoTitle("");
    toast.success("Titlu actualizat");
  };

  const cancelEditingVideo = () => {
    setEditingVideoIndex(null);
    setEditingVideoTitle("");
  };

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
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `complexes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-images')
        .getPublicUrl(filePath);

      return publicUrl;
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

    setIsLoading(true);

    try {
      // Upload new image if selected
      const imageUrl = await uploadImage();

      // Update the complex and return the updated row
      const { data: updatedData, error } = await supabase
        .from('real_estate_projects')
        .update({
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
          videos: videos,
        } as any)
        .eq('id', id)
        .select();

      if (error) throw error;

      // Check if any rows were actually updated
      if (!updatedData || updatedData.length === 0) {
        toast.error("Nu s-a putut actualiza complexul. Verifică permisiunile.");
        return;
      }

      // Invalidate all related queries to refresh the data
      await queryClient.invalidateQueries({ queryKey: ['project-edit', id] });
      await queryClient.invalidateQueries({ queryKey: ['project', id] });
      await queryClient.invalidateQueries({ queryKey: ['public-project', id] });
      await queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
      await queryClient.invalidateQueries({ queryKey: ['public-projects'] });

      toast.success("Complexul a fost actualizat cu succes!");
      navigate(`/admin/complexe/${id}`);
    } catch (error) {
      console.error('Error updating complex:', error);
      toast.error("Eroare la actualizarea complexului");
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
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

            {/* Videos Section - Only for RENEW RESIDENCE */}
            {formData.name?.toUpperCase() === "RENEW RESIDENCE" && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  <Label className="text-lg font-semibold">Stadiu Lucrare - Videoclipuri</Label>
                </div>
                
                {/* Existing Videos */}
                {videos.length > 0 && (
                  <div className="space-y-3">
                    {videos.map((video, index) => {
                      const videoId = extractYouTubeId(video.url);
                      return (
                        <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                          {/* Reorder buttons */}
                          <div className="flex flex-col gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => moveVideoUp(index)}
                              disabled={index === 0}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => moveVideoDown(index)}
                              disabled={index === videos.length - 1}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </div>
                          {videoId && (
                            <img 
                              src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                              alt={video.title}
                              className="w-24 h-16 object-cover rounded"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            {editingVideoIndex === index ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={editingVideoTitle}
                                  onChange={(e) => setEditingVideoTitle(e.target.value)}
                                  className="h-8"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveVideoTitle();
                                    if (e.key === 'Escape') cancelEditingVideo();
                                  }}
                                  autoFocus
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-green-600"
                                  onClick={saveVideoTitle}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={cancelEditingVideo}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <p className="font-medium truncate">{video.title}</p>
                                <p className="text-xs text-muted-foreground truncate">{video.url}</p>
                              </>
                            )}
                          </div>
                          {editingVideoIndex !== index && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => startEditingVideo(index)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeVideo(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add New Video */}
                <div className="space-y-3 p-4 border border-dashed rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="videoUrl">URL YouTube</Label>
                      <Input
                        id="videoUrl"
                        value={newVideoUrl}
                        onChange={(e) => setNewVideoUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="videoTitle">Titlu Video</Label>
                      <Input
                        id="videoTitle"
                        value={newVideoTitle}
                        onChange={(e) => setNewVideoTitle(e.target.value)}
                        placeholder="Ex: Stadiu lucrare Decembrie 2024"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addVideo}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adaugă Video
                  </Button>
                </div>
              </div>
            )}

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

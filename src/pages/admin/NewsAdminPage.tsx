import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Pencil, Trash2, Eye, Search, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import RichTextEditor from "@/components/RichTextEditor";
import { adminApi } from "@/lib/adminApi";

interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string | null;
  featured_image: string | null;
  keywords: string | null;
  status: "draft" | "published";
  published_date: string | null;
  created_at: string;
  updated_at: string;
}

const emptyArticle = {
  slug: "",
  title: "",
  description: "",
  content: "",
  featured_image: "",
  keywords: "",
  status: "draft" as "draft" | "published",
  published_date: "",
};

const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

const NewsAdminPage = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<NewsArticle | null>(null);
  const [formData, setFormData] = useState(emptyArticle);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">("all");
  const [uploading, setUploading] = useState(false);

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["admin-news-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_articles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as NewsArticle[];
    },
  });

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      const matchesSearch =
        !search ||
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        (a.keywords || "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [articles, search, statusFilter]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        ...data,
        published_date:
          data.status === "published"
            ? data.published_date || new Date().toISOString()
            : data.published_date || null,
      };

      if (editing) {
        const result = await adminApi.update("news_articles", editing.id, payload);
        if (!result.success) throw new Error(result.error);
      } else {
        const result = await adminApi.insert("news_articles", payload);
        if (!result.success) {
          if (result.error?.includes("slug") || result.error?.includes("duplicate")) {
            throw new Error("Slug already exists. Change the title or slug.");
          }
          throw new Error(result.error || "Save error");
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-news-articles"] });
      toast.success(editing ? "Article updated!" : "Article created!");
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await adminApi.delete("news_articles", id);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-news-articles"] });
      toast.success("Article deleted!");
    },
    onError: (err: Error) => toast.error("Error: " + err.message),
  });

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from("news-images")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("news-images").getPublicUrl(path);
      setFormData((p) => ({ ...p, featured_image: data.publicUrl }));
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFormData(emptyArticle);
    setIsDialogOpen(true);
  };

  const openEdit = (a: NewsArticle) => {
    setEditing(a);
    setFormData({
      slug: a.slug,
      title: a.title,
      description: a.description || "",
      content: a.content || "",
      featured_image: a.featured_image || "",
      keywords: a.keywords || "",
      status: a.status,
      published_date: a.published_date ? a.published_date.slice(0, 16) : "",
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditing(null);
    setFormData(emptyArticle);
  };

  const handleTitleChange = (title: string) => {
    setFormData((p) => ({ ...p, title, slug: p.slug || slugify(title) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.slug) {
      toast.error("Title and slug are required");
      return;
    }
    if (formData.description && formData.description.length > 160) {
      toast.error("Description must be 160 characters or less");
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">News Articles</h1>
          <p className="text-muted-foreground">Manage news articles</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          New Article
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {articles.length === 0
              ? "No articles yet. Create your first one!"
              : "No articles match your filters."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((a) => (
            <Card key={a.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold truncate">{a.title}</h3>
                    <Badge
                      variant={a.status === "published" ? "default" : "outline"}
                      className="text-xs"
                    >
                      {a.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                    <span className="font-mono text-xs">/{a.slug}</span>
                    {a.published_date && (
                      <span>
                        Published:{" "}
                        {new Date(a.published_date).toLocaleDateString("ro-RO")}
                      </span>
                    )}
                    <span>
                      Created: {new Date(a.created_at).toLocaleDateString("ro-RO")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {a.status === "published" && (
                    <Button
                      variant="outline"
                      size="icon"
                      asChild
                      aria-label="Preview"
                    >
                      <a href={`/news/${a.slug}`} target="_blank" rel="noreferrer">
                        <Eye className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openEdit(a)}
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm("Delete this article?")) {
                        deleteMutation.mutate(a.id);
                      }
                    }}
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Article" : "New Article"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Article title"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug *</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, slug: e.target.value }))
                  }
                  placeholder="article-slug"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                Description{" "}
                <span className="text-xs text-muted-foreground">
                  ({formData.description.length}/160)
                </span>
              </Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Short description (max 160 chars, used as meta description)..."
                rows={3}
                maxLength={160}
              />
            </div>

            <div className="space-y-2">
              <Label>Featured Image</Label>
              <div className="flex items-center gap-3">
                <Input
                  value={formData.featured_image}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, featured_image: e.target.value }))
                  }
                  placeholder="https://... or upload below"
                />
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImageUpload(f);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    asChild
                  >
                    <span>
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      Upload
                    </span>
                  </Button>
                </label>
              </div>
              {formData.featured_image && (
                <img
                  src={formData.featured_image}
                  alt="Preview"
                  className="mt-2 h-32 rounded border object-cover"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Content</Label>
              <RichTextEditor
                value={formData.content}
                onChange={(html) =>
                  setFormData((p) => ({ ...p, content: html }))
                }
                placeholder="Write the article content..."
                minHeight={250}
                maxHeight={600}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Keywords (comma-separated)</Label>
                <Input
                  value={formData.keywords}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, keywords: e.target.value }))
                  }
                  placeholder="real estate, news, bucharest"
                />
              </div>
              <div className="space-y-2">
                <Label>Published Date</Label>
                <Input
                  type="datetime-local"
                  value={formData.published_date}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, published_date: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.status === "published"}
                onCheckedChange={(checked) =>
                  setFormData((p) => ({
                    ...p,
                    status: checked ? "published" : "draft",
                  }))
                }
              />
              <Label>
                Published{" "}
                <span className="text-xs text-muted-foreground">
                  (off = draft)
                </span>
              </Label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending
                  ? "Saving..."
                  : editing
                  ? "Update"
                  : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewsAdminPage;

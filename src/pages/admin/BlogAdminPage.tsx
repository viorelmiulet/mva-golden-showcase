import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, StarOff } from "lucide-react";
import { toast } from "sonner";
import RichTextEditor from "@/components/RichTextEditor";
import { adminApi } from "@/lib/adminApi";

const categories = [
  { id: "ghiduri", name: "Ghiduri" },
  { id: "piata", name: "Piața Imobiliară" },
  { id: "sfaturi", name: "Sfaturi" },
  { id: "investitii", name: "Investiții" },
  { id: "legal", name: "Legal & Financiar" },
  { id: "complexe", name: "Complexe Noi" },
];

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  author: string;
  category_id: string;
  category: string;
  read_time: string | null;
  featured: boolean | null;
  is_published: boolean | null;
  meta_title: string | null;
  meta_description: string | null;
  cover_image: string | null;
  created_at: string;
  updated_at: string;
}

const emptyPost = {
  slug: "",
  title: "",
  excerpt: "",
  content: "",
  author: "MVA Imobiliare",
  category_id: "ghiduri",
  category: "Ghiduri",
  read_time: "5 min",
  featured: false,
  is_published: true,
  meta_title: "",
  meta_description: "",
  cover_image: "",
};

const BlogAdminPage = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState(emptyPost);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as BlogPost[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const postData = {
        ...data,
        featured: data.featured || false,
        is_published: data.is_published !== false,
      };

      if (editingPost) {
        const result = await adminApi.update("blog_posts", editingPost.id, postData);
        if (!result.success) throw new Error(result.error);
      } else {
        const result = await adminApi.insert("blog_posts", postData);
        if (!result.success) {
          if (result.error?.includes('slug') || result.error?.includes('duplicate')) {
            throw new Error("Slug-ul există deja. Schimbă titlul sau slug-ul.");
          }
          throw new Error(result.error || "Eroare la salvare");
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast.success(editingPost ? "Articol actualizat!" : "Articol creat!");
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await adminApi.delete("blog_posts", id);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast.success("Articol șters!");
    },
    onError: (err: Error) => toast.error("Eroare: " + err.message),
  });

  const openCreate = () => {
    setEditingPost(null);
    setFormData(emptyPost);
    setIsDialogOpen(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt || "",
      content: post.content || "",
      author: post.author,
      category_id: post.category_id,
      category: post.category,
      read_time: post.read_time || "5 min",
      featured: post.featured || false,
      is_published: post.is_published !== false,
      meta_title: post.meta_title || "",
      meta_description: post.meta_description || "",
      cover_image: post.cover_image || "",
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingPost(null);
    setFormData(emptyPost);
  };

  const handleCategoryChange = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    setFormData((prev) => ({
      ...prev,
      category_id: categoryId,
      category: cat?.name || categoryId,
    }));
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.slug) {
      toast.error("Titlul și slug-ul sunt obligatorii");
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Blog</h1>
          <p className="text-muted-foreground">Gestionează articolele de pe blog</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Articol Nou
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Se încarcă...</div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nu există articole. Creează primul articol!
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold truncate">{post.title}</h3>
                    {post.featured && (
                      <Badge variant="secondary" className="text-xs bg-gold/20 text-gold">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                    {!post.is_published && (
                      <Badge variant="outline" className="text-xs">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Draft
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Badge variant="secondary" className="text-xs">{post.category}</Badge>
                    <span>{post.author}</span>
                    <span>{post.read_time}</span>
                    <span>{new Date(post.created_at).toLocaleDateString("ro-RO")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" size="icon" onClick={() => openEdit(post)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm("Sigur vrei să ștergi acest articol?")) {
                        deleteMutation.mutate(post.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPost ? "Editează Articol" : "Articol Nou"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Titlu *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Titlul articolului"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug *</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder="slug-articol"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Rezumat</Label>
              <Textarea
                value={formData.excerpt}
                onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Scurtă descriere a articolului..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Conținut</Label>
              <RichTextEditor
                value={formData.content}
                onChange={(html) => setFormData((prev) => ({ ...prev, content: html }))}
                placeholder="Scrie conținutul articolului..."
                minHeight={250}
                maxHeight={600}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Categorie</Label>
                <Select value={formData.category_id} onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Autor</Label>
                <Input
                  value={formData.author}
                  onChange={(e) => setFormData((prev) => ({ ...prev, author: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Timp citire</Label>
                <Input
                  value={formData.read_time}
                  onChange={(e) => setFormData((prev) => ({ ...prev, read_time: e.target.value }))}
                  placeholder="5 min"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Meta Title (SEO)</Label>
                <Input
                  value={formData.meta_title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, meta_title: e.target.value }))}
                  placeholder="Titlu SEO (opțional)"
                />
              </div>
              <div className="space-y-2">
                <Label>Meta Description (SEO)</Label>
                <Input
                  value={formData.meta_description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, meta_description: e.target.value }))}
                  placeholder="Descriere SEO (opțional)"
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_published}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_published: checked }))
                  }
                />
                <Label>Publicat</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.featured}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, featured: checked }))
                  }
                />
                <Label>Featured</Label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Anulează
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Se salvează..." : editingPost ? "Actualizează" : "Creează"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlogAdminPage;

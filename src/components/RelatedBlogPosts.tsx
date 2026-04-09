import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, BookOpen } from "lucide-react";
import OptimizedImage from "@/components/OptimizedImage";

interface RelatedBlogPostsProps {
  complexName: string;
  maxPosts?: number;
}

const RelatedBlogPosts = ({ complexName, maxPosts = 3 }: RelatedBlogPostsProps) => {
  const { data: posts = [] } = useQuery({
    queryKey: ["related-blog-posts", complexName],
    queryFn: async () => {
      // Search for blog posts mentioning this complex
      const searchTerms = complexName.toLowerCase().split(/\s+/).filter(t => t.length > 3);
      
      const { data, error } = await supabase
        .from("blog_posts")
        .select("slug, title, excerpt, cover_image, created_at, read_time")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!data) return [];

      // Filter posts that mention the complex name
      const filtered = data.filter(post => {
        const titleLower = post.title.toLowerCase();
        return searchTerms.some(term => titleLower.includes(term));
      });

      // If no direct matches, return latest posts from 'complexe' or 'piata' categories
      if (filtered.length === 0) {
        const { data: fallback } = await supabase
          .from("blog_posts")
          .select("slug, title, excerpt, cover_image, created_at, read_time")
          .eq("is_published", true)
          .in("category_id", ["complexe", "piata", "investitii"])
          .order("created_at", { ascending: false })
          .limit(maxPosts);
        return fallback || [];
      }

      return filtered.slice(0, maxPosts);
    },
  });

  if (posts.length === 0) return null;

  return (
    <section className="mt-8 sm:mt-12">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-gold" />
        Articole Despre {complexName}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link key={post.slug} to={`/blog/${post.slug}`} className="group">
            <Card className="h-full hover:shadow-lg transition-all hover:border-gold/50 overflow-hidden">
              {post.cover_image && (
                <div className="h-36 overflow-hidden">
                  <OptimizedImage
                    src={post.cover_image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    width={400}
                    height={225}
                  />
                </div>
              )}
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-gold transition-colors mb-2">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {post.excerpt}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{post.read_time}</span>
                  <span className="text-xs text-gold flex items-center gap-1">
                    Citește <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <div className="mt-4 text-center">
        <Link
          to="/blog"
          className="text-gold hover:text-gold/80 text-sm font-medium inline-flex items-center gap-1"
        >
          Vezi toate articolele <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
};

export default RelatedBlogPosts;

import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Calendar, User, ArrowLeft, ArrowRight, Clock, Home, TrendingUp, Lightbulb, PiggyBank, Scale, Building2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Breadcrumbs from "@/components/Breadcrumbs";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";

const getCategoryIcon = (categoryId: string) => {
  const icons: Record<string, typeof Home> = {
    ghiduri: Home,
    piata: TrendingUp,
    sfaturi: Lightbulb,
    investitii: PiggyBank,
    legal: Scale,
    complexe: Building2,
  };
  return icons[categoryId] || Home;
};

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug!)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: relatedPosts = [] } = useQuery({
    queryKey: ["blog-related", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("slug, title")
        .eq("is_published", true)
        .neq("slug", slug!)
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data || [];
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-20 flex items-center justify-center">
          <div className="animate-pulse text-gold">Se încarcă...</div>
        </main>
        <Footer />
      </>
    );
  }

  if (!post) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-20 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Articol negăsit</h1>
            <Link to="/blog">
              <Button>Înapoi la Blog</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const CategoryIcon = getCategoryIcon(post.category_id);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ro-RO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const articleStructuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.meta_description || post.excerpt || post.title,
    "image": "https://mvaimobiliare.ro/mva-logo-luxury.svg",
    "datePublished": post.created_at,
    "dateModified": post.updated_at,
    "author": {
      "@type": "Person",
      "name": post.author
    },
    "publisher": {
      "@type": "Organization",
      "name": "MVA Imobiliare",
      "logo": {
        "@type": "ImageObject",
        "url": "https://mvaimobiliare.ro/mva-logo-luxury.svg"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://mvaimobiliare.ro/blog/${slug}`
    }
  };

  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Acasă", "item": "https://mvaimobiliare.ro/" },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://mvaimobiliare.ro/blog" },
      { "@type": "ListItem", "position": 3, "name": post.title, "item": `https://mvaimobiliare.ro/blog/${slug}` }
    ]
  };

  return (
    <>
      <BreadcrumbSchema items={[
        { name: "Acasă", url: "/" },
        { name: "Blog", url: "/blog" },
        { name: post.title, url: `/blog/${slug}` }
      ]} />
      <Helmet>
        <title>{post.meta_title || `${post.title} | MVA Imobiliare Blog`}</title>
        <meta name="description" content={post.meta_description || post.excerpt || post.title} />
        <meta name="keywords" content="imobiliare, ghid, sfaturi, București, proprietăți" />
        <link rel="canonical" href={`https://mvaimobiliare.ro/blog/${slug}`} />
        
        <meta property="og:title" content={`${post.title} | MVA Imobiliare`} />
        <meta property="og:description" content={post.meta_description || post.excerpt || post.title} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://mvaimobiliare.ro/blog/${slug}`} />
        <meta property="og:image" content="https://mvaimobiliare.ro/mva-logo-luxury.svg" />
        <meta property="article:published_time" content={post.created_at} />
        <meta property="article:author" content={post.author} />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${post.title} | MVA Imobiliare`} />
        <meta name="twitter:description" content={post.meta_description || post.excerpt || post.title} />
        <meta name="twitter:image" content="https://mvaimobiliare.ro/mva-logo-luxury.svg" />

        <script type="application/ld+json">
          {JSON.stringify(articleStructuredData)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbStructuredData)}
        </script>
      </Helmet>

      <Header />
      
      <main className="min-h-screen pt-20">
        <article className="py-8 sm:py-12 bg-background">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6">
            <div className="max-w-4xl mx-auto">
              <Breadcrumbs items={[{ label: "Blog", href: "/blog" }, { label: post.title }]} />

              <Link to="/blog" className="inline-flex items-center gap-2 text-gold hover:text-gold/80 transition-colors mb-6">
                <ArrowLeft className="h-4 w-4" />
                <span>Înapoi la Blog</span>
              </Link>

              <header className="mb-8">
                <Badge className="mb-4 bg-gold/20 text-gold border-gold/30 hover:bg-gold/30">
                  <CategoryIcon className="h-3 w-3 mr-1" />
                  {post.category}
                </Badge>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-foreground leading-tight">
                  {post.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(post.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    <span>{post.author}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>{post.read_time} citire</span>
                  </div>
                </div>
              </header>

              {post.content && (
                <div 
                  className="prose prose-lg max-w-none dark:prose-invert
                    prose-headings:text-foreground prose-headings:font-bold
                    prose-h2:text-xl prose-h2:sm:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border prose-h2:pb-2
                    prose-h3:text-lg prose-h3:sm:text-xl prose-h3:mt-6 prose-h3:mb-3
                    prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-4
                    prose-ul:my-4 prose-ul:pl-6
                    prose-li:text-muted-foreground prose-li:mb-2
                    prose-strong:text-foreground prose-strong:font-semibold
                    prose-code:bg-muted prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm
                    prose-a:text-gold prose-a:no-underline hover:prose-a:underline"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              )}

              <div className="mt-12 p-6 sm:p-8 bg-gradient-to-br from-gold/10 to-gold/5 rounded-2xl border border-gold/20">
                <h3 className="text-xl font-bold mb-3">Ai nevoie de ajutor?</h3>
                <p className="text-muted-foreground mb-4">
                  Echipa noastră de specialiști este aici să te ghideze în procesul de cumpărare sau vânzare a proprietății tale.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link to="/#contact">
                    <Button className="bg-gold hover:bg-gold/90 text-primary-foreground">
                      Contactează-ne
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/proprietati">
                    <Button variant="outline">
                      Vezi Proprietăți
                    </Button>
                  </Link>
                </div>
              </div>

              {relatedPosts.length > 0 && (
                <div className="mt-12">
                  <h3 className="text-xl font-bold mb-6">Articole Similare</h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {relatedPosts.map((relatedPost) => (
                      <Link key={relatedPost.slug} to={`/blog/${relatedPost.slug}`}>
                        <Card className="h-full hover:shadow-lg transition-all hover:border-gold/50">
                          <CardHeader className="p-4">
                            <CardTitle className="text-base line-clamp-2 group-hover:text-gold transition-colors">
                              {relatedPost.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <span className="text-gold text-sm flex items-center gap-1">
                              Citește
                              <ArrowRight className="h-3 w-3" />
                            </span>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </article>
      </main>

      <Footer />
    </>
  );
};

export default BlogPost;

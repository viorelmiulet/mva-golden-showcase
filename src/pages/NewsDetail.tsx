import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Calendar, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string | null;
  featured_image: string | null;
  keywords: string | null;
  published_date: string | null;
  created_at: string;
  updated_at: string;
}

const NewsDetail = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: article, isLoading } = useQuery({
    queryKey: ["news-article", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_articles")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      return data as NewsArticle | null;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">
          Se încarcă...
        </div>
        <Footer />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Articol negăsit</h1>
          <Button asChild>
            <Link to="/news">Înapoi la Noutăți</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const publishedDate = article.published_date || article.created_at;
  const url = `https://mvaimobiliare.ro/news/${article.slug}`;
  const metaDescription =
    article.description ||
    article.title.slice(0, 160);

  const newsSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: metaDescription,
    image: article.featured_image ? [article.featured_image] : undefined,
    datePublished: publishedDate,
    dateModified: article.updated_at,
    author: {
      "@type": "Organization",
      name: "MVA Imobiliare",
    },
    publisher: {
      "@type": "Organization",
      name: "MVA Imobiliare",
      logo: {
        "@type": "ImageObject",
        url: "https://mvaimobiliare.ro/mva-logo-luxury.svg",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    keywords: article.keywords || undefined,
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{article.title} – MVA Imobiliare</title>
        <meta name="description" content={metaDescription} />
        {article.keywords && <meta name="keywords" content={article.keywords} />}
        <link rel="canonical" href={url} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={url} />
        {article.featured_image && (
          <meta property="og:image" content={article.featured_image} />
        )}
        <meta property="article:published_time" content={publishedDate} />
        <meta property="article:modified_time" content={article.updated_at} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.title} />
        <meta name="twitter:description" content={metaDescription} />
        {article.featured_image && (
          <meta name="twitter:image" content={article.featured_image} />
        )}
        <script type="application/ld+json">
          {JSON.stringify(newsSchema)}
        </script>
      </Helmet>

      <Header />
      <main className="container mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: "Noutăți", href: "/news" },
            { label: article.title, href: `/news/${article.slug}` },
          ]}
        />

        <article className="max-w-3xl mx-auto">
          <Button asChild variant="ghost" size="sm" className="mb-6">
            <Link to="/news">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Toate noutățile
            </Link>
          </Button>

          {article.featured_image && (
            <img
              src={article.featured_image}
              alt={article.title}
              className="w-full aspect-video object-cover rounded-lg mb-6"
            />
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Calendar className="h-4 w-4" />
            <time dateTime={publishedDate}>
              {new Date(publishedDate).toLocaleDateString("ro-RO", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </time>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4">{article.title}</h1>

          {article.description && (
            <p className="text-lg text-muted-foreground mb-8">
              {article.description}
            </p>
          )}

          {article.content && (
            <div
              className="prose prose-lg max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          )}
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default NewsDetail;

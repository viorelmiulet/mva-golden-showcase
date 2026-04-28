import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Calendar, ArrowRight, Loader2, Newspaper } from "lucide-react";
import { useEffect, useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Breadcrumbs from "@/components/Breadcrumbs";
import { supabase } from "@/integrations/supabase/client";

interface NewsItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  featured_image: string | null;
  published_date: string | null;
  created_at: string;
}

const PAGE_SIZE = 12;

/**
 * Generate optimized thumbnail URL using Supabase Storage image transformations.
 * Falls back to original URL for non-Supabase or non-public-bucket images.
 */
const getThumbnailUrl = (url: string, width: number): string => {
  if (!url) return url;
  // Convert /object/public/ to /render/image/public/ to enable transformations
  if (url.includes("/storage/v1/object/public/")) {
    const transformed = url.replace(
      "/storage/v1/object/public/",
      "/storage/v1/render/image/public/"
    );
    const sep = transformed.includes("?") ? "&" : "?";
    return `${transformed}${sep}width=${width}&resize=contain&quality=75`;
  }
  return url;
};

const News = () => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["news-list-infinite"],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const from = (pageParam as number) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from("news_articles")
        .select("id, slug, title, description, featured_image, published_date, created_at")
        .eq("status", "published")
        .order("published_date", { ascending: false })
        .range(from, to);
      if (error) throw error;
      return data as NewsItem[];
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.length,
  });

  const articles = data?.pages.flat() ?? [];
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="min-h-screen bg-background">
      {(() => {
        const count = articles.length;
        const latest = articles[0];
        const latestImage = latest?.featured_image || "https://mvaimobiliare.ro/og-image.jpg";
        const dynamicTitle = count > 0
          ? `Știri Imobiliare București (${count}+) – Noutăți Piața Rezidențială | MVA Imobiliare`
          : "Știri Imobiliare București – Noutăți Piața Rezidențială | MVA Imobiliare";
        const dynamicDescription = latest
          ? `Cele mai recente ${count}+ noutăți imobiliare. Ultimul articol: "${latest.title}". Analize, tendințe și informații despre piața rezidențială din București.`
          : "Cele mai noi articole și noutăți din piața imobiliară din București și împrejurimi. Analize, tendințe și informații actualizate.";

        const itemListSchema = {
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": "Noutăți Imobiliare MVA",
          "url": "https://mvaimobiliare.ro/news",
          "numberOfItems": count,
          "itemListElement": articles.slice(0, 20).map((a, idx) => ({
            "@type": "ListItem",
            "position": idx + 1,
            "url": `https://mvaimobiliare.ro/news/${a.slug}`,
            "name": a.title,
          })),
        };

        return (
          <Helmet>
            <title>{dynamicTitle}</title>
            <meta name="description" content={dynamicDescription} />
            <meta name="keywords" content="stiri imobiliare, noutati imobiliare bucuresti, piata rezidentiala, analize imobiliare, tendinte imobiliare 2026" />
            <link rel="canonical" href="https://mvaimobiliare.ro/news" />
            <meta property="og:title" content={dynamicTitle} />
            <meta property="og:description" content={dynamicDescription} />
            <meta property="og:type" content="website" />
            <meta property="og:url" content="https://mvaimobiliare.ro/news" />
            <meta property="og:image" content={latestImage} />
            <meta property="og:locale" content="ro_RO" />
            <meta property="og:site_name" content="MVA Imobiliare" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={dynamicTitle} />
            <meta name="twitter:description" content={dynamicDescription} />
            <meta name="twitter:image" content={latestImage} />
            <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>
          </Helmet>
        );
      })()}

      <Header />
      <main className="container mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: "Noutăți", href: "/news" }]} />

        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Noutăți</h1>
          <p className="text-lg text-muted-foreground">
            Cele mai recente articole și informații din piața imobiliară.
          </p>
        </div>

        {!isLoading && articles.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            Nu există articole publicate momentan.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {articles.map((a) => {
                const date = a.published_date || a.created_at;
                const formattedDate = new Date(date).toLocaleDateString("ro-RO", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                });
                return (
                  <Link key={a.id} to={`/news/${a.slug}`} className="group block">
                    <Card className="h-full overflow-hidden border-border/60 hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                      <div className="relative aspect-video overflow-hidden bg-muted">
                        {a.featured_image ? (
                          <img
                            src={getThumbnailUrl(a.featured_image, 600)}
                            srcSet={`${getThumbnailUrl(a.featured_image, 400)} 400w, ${getThumbnailUrl(a.featured_image, 600)} 600w, ${getThumbnailUrl(a.featured_image, 900)} 900w`}
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            alt={a.title}
                            loading="lazy"
                            decoding="async"
                            width={600}
                            height={338}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <Newspaper className="h-12 w-12 text-muted-foreground/40" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <Badge className="absolute top-3 left-3 bg-primary/90 backdrop-blur-sm text-primary-foreground border-0 shadow-md">
                          <Newspaper className="h-3 w-3 mr-1" />
                          Știri
                        </Badge>
                      </div>
                      <div className="flex flex-col flex-1 p-5 gap-3">
                        <div className="flex items-center text-xs text-muted-foreground gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <time dateTime={date}>{formattedDate}</time>
                        </div>
                        <h2 className="text-lg font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                          {a.title}
                        </h2>
                        {a.description && (
                          <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
                            {a.description}
                          </p>
                        )}
                        <span className="inline-flex items-center text-sm font-medium text-primary mt-auto pt-2 border-t border-border/60 group-hover:gap-2 gap-1 transition-all">
                          Citește articolul <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>

            <div
              ref={sentinelRef}
              className="flex justify-center items-center py-10"
              aria-hidden={!hasNextPage}
            >
              {isFetchingNextPage && (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              )}
              {!hasNextPage && articles.length > PAGE_SIZE && (
                <p className="text-sm text-muted-foreground">
                  Ai ajuns la finalul listei.
                </p>
              )}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default News;

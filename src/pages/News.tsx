import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Calendar, ArrowRight, Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      <Helmet>
        <title>Noutăți Imobiliare – MVA Imobiliare</title>
        <meta
          name="description"
          content="Cele mai noi articole și noutăți din piața imobiliară din București și împrejurimi."
        />
        <link rel="canonical" href="https://mvaimobiliare.ro/news" />
        <meta property="og:title" content="Noutăți Imobiliare – MVA Imobiliare" />
        <meta
          property="og:description"
          content="Cele mai noi articole și noutăți din piața imobiliară."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mvaimobiliare.ro/news" />
      </Helmet>

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
                return (
                  <Link key={a.id} to={`/news/${a.slug}`} className="group">
                    <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow">
                      {a.featured_image && (
                        <div className="aspect-video overflow-hidden bg-muted">
                          <img
                            src={a.featured_image}
                            alt={a.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-center text-xs text-muted-foreground gap-1 mb-2">
                          <Calendar className="h-3 w-3" />
                          <time dateTime={date}>
                            {new Date(date).toLocaleDateString("ro-RO", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </time>
                        </div>
                        <CardTitle className="text-xl group-hover:text-primary transition-colors line-clamp-2">
                          {a.title}
                        </CardTitle>
                        {a.description && (
                          <CardDescription className="line-clamp-3">
                            {a.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <span className="inline-flex items-center text-sm font-medium text-primary group-hover:gap-2 gap-1 transition-all">
                          Citește articolul <ArrowRight className="h-4 w-4" />
                        </span>
                      </CardContent>
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

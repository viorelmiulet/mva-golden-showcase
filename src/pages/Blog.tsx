import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, User, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const blogPosts = [
  {
    id: 1,
    slug: "ghidul-complet-cumparare-proprietate",
    title: "Ghidul Complet pentru Cumpărarea unei Proprietăți în București",
    excerpt: "Tot ce trebuie să știi despre procesul de achiziție imobiliară în capitală, de la căutare până la semnarea actelor.",
    date: "15 Octombrie 2025",
    author: "Viorel Miulet",
    category: "Ghiduri",
  },
  {
    id: 2,
    slug: "tendinte-piata-imobiliara-2025",
    title: "Tendințe pe Piața Imobiliară în 2025",
    excerpt: "Analiză detaliată a evoluției prețurilor și a celor mai căutate zone din București și Ilfov.",
    date: "10 Octombrie 2025",
    author: "MVA Imobiliare",
    category: "Piața Imobiliară",
  },
  {
    id: 3,
    slug: "pregatirea-casei-pentru-vanzare",
    title: "Cum Pregătești Casa pentru Vânzare: 10 Sfaturi Esențiale",
    excerpt: "Strategii dovedite pentru a-ți maximiza șansele de vânzare și pentru a obține cel mai bun preț.",
    date: "5 Octombrie 2025",
    author: "Viorel Miulet",
    category: "Sfaturi",
  },
  {
    id: 4,
    slug: "investitii-imobiliare-ghid",
    title: "Investiții Imobiliare: Ce Trebuie să Știi Înainte să Începi",
    excerpt: "Ghid pentru investitori: analiza rentabilității, zonele promițătoare și riscurile de evitat.",
    date: "1 Octombrie 2025",
    author: "MVA Imobiliare",
    category: "Investiții",
  },
];

const Blog = () => {
  return (
    <>
      <Helmet>
        <title>Blog Imobiliar - Sfaturi și Ghiduri | MVA Imobiliare</title>
        <meta name="description" content="Descoperiți articole despre piața imobiliară, ghiduri de cumpărare și vânzare, tendințe și sfaturi de investiții imobiliare în București." />
        <meta name="keywords" content="blog imobiliar, sfaturi imobiliare, ghid cumpărare casă, investiții imobiliare, piața imobiliară București" />
        <link rel="canonical" href="https://mvaimobiliare.ro/blog" />
        
        <meta property="og:title" content="Blog Imobiliar - Sfaturi și Ghiduri | MVA Imobiliare" />
        <meta property="og:description" content="Descoperiți articole despre piața imobiliară, ghiduri de cumpărare și vânzare, tendințe și sfaturi de investiții imobiliare în București." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mvaimobiliare.ro/blog" />
      </Helmet>

      <Header />
      
      <main className="min-h-screen pt-20">
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                Blog Imobiliar
              </h1>
              <p className="text-lg text-muted-foreground">
                Articole utile, ghiduri și sfaturi pentru navigarea pieței imobiliare
              </p>
            </div>

            <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-2">
              {blogPosts.map((post) => (
                <Link key={post.id} to={`/blog/${post.slug}`}>
                  <Card className="hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <span className="px-3 py-1 rounded-full bg-gold/10 text-gold">
                          {post.category}
                        </span>
                      </div>
                      <CardTitle className="text-2xl mb-2 group-hover:text-gold transition-colors">
                        {post.title}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {post.excerpt}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{post.date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>{post.author}</span>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gold" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default Blog;

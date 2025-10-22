import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, User, ArrowRight, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const blogPosts = [
  {
    id: 1,
    slug: "ghidul-complet-cumparare-proprietate",
    title: "🏠 Ghidul Complet pentru Cumpărarea unei Proprietăți în București",
    excerpt: "Tot ce trebuie să știi despre procesul de achiziție imobiliară în capitală, de la căutare până la semnarea actelor. Descoperă pașii esențiali pentru a face cea mai bună investiție! 🔑",
    date: "15 Octombrie 2025",
    author: "Viorel Miulet",
    category: "📚 Ghiduri",
    readTime: "8 min"
  },
  {
    id: 2,
    slug: "tendinte-piata-imobiliara-2025",
    title: "📈 Tendințe pe Piața Imobiliară în 2025",
    excerpt: "Analiză detaliată a evoluției prețurilor și a celor mai căutate zone din București și Ilfov. Află unde merită să investești acum! 💰",
    date: "10 Octombrie 2025",
    author: "MVA Imobiliare",
    category: "📊 Piața Imobiliară",
    readTime: "6 min"
  },
  {
    id: 3,
    slug: "pregatirea-casei-pentru-vanzare",
    title: "✨ Cum Pregătești Casa pentru Vânzare: 10 Sfaturi Esențiale",
    excerpt: "Strategii dovedite pentru a-ți maximiza șansele de vânzare și pentru a obține cel mai bun preț. Transformă casa ta într-un magnet pentru cumpărători! 🎯",
    date: "5 Octombrie 2025",
    author: "Viorel Miulet",
    category: "💡 Sfaturi",
    readTime: "10 min"
  },
  {
    id: 4,
    slug: "investitii-imobiliare-ghid",
    title: "💎 Investiții Imobiliare: Ce Trebuie să Știi Înainte să Începi",
    excerpt: "Ghid pentru investitori: analiza rentabilității, zonele promițătoare și riscurile de evitat. Construiește-ți averea prin imobiliare! 🚀",
    date: "1 Octombrie 2025",
    author: "MVA Imobiliare",
    category: "💰 Investiții",
    readTime: "12 min"
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
        <meta property="og:image" content="https://mvaimobiliare.ro/mva-logo-luxury.svg" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Blog Imobiliar - Sfaturi și Ghiduri | MVA Imobiliare" />
        <meta name="twitter:description" content="Descoperiți articole despre piața imobiliară, ghiduri de cumpărare și vânzare, tendințe și sfaturi de investiții imobiliare în București." />
        <meta name="twitter:image" content="https://mvaimobiliare.ro/mva-logo-luxury.svg" />
      </Helmet>

      <Header />
      
      <main className="min-h-screen pt-20">
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                📝 Blog Imobiliar MVA
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Articole utile, ghiduri și sfaturi pentru navigarea pieței imobiliare. 
                Învață din experiența noastră și ia cele mai bune decizii! 🎓
              </p>
            </div>

            <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-2">
              {blogPosts.map((post) => (
                <Link key={post.id} to={`/blog/${post.slug}`} className="group">
                  <Card className="hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer h-full border-2 hover:border-gold/50">
                    <CardHeader className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-sm font-medium">
                          {post.category}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{post.readTime}</span>
                        </div>
                      </div>
                      <CardTitle className="text-2xl mb-2 group-hover:text-gold transition-colors leading-tight">
                        {post.title}
                      </CardTitle>
                      <CardDescription className="text-base leading-relaxed">
                        {post.excerpt}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            <span>{post.date}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <User className="h-4 w-4" />
                            <span>{post.author}</span>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gold group-hover:translate-x-1 transition-transform" />
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

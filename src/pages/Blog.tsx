import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, User, ArrowRight, Clock, TrendingUp, Home, Lightbulb, PiggyBank, Scale, FileText, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";

const categories = [
  { id: "all", name: "Toate", icon: FileText },
  { id: "ghiduri", name: "Ghiduri", icon: Home },
  { id: "piata", name: "Piața Imobiliară", icon: TrendingUp },
  { id: "sfaturi", name: "Sfaturi", icon: Lightbulb },
  { id: "investitii", name: "Investiții", icon: PiggyBank },
  { id: "legal", name: "Legal & Financiar", icon: Scale },
  { id: "complexe", name: "Complexe Noi", icon: Building2 },
];

const blogPosts = [
  {
    id: 1,
    slug: "ghidul-complet-cumparare-proprietate",
    title: "Ghidul Complet pentru Cumpărarea unei Proprietăți în București",
    excerpt: "Tot ce trebuie să știi despre procesul de achiziție imobiliară în capitală, de la căutare până la semnarea actelor. Descoperă pașii esențiali pentru a face cea mai bună investiție!",
    date: "15 Octombrie 2025",
    author: "Viorel Miulet",
    categoryId: "ghiduri",
    category: "Ghiduri",
    readTime: "8 min",
    featured: true
  },
  {
    id: 2,
    slug: "tendinte-piata-imobiliara-2025",
    title: "Tendințe pe Piața Imobiliară în 2025",
    excerpt: "Analiză detaliată a evoluției prețurilor și a celor mai căutate zone din București și Ilfov. Află unde merită să investești acum!",
    date: "10 Octombrie 2025",
    author: "MVA Imobiliare",
    categoryId: "piata",
    category: "Piața Imobiliară",
    readTime: "6 min",
    featured: true
  },
  {
    id: 3,
    slug: "pregatirea-casei-pentru-vanzare",
    title: "Cum Pregătești Casa pentru Vânzare: 10 Sfaturi Esențiale",
    excerpt: "Strategii dovedite pentru a-ți maximiza șansele de vânzare și pentru a obține cel mai bun preț. Transformă casa ta într-un magnet pentru cumpărători!",
    date: "5 Octombrie 2025",
    author: "Viorel Miulet",
    categoryId: "sfaturi",
    category: "Sfaturi",
    readTime: "10 min",
    featured: false
  },
  {
    id: 4,
    slug: "investitii-imobiliare-ghid",
    title: "Investiții Imobiliare: Ce Trebuie să Știi Înainte să Începi",
    excerpt: "Ghid pentru investitori: analiza rentabilității, zonele promițătoare și riscurile de evitat. Construiește-ți averea prin imobiliare!",
    date: "1 Octombrie 2025",
    author: "MVA Imobiliare",
    categoryId: "investitii",
    category: "Investiții",
    readTime: "12 min",
    featured: false
  },
  {
    id: 5,
    slug: "prima-casa-vs-credit-standard",
    title: "Prima Casă vs Credit Standard: Care Este Mai Avantajos în 2025?",
    excerpt: "Comparație detaliată între programul Prima Casă și creditele ipotecare standard. Află care opțiune se potrivește situației tale financiare.",
    date: "28 Septembrie 2025",
    author: "MVA Imobiliare",
    categoryId: "legal",
    category: "Legal & Financiar",
    readTime: "7 min",
    featured: false
  },
  {
    id: 6,
    slug: "complexe-rezidentiale-nord-bucuresti",
    title: "Top 5 Complexe Rezidențiale din Nordul Bucureștiului în 2025",
    excerpt: "Analiză a celor mai noi și apreciate complexe rezidențiale din zona de nord. Pipera, Băneasa, Voluntari - unde să investești?",
    date: "25 Septembrie 2025",
    author: "Viorel Miulet",
    categoryId: "complexe",
    category: "Complexe Noi",
    readTime: "9 min",
    featured: false
  },
  {
    id: 7,
    slug: "erori-cumparatori-prima-casa",
    title: "7 Greșeli Frecvente ale Cumpărătorilor la Prima Casă",
    excerpt: "Evită capcanele comune care pot transforma visul casei tale într-un coșmar financiar. Învață din experiențele altora!",
    date: "20 Septembrie 2025",
    author: "Viorel Miulet",
    categoryId: "ghiduri",
    category: "Ghiduri",
    readTime: "6 min",
    featured: false
  },
  {
    id: 8,
    slug: "verificarea-actelor-proprietate",
    title: "Cum Verifici Actele unei Proprietăți: Ghid Complet",
    excerpt: "Tot ce trebuie să știi despre verificarea documentelor legale înainte de cumpărare. Carte funciară, autorizații, ipoteci și sarcini.",
    date: "15 Septembrie 2025",
    author: "MVA Imobiliare",
    categoryId: "legal",
    category: "Legal & Financiar",
    readTime: "11 min",
    featured: false
  },
  {
    id: 9,
    slug: "chirii-vs-cumparare-2025",
    title: "Chirie vs Cumpărare: Ce Este Mai Rentabil în 2025?",
    excerpt: "Analiză financiară completă: când merită să plătești chirie și când este momentul să cumperi propria locuință.",
    date: "10 Septembrie 2025",
    author: "MVA Imobiliare",
    categoryId: "investitii",
    category: "Investiții",
    readTime: "8 min",
    featured: false
  },
  {
    id: 10,
    slug: "negocierea-pretului-imobiliar",
    title: "Arta Negocierii: Cum Obții Cel Mai Bun Preț la Cumpărare",
    excerpt: "Tehnici și strategii de negociere folosite de profesioniști. Economisește mii de euro la următoarea achiziție imobiliară.",
    date: "5 Septembrie 2025",
    author: "Viorel Miulet",
    categoryId: "sfaturi",
    category: "Sfaturi",
    readTime: "7 min",
    featured: false
  },
  {
    id: 11,
    slug: "apartamente-militari-residence-ghid-cumparatori-2025",
    title: "Ghid Complet pentru Cumpărători în Militari Residence 2025",
    excerpt: "Tot ce trebuie să știi înainte să cumperi un apartament în Militari Residence în 2025. Prețuri reale, cele mai bune zone, sfaturi de la agenți locali cu experiență din 2016.",
    date: "2 Martie 2026",
    author: "MVA Imobiliare",
    categoryId: "ghiduri",
    category: "Ghiduri",
    readTime: "15 min",
    featured: true
  },
];

const Blog = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredPosts = selectedCategory === "all" 
    ? blogPosts 
    : blogPosts.filter(post => post.categoryId === selectedCategory);

  const featuredPosts = blogPosts.filter(post => post.featured);

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.icon || FileText;
  };

  return (
    <>
      <BreadcrumbSchema items={[
        { name: "Acasă", url: "/" },
        { name: "Blog", url: "/blog" }
      ]} />
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
        {/* Hero Section */}
        <section className="py-12 sm:py-16 bg-gradient-to-b from-background to-muted/30">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6">
            <Breadcrumbs items={[{ label: "Blog" }]} />
            <div className="max-w-4xl mx-auto text-center mb-8 sm:mb-12">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-foreground px-2">
                Blog Imobiliar MVA
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-4 sm:px-2">
                Articole utile, ghiduri și sfaturi pentru navigarea pieței imobiliare. 
                Învață din experiența noastră și ia cele mai bune decizii!
              </p>
            </div>

            {/* Featured Articles */}
            {featuredPosts.length > 0 && (
              <div className="max-w-6xl mx-auto mb-12">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-gold" />
                  Articole Recomandate
                </h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {featuredPosts.map((post) => {
                    const CategoryIcon = getCategoryIcon(post.categoryId);
                    return (
                      <Link key={post.id} to={`/blog/${post.slug}`} className="group touch-manipulation">
                        <Card className="hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer h-full border-2 border-gold/30 bg-gradient-to-br from-gold/5 to-transparent">
                          <CardHeader className="space-y-2 sm:space-y-3 p-4 sm:p-6">
                            <div className="flex items-center justify-between gap-2">
                              <Badge className="text-xs sm:text-sm font-medium bg-gold/20 text-gold border-gold/30 hover:bg-gold/30">
                                <CategoryIcon className="h-3 w-3 mr-1" />
                                {post.category}
                              </Badge>
                              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground flex-shrink-0">
                                <Clock className="h-3 w-3" />
                                <span>{post.readTime}</span>
                              </div>
                            </div>
                            <CardTitle className="text-lg sm:text-xl lg:text-2xl mb-2 group-hover:text-gold transition-colors leading-tight">
                              {post.title}
                            </CardTitle>
                            <CardDescription className="text-sm sm:text-base leading-relaxed">
                              {post.excerpt}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="p-4 sm:p-6 pt-0">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 pt-4 border-t border-border">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground w-full sm:w-auto">
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                  <span>{post.date}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                  <span>{post.author}</span>
                                </div>
                              </div>
                              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-gold group-hover:translate-x-1 transition-transform self-end sm:self-auto" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Category Filter & All Articles */}
        <section className="py-8 sm:py-12 bg-background">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6">
            <div className="max-w-6xl mx-auto">
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2 mb-8 justify-center">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedCategory === category.id
                          ? "bg-gold text-primary-foreground shadow-md"
                          : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {category.name}
                    </button>
                  );
                })}
              </div>

              {/* Articles Grid */}
              <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredPosts.map((post) => {
                  const CategoryIcon = getCategoryIcon(post.categoryId);
                  return (
                    <Link key={post.id} to={`/blog/${post.slug}`} className="group touch-manipulation">
                      <Card className="hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer h-full border hover:border-gold/50">
                        <CardHeader className="space-y-2 p-4">
                          <div className="flex items-center justify-between gap-2">
                            <Badge variant="secondary" className="text-xs font-medium">
                              <CategoryIcon className="h-3 w-3 mr-1" />
                              {post.category}
                            </Badge>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground flex-shrink-0">
                              <Clock className="h-3 w-3" />
                              <span>{post.readTime}</span>
                            </div>
                          </div>
                          <CardTitle className="text-base sm:text-lg group-hover:text-gold transition-colors leading-tight line-clamp-2">
                            {post.title}
                          </CardTitle>
                          <CardDescription className="text-sm leading-relaxed line-clamp-3">
                            {post.excerpt}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="flex items-center justify-between pt-3 border-t border-border">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{post.date}</span>
                            </div>
                            <ArrowRight className="h-4 w-4 text-gold group-hover:translate-x-1 transition-transform" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>

              {filteredPosts.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Nu există articole în această categorie.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="py-12 sm:py-16 bg-muted/50">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-xl sm:text-2xl font-bold mb-3">Rămâi Informat!</h2>
              <p className="text-muted-foreground mb-6">
                Contactează-ne pentru consultanță gratuită și sfaturi personalizate despre piața imobiliară.
              </p>
              <Link 
                to="/#contact" 
                className="inline-flex items-center gap-2 bg-gold hover:bg-gold/90 text-primary-foreground px-6 py-3 rounded-lg font-medium transition-all hover:scale-105"
              >
                Contactează-ne
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default Blog;
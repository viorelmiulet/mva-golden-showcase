import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { usePageTracking } from "@/hooks/useGoogleAnalytics"
import { Helmet } from "react-helmet-async"
import { 
  Shield, 
  Award, 
  Users, 
  Clock, 
  MapPin, 
  Heart,
  TrendingUp,
  Eye,
  MessageCircle,
  Star
} from "lucide-react"

const WhyChooseUs = () => {
  // Track page view
  usePageTracking("De ce să ne alegi pe noi - MVA Imobiliare", "/de-ce-sa-ne-alegi");

  const advantages = [
    {
      icon: Award,
      title: "Experiență Dovedită",
      description: "Peste 5 ani de experiență în piața imobiliară din vestul Bucureștiului, cu sute de tranzacții finalizate cu succes.",
      color: "text-gold"
    },
    {
      icon: Shield,
      title: "Transparență Completă", 
      description: "Oferim informații clare despre fiecare proprietate, prețuri reale și contracte transparente. Fără costuri ascunse.",
      color: "text-blue-500"
    },
    {
      icon: MapPin,
      title: "Specializare Locală",
      description: "Cunoaștem în detaliu zona Chiajna și vestul Bucureștiului. Experți în proiectele premium din această zonă strategică.",
      color: "text-green-500"
    },
    {
      icon: Users,
      title: "Consultanță Personalizată",
      description: "Fiecare client este unic. Adaptăm serviciile după nevoile tale specifice și te îndrumăm pas cu pas.",
      color: "text-purple-500"
    },
    {
      icon: Eye,
      title: "Proprietăți Selectate",
      description: "Portofoliu curat cu apartamente verificate personal. Doar proiecte cu finisaje premium și dezvoltatori de încredere.",
      color: "text-orange-500"
    },
    {
      icon: Clock,
      title: "Disponibilitate 24/7",
      description: "Suntem disponibili oricând ai nevoie. Răspundem rapid la întrebări și organizăm vizionări flexibile.",
      color: "text-indigo-500"
    }
  ];

  const services = [
    "Evaluări gratuite și profesionale",
    "Asistență juridică completă",
    "Negociere în numele tău",
    "Suport pentru credite ipotecare", 
    "Consultanță în investiții imobiliare",
    "Management proprietăți",
    "Urmărire post-vânzare"
  ];

  const testimonials = [
    {
      name: "Maria & Alexandru P.",
      text: "Profesionalism și dedicare excepționale. Ne-au ajutat să găsim apartamentul perfect în Chiajna în doar 2 săptămâni!",
      rating: 5
    },
    {
      name: "Cristina R.",
      text: "Transparență totală și servicii complete. Recomand cu încredere echipa MVA Imobiliare.",
      rating: 5  
    },
    {
      name: "Mihai D.",
      text: "Cea mai bună agenție din zona de vest! M-au ghidat perfect prin tot procesul de achiziție.",
      rating: 5
    }
  ];

  // FAQ Schema for AI
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "De ce să aleg MVA Imobiliare pentru vânzarea proprietății?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "MVA Imobiliare oferă experiență dovedită de peste 5 ani, atingem o medie de 97% din prețul cerut, avem o echipă dedicată disponibilă 24/7 și asigurăm expunere maximă online și offline pe multiple platforme."
        }
      },
      {
        "@type": "Question",
        "name": "Cât timp durează să vindeți o proprietate?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "98% dintre proprietățile noastre sunt live online în termen de 48 de ore de la fotografiere. Datorită bazei noastre mari de cumpărători și tehnicilor de marketing avansate, reușim să vindem rapid."
        }
      },
      {
        "@type": "Question",
        "name": "Ce zone deservește MVA Imobiliare?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Suntem specializați în zona Chiajna și vestul Bucureștiului, cu peste 15.000 de proprietăți în baza de date, actualizate lunar."
        }
      },
      {
        "@type": "Question",
        "name": "Oferiți consultanță pentru credite ipotecare?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Da, oferim suport complet pentru credite ipotecare, asistență juridică, evaluări gratuite și profesionale, precum și consultanță în investiții imobiliare."
        }
      }
    ]
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Acasă",
        "item": "https://mvaimobiliare.ro/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "De ce să ne alegi",
        "item": "https://mvaimobiliare.ro/de-ce-sa-ne-alegi"
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>De ce să ne alegi pe noi? - Agenție Imobiliară Expertă | MVA Imobiliare</title>
        <meta name="description" content="Descoperă avantajele de a lucra cu MVA Imobiliare: experiență dovedită, transparență completă, consultanță personalizată și portofoliu curat de proprietăți premium în vestul Bucureștiului." />
        <meta name="keywords" content="agenție imobiliară de încredere, consultant imobiliar expert, servicii imobiliare premium, agenție imobiliară București vest, agent imobiliar profesionist" />
        <link rel="canonical" href="https://mvaimobiliare.ro/de-ce-sa-ne-alegi" />
        
        {/* AI Crawler Optimization */}
        <meta name="summary" content="MVA Imobiliare oferă servicii imobiliare premium cu peste 5 ani experiență în vestul Bucureștiului. Avantaje cheie: rată de succes 97% în atingerea prețului cerut, echipă disponibilă 24/7, proprietăți live online în 48h, bază de date cu 15.000+ proprietăți, expunere maximă pe multiple platforme, consultanță completă și asistență juridică." />
        <meta name="category" content="Real Estate Services" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mvaimobiliare.ro/de-ce-sa-ne-alegi" />
        <meta property="og:title" content="De ce MVA Imobiliare - Agenție Expertă în București" />
        <meta property="og:description" content="Experiență dovedită, transparență completă și rezultate garantate în tranzacții imobiliare" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary" />
        <meta property="twitter:title" content="De ce MVA Imobiliare" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>
      <div className="min-h-screen">
        <Header />
      
      <main>
        {/* Hero Section */}
        <section className="relative py-12 md:py-20 bg-gradient-to-br from-background to-muted">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-4xl mx-auto">
              <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20 mb-4 md:mb-6">
                Agenția Ta de Încredere
              </Badge>
              
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 md:mb-6">
                <span className="block text-foreground">De ce să ne</span>
                <span className="block bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                  Alegi pe Noi?
                </span>
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed mb-6 md:mb-8 px-2">
                Partenerii tăi de încredere pentru investiții imobiliare inteligente în vestul Bucureștiului.
                Experiență, transparență și rezultate garantate.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
                <a href="https://wa.me/40767941512" target="_blank" rel="noopener noreferrer">
                  <Button variant="luxury" size="lg" className="w-full sm:w-auto px-6 md:px-8">
                    <MessageCircle className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                    Contactează-ne pe WhatsApp
                  </Button>
                </a>
                <Button variant="luxuryOutline" size="lg" className="w-full sm:w-auto px-6 md:px-8" onClick={() => {
                  document.getElementById('avantaje')?.scrollIntoView({ behavior: 'smooth' });
                }}>
                  <Eye className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                  Descoperă Avantajele
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Section */}
        <section id="continut-principal" className="py-12 md:py-20">
          <div className="container mx-auto px-4">
            {/* Pentru vânzare */}
            <div className="mb-12 md:mb-20">
              <div className="text-center mb-8 md:mb-16">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-playfair font-bold mb-4 md:mb-6 px-2">
                  De ce să alegeți <span className="text-gold">MVA IMOBILIARE</span> pentru a vinde proprietatea dumneavoastră?
                </h2>
                <p className="text-base sm:text-lg md:text-xl font-inter text-muted-foreground max-w-4xl mx-auto leading-relaxed px-2">
                  Experiența, palmaresul nostru și puterea brandului ne pun în poziția perfectă pentru a obține cel mai bun preț pentru proprietatea dumneavoastră.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 md:gap-6 lg:gap-8 max-w-7xl mx-auto">
                <Card className="border-gold/10 hover:border-gold/30 transition-all duration-300">
                  <CardContent className="p-4 md:p-6 lg:p-8">
                    <div className="flex items-start mb-4 md:mb-6">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gold/10 flex items-center justify-center mr-3 md:mr-4 mt-1 flex-shrink-0">
                        <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-gold" />
                      </div>
                      <div>
                        <h3 className="text-lg md:text-xl font-playfair font-semibold mb-2 md:mb-3 text-gold">1. Magnet pentru cumpărători</h3>
                        <p className="font-inter text-sm md:text-base text-muted-foreground leading-relaxed">
                          Datorită tehnicilor de marketing avansate, atragem un număr impresionat de potențiali cumpărători în baza noastră de date, ceea ce vă oferă un avantaj distinct atunci când intenționați să vindeți casa dumneavoastră.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gold/10 hover:border-gold/30 transition-all duration-300">
                  <CardContent className="p-4 md:p-6 lg:p-8">
                    <div className="flex items-start mb-4 md:mb-6">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gold/10 flex items-center justify-center mr-3 md:mr-4 mt-1 flex-shrink-0">
                        <Award className="w-5 h-5 md:w-6 md:h-6 text-gold" />
                      </div>
                      <div>
                        <h3 className="text-lg md:text-xl font-playfair font-semibold mb-2 md:mb-3 text-gold">2. Evaluăm corect pentru a obține cel mai bun preț</h3>
                        <p className="font-inter text-sm md:text-base text-muted-foreground leading-relaxed mb-3 md:mb-4">
                          Atingem o medie de 97% din prețul cerut pentru fiecare proprietate pe care o vindem.
                        </p>
                        <p className="font-inter text-sm md:text-base text-muted-foreground leading-relaxed">
                          Vizităm multe proprietăți în fiecare lună, așa că avem o înțelegere profundă a valorilor de piață și a modului în care putem obține cel mai bun preț. Tehnologia noastră avansată ne oferă în continuare o perspectivă asupra prețurilor și a informațiilor despre piața imobiliară.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gold/10 hover:border-gold/30 transition-all duration-300">
                  <CardContent className="p-4 md:p-6 lg:p-8">
                    <div className="flex items-start mb-4 md:mb-6">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gold/10 flex items-center justify-center mr-3 md:mr-4 mt-1 flex-shrink-0">
                        <Users className="w-5 h-5 md:w-6 md:h-6 text-gold" />
                      </div>
                      <div>
                        <h3 className="text-lg md:text-xl font-playfair font-semibold mb-2 md:mb-3 text-gold">3. O echipă unică de suport</h3>
                        <p className="font-inter text-sm md:text-base text-muted-foreground leading-relaxed mb-3 md:mb-4">
                          Personalul nostru de suport ne ajută să menținem cel mai înalt nivel de servicii pentru clienți.
                        </p>
                        <p className="font-inter text-sm md:text-base text-muted-foreground leading-relaxed">
                          Suntem mereu disponibili – Datorită programului încărcat al cumpărătorilor, 38% dintre vizionările noastre au loc seara și în weekend. Acesta este un moment în care mulți agenți nu sunt în activitate.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gold/10 hover:border-gold/30 transition-all duration-300">
                  <CardContent className="p-4 md:p-6 lg:p-8">
                    <div className="flex items-start mb-4 md:mb-6">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gold/10 flex items-center justify-center mr-3 md:mr-4 mt-1 flex-shrink-0">
                        <Clock className="w-5 h-5 md:w-6 md:h-6 text-gold" />
                      </div>
                      <div>
                        <h3 className="text-lg md:text-xl font-playfair font-semibold mb-2 md:mb-3 text-gold">4. Expertiza din interiorul companiei economisește timp</h3>
                        <p className="font-inter text-sm md:text-base text-muted-foreground leading-relaxed mb-3 md:mb-4">
                          98% dintre proprietățile noastre sunt live online, în termen de 48 de ore.
                        </p>
                        <p className="font-inter text-sm md:text-base text-muted-foreground leading-relaxed">
                          Noi nu pierdem timp prețios. Putem avea proprietatea pe deplin promovată online în termen de 48 de ore de la fotografierea proprietății.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gold/10 hover:border-gold/30 transition-all duration-300 md:col-span-2">
                  <CardContent className="p-4 md:p-6 lg:p-8">
                    <div className="flex items-start mb-4 md:mb-6">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gold/10 flex items-center justify-center mr-3 md:mr-4 mt-1 flex-shrink-0">
                        <Eye className="w-5 h-5 md:w-6 md:h-6 text-gold" />
                      </div>
                      <div>
                        <h3 className="text-lg md:text-xl font-playfair font-semibold mb-2 md:mb-3 text-gold">5. Expunerea maximă</h3>
                        <p className="font-inter text-sm md:text-base text-muted-foreground leading-relaxed mb-3 md:mb-4">
                          Asigurăm acoperire totală, atât în mediul online cât și offline.
                        </p>
                        <p className="font-inter text-sm md:text-base text-muted-foreground leading-relaxed">
                          mvaimobiliare.ro atrage mult trafic de calitate, datorită eforturilor de optimizare continue. Vom promova, de asemenea, proprietatea dumneavoastră pe imobiliare.ro, imopedia.ro, magazinuldecase.ro și mai multe site-uri de proprietate și de anunțuri, precum și prin tehnici de e-mail marketing, toate pentru nici un cost suplimentar.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gold/10 hover:border-gold/30 transition-all duration-300">
                  <CardContent className="p-4 md:p-6 lg:p-8">
                    <div className="flex items-start mb-4 md:mb-6">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gold/10 flex items-center justify-center mr-3 md:mr-4 mt-1 flex-shrink-0">
                        <Shield className="w-5 h-5 md:w-6 md:h-6 text-gold" />
                      </div>
                      <div>
                        <h3 className="text-lg md:text-xl font-playfair font-semibold mb-2 md:mb-3 text-gold">6. Cele mai înalte standarde etice</h3>
                        <p className="font-inter text-sm md:text-base text-muted-foreground leading-relaxed">
                          Agenții noștri lucrează în strânsă colaborare cu departamentul nostru de relații cu clienții pentru a oferi cele mai bune servicii pentru clienții noștri. Acest lucru ne ajută să construim parteneriate și relații pe termen lung.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gold/10 hover:border-gold/30 transition-all duration-300">
                  <CardContent className="p-4 md:p-6 lg:p-8">
                    <div className="flex items-start mb-4 md:mb-6">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gold/10 flex items-center justify-center mr-3 md:mr-4 mt-1 flex-shrink-0">
                        <Heart className="w-5 h-5 md:w-6 md:h-6 text-gold" />
                      </div>
                      <div>
                        <h3 className="text-lg md:text-xl font-playfair font-semibold mb-2 md:mb-3 text-gold">7. Ne facem treaba bine</h3>
                        <p className="font-inter text-sm md:text-base text-muted-foreground leading-relaxed">
                          Oamenii noștri sunt instruiți pentru a fi cei mai buni profesioniști din industrie. Ei vor lucra cu pasiune în numele dvs. pentru a vă obține cel mai bun preț posibil și pentru a vă oferi servicii deosebite.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Pentru cumpărare */}
            <div>
              <div className="text-center mb-8 md:mb-16">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-playfair font-bold mb-4 md:mb-6 px-2">
                  De ce să alegeți <span className="text-gold">MVA IMOBILIARE</span> pentru a găsi noua dumneavoastră casă?
                </h2>
                <p className="text-base sm:text-lg md:text-xl font-inter text-muted-foreground max-w-4xl mx-auto leading-relaxed px-2">
                  Cu mii de proprietăți de vânzare actualizate, furnizarea mai multor opțiuni excepționale și mai multe ore de deschidere pentru vizionări convenabile, suntem prima soluție pentru cumpărători.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 md:gap-6 lg:gap-8 max-w-7xl mx-auto">
                <Card className="border-gold/10 hover:border-gold/30 transition-all duration-300">
                  <CardContent className="p-4 md:p-6 lg:p-8">
                    <div className="flex items-start mb-4 md:mb-6">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gold/10 flex items-center justify-center mr-3 md:mr-4 mt-1 flex-shrink-0">
                        <MapPin className="w-5 h-5 md:w-6 md:h-6 text-gold" />
                      </div>
                      <div>
                        <h3 className="text-lg md:text-xl font-playfair font-semibold mb-2 md:mb-3 text-gold">1. Mii de proprietăți</h3>
                        <p className="font-inter text-sm md:text-base text-muted-foreground leading-relaxed">
                          Cu peste 15.000 de proprietăți în baza de date, actualizate cel puțin o dată pe lună, puteți fi siguri că, indiferent de nevoile dumneavoastră, avem exact ceea ce căutați.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gold/10 hover:border-gold/30 transition-all duration-300">
                  <CardContent className="p-4 md:p-6 lg:p-8">
                    <div className="flex items-start mb-4 md:mb-6">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gold/10 flex items-center justify-center mr-3 md:mr-4 mt-1 flex-shrink-0">
                        <Clock className="w-5 h-5 md:w-6 md:h-6 text-gold" />
                      </div>
                      <div>
                        <h3 className="text-lg md:text-xl font-playfair font-semibold mb-2 md:mb-3 text-gold">2. Program prelungit de lucru</h3>
                        <p className="font-inter text-sm md:text-base text-muted-foreground leading-relaxed mb-3 md:mb-4">
                          Agenții noștri sunt disponibili de luni până sâmbătă. În plus, liniile noastre telefonice sunt deschise șapte zile pe săptămână.
                        </p>
                        <p className="font-inter text-sm md:text-base text-muted-foreground leading-relaxed">
                          În scopul de a vă asigura o proprietate vă recomandăm o vizionare mai rapidă. Noi vă însoțim la vizionare, fiind pregătiți pentru a răspunde imediat la orice întrebări și consiliere în cazul în care este necesar.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gold/10 hover:border-gold/30 transition-all duration-300">
                  <CardContent className="p-4 md:p-6 lg:p-8">
                    <div className="flex items-start mb-4 md:mb-6">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gold/10 flex items-center justify-center mr-3 md:mr-4 mt-1 flex-shrink-0">
                        <Eye className="w-5 h-5 md:w-6 md:h-6 text-gold" />
                      </div>
                      <div>
                        <h3 className="text-lg md:text-xl font-playfair font-semibold mb-2 md:mb-3 text-gold">3. Informații detaliate despre proprietăți</h3>
                        <p className="font-inter text-sm md:text-base text-muted-foreground leading-relaxed">
                          Oferindu-vă informații cât mai mult posibil, înainte de o vizionare, site-ul nostru și un portal deschis special pentru dumneavoastră sunt renumite pentru funcțiile lor de căutare ușor de utilizat și pentru informațiile detaliate.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gold/10 hover:border-gold/30 transition-all duration-300">
                  <CardContent className="p-4 md:p-6 lg:p-8">
                    <div className="flex items-start mb-4 md:mb-6">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gold/10 flex items-center justify-center mr-3 md:mr-4 mt-1 flex-shrink-0">
                        <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-gold" />
                      </div>
                      <div>
                        <h3 className="text-lg md:text-xl font-playfair font-semibold mb-2 md:mb-3 text-gold">4. Alerte pe e-mail</h3>
                        <p className="font-inter text-sm md:text-base text-muted-foreground leading-relaxed">
                          Pe lângă primirea detaliilor de proprietate - atunci când vă înregistrați la noi puteți alege să fiți notificat instantaneu pe email pe măsura ce noi proprietăți devin disponibile.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gold/10 hover:border-gold/30 transition-all duration-300 md:col-span-2">
                  <CardContent className="p-4 md:p-6 lg:p-8">
                    <div className="flex items-start mb-4 md:mb-6">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gold/10 flex items-center justify-center mr-3 md:mr-4 mt-1 flex-shrink-0">
                        <Award className="w-5 h-5 md:w-6 md:h-6 text-gold" />
                      </div>
                      <div>
                        <h3 className="text-lg md:text-xl font-playfair font-semibold mb-2 md:mb-3 text-gold">5. Consultanță de specialitate</h3>
                        <p className="font-inter text-sm md:text-base text-muted-foreground leading-relaxed">
                          În calitate de broker imobiliar din București, suntem capabili să vă oferim cunoștințe locale și consultanță de specialitate, indiferent de cerințele dumneavoastră.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-12 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8 md:mb-16">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4 px-2">
                  Servicii <span className="text-gold">Complete</span>
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-muted-foreground px-2">
                  Tot ce ai nevoie pentru o tranzacție imobiliară de succes
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 md:gap-6">
                {services.map((service, index) => (
                  <div key={index} className="flex items-center p-3 md:p-4 bg-background rounded-xl border border-gold/10 hover:border-gold/30 transition-colors">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gold/10 flex items-center justify-center mr-3 md:mr-4 flex-shrink-0">
                      <Heart className="w-3 h-3 md:w-4 md:h-4 text-gold" />
                    </div>
                    <span className="font-medium text-sm md:text-base">{service}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8 md:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4 px-2">
                Ce Spun <span className="text-gold">Clienții</span>
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground px-2">
                Mărturii reale de la familiile pe care le-am ajutat să își găsească casa
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 max-w-6xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="relative overflow-hidden border-gold/10 hover:border-gold/30 transition-all duration-300">
                  <CardContent className="p-4 md:p-6 lg:p-8">
                    <div className="flex mb-3 md:mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 md:w-5 md:h-5 text-gold fill-gold" />
                      ))}
                    </div>
                    
                    <p className="text-sm md:text-base text-muted-foreground italic mb-4 md:mb-6 leading-relaxed">
                      "{testimonial.text}"
                    </p>
                    
                    <div className="font-semibold text-sm md:text-base text-gold">
                      {testimonial.name}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-20 bg-gradient-to-r from-gold/10 via-gold-light/10 to-gold/10">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 md:mb-6 px-2">
                Gata să Găsești <span className="text-gold">Casa Perfectă?</span>
              </h2>
              
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 md:mb-8 px-2">
                Hai să discutăm despre visurile tale imobiliare. Consultația este gratuită și fără angajament.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
                <a href="https://wa.me/40767941512" target="_blank" rel="noopener noreferrer">
                  <Button variant="luxury" size="lg" className="w-full sm:w-auto px-6 md:px-8">
                    <MessageCircle className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                    Contactează-ne pe WhatsApp
                  </Button>
                </a>
                <Button variant="luxuryOutline" size="lg" className="w-full sm:w-auto px-6 md:px-8" onClick={() => {
                  document.getElementById('proprietati')?.scrollIntoView({ behavior: 'smooth' });
                  window.location.href = '/#proprietati';
                }}>
                  <TrendingUp className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                  Vezi Proprietățile
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
    </>
  );
};

export default WhyChooseUs;
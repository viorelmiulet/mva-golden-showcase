import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { usePageTracking } from "@/hooks/useGoogleAnalytics"
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

  return (
    <div className="min-h-screen">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-br from-background to-muted">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-4xl mx-auto">
              <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20 mb-6">
                Agenția Ta de Încredere
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                <span className="block text-foreground">De ce să ne</span>
                <span className="block bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                  Alegi pe Noi?
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed mb-8">
                Partenerii tăi de încredere pentru investiții imobiliare inteligente în vestul Bucureștiului.
                Experiență, transparență și rezultate garantate.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="https://wa.me/40767941512" target="_blank" rel="noopener noreferrer">
                  <Button variant="luxury" size="lg" className="px-8">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Consultație Gratuită
                  </Button>
                </a>
                <Button variant="luxuryOutline" size="lg" className="px-8" onClick={() => {
                  document.getElementById('avantaje')?.scrollIntoView({ behavior: 'smooth' });
                }}>
                  <Eye className="mr-2 h-5 w-5" />
                  Descoperă Avantajele
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Advantages Section */}
        <section id="avantaje" className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Avantajele <span className="text-gold">MVA Imobiliare</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Ceea ce ne diferențiază și ne face alegerea perfectă pentru nevoile tale imobiliare
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {advantages.map((advantage, index) => (
                <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-gold/10 hover:border-gold/30">
                  <CardContent className="p-8">
                    <div className="mb-6">
                      <div className={`w-14 h-14 rounded-2xl bg-background/50 flex items-center justify-center ${advantage.color} group-hover:scale-110 transition-transform duration-300`}>
                        <advantage.icon className="w-7 h-7" />
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-semibold mb-4 group-hover:text-gold transition-colors">
                      {advantage.title}
                    </h3>
                    
                    <p className="text-muted-foreground leading-relaxed">
                      {advantage.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Servicii <span className="text-gold">Complete</span>
                </h2>
                <p className="text-xl text-muted-foreground">
                  Tot ce ai nevoie pentru o tranzacție imobiliară de succes
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {services.map((service, index) => (
                  <div key={index} className="flex items-center p-4 bg-background rounded-xl border border-gold/10 hover:border-gold/30 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center mr-4">
                      <Heart className="w-4 h-4 text-gold" />
                    </div>
                    <span className="font-medium">{service}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ce Spun <span className="text-gold">Clienții</span>
              </h2>
              <p className="text-xl text-muted-foreground">
                Mărturii reale de la familiile pe care le-am ajutat să își găsească casa
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="relative overflow-hidden border-gold/10 hover:border-gold/30 transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-gold fill-gold" />
                      ))}
                    </div>
                    
                    <p className="text-muted-foreground italic mb-6 leading-relaxed">
                      "{testimonial.text}"
                    </p>
                    
                    <div className="font-semibold text-gold">
                      {testimonial.name}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-gold/10 via-gold-light/10 to-gold/10">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Gata să Găsești <span className="text-gold">Casa Perfectă?</span>
              </h2>
              
              <p className="text-xl text-muted-foreground mb-8">
                Hai să discutăm despre visurile tale imobiliare. Consultația este gratuită și fără angajament.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="https://wa.me/40767941512" target="_blank" rel="noopener noreferrer">
                  <Button variant="luxury" size="lg" className="px-8">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Contactează-ne Acum
                  </Button>
                </a>
                <Button variant="luxuryOutline" size="lg" className="px-8" onClick={() => {
                  document.getElementById('proprietati')?.scrollIntoView({ behavior: 'smooth' });
                  window.location.href = '/#proprietati';
                }}>
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Vezi Proprietățile
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default WhyChooseUs;
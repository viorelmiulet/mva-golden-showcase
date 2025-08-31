import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowDown, Sparkles, MapPin, Phone, MessageCircle } from "lucide-react"
import heroProperty from "@/assets/hero-property.jpg"
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics"

const Hero = () => {
  const { trackEvent, trackContact } = useGoogleAnalytics();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      // Track navigation click
      trackEvent('scroll_to_section', 'navigation', sectionId);
    }
  };

  const handleWhatsAppClick = () => {
    trackContact('whatsapp', 'hero_cta');
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background with Parallax Effect */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-background/70 z-10"></div>
        <img 
          src={heroProperty} 
          alt="Apartamente premium MVA Imobiliare - complexe rezidențiale moderne în Chiajna, vestul Bucureștiului" 
          className="w-full h-full object-cover scale-110 animate-fade-in"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10"></div>
      </div>

      {/* Content Grid */}
      <main className="relative z-20 container mx-auto px-4 min-h-screen flex items-center">
        <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
          
          {/* Left Column - Main Content */}
          <header className="space-y-8">
            <div className="space-y-6">
              <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20 px-4 py-2">
                <Sparkles className="w-4 h-4 mr-2" />
                Premium Real Estate
              </Badge>
              
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight">
                <span className="block text-foreground">Soluții Imobiliare</span>
                <span className="block bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                  Complete
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-lg">
                Descoperă cele mai selective proiecte imobiliare din vestul Bucureștiului. 
                Investiții sigure cu finisaje premium și locații strategice.
              </p>
            </div>
            
            <nav className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="luxury" 
                size="lg" 
                className="group px-8"
                onClick={() => scrollToSection('proprietati')}
              >
                Explorează Proiectele
                <ArrowDown className="ml-2 h-4 w-4 group-hover:translate-y-1 transition-transform" />
              </Button>
              
              <a href="https://wa.me/40767941512" target="_blank" rel="noopener noreferrer" onClick={handleWhatsAppClick}>
                <Button 
                  variant="luxuryOutline" 
                  size="lg"
                  className="w-full sm:w-auto px-8"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Contactează-ne pe WhatsApp
                </Button>
              </a>
            </nav>
          </header>

          {/* Right Column - Stats Cards */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6 mt-8 lg:mt-0">
            <div className="bg-card/60 backdrop-blur-sm border border-gold/10 rounded-2xl p-4 sm:p-6 hover:bg-card/80 transition-all duration-300 group">
              <div className="text-2xl sm:text-3xl font-bold text-gold mb-2">€40K+</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Preturi de la</div>
              <div className="text-xs sm:text-sm text-foreground font-medium">Apartamente moderne</div>
            </div>
            
            <div className="bg-card/60 backdrop-blur-sm border border-gold/10 rounded-2xl p-4 sm:p-6 hover:bg-card/80 transition-all duration-300 group sm:mt-8">
              <div className="text-2xl sm:text-3xl font-bold text-gold mb-2">3</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Complexe disponibile</div>
              <div className="text-xs sm:text-sm text-foreground font-medium">Chiajna, Ilfov</div>
            </div>
            
            <div className="bg-card/60 backdrop-blur-sm border border-gold/10 rounded-2xl p-4 sm:p-6 hover:bg-card/80 transition-all duration-300 group">
              <div className="text-2xl sm:text-3xl font-bold text-gold mb-2">1-3</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Camere disponibile</div>
              <div className="text-xs sm:text-sm text-foreground font-medium">30-75 mp</div>
            </div>
            
            <div className="bg-card/60 backdrop-blur-sm border border-gold/10 rounded-2xl p-4 sm:p-6 hover:bg-card/80 transition-all duration-300 group sm:mt-8">
              <div className="flex items-center mb-2">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gold mr-1" />
                <div className="text-xs sm:text-sm text-gold font-semibold">Vest București</div>
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Locație strategică</div>
              <div className="text-xs sm:text-sm text-foreground font-medium">Acces facil la centru</div>
            </div>
          </div>
        </div>
      </main>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce z-20">
        <div className="w-6 h-10 border-2 border-gold rounded-full flex justify-center cursor-pointer hover:border-gold-light transition-colors"
             onClick={() => scrollToSection('despre')}>
          <div className="w-1 h-3 bg-gold rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  )
}

export default Hero
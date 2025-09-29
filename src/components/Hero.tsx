import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowDown, Sparkles, MapPin, Phone, MessageCircle, UserPlus } from "lucide-react"
import heroProperty from "@/assets/hero-property.jpg"
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics"
import { CollaborationForm } from "@/components/CollaborationForm"

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
      {/* Liquid Glass Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 z-10" style={{ background: 'var(--gradient-hero-glass)' }}></div>
        <img 
          src={heroProperty} 
          alt="Apartamente premium MVA Imobiliare - complexe rezidențiale moderne în Chiajna, vestul Bucureștiului" 
          className="w-full h-full object-cover scale-110 animate-fade-in"
          loading="eager"
        />
        <div className="absolute inset-0 backdrop-blur-[2px] z-5"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent z-10"></div>
      </div>

      {/* Content Grid */}
      <main className="relative z-20 container mx-auto px-3 sm:px-4 lg:px-6 min-h-screen flex items-center">
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center w-full pt-16 sm:pt-20">
          
          {/* Left Column - Main Content */}
          <header className="space-y-4 sm:space-y-6 lg:space-y-8 text-center lg:text-left">
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Premium Real Estate
              </Badge>
              
              <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                <span className="block text-foreground mb-1 sm:mb-2">Soluții Imobiliare</span>
                <span className="block bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                  Complete
                </span>
              </h1>
              
              <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0 px-2 sm:px-0">
                Descoperă cele mai selective proiecte imobiliare din vestul Bucureștiului. 
                Investiții sigure cu finisaje premium și locații strategice.
              </p>
            </div>
            
            <nav className="flex flex-col xs:flex-row gap-3 sm:gap-4 px-2 sm:px-0">
              <CollaborationForm>
                <Button 
                  variant="luxury" 
                  size="lg" 
                  className="group px-4 sm:px-6 lg:px-8 h-11 sm:h-12 lg:h-14 text-sm sm:text-base font-semibold w-full xs:w-auto shadow-2xl"
                >
                  <UserPlus className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Colaborează cu </span>
                  <span className="sm:hidden">Colaborează</span>
                  <span className="hidden sm:inline">noi</span>
                </Button>
              </CollaborationForm>
              
              <a 
                href="https://wa.me/40767941512?text=Salut!%20Sunt%20interesat%20de%20apartamente%20in%20complexele%20voastre%20din%20Chiajna.%20Imi%20puteti%20oferi%20mai%20multe%20detalii%3F" 
                target="_blank" 
                rel="noopener noreferrer" 
                onClick={handleWhatsAppClick}
              >
                <Button 
                  variant="luxuryOutline" 
                  size="lg"
                  className="w-full xs:w-auto px-4 sm:px-6 lg:px-8 h-11 sm:h-12 lg:h-14 text-sm sm:text-base font-semibold"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  <span className="hidden xs:inline">Contactează-ne pe </span>WhatsApp
                </Button>
              </a>
            </nav>
          </header>

          {/* Right Column - Stats Cards */}
          <div className="grid grid-cols-2 gap-2 xs:gap-3 sm:gap-4 lg:gap-6 mt-6 lg:mt-0 px-2 sm:px-0">
            <div className="card-responsive group touch-manipulation">
              <div className="text-lg xs:text-xl sm:text-2xl lg:text-3xl font-bold text-gold mb-1 sm:mb-2 drop-shadow-lg">€40K+</div>
              <div className="text-xs text-muted-foreground">Preturi de la</div>
              <div className="text-xs sm:text-sm text-foreground font-medium">Apartamente moderne</div>
            </div>
            
            <div className="card-responsive group lg:mt-8 touch-manipulation">
              <div className="text-lg xs:text-xl sm:text-2xl lg:text-3xl font-bold text-gold mb-1 sm:mb-2 drop-shadow-lg">3</div>
              <div className="text-xs text-muted-foreground">Complexe disponibile</div>
              <div className="text-xs sm:text-sm text-foreground font-medium">Chiajna, Ilfov</div>
            </div>
            
            <div className="card-responsive group touch-manipulation">
              <div className="text-lg xs:text-xl sm:text-2xl lg:text-3xl font-bold text-gold mb-1 sm:mb-2 drop-shadow-lg">1-3</div>
              <div className="text-xs text-muted-foreground">Camere disponibile</div>
              <div className="text-xs sm:text-sm text-foreground font-medium">30-75 mp</div>
            </div>
            
            <div className="card-responsive group lg:mt-8 touch-manipulation">
              <div className="flex items-center mb-1 sm:mb-2">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gold mr-1 drop-shadow-lg" />
                <div className="text-xs sm:text-sm text-gold font-semibold drop-shadow-lg">Vest București</div>
              </div>
              <div className="text-xs text-muted-foreground">Locație strategică</div>
              <div className="text-xs sm:text-sm text-foreground font-medium">Acces facil la centru</div>
            </div>
          </div>
        </div>
      </main>

      {/* Scroll Indicator - Hidden on small screens */}
      <div className="hidden sm:block absolute bottom-6 lg:bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce z-20">
        <div className="w-6 h-10 border-2 border-gold rounded-full flex justify-center cursor-pointer hover:border-gold-light transition-colors touch-manipulation"
             onClick={() => scrollToSection('despre')}>
          <div className="w-1 h-3 bg-gold rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  )
}

export default Hero
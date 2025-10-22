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
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden" itemScope itemType="https://schema.org/WebPageElement">
      {/* Liquid Glass Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 z-10" style={{ background: 'var(--gradient-hero-glass)' }}></div>
        <img 
          src={heroProperty} 
          alt="Apartamente premium MVA Imobiliare - complexe rezidențiale moderne în Chiajna, vestul Bucureștiului cu finisaje de lux și facilități complete" 
          className="w-full h-full object-cover scale-110 animate-fade-in"
          loading="eager"
          itemProp="image"
        />
        <div className="absolute inset-0 backdrop-blur-[2px] z-5"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent z-10"></div>
      </div>

      {/* Content Grid */}
      <div className="relative z-20 container mx-auto px-3 sm:px-4 lg:px-6 min-h-screen flex items-center" role="main">
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center w-full pt-16 sm:pt-20">
          
          {/* Left Column - Main Content */}
          <header className="space-y-4 sm:space-y-6 lg:space-y-8 text-center lg:text-left" itemScope itemType="https://schema.org/WPHeader">
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Premium Real Estate
              </Badge>
              
              <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight" itemProp="headline">
                <span className="block text-foreground mb-1 sm:mb-2">Soluții Imobiliare</span>
                <span className="block bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                  Complete
                </span>
              </h1>
              
              <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0 px-2 sm:px-0" itemProp="description">
                Descoperă cele mai selective proiecte imobiliare din vestul Bucureștiului. 
                Investiții sigure cu finisaje premium și locații strategice.
              </p>
            </div>
            
            <nav className="flex flex-col xs:flex-row gap-3 sm:gap-4 px-2 sm:px-0" aria-label="Call to action buttons">
              <CollaborationForm>
                <Button 
                  variant="luxury" 
                  size="lg" 
                  className="group px-3 sm:px-6 lg:px-8 h-11 sm:h-12 lg:h-14 text-xs sm:text-base font-semibold w-full xs:w-auto shadow-2xl"
                >
                  <UserPlus className="mr-1.5 sm:mr-2 h-4 w-4 flex-shrink-0" />
                  <span>Colaborează cu noi</span>
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
          <aside className="grid grid-cols-2 gap-2 xs:gap-3 sm:gap-4 lg:gap-6 mt-6 lg:mt-0 px-2 sm:px-0 max-w-md mx-auto lg:ml-auto lg:mr-0" aria-label="Statistici cheie proprietăți">
            <div className="card-responsive group touch-manipulation h-full aspect-square flex flex-col justify-center p-3 sm:p-4">
              <div className="text-base xs:text-lg sm:text-xl lg:text-2xl font-bold text-gold mb-1 drop-shadow-lg">€40K+</div>
              <div className="text-[10px] xs:text-xs text-muted-foreground">Preturi de la</div>
              <div className="text-[10px] xs:text-xs text-foreground font-medium">Apartamente moderne</div>
            </div>
            
            <div className="card-responsive group touch-manipulation h-full aspect-square flex flex-col justify-center p-3 sm:p-4">
              <div className="text-base xs:text-lg sm:text-xl lg:text-2xl font-bold text-gold mb-1 drop-shadow-lg">3</div>
              <div className="text-[10px] xs:text-xs text-muted-foreground">Complexe disponibile</div>
              <div className="text-[10px] xs:text-xs text-foreground font-medium">Chiajna, Ilfov</div>
            </div>
            
            <div className="card-responsive group touch-manipulation h-full aspect-square flex flex-col justify-center p-3 sm:p-4">
              <div className="text-base xs:text-lg sm:text-xl lg:text-2xl font-bold text-gold mb-1 drop-shadow-lg">1-3</div>
              <div className="text-[10px] xs:text-xs text-muted-foreground">Camere disponibile</div>
              <div className="text-[10px] xs:text-xs text-foreground font-medium">30-75 mp</div>
            </div>
            
            <div className="card-responsive group touch-manipulation h-full aspect-square flex flex-col justify-center p-3 sm:p-4">
              <div className="flex items-center mb-1">
                <MapPin className="w-3 h-3 text-gold mr-1 drop-shadow-lg" />
                <div className="text-[10px] xs:text-xs text-gold font-semibold drop-shadow-lg">Vest București</div>
              </div>
              <div className="text-[10px] xs:text-xs text-muted-foreground">Locație strategică</div>
              <div className="text-[10px] xs:text-xs text-foreground font-medium">Acces facil la centru</div>
            </div>
          </aside>
        </div>
      </div>

      {/* Scroll Indicator - Hidden on small screens */}
      <button 
        className="hidden sm:block absolute bottom-6 lg:bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce z-20"
        onClick={() => scrollToSection('despre')}
        aria-label="Scroll to about section"
      >
        <div className="w-6 h-10 border-2 border-gold rounded-full flex justify-center cursor-pointer hover:border-gold-light transition-colors touch-manipulation">
          <div className="w-1 h-3 bg-gold rounded-full mt-2 animate-pulse"></div>
        </div>
      </button>
    </section>
  )
}

export default Hero
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowDown, Sparkles, MapPin, Phone, UserPlus } from "lucide-react"
import heroProperty from "@/assets/hero-property.jpg"
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics"
import { CollaborationForm } from "@/components/CollaborationForm"
import { useRealEstateStats } from "@/hooks/useRealEstateStats"
import WhatsAppIcon from "@/components/icons/WhatsAppIcon"
import { useLanguage } from "@/contexts/LanguageContext"
import { addPreloadLink } from "@/hooks/useImagePreload"

const Hero = () => {
  const { trackEvent, trackContact } = useGoogleAnalytics();
  const { data: stats, isLoading } = useRealEstateStats();
  const { t, language } = useLanguage();

  // Preload hero image immediately for LCP optimization
  useEffect(() => {
    addPreloadLink(heroProperty, { width: 1920, quality: 85, priority: 'high' });
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      trackEvent('scroll_to_section', 'navigation', sectionId);
    }
  };

  const handleWhatsAppClick = () => {
    trackContact('whatsapp', 'hero_cta');
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden" itemScope itemType="https://schema.org/WebPageElement">
      {/* Modern Glass Background - Optimized for LCP */}
      <div className="absolute inset-0">
        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-radial from-gold/10 via-gold/5 to-transparent rounded-full blur-3xl animate-float opacity-60" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-radial from-gold/8 via-transparent to-transparent rounded-full blur-3xl animate-float opacity-40" style={{ animationDelay: '3s' }} />
        
        <div className="absolute inset-0 z-10" style={{ background: 'var(--gradient-hero-glass)' }}></div>
        <img 
          src={heroProperty} 
          alt="Apartamente premium MVA Imobiliare - complexe rezidențiale moderne în Chiajna, vestul Bucureștiului cu finisaje de lux și facilități complete" 
          className="w-full h-full object-cover scale-105 animate-fade-in"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          itemProp="image"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 backdrop-blur-[1px] z-5"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-background/60 z-10"></div>
      </div>

      {/* Content Grid */}
      <div className="relative z-20 container mx-auto px-3 sm:px-4 lg:px-6 min-h-screen flex items-center" role="main">
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center w-full pt-16 sm:pt-20">
          
          {/* Left Column - Main Content */}
          <header className="space-y-4 sm:space-y-6 lg:space-y-8 text-center lg:text-left" itemScope itemType="https://schema.org/WPHeader">
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
            <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight tracking-tight" itemProp="headline">
                <span className="block text-foreground mb-1 sm:mb-2 drop-shadow-lg">
                  {language === 'ro' ? 'Soluții Imobiliare' : 'Real Estate Solutions'}
                </span>
                <span className="block text-gradient-gold drop-shadow-lg">
                  {language === 'ro' ? 'Complete' : 'Complete'}
                </span>
              </h1>
              
              <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-muted-foreground/90 leading-relaxed max-w-lg mx-auto lg:mx-0 px-2 sm:px-0 backdrop-blur-sm" itemProp="description">
                {language === 'ro' 
                  ? 'Descoperă cele mai selective proiecte imobiliare din vestul Bucureștiului. Investiții sigure cu finisaje premium și locații strategice.'
                  : 'Discover the most selective real estate projects in western Bucharest. Safe investments with premium finishes and strategic locations.'}
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
                  <span>{language === 'ro' ? 'Colaborează cu noi' : 'Partner with us'}</span>
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
                  <WhatsAppIcon className="mr-2 h-4 w-4" />
                  <span className="hidden xs:inline">{language === 'ro' ? 'Contactează-ne pe ' : 'Contact us on '}</span>WhatsApp
                </Button>
              </a>
            </nav>
          </header>

          {/* Right Column - Stats Cards */}
          <aside className="grid grid-cols-2 gap-3 xs:gap-4 sm:gap-5 lg:gap-6 mt-6 lg:mt-0 px-2 sm:px-0 max-w-md mx-auto lg:ml-auto lg:mr-0" aria-label={language === 'ro' ? 'Statistici cheie proprietăți' : 'Key property statistics'}>
            <div className="stats-card group touch-manipulation h-full aspect-square flex flex-col justify-center p-4 sm:p-5 glow-gold">
              <div className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient-gold mb-2">
                {isLoading ? "..." : stats?.propertiesCount || 0}
              </div>
              <div className="text-[11px] xs:text-xs text-muted-foreground mb-0.5">
                {language === 'ro' ? 'Proprietăți listate' : 'Listed properties'}
              </div>
              <div className="text-[11px] xs:text-xs text-foreground/80 font-medium">
                {language === 'ro' ? 'Apartamente disponibile' : 'Available apartments'}
              </div>
            </div>
            
            <div className="stats-card group touch-manipulation h-full aspect-square flex flex-col justify-center p-4 sm:p-5 glow-gold" style={{ animationDelay: '0.1s' }}>
              <div className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient-gold mb-2">
                {isLoading ? "..." : stats?.projectsCount || 0}
              </div>
              <div className="text-[11px] xs:text-xs text-muted-foreground mb-0.5">
                {language === 'ro' ? 'Complexe disponibile' : 'Available complexes'}
              </div>
              <div className="text-[11px] xs:text-xs text-foreground/80 font-medium">Chiajna, Ilfov</div>
            </div>
            
            <div className="stats-card group touch-manipulation h-full aspect-square flex flex-col justify-center p-4 sm:p-5 glow-gold" style={{ animationDelay: '0.2s' }}>
              <div className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient-gold mb-2">1-3</div>
              <div className="text-[11px] xs:text-xs text-muted-foreground mb-0.5">
                {language === 'ro' ? 'Camere disponibile' : 'Rooms available'}
              </div>
              <div className="text-[11px] xs:text-xs text-foreground/80 font-medium">30-75 mp</div>
            </div>
            
            <div className="stats-card group touch-manipulation h-full aspect-square flex flex-col justify-center p-4 sm:p-5 glow-gold" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center mb-2">
                <MapPin className="w-4 h-4 text-gold mr-1.5" />
                <div className="text-xs xs:text-sm text-gradient-gold font-bold">
                  {language === 'ro' ? 'Vest București' : 'West Bucharest'}
                </div>
              </div>
              <div className="text-[11px] xs:text-xs text-muted-foreground mb-0.5">
                {language === 'ro' ? 'Locație strategică' : 'Strategic location'}
              </div>
              <div className="text-[11px] xs:text-xs text-foreground/80 font-medium">
                {language === 'ro' ? 'Acces facil la centru' : 'Easy access to center'}
              </div>
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
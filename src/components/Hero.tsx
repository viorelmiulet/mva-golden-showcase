import { Button } from "@/components/ui/button"
import { Calendar, Mail } from "lucide-react"
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics"
import { lazy, Suspense } from "react"
import { Link } from "react-router-dom"
import { useLanguage } from "@/contexts/LanguageContext"
import { useRealEstateStats } from "@/hooks/useRealEstateStats"

const ScheduleViewingDialog = lazy(() => import("@/components/ScheduleViewingDialog").then((m) => ({ default: m.ScheduleViewingDialog })))

const Hero = () => {
  const { trackContact } = useGoogleAnalytics();
  const { language } = useLanguage();
  const { data: stats, isLoading: isStatsLoading } = useRealEstateStats();

  const handleContactClick = () => {
    trackContact('form', 'hero_cta');
  };

  return (
    <section id="home" className="relative min-h-[88vh] sm:min-h-[85vh] flex items-center overflow-hidden" itemScope itemType="https://schema.org/WebPageElement">
      {/* Background */}
      <div className="absolute inset-0">
        <img 
          src="/hero-mobile.webp"
          srcSet="/hero-mobile.webp 768w, /hero-desktop.webp 1440w"
          sizes="(max-width: 768px) 100vw, 1440px"
          alt="Apartamente de vânzare Militari București – MVA Imobiliare" 
          className="w-full h-full object-cover"
          loading="eager"
          // @ts-ignore
          fetchpriority="high"
          decoding="sync"
          itemProp="image"
          width={1440}
          height={810}
        />
        <div className="absolute inset-0 bg-background/80 md:backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-20 container mx-auto px-5 sm:px-6 lg:px-6 pt-16 sm:pt-20 md:pt-24 pb-10 md:pb-12">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center w-full">
          
          {/* Left - Main Content */}
          <header className="space-y-5 sm:space-y-6 text-center lg:text-left" itemScope itemType="https://schema.org/WPHeader">
            <h1 className="text-[2.25rem] leading-[1.1] sm:text-5xl md:text-5xl lg:text-6xl font-bold tracking-tight" itemProp="headline">
              <span className="block text-foreground">
                {language === 'ro' ? 'Soluții Imobiliare' : 'Real Estate Solutions'}
              </span>
              <span className="block text-gradient-gold">
                {language === 'ro' ? 'Complete' : 'Complete'}
              </span>
            </h1>
            
            <p className="text-base sm:text-base lg:text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0" itemProp="description">
              {language === 'ro' 
                ? 'Descoperă cele mai selective proiecte imobiliare din vestul Bucureștiului. Investiții sigure cu finisaje premium și locații strategice.'
                : 'Discover the most selective real estate projects in western Bucharest. Safe investments with premium finishes and strategic locations.'}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-1 w-full max-w-md mx-auto lg:mx-0" aria-label="Call to action buttons">
              <Suspense fallback={<Button variant="luxury" size="lg" className="group w-full sm:flex-1 px-6 h-12 font-semibold"><Calendar className="mr-2 h-4 w-4" />{language === 'ro' ? 'Programează o vizionare' : 'Schedule a viewing'}</Button>}>
                <ScheduleViewingDialog
                  propertyTitle={language === 'ro' ? 'Consultanță generală' : 'General consultation'}
                  propertyId="hero-cta"
                  trigger={
                    <Button variant="luxury" size="lg" className="group w-full sm:flex-1 px-6 h-12 font-semibold">
                      <Calendar className="mr-2 h-4 w-4" />
                      {language === 'ro' ? 'Programează o vizionare' : 'Schedule a viewing'}
                    </Button>
                  }
                />
              </Suspense>

              <Link to="/contact" onClick={handleContactClick} className="w-full sm:flex-1">
                <Button variant="luxuryOutline" size="lg" className="w-full px-6 h-12 font-semibold">
                  <Mail className="mr-2 h-4 w-4" />
                  {language === 'ro' ? 'Contact' : 'Contact'}
                </Button>
              </Link>
            </div>
          </header>

          {/* Right - Stats */}
          <aside className="hidden md:grid grid-cols-2 gap-4 max-w-sm mx-auto lg:ml-auto lg:mr-0" aria-label={language === 'ro' ? 'Statistici cheie' : 'Key stats'}>
            {[
              { value: isStatsLoading ? "..." : stats?.propertiesCount ?? "—", label: language === 'ro' ? 'Proprietăți listate' : 'Listed properties' },
              { value: isStatsLoading ? "..." : stats?.projectsCount ?? "—", label: language === 'ro' ? 'Ansambluri rezidențiale' : 'Residential complexes' },
              { value: "1-3", label: language === 'ro' ? 'Camere · 30-75 mp' : 'Rooms · 30-75 sqm' },
              { value: language === 'ro' ? 'Vest' : 'West', label: language === 'ro' ? 'București' : 'Bucharest' },
            ].map((stat, i) => (
              <div key={i} className="glass rounded-2xl p-5 text-center border border-border/50">
                <div className="text-2xl sm:text-3xl font-bold text-gradient-gold mb-1">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </section>
  )
}

export default Hero

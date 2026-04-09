import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics"
import { lazy, Suspense } from "react"
import WhatsAppIcon from "@/components/icons/WhatsAppIcon"
import { useLanguage } from "@/contexts/LanguageContext"
import { useRealEstateStats } from "@/hooks/useRealEstateStats"

const CollaborationForm = lazy(() => import("@/components/CollaborationForm").then((module) => ({ default: module.CollaborationForm })))

const Hero = () => {
  const { trackContact } = useGoogleAnalytics();
  const { language } = useLanguage();
  const { data: stats, isLoading: isStatsLoading } = useRealEstateStats();

  const handleWhatsAppClick = () => {
    trackContact('whatsapp', 'hero_cta');
  };

  return (
    <section id="home" className="relative min-h-[85vh] flex items-center overflow-hidden" itemScope itemType="https://schema.org/WebPageElement">
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
      <div className="relative z-20 container mx-auto px-4 lg:px-6 pt-10 md:pt-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center w-full">
          
          {/* Left - Main Content */}
          <header className="space-y-6 text-center lg:text-left" itemScope itemType="https://schema.org/WPHeader">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight" itemProp="headline">
              <span className="block text-foreground">
                {language === 'ro' ? 'Soluții Imobiliare' : 'Real Estate Solutions'}
              </span>
              <span className="block text-gradient-gold">
                {language === 'ro' ? 'Complete' : 'Complete'}
              </span>
            </h1>
            
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0" itemProp="description">
              {language === 'ro' 
                ? 'Descoperă cele mai selective proiecte imobiliare din vestul Bucureștiului. Investiții sigure cu finisaje premium și locații strategice.'
                : 'Discover the most selective real estate projects in western Bucharest. Safe investments with premium finishes and strategic locations.'}
            </p>
            
            <div className="flex flex-col md:flex-row gap-3" aria-label="Call to action buttons">
              <Suspense fallback={<Button variant="luxury" size="lg" className="group px-6 h-12 font-semibold w-full md:w-auto"><UserPlus className="mr-2 h-4 w-4" />{language === 'ro' ? 'Colaborează cu noi' : 'Partner with us'}</Button>}>
                <CollaborationForm>
                  <Button variant="luxury" size="lg" className="group px-6 h-12 font-semibold w-full md:w-auto">
                    <UserPlus className="mr-2 h-4 w-4" />
                    {language === 'ro' ? 'Colaborează cu noi' : 'Partner with us'}
                  </Button>
                </CollaborationForm>
              </Suspense>
              
              <a 
                href="https://wa.me/40767941512?text=Salut!%20Sunt%20interesat%20de%20apartamente%20in%20complexele%20voastre%20din%20Chiajna.%20Imi%20puteti%20oferi%20mai%20multe%20detalii%3F" 
                target="_blank" 
                rel="noopener noreferrer" 
                onClick={handleWhatsAppClick}
                className="w-full md:w-auto"
              >
                <Button variant="luxuryOutline" size="lg" className="w-full md:w-auto px-6 h-12 font-semibold">
                  <WhatsAppIcon className="mr-2 h-4 w-4" />
                  <span className="hidden md:inline">{language === 'ro' ? 'Contactează-ne pe ' : 'Contact us on '}</span>WhatsApp
                </Button>
              </a>
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

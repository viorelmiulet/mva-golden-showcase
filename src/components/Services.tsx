import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Home, 
  TrendingUp, 
  ClipboardCheck, 
  Key, 
  Scale, 
  Camera,
  ArrowRight,
  Phone 
} from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

const Services = () => {
  const { language } = useLanguage();

  const services = language === 'ro' ? [
    {
      title: "Vânzare Complexe Rezidențiale",
      description: "Comercializarea apartamentelor din complexele premium cu strategii de marketing personalizate și prezentare profesională.",
      icon: Home,
      highlight: true
    },
    {
      title: "Consultanță în Investiții",
      description: "Analiză de piață și consultanță specializată pentru investițiile imobiliare cu randament maxim în vestul Bucureștiului.",
      icon: TrendingUp
    },
    {
      title: "Evaluări Profesionale",
      description: "Evaluări precise și obiective realizate de experți autorizați conform standardelor internaționale.",
      icon: ClipboardCheck
    },
    {
      title: "Administrare Proprietăți",
      description: "Servicii complete de administrare și întreținere pentru apartamentele din portofoliul dvs.",
      icon: Key
    },
    {
      title: "Consultanță Juridică",
      description: "Asistență juridică specializată pentru toate aspectele legale ale tranzacțiilor imobiliare.",
      icon: Scale
    },
    {
      title: "Marketing Premium",
      description: "Strategii de marketing premium cu fotografii profesionale și prezentări virtuale interactive.",
      icon: Camera
    }
  ] : [
    {
      title: "Residential Complex Sales",
      description: "Marketing apartments in premium complexes with personalized strategies and professional presentation.",
      icon: Home,
      highlight: true
    },
    {
      title: "Investment Consulting",
      description: "Market analysis and specialized consulting for real estate investments with maximum returns in western Bucharest.",
      icon: TrendingUp
    },
    {
      title: "Professional Valuations",
      description: "Accurate and objective valuations by authorized experts according to international standards.",
      icon: ClipboardCheck
    },
    {
      title: "Property Management",
      description: "Complete management and maintenance services for apartments in your portfolio.",
      icon: Key
    },
    {
      title: "Legal Consulting",
      description: "Specialized legal assistance for all aspects of real estate transactions.",
      icon: Scale
    },
    {
      title: "Premium Marketing",
      description: "Premium marketing strategies with professional photography and interactive virtual presentations.",
      icon: Camera
    }
  ];

  return (
    <section id="servicii" className="relative py-16 sm:py-20 lg:py-28 overflow-hidden" itemScope itemType="https://schema.org/Service">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/5 via-background to-secondary/5" />
      <div className="absolute bottom-0 left-1/2 w-[600px] h-[600px] bg-gradient-radial from-gold/5 to-transparent rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
      
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 relative z-10">
        <article className="max-w-6xl mx-auto">
          
          {/* Header */}
          <header className="text-center mb-14 sm:mb-18 lg:mb-24">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 sm:mb-8 tracking-tight" itemProp="name">
              <span className="text-foreground drop-shadow-lg">{language === 'ro' ? 'Servicii ' : 'Complete '}</span>
              <span className="text-gradient-gold">
                {language === 'ro' ? 'Complete' : 'Services'}
              </span>
            </h1>
            
            <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4 sm:px-0" itemProp="description">
              {language === 'ro'
                ? 'Oferim o gamă completă de servicii imobiliare premium, adaptate perfect pentru complexele rezidențiale moderne din vestul capitalei.'
                : 'We offer a complete range of premium real estate services, perfectly tailored for modern residential complexes in the western capital.'}
            </p>
          </header>

          {/* Services Grid */}
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8 px-2 sm:px-0">
            {services.map((service, index) => {
              const Icon = service.icon
              
              return (
                <div 
                  key={index} 
                  className={`card-modern group relative overflow-hidden p-6 sm:p-7 lg:p-8 ${
                    service.highlight 
                      ? 'border-gold/30 bg-gradient-to-br from-gold/8 to-gold-dark/5' 
                      : ''
                  } border-glow`}
                >
                    {service.highlight && (
                      <div className="absolute top-4 right-4">
                        <Badge variant="secondary" className="bg-gradient-to-r from-gold to-gold-dark text-primary-foreground text-xs font-medium shadow-lg">
                          {language === 'ro' ? 'Specializare' : 'Specialty'}
                        </Badge>
                      </div>
                    )}
                    
                    <div className="space-y-4 sm:space-y-5 lg:space-y-6">
                      {/* Icon */}
                      <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-2xl ${
                        service.highlight 
                          ? 'bg-gradient-to-br from-gold to-gold-dark shadow-lg' 
                          : 'bg-gradient-to-br from-gold/15 to-gold-dark/15 border border-gold/20'
                      } group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                        <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${
                          service.highlight ? 'text-primary-foreground' : 'text-gold'
                        }`} />
                      </div>
                      
                      {/* Title */}
                      <h2 className={`text-base sm:text-lg lg:text-xl font-bold leading-tight ${
                        service.highlight ? 'text-gradient-gold' : 'text-foreground group-hover:text-gold'
                      } transition-colors`}>
                        {service.title}
                      </h2>
                      
                      {/* Description */}
                      <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                        {service.description}
                      </p>
                      
                      {/* Hover Arrow */}
                      <div className="flex items-center text-gold opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        <span className="text-sm font-medium mr-2">{language === 'ro' ? 'Află mai multe' : 'Learn more'}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                </div>
              )
            })}
          </div>

          {/* CTA Section */}
          <footer className="mt-14 sm:mt-18 lg:mt-24 text-center px-2 sm:px-0">
            <div className="card-modern p-8 sm:p-10 lg:p-12 border-gold/20 glow-gold shimmer">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-4 sm:mb-5">
                {language === 'ro' ? 'Pregătit să îți găsești apartamentul perfect?' : 'Ready to find your perfect apartment?'}
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
                {language === 'ro' 
                  ? 'Contactează-ne astăzi pentru o consultație gratuită și descoperă cum putem să te ajutăm să găsești proprietatea ideală.'
                  : 'Contact us today for a free consultation and discover how we can help you find the ideal property.'}
              </p>
              <a href="tel:0767941512" aria-label={language === 'ro' ? 'Sună la MVA Imobiliare' : 'Call MVA Real Estate'}>
                <button className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-gold to-gold-dark text-primary-foreground rounded-xl text-sm sm:text-base font-semibold hover:shadow-lg hover:shadow-gold/30 transition-all duration-300 touch-manipulation min-h-[44px] group">
                  <Phone className="mr-2 w-5 h-5 flex-shrink-0 group-hover:rotate-12 transition-transform" aria-hidden="true" />
                  <span>0767 941 512</span>
                </button>
              </a>
            </div>
          </footer>
        </article>
      </div>
    </section>
  )
}

export default Services
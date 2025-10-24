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

const Services = () => {
  const services = [
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
  ]

  return (
    <section id="servicii" className="py-12 sm:py-16 lg:py-24 bg-background" itemScope itemType="https://schema.org/Service">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <article className="max-w-6xl mx-auto">
          
          {/* Header */}
          <header className="text-center mb-12 sm:mb-16 lg:mb-20">
            <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20 mb-4 sm:mb-6 text-xs sm:text-sm">
              Servicii Premium
            </Badge>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 sm:mb-8" itemProp="name">
              <span className="text-foreground">Servicii </span>
              <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                Complete
              </span>
            </h1>
            
            <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4 sm:px-0" itemProp="description">
              Oferim o gamă completă de servicii imobiliare premium, adaptate perfect 
              pentru complexele rezidențiale moderne din vestul capitalei.
            </p>
          </header>

          {/* Services Grid */}
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8 px-2 sm:px-0">
            {services.map((service, index) => {
              const Icon = service.icon
              
              return (
                <Card 
                  key={index} 
                  className={`group relative overflow-hidden transition-all duration-500 hover:shadow-2xl ${
                    service.highlight 
                      ? 'border-gold/30 bg-gradient-to-br from-gold/5 to-gold-dark/5 hover:border-gold/50' 
                      : 'border-border/30 bg-card/30 hover:border-gold/30'
                  } backdrop-blur-sm hover:bg-card/60`}
                >
                  {service.highlight && (
                    <div className="absolute top-4 right-4">
                      <Badge variant="secondary" className="bg-gold text-primary-foreground text-xs">
                        Specializare
                      </Badge>
                    </div>
                  )}
                  
                  <CardContent className="p-4 sm:p-6 lg:p-8">
                    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                      {/* Icon */}
                      <div className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl ${
                        service.highlight 
                          ? 'bg-gradient-to-br from-gold to-gold-dark' 
                          : 'bg-gradient-to-br from-gold/20 to-gold-dark/20'
                      } group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${
                          service.highlight ? 'text-primary-foreground' : 'text-gold'
                        }`} />
                      </div>
                      
                      {/* Title */}
                      <h2 className={`text-base sm:text-lg lg:text-xl font-bold leading-tight ${
                        service.highlight ? 'text-gold' : 'text-foreground'
                      } group-hover:text-gold transition-colors`}>
                        {service.title}
                      </h2>
                      
                      {/* Description */}
                      <p className="text-muted-foreground leading-relaxed text-xs sm:text-sm lg:text-base">
                        {service.description}
                      </p>
                      
                      {/* Hover Arrow */}
                      <div className="flex items-center text-gold opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                        <span className="text-sm font-medium mr-2">Află mai multe</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* CTA Section */}
          <footer className="mt-12 sm:mt-16 lg:mt-20 text-center px-2 sm:px-0">
            <div className="bg-gradient-to-r from-gold/10 via-gold/5 to-gold/10 rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-gold/20">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-3 sm:mb-4">
                Pregătit să îți găsești apartamentul perfect?
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-2xl mx-auto px-2">
                Contactează-ne astăzi pentru o consultație gratuită și descoperă cum putem 
                să te ajutăm să găsești proprietatea ideală.
              </p>
              <a href="tel:0767941512" aria-label="Sună la MVA Imobiliare">
                <button className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-gold text-primary-foreground rounded-lg text-sm sm:text-base font-medium hover:bg-gold-dark transition-colors touch-manipulation min-h-[44px]">
                  <Phone className="mr-2 w-4 h-4 flex-shrink-0" aria-hidden="true" />
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
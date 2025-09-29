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
    <section id="servicii" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <header className="text-center mb-20">
            <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20 mb-6">
              Servicii Premium
            </Badge>
            
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-8">
              <span className="text-foreground">Servicii </span>
              <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                Complete
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Oferim o gamă completă de servicii imobiliare premium, adaptate perfect 
              pentru complexele rezidențiale moderne din vestul capitalei.
            </p>
          </header>

          {/* Services Grid */}
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
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
                  
                  <CardContent className="p-6 sm:p-8">
                    <div className="space-y-4 sm:space-y-6">
                      {/* Icon */}
                      <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${
                        service.highlight 
                          ? 'bg-gradient-to-br from-gold to-gold-dark' 
                          : 'bg-gradient-to-br from-gold/20 to-gold-dark/20'
                      } group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${
                          service.highlight ? 'text-primary-foreground' : 'text-gold'
                        }`} />
                      </div>
                      
                      {/* Title */}
                      <h2 className={`text-lg sm:text-xl font-bold leading-tight ${
                        service.highlight ? 'text-gold' : 'text-foreground'
                      } group-hover:text-gold transition-colors`}>
                        {service.title}
                      </h2>
                      
                      {/* Description */}
                      <p className="text-muted-foreground leading-relaxed text-sm">
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
          <div className="mt-20 text-center">
            <div className="bg-gradient-to-r from-gold/10 via-gold/5 to-gold/10 rounded-2xl p-8 border border-gold/20">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Pregătit să îți găsești apartamentul perfect?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Contactează-ne astăzi pentru o consultație gratuită și descoperă cum putem 
                să te ajutăm să găsești proprietatea ideală.
              </p>
              <a href="tel:0767941512">
                <button className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-gold text-primary-foreground rounded-lg text-sm sm:text-base font-medium hover:bg-gold-dark transition-colors">
                  <Phone className="mr-2 w-4 h-4 flex-shrink-0" />
                  <span>0767 941 512</span>
                </button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Services
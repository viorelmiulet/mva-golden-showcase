import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const Services = () => {
  const services = [
    {
      title: "Vânzare Proprietăți Premium",
      description: "Comercializarea proprietăților de lux cu strategii de marketing personalizate și prezentare profesională.",
      icon: "🏠"
    },
    {
      title: "Consultanță în Investiții",
      description: "Analiză de piață și consultanță specializată pentru investițiile imobiliare cu randament maxim.",
      icon: "📈"
    },
    {
      title: "Evaluări Profesionale",
      description: "Evaluări precise și obiective realizate de experți autorizați conform standardelor internaționale.",
      icon: "📊"
    },
    {
      title: "Managementul Proprietăților",
      description: "Servicii complete de administrare și întreținere pentru proprietățile din portofoliul dvs.",
      icon: "🔑"
    },
    {
      title: "Consultanță Juridică",
      description: "Asistență juridică specializată pentru toate aspectele legale ale tranzacțiilor imobiliare.",
      icon: "⚖️"
    },
    {
      title: "Marketing Personalizat",
      description: "Strategii de marketing premium cu fotografii profesionale și prezentări virtuale interactive.",
      icon: "📸"
    }
  ]

  return (
    <section id="servicii" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="text-foreground">Serviciile </span>
              <span className="text-gold">Noastre</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-gold-dark to-gold mx-auto mb-6"></div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Oferim o gamă completă de servicii imobiliare premium, adaptate nevoilor 
              clienților noștri exigenți.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-border/50 hover:border-gold/50 bg-card/50 hover:bg-card">
                <CardHeader className="text-center">
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {service.icon}
                  </div>
                  <CardTitle className="text-xl text-foreground group-hover:text-gold transition-colors">
                    {service.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-muted-foreground leading-relaxed">
                    {service.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Services
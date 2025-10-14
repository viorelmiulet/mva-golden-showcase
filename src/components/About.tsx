import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { CheckCircle, Award, Users, TrendingUp } from "lucide-react"

const About = () => {
  const achievements = [
    {
      icon: Award,
      number: "15+",
      label: "Ani experiență",
      description: "în piața imobiliară premium"
    },
    {
      icon: Users,
      number: "500+", 
      label: "Clienți mulțumiți",
      description: "tranzacții finalizate cu succes"
    },
    {
      icon: TrendingUp,
      number: "€50M+",
      label: "Valoare tranzacții",
      description: "proprietăți comercializate"
    }
  ]

  const values = [
    "Transparență totală în toate tranzacțiile",
    "Consultanță personalizată pentru fiecare client", 
    "Experiență vastă în segmentul premium",
    "Relații de lungă durată cu dezvoltatorii"
  ]

  return (
    <section id="despre" className="py-12 sm:py-16 lg:py-24 bg-gradient-to-b from-secondary/20 to-background" itemScope itemType="https://schema.org/AboutPage">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <article className="max-w-6xl mx-auto">
          
          {/* Header */}
          <header className="text-center mb-12 sm:mb-16 lg:mb-20">
            <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20 mb-4 sm:mb-6 text-xs sm:text-sm">
              Despre MVA Imobiliare
            </Badge>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 lg:mb-8" itemProp="headline">
              <span className="text-foreground">Partenerii </span>
              <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                Tăi de Încredere
              </span>
            </h1>
            
            <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4 sm:px-0" itemProp="description">
              Cu peste 15 ani de experiență în domeniul imobiliar premium, MVA IMOBILIARE 
              este liderul în comercializarea proprietăților de excepție din vestul Bucureștiului.
            </p>
          </header>

          {/* Achievements Grid */}
          <div className="grid-responsive-3 mb-12 sm:mb-16 lg:mb-20">
            {achievements.map((achievement, index) => {
              const Icon = achievement.icon
              return (
                <Card key={index} className="card-responsive border-0 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 group text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-gold to-gold-dark rounded-xl lg:rounded-2xl mb-3 sm:mb-4 lg:mb-6 group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-primary-foreground" />
                  </div>
                  
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gold mb-1 sm:mb-2">
                    {achievement.number}
                  </div>
                  
                  <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-foreground mb-1 sm:mb-2">
                    {achievement.label}
                  </h2>
                  
                  <p className="text-xs sm:text-sm lg:text-base text-muted-foreground leading-relaxed">
                    {achievement.description}
                  </p>
                </Card>
              )
            })}
          </div>

          {/* Mission & Values */}
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            
            {/* Mission */}
            <div className="space-responsive">
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-4 sm:mb-6">
                  Misiunea Noastră
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed mb-4 sm:mb-6">
                  Să conectăm clienții cu <span className="text-gold font-semibold">proprietățile perfecte</span> pentru 
                  stilul lor de viață, oferind servicii imobiliare de excepție și consultanță specializată 
                  în segmentul premium.
                </p>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">
                  Echipa noastră de experți vă ghidează prin fiecare etapă a procesului, asigurându-se 
                  că fiecare investiție este o <span className="text-gold font-semibold">experiență de neuitat</span>.
                </p>
              </div>
            </div>

            {/* Values */}
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-4 sm:mb-6 lg:mb-8">
                De Ce Să Ne Alegi
              </h2>
              
              <div className="space-y-3 sm:space-y-4">
                {values.map((value, index) => (
                  <div key={index} className="flex items-start space-x-3 sm:space-x-4 group">
                    <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-gold/10 rounded-full flex items-center justify-center mt-0.5 group-hover:bg-gold/20 transition-colors">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-gold" />
                    </div>
                    <p className="text-foreground font-medium leading-relaxed text-sm sm:text-base">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}

export default About
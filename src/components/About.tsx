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
    <section id="despre" className="py-24 bg-gradient-to-b from-secondary/20 to-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <header className="text-center mb-20">
            <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20 mb-6">
              Despre MVA Imobiliare
            </Badge>
            
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-8">
              <span className="text-foreground">Partenerii </span>
              <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                Tăi de Încredere
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Cu peste 15 ani de experiență în domeniul imobiliar premium, MVA IMOBILIARE 
              este liderul în comercializarea proprietăților de excepție din vestul Bucureștiului.
            </p>
          </header>

          {/* Achievements Grid */}
          <div className="grid gap-4 sm:gap-6 md:grid-cols-3 mb-16 lg:mb-20">
            {achievements.map((achievement, index) => {
              const Icon = achievement.icon
              return (
                <Card key={index} className="p-6 sm:p-8 text-center border-0 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 group">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-gold to-gold-dark rounded-2xl mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
                  </div>
                  
                  <div className="text-3xl sm:text-4xl font-bold text-gold mb-2">
                    {achievement.number}
                  </div>
                  
              <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                {achievement.label}
              </h2>
                  
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {achievement.description}
                  </p>
                </Card>
              )
            })}
          </div>

          {/* Mission & Values */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Mission */}
            <div className="space-y-8">
              <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Misiunea Noastră
              </h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  Să conectăm clienții cu <span className="text-gold font-semibold">proprietățile perfecte</span> pentru 
                  stilul lor de viață, oferind servicii imobiliare de excepție și consultanță specializată 
                  în segmentul premium.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Echipa noastră de experți vă ghidează prin fiecare etapă a procesului, asigurându-se 
                  că fiecare investiție este o <span className="text-gold font-semibold">experiență de neuitat</span>.
                </p>
              </div>
            </div>

            {/* Values */}
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-foreground mb-8">
                De Ce Să Ne Alegi
              </h2>
              
              <div className="space-y-4">
                {values.map((value, index) => (
                  <div key={index} className="flex items-start space-x-4 group">
                    <div className="flex-shrink-0 w-6 h-6 bg-gold/10 rounded-full flex items-center justify-center mt-0.5 group-hover:bg-gold/20 transition-colors">
                      <CheckCircle className="w-4 h-4 text-gold" />
                    </div>
                    <p className="text-foreground font-medium leading-relaxed">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default About
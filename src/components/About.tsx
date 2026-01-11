import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { CheckCircle, Award, Users, TrendingUp } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

const About = () => {
  const { language } = useLanguage();

  const achievements = [
    {
      icon: Award,
      number: "15+",
      label: language === 'ro' ? "Ani experiență" : "Years experience",
      description: language === 'ro' ? "în piața imobiliară premium" : "in the premium real estate market"
    },
    {
      icon: Users,
      number: "500+", 
      label: language === 'ro' ? "Clienți mulțumiți" : "Happy clients",
      description: language === 'ro' ? "tranzacții finalizate cu succes" : "successfully completed transactions"
    },
    {
      icon: TrendingUp,
      number: "€50M+",
      label: language === 'ro' ? "Valoare tranzacții" : "Transaction value",
      description: language === 'ro' ? "proprietăți comercializate" : "properties sold"
    }
  ]

  const values = language === 'ro' ? [
    "Transparență totală în toate tranzacțiile",
    "Consultanță personalizată pentru fiecare client", 
    "Experiență vastă în segmentul premium",
    "Relații de lungă durată cu dezvoltatorii"
  ] : [
    "Total transparency in all transactions",
    "Personalized consulting for each client",
    "Extensive experience in the premium segment",
    "Long-term relationships with developers"
  ];

  return (
    <section id="despre" className="relative py-16 sm:py-20 lg:py-28 overflow-hidden" itemScope itemType="https://schema.org/AboutPage">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/10 to-background" />
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-gradient-radial from-gold/5 to-transparent rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
      <div className="absolute top-1/3 right-0 w-[300px] h-[300px] bg-gradient-radial from-gold/5 to-transparent rounded-full blur-3xl translate-x-1/2" />
      
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 relative z-10">
        <article className="max-w-6xl mx-auto">
          
          {/* Header */}
          <header className="text-center mb-14 sm:mb-18 lg:mb-24">
            <div className="inline-flex items-center justify-center mb-6 sm:mb-8">
              <div className="h-px w-8 sm:w-16 bg-gradient-to-r from-transparent to-gold/40 mr-4"></div>
              <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/30 px-4 py-1.5 text-xs sm:text-sm font-medium">
                {language === 'ro' ? 'Despre MVA Imobiliare' : 'About MVA Real Estate'}
              </Badge>
              <div className="h-px w-8 sm:w-16 bg-gradient-to-l from-transparent to-gold/40 ml-4"></div>
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 sm:mb-8 lg:mb-10 tracking-tight" itemProp="headline">
              <span className="text-foreground drop-shadow-lg">
                {language === 'ro' ? 'Partenerii ' : 'Your Trusted '}
              </span>
              <span className="text-gradient-gold">
                {language === 'ro' ? 'Tăi de Încredere' : 'Partners'}
              </span>
            </h1>
            
            <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4 sm:px-0" itemProp="description">
              {language === 'ro' 
                ? 'Cu peste 15 ani de experiență în domeniul imobiliar premium, MVA IMOBILIARE este liderul în comercializarea proprietăților de excepție din vestul Bucureștiului.'
                : 'With over 15 years of experience in premium real estate, MVA IMOBILIARE is the leader in selling exceptional properties in western Bucharest.'}
            </p>
          </header>

          {/* Achievements Grid */}
          <div className="grid-responsive-3 mb-14 sm:mb-18 lg:mb-24">
            {achievements.map((achievement, index) => {
              const Icon = achievement.icon
              return (
                <div key={index} className="card-modern p-6 sm:p-8 lg:p-10 text-center group border-glow">
                  <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-gold/20 via-gold/10 to-gold-dark/20 rounded-2xl lg:rounded-3xl mb-4 sm:mb-6 lg:mb-8 group-hover:scale-110 transition-all duration-300 border border-gold/20">
                    <Icon className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-gold" />
                  </div>
                  
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gradient-gold mb-2 sm:mb-3">
                    {achievement.number}
                  </div>
                  
                  <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-foreground mb-2 sm:mb-3">
                    {achievement.label}
                  </h2>
                  
                  <p className="text-xs sm:text-sm lg:text-base text-muted-foreground leading-relaxed">
                    {achievement.description}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Mission & Values */}
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            
            {/* Mission */}
            <div className="space-responsive">
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-4 sm:mb-6">
                  {language === 'ro' ? 'Misiunea Noastră' : 'Our Mission'}
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed mb-4 sm:mb-6">
                  {language === 'ro' 
                    ? <>Să conectăm clienții cu <span className="text-gold font-semibold">proprietățile perfecte</span> pentru stilul lor de viață, oferind servicii imobiliare de excepție și consultanță specializată în segmentul premium.</>
                    : <>To connect clients with the <span className="text-gold font-semibold">perfect properties</span> for their lifestyle, providing exceptional real estate services and specialized consulting in the premium segment.</>}
                </p>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">
                  {language === 'ro'
                    ? <>Echipa noastră de experți vă ghidează prin fiecare etapă a procesului, asigurându-se că fiecare investiție este o <span className="text-gold font-semibold">experiență de neuitat</span>.</>
                    : <>Our team of experts guides you through every step of the process, ensuring that every investment is an <span className="text-gold font-semibold">unforgettable experience</span>.</>}
                </p>
              </div>
            </div>

            {/* Values */}
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-4 sm:mb-6 lg:mb-8">
                {language === 'ro' ? 'De Ce Să Ne Alegi' : 'Why Choose Us'}
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
import { CheckCircle, Award, Users, TrendingUp } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import ScrollReveal from "@/components/ScrollReveal"

const About = () => {
  const { language } = useLanguage();

  const achievements = [
    { icon: Award, number: "15+", label: language === 'ro' ? "Ani experiență" : "Years experience" },
    { icon: Users, number: "500+", label: language === 'ro' ? "Clienți mulțumiți" : "Happy clients" },
    { icon: TrendingUp, number: "€50M+", label: language === 'ro' ? "Valoare tranzacții" : "Transaction value" }
  ];

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
    <section id="despre" className="py-16 sm:py-20 lg:py-24" itemScope itemType="https://schema.org/AboutPage">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="max-w-5xl mx-auto">
          
          {/* Header */}
          <ScrollReveal>
            <header className="text-center mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 tracking-tight" itemProp="headline">
                <span className="text-foreground">{language === 'ro' ? 'Partenerii ' : 'Your Trusted '}</span>
                <span className="text-gradient-gold">{language === 'ro' ? 'Tăi de Încredere' : 'Partners'}</span>
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed" itemProp="description">
                {language === 'ro' 
                  ? 'Cu peste 15 ani de experiență în domeniul imobiliar premium, MVA IMOBILIARE este liderul în comercializarea proprietăților de excepție din vestul Bucureștiului.'
                  : 'With over 15 years of experience in premium real estate, MVA IMOBILIARE is the leader in selling exceptional properties in western Bucharest.'}
              </p>
            </header>
          </ScrollReveal>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 sm:gap-6 mb-12 lg:mb-16">
            {achievements.map((item, i) => {
              const Icon = item.icon;
              return (
                <ScrollReveal key={i} delay={i * 0.1}>
                  <div className="text-center p-4 sm:p-6 glass rounded-2xl border border-border/50">
                    <Icon className="w-6 h-6 text-gold mx-auto mb-3" />
                    <div className="text-2xl sm:text-3xl font-bold text-gradient-gold mb-1">{item.number}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">{item.label}</div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>

          {/* Mission & Values */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            <ScrollReveal direction="left">
              <article>
                <h3 className="text-lg sm:text-xl font-bold text-foreground mb-4">
                  {language === 'ro' ? 'Misiunea Noastră' : 'Our Mission'}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-3">
                  {language === 'ro' 
                    ? <>Să conectăm clienții cu <span className="text-gold font-semibold">proprietățile perfecte</span> pentru stilul lor de viață, oferind servicii imobiliare de excepție și consultanță specializată.</>
                    : <>To connect clients with the <span className="text-gold font-semibold">perfect properties</span> for their lifestyle, providing exceptional real estate services and specialized consulting.</>}
                </p>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {language === 'ro'
                    ? <>Echipa noastră vă ghidează prin fiecare etapă, asigurându-se că fiecare investiție este o <span className="text-gold font-semibold">experiență de neuitat</span>.</>
                    : <>Our team guides you through every step, ensuring that every investment is an <span className="text-gold font-semibold">unforgettable experience</span>.</>}
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground mb-4">
                  {language === 'ro' ? 'De Ce Să Ne Alegi' : 'Why Choose Us'}
                </h3>
                <div className="space-y-3">
                  {values.map((value, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                      <p className="text-sm sm:text-base text-foreground">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;

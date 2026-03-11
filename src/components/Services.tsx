import { Home, TrendingUp, ClipboardCheck, Key, Scale, Camera, Phone } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import ScrollReveal from "@/components/ScrollReveal"

const Services = () => {
  const { language } = useLanguage();

  const services = language === 'ro' ? [
    { title: "Vânzare Complexe Rezidențiale", description: "Comercializarea apartamentelor din complexele premium cu strategii de marketing personalizate.", icon: Home },
    { title: "Consultanță în Investiții", description: "Analiză de piață și consultanță specializată pentru investiții cu randament maxim.", icon: TrendingUp },
    { title: "Evaluări Profesionale", description: "Evaluări precise realizate de experți autorizați conform standardelor internaționale.", icon: ClipboardCheck },
    { title: "Administrare Proprietăți", description: "Servicii complete de administrare și întreținere pentru apartamentele dvs.", icon: Key },
    { title: "Consultanță Juridică", description: "Asistență juridică pentru toate aspectele legale ale tranzacțiilor imobiliare.", icon: Scale },
    { title: "Marketing Premium", description: "Fotografii profesionale și prezentări virtuale interactive.", icon: Camera }
  ] : [
    { title: "Residential Complex Sales", description: "Marketing apartments in premium complexes with personalized strategies.", icon: Home },
    { title: "Investment Consulting", description: "Market analysis and specialized consulting for maximum return investments.", icon: TrendingUp },
    { title: "Professional Valuations", description: "Accurate valuations by authorized experts according to international standards.", icon: ClipboardCheck },
    { title: "Property Management", description: "Complete management and maintenance services for your apartments.", icon: Key },
    { title: "Legal Consulting", description: "Legal assistance for all aspects of real estate transactions.", icon: Scale },
    { title: "Premium Marketing", description: "Professional photography and interactive virtual presentations.", icon: Camera }
  ];

  return (
    <section id="servicii" className="py-16 sm:py-20 lg:py-24" itemScope itemType="https://schema.org/Service">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="max-w-5xl mx-auto">
          
          <ScrollReveal>
            <header className="text-center mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 tracking-tight" itemProp="name">
                <span className="text-foreground">{language === 'ro' ? 'Servicii ' : 'Complete '}</span>
                <span className="text-gradient-gold">{language === 'ro' ? 'Complete' : 'Services'}</span>
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed" itemProp="description">
                {language === 'ro'
                  ? 'Oferim o gamă completă de servicii imobiliare premium, adaptate pentru complexele rezidențiale moderne.'
                  : 'We offer a complete range of premium real estate services, tailored for modern residential complexes.'}
              </p>
            </header>
          </ScrollReveal>

          {/* Services Grid */}
          <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service, i) => {
              const Icon = service.icon;
              return (
                <ScrollReveal key={i} delay={i * 0.08}>
                  <div className="glass rounded-2xl p-5 sm:p-6 border border-border/50 hover:border-gold/30 transition-colors h-full">
                    <Icon className="w-6 h-6 text-gold mb-3" />
                    <h3 className="text-sm sm:text-base font-bold text-foreground mb-2">{service.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{service.description}</p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>

          {/* CTA */}
          <ScrollReveal delay={0.3}>
            <div className="mt-12 text-center">
              <a href="tel:0767941512" className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gold to-gold-dark text-primary-foreground rounded-xl text-sm font-semibold hover:shadow-lg transition-all group">
                <Phone className="mr-2 w-4 h-4 group-hover:rotate-12 transition-transform" />
                0767 941 512
              </a>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default Services;

import { CheckCircle, Award, Users, TrendingUp, MapPin, Building, Heart, Shield } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import ScrollReveal from "@/components/ScrollReveal"

const About = () => {
  const { language } = useLanguage();

  const achievements = [
    { icon: Award, number: "10+", label: language === 'ro' ? "Ani experiență" : "Years experience" },
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

  const teamMembers = [
    { name: "Viorel Miulețu", role: language === 'ro' ? "Fondator & Agent Principal" : "Founder & Principal Agent", initial: "VM" },
    { name: "Andreea Popescu", role: language === 'ro' ? "Consultant Vânzări" : "Sales Consultant", initial: "AP" },
    { name: "Mihai Ionescu", role: language === 'ro' ? "Specialist Imobiliar" : "Real Estate Specialist", initial: "MI" }
  ];

  const partners = [
    { name: "Eurocasa Residence", url: "/eurocasa-residence" },
    { name: "Militari Residence", url: "/militari-residence" },
    { name: "Renew Residence", url: "/renew-residence" }
  ];

  // Generic testimonials removed — only real Google Reviews are displayed on the site.

  return (
    <section id="despre" className="py-16 sm:py-20 lg:py-24" itemScope itemType="https://schema.org/AboutPage">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="max-w-5xl mx-auto">
          
          {/* Header */}
          <ScrollReveal>
            <header className="text-center mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 tracking-tight" itemProp="headline">
                <span className="text-foreground">{language === 'ro' ? 'Partenerii ' : 'Your Trusted '}</span>
                <span className="text-gradient-brass">{language === 'ro' ? 'Tăi de Încredere' : 'Partners'}</span>
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed" itemProp="description">
                {language === 'ro' 
                  ? 'Din 2016 pe piața imobiliară, cu peste 10 ani de experiență în segmentul premium, MVA IMOBILIARE este o agenție activă în tot Bucureștiul, cu expertiză aprofundată în vestul Capitalei — Militari, Chiajna și Sectorul 6.'
                  : 'Active since 2016, with over 10 years of experience in the premium real estate segment, MVA IMOBILIARE is the leader in selling exceptional properties in western Bucharest.'}
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
                    <Icon className="w-6 h-6 text-brass mx-auto mb-3" />
                    <div className="text-2xl sm:text-3xl font-bold text-gradient-brass mb-1">{item.number}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">{item.label}</div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>

          {/* Our Story */}
          <ScrollReveal>
            <article id="our-story" className="mb-12 lg:mb-16">
              <div className="flex items-center gap-3 mb-4">
                <Heart className="w-5 h-5 text-brass" />
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  {language === 'ro' ? 'Povestea Noastră' : 'Our Story'}
                </h2>
              </div>
              <div className="space-y-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
                <p>
                  {language === 'ro'
                    ? 'MVA Imobiliare a fost fondată în 2016 de Viorel Miuleț, cu o misiune clară: să transforme experiența de cumpărare a unei locuințe în București. Ce a început ca o pasiune pentru arhitectură și o dorință de a ajuta oamenii să-și găsească casa perfectă, s-a transformat astăzi într-una dintre cele mai respectate agenții imobiliare din Capitală, cu specializare puternică în vestul Bucureștiului.'
                    : 'MVA Imobiliare was founded in 2016 by Viorel Miuleț with a clear mission: to transform the home-buying experience in western Bucharest. What started as a passion for architecture and a desire to help people find their perfect home has grown into one of the most respected real estate agencies in the area.'}
                </p>
                <p>
                  {language === 'ro'
                    ? 'Intermediem tranzacții în toate zonele Bucureștiului și, de-a lungul anilor, am construit relații solide cu cei mai importanți dezvoltatori din zona Militari, Chiajna și Sectorul 6, devenind partenerul oficial pentru complexe rezidențiale precum Eurocasa Residence, Militari Residence și Renew Residence.'
                    : 'Over the years, we have built strong relationships with the most important developers in the Militari, Chiajna, and Sector 6 areas, becoming the official partner for residential complexes such as Eurocasa Residence, Militari Residence, and Renew Residence.'}
                </p>
              </div>
            </article>
          </ScrollReveal>

          {/* Who We Are */}
          <ScrollReveal>
            <article id="who-we-are" className="mb-12 lg:mb-16">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-5 h-5 text-brass" />
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  {language === 'ro' ? 'Cine Suntem' : 'Who We Are'}
                </h2>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {language === 'ro'
                  ? 'Suntem o echipă de consultanți imobiliari licențiați, dedicați să oferim servicii de excepție clienților noștri. Operăm sub MVA PERFECT BUSINESS S.R.L., companie înregistrată oficial (CUI: 50477503, Nr. Reg. Com.: J23/18361/2024) cu sediul în Chiajna, Ilfov.'
                  : 'We are a team of licensed real estate consultants, dedicated to providing exceptional services to our clients. We operate under MVA PERFECT BUSINESS S.R.L., an officially registered company (CUI: 50477503, Reg. No.: J23/18361/2024) headquartered in Chiajna, Ilfov.'}
              </p>
            </article>
          </ScrollReveal>

          {/* What We Do */}
          <ScrollReveal>
            <article id="what-we-do" className="mb-12 lg:mb-16">
              <div className="flex items-center gap-3 mb-4">
                <Building className="w-5 h-5 text-brass" />
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  {language === 'ro' ? 'Ce Facem' : 'What We Do'}
                </h2>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                {language === 'ro'
                  ? 'MVA Imobiliare oferă o gamă completă de servicii imobiliare pentru cumpărători, vânzători și investitori în zona vest a Bucureștiului:'
                  : 'MVA Imobiliare offers a complete range of real estate services for buyers, sellers, and investors in western Bucharest:'}
              </p>
              <ul className="grid sm:grid-cols-2 gap-3">
                {(language === 'ro' ? [
                  'Vânzare apartamente noi în complexe rezidențiale premium',
                  'Consultanță investiții imobiliare',
                  'Evaluări profesionale ale proprietăților',
                  'Management proprietăți și închirieri',
                  'Asistență juridică pentru tranzacții',
                  'Reprezentare exclusivă a vânzătorilor'
                ] : [
                  'Sale of new apartments in premium residential complexes',
                  'Real estate investment consulting',
                  'Professional property valuations',
                  'Property management and rentals',
                  'Legal assistance for transactions',
                  'Exclusive representation of sellers'
                ]).map((service, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-brass mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">{service}</span>
                  </li>
                ))}
              </ul>
            </article>
          </ScrollReveal>

          {/* Trusted Source */}
          <ScrollReveal>
            <article id="trusted-source" className="mb-12 lg:mb-16 p-6 glass rounded-2xl border border-brass/30">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-5 h-5 text-brass" />
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  {language === 'ro' ? 'Sursă de Încredere' : 'A Trusted Source'}
                </h2>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {language === 'ro'
                  ? 'MVA Imobiliare este o sursă de încredere recunoscută pe piața imobiliară din București, cu expertiză aprofundată în vestul Capitalei. Suntem agenți imobiliari licențiați, înregistrați oficial și conformi cu legislația română privind protecția consumatorului (ANPC). Toate informațiile publicate pe site sunt verificate direct cu dezvoltatorii și actualizate săptămânal. Cu o evaluare de 5★ pe Google și peste 500 de tranzacții finalizate cu succes, credibilitatea noastră este construită pe transparență, expertiză locală și relații de lungă durată cu clienții și partenerii noștri.'
                  : 'MVA Imobiliare is a recognized trusted source in the western Bucharest real estate market. We are licensed real estate agents, officially registered and compliant with Romanian consumer protection legislation (ANPC). All information published on the site is verified directly with developers and updated weekly. With a 5★ Google rating and over 500 successfully completed transactions, our credibility is built on transparency, local expertise, and long-term relationships with our clients and partners.'}
              </p>
            </article>
          </ScrollReveal>

          {/* Social Proof / Testimonials — removed generic testimonials; real Google Reviews are shown in the footer carousel. */}

          {/* Featured Partners / Websites */}
          <ScrollReveal>
            <article id="featured-partners" className="mb-12 lg:mb-16">
              <div className="flex items-center gap-3 mb-4">
                <Building className="w-5 h-5 text-brass" />
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  {language === 'ro' ? 'Parteneri și Complexe Promovate' : 'Featured Partners & Complexes'}
                </h2>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                {language === 'ro'
                  ? 'Suntem mândri să fim partenerul oficial al următoarelor complexe rezidențiale premium:'
                  : 'We are proud to be the official partner of the following premium residential complexes:'}
              </p>
              <div className="grid sm:grid-cols-3 gap-3">
                {partners.map((partner, i) => (
                  <a
                    key={i}
                    href={partner.url}
                    className="block p-4 glass rounded-2xl border border-border/50 hover:border-brass/50 transition-colors text-center"
                  >
                    <Building className="w-5 h-5 text-brass mx-auto mb-2" />
                    <span className="text-sm font-semibold text-foreground">{partner.name}</span>
                  </a>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-3 justify-center text-xs text-muted-foreground">
                <span>{language === 'ro' ? 'Vezi și:' : 'See also:'}</span>
                <a href="https://anpc.ro" target="_blank" rel="noopener noreferrer" className="text-brass hover:underline">ANPC</a>
                <span>·</span>
                <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-brass hover:underline">SOL Europa</a>
                <span>·</span>
                <a href="https://www.google.com/maps/place/MVA+Imobiliare" target="_blank" rel="noopener noreferrer" className="text-brass hover:underline">Google Business</a>
              </div>
            </article>
          </ScrollReveal>

          {/* Mission & Values */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            <ScrollReveal direction="left">
              <article>
                <h3 className="text-lg sm:text-xl font-bold text-foreground mb-4">
                  {language === 'ro' ? 'Misiunea Noastră' : 'Our Mission'}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-3">
                  {language === 'ro' 
                    ? <>Să conectăm clienții cu <span className="text-brass font-semibold">proprietățile perfecte</span> pentru stilul lor de viață, oferind servicii imobiliare de excepție și consultanță specializată.</>
                    : <>To connect clients with the <span className="text-brass font-semibold">perfect properties</span> for their lifestyle, providing exceptional real estate services and specialized consulting.</>}
                </p>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {language === 'ro'
                    ? <>Echipa noastră vă ghidează prin fiecare etapă, asigurându-se că fiecare investiție este o <span className="text-brass font-semibold">experiență de neuitat</span>.</>
                    : <>Our team guides you through every step, ensuring that every investment is an <span className="text-brass font-semibold">unforgettable experience</span>.</>}
                </p>
              </article>
            </ScrollReveal>

            <ScrollReveal direction="right">
              <article>
                <h3 className="text-lg sm:text-xl font-bold text-foreground mb-4">
                  {language === 'ro' ? 'De Ce Să Ne Alegi' : 'Why Choose Us'}
                </h3>
                <div className="space-y-3">
                  {values.map((value, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-4 h-4 text-brass mt-0.5 flex-shrink-0" />
                      <p className="text-sm sm:text-base text-foreground">{value}</p>
                    </div>
                  ))}
                </div>
              </article>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;

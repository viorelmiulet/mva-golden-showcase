import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { usePageTracking } from "@/hooks/useGoogleAnalytics"
import { Helmet } from "react-helmet-async"
import BreadcrumbSchema from "@/components/BreadcrumbSchema"
import { useLanguage } from "@/contexts/LanguageContext"
import { 
  Shield, 
  Award, 
  Users, 
  Clock, 
  MapPin, 
  Heart,
  TrendingUp,
  Eye,
  MessageCircle,
  Star
} from "lucide-react"

const WhyChooseUs = () => {
  const { t, language } = useLanguage();
  
  // Track page view
  usePageTracking(language === 'ro' ? "De ce să ne alegi pe noi - MVA Imobiliare" : "Why Choose Us - MVA Imobiliare", "/de-ce-sa-ne-alegi");

  const sellingIcons = [TrendingUp, Award, Users, Clock, Eye, Shield, Heart];
  const buyingIcons = [MapPin, Clock, Eye, MessageCircle, Award];

  // FAQ Schema for AI
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": language === 'ro' ? "De ce să aleg MVA Imobiliare pentru vânzarea proprietății?" : "Why choose MVA Imobiliare to sell my property?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": language === 'ro' 
            ? "MVA Imobiliare oferă experiență dovedită de peste 5 ani, atingem o medie de 97% din prețul cerut, avem o echipă dedicată disponibilă 24/7 și asigurăm expunere maximă online și offline pe multiple platforme."
            : "MVA Imobiliare offers over 5 years of proven experience, we achieve an average of 97% of the asking price, have a dedicated team available 24/7, and ensure maximum online and offline exposure across multiple platforms."
        }
      },
      {
        "@type": "Question",
        "name": language === 'ro' ? "Cât timp durează să vindeți o proprietate?" : "How long does it take to sell a property?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": language === 'ro'
            ? "98% dintre proprietățile noastre sunt live online în termen de 48 de ore de la fotografiere. Datorită bazei noastre mari de cumpărători și tehnicilor de marketing avansate, reușim să vindem rapid."
            : "98% of our properties are live online within 48 hours of photography. Thanks to our large buyer base and advanced marketing techniques, we manage to sell quickly."
        }
      }
    ]
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": language === 'ro' ? "Acasă" : "Home",
        "item": "https://mvaimobiliare.ro/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": language === 'ro' ? "De ce să ne alegi" : "Why Choose Us",
        "item": "https://mvaimobiliare.ro/de-ce-sa-ne-alegi"
      }
    ]
  };

  return (
    <>
      <BreadcrumbSchema items={[
        { name: language === 'ro' ? "Acasă" : "Home", url: "/" },
        { name: language === 'ro' ? "De ce să ne alegi" : "Why Choose Us", url: "/de-ce-sa-ne-alegi" }
      ]} />
      <Helmet>
        <title>{language === 'ro' ? 'De ce să ne alegi pe noi? - Agenție Imobiliară Expertă | MVA Imobiliare' : 'Why Choose Us? - Expert Real Estate Agency | MVA Imobiliare'}</title>
        <meta name="description" content={t.whyChooseUs.heroSubtitle} />
        <meta name="keywords" content="agenție imobiliară de încredere, consultant imobiliar expert, servicii imobiliare premium, agenție imobiliară București vest, agent imobiliar profesionist" />
        <link rel="canonical" href="https://mvaimobiliare.ro/de-ce-sa-ne-alegi" />
        
        {/* AI Crawler Optimization */}
        <meta name="summary" content={t.whyChooseUs.sellingSubtitle} />
        <meta name="category" content="Real Estate Services" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mvaimobiliare.ro/de-ce-sa-ne-alegi" />
        <meta property="og:title" content={language === 'ro' ? 'De ce MVA Imobiliare - Agenție Expertă în București' : 'Why MVA Imobiliare - Expert Agency in Bucharest'} />
        <meta property="og:description" content={t.whyChooseUs.heroSubtitle} />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary" />
        <meta property="twitter:title" content={language === 'ro' ? 'De ce MVA Imobiliare' : 'Why MVA Imobiliare'} />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>
      <div className="min-h-screen">
        <Header />
      
      <main>
        {/* Hero Section */}
        <section className="relative py-8 sm:py-12 md:py-16 lg:py-20 bg-gradient-to-br from-background to-muted">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6">
            <div className="text-center max-w-4xl mx-auto">
              <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20 mb-3 sm:mb-4 md:mb-6 text-xs sm:text-sm">
                {t.whyChooseUs.badge}
              </Badge>
              
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4 md:mb-6 px-2">
                <span className="block text-foreground">{t.whyChooseUs.heroTitle}</span>
                <span className="block bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                  {t.whyChooseUs.heroTitleHighlight}
                </span>
              </h1>
              
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed mb-4 sm:mb-6 md:mb-8 px-4 sm:px-2">
                {t.whyChooseUs.heroSubtitle}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-2">
                <a href="https://wa.me/40767941512" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                  <Button variant="luxury" size="lg" className="w-full sm:w-auto px-4 sm:px-6 md:px-8 min-h-[44px]">
                    <MessageCircle className="mr-2 h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                    <span className="truncate">{t.whyChooseUs.contactWhatsApp}</span>
                  </Button>
                </a>
                <Button variant="luxuryOutline" size="lg" className="w-full sm:w-auto px-4 sm:px-6 md:px-8 min-h-[44px]" onClick={() => {
                  document.getElementById('avantaje')?.scrollIntoView({ behavior: 'smooth' });
                }}>
                  <Eye className="mr-2 h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                  {t.whyChooseUs.discoverAdvantages}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Section */}
        <section id="continut-principal" className="py-8 sm:py-12 md:py-16 lg:py-20">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6">
            {/* Pentru vânzare */}
            <div className="mb-12 md:mb-20">
              <div className="text-center mb-8 md:mb-16">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-playfair font-bold mb-4 md:mb-6 px-2">
                  {t.whyChooseUs.sellingTitle} <span className="text-gold">{t.whyChooseUs.sellingTitleHighlight}</span> {t.whyChooseUs.sellingTitleEnd}
                </h2>
                <p className="text-base sm:text-lg md:text-xl font-inter text-muted-foreground max-w-4xl mx-auto leading-relaxed px-2">
                  {t.whyChooseUs.sellingSubtitle}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 md:gap-6 lg:gap-8 max-w-7xl mx-auto">
                {t.whyChooseUs.sellingPoints.map((point, index) => {
                  const IconComponent = sellingIcons[index] || Award;
                  const isFullWidth = index === 4; // "Expunerea maximă" takes full width
                  
                  return (
                    <Card key={index} className={`border-gold/10 hover:border-gold/30 transition-all duration-300 ${isFullWidth ? 'md:col-span-2' : ''}`}>
                      <CardContent className="p-4 md:p-6 lg:p-8">
                        <div className="flex items-start mb-4 md:mb-6">
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gold/10 flex items-center justify-center mr-3 md:mr-4 mt-1 flex-shrink-0">
                            <IconComponent className="w-5 h-5 md:w-6 md:h-6 text-gold" />
                          </div>
                          <div>
                            <h3 className="text-lg md:text-xl font-playfair font-semibold mb-2 md:mb-3 text-gold">
                              {index + 1}. {point.title}
                            </h3>
                            <p className="font-inter text-sm md:text-base text-muted-foreground leading-relaxed mb-3 md:mb-4">
                              {point.text}
                            </p>
                            {point.text2 && (
                              <p className="font-inter text-sm md:text-base text-muted-foreground leading-relaxed">
                                {point.text2}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Pentru cumpărare */}
            <div>
              <div className="text-center mb-8 md:mb-16">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-playfair font-bold mb-4 md:mb-6 px-2">
                  {t.whyChooseUs.buyingTitle} <span className="text-gold">{t.whyChooseUs.sellingTitleHighlight}</span> {t.whyChooseUs.buyingTitleEnd}
                </h2>
                <p className="text-base sm:text-lg md:text-xl font-inter text-muted-foreground max-w-4xl mx-auto leading-relaxed px-2">
                  {t.whyChooseUs.buyingSubtitle}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 md:gap-6 lg:gap-8 max-w-7xl mx-auto">
                {t.whyChooseUs.buyingPoints.map((point, index) => {
                  const IconComponent = buyingIcons[index] || Award;
                  const isFullWidth = index === 4; // Last item takes full width
                  
                  return (
                    <Card key={index} className={`border-gold/10 hover:border-gold/30 transition-all duration-300 ${isFullWidth ? 'md:col-span-2' : ''}`}>
                      <CardContent className="p-4 md:p-6 lg:p-8">
                        <div className="flex items-start mb-4 md:mb-6">
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gold/10 flex items-center justify-center mr-3 md:mr-4 mt-1 flex-shrink-0">
                            <IconComponent className="w-5 h-5 md:w-6 md:h-6 text-gold" />
                          </div>
                          <div>
                            <h3 className="text-lg md:text-xl font-playfair font-semibold mb-2 md:mb-3 text-gold">
                              {index + 1}. {point.title}
                            </h3>
                            <p className="font-inter text-sm md:text-base text-muted-foreground leading-relaxed mb-3 md:mb-4">
                              {point.text}
                            </p>
                            {point.text2 && (
                              <p className="font-inter text-sm md:text-base text-muted-foreground leading-relaxed">
                                {point.text2}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-12 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8 md:mb-16">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4 px-2">
                  {t.whyChooseUs.servicesTitle} <span className="text-gold">{t.whyChooseUs.servicesTitleHighlight}</span>
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-muted-foreground px-2">
                  {t.whyChooseUs.servicesSubtitle}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 md:gap-6">
                {t.whyChooseUs.servicesList.map((service, index) => (
                  <div key={index} className="flex items-center p-3 md:p-4 bg-background rounded-xl border border-gold/10 hover:border-gold/30 transition-colors">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gold/10 flex items-center justify-center mr-3 md:mr-4 flex-shrink-0">
                      <Heart className="w-3 h-3 md:w-4 md:h-4 text-gold" />
                    </div>
                    <span className="font-medium text-sm md:text-base">{service}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8 md:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4 px-2">
                {t.whyChooseUs.testimonialsTitle} <span className="text-gold">{t.whyChooseUs.testimonialsTitleHighlight}</span>
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground px-2">
                {t.whyChooseUs.testimonialsSubtitle}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 max-w-6xl mx-auto">
              {t.whyChooseUs.testimonials.map((testimonial, index) => (
                <Card key={index} className="relative overflow-hidden border-gold/10 hover:border-gold/30 transition-all duration-300">
                  <CardContent className="p-4 md:p-6 lg:p-8">
                    <div className="flex mb-3 md:mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 md:w-5 md:h-5 text-gold fill-gold" />
                      ))}
                    </div>
                    
                    <p className="text-sm md:text-base text-muted-foreground italic mb-4 md:mb-6 leading-relaxed">
                      "{testimonial.text}"
                    </p>
                    
                    <div className="font-semibold text-sm md:text-base text-gold">
                      {testimonial.name}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-20 bg-gradient-to-r from-gold/10 via-gold-light/10 to-gold/10">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 md:mb-6 px-2">
                {t.whyChooseUs.ctaTitle} <span className="text-gold">{t.whyChooseUs.ctaTitleHighlight}</span>
              </h2>
              
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 md:mb-8 px-2">
                {t.whyChooseUs.ctaSubtitle}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
                <a href="https://wa.me/40767941512" target="_blank" rel="noopener noreferrer">
                  <Button variant="luxury" size="lg" className="w-full sm:w-auto px-6 md:px-8">
                    <MessageCircle className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                    {t.whyChooseUs.contactWhatsApp}
                  </Button>
                </a>
                <Button variant="luxuryOutline" size="lg" className="w-full sm:w-auto px-6 md:px-8" onClick={() => {
                  document.getElementById('proprietati')?.scrollIntoView({ behavior: 'smooth' });
                  window.location.href = '/#proprietati';
                }}>
                  <TrendingUp className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                  {t.whyChooseUs.viewProperties}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
    </>
  );
};

export default WhyChooseUs;
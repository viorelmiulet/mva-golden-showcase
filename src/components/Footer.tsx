import { useState, useEffect } from "react"
import { Separator } from "@/components/ui/separator"
import { ArrowUp, Download } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { useSiteSettings } from "@/hooks/useSiteSettings"
import { useLanguage } from "@/contexts/LanguageContext"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}


const Footer = () => {
  const location = useLocation()
  const { data: settings } = useSiteSettings()
  const { language, t } = useLanguage()
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  const phoneNumber = settings?.phone?.replace(/\s/g, '') || "0767941512"
  const companyName = settings?.companyName || "MVA IMOBILIARE"
  const companyDescription = settings?.companyDescription || (language === 'ro' 
    ? "Agenția imobiliară de încredere pentru complexe rezidențiale premium în vestul Bucureștiului. Transformăm visurile tale de locuință în realitate."
    : "The trusted real estate agency for premium residential complexes in western Bucharest. We transform your housing dreams into reality.")
  const facebookUrl = settings?.facebook || "https://www.facebook.com/profile.php?id=61575213335398"

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setIsInstalled(true)
      }
      setDeferredPrompt(null)
    }
  }

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigation = (link: { name: string; id: string; type: 'scroll' | 'link' }) => {
    if (link.type === 'link') {
      return
    } else if (link.type === 'scroll') {
      if (location.pathname !== '/') {
        window.location.href = `/#${link.id}`
      } else {
        scrollToSection(link.id)
      }
    }
  };

  const quickLinks = [
    { name: t.nav.home, id: '/', type: 'link' as const },
    { name: t.nav.about, id: '/despre-noi', type: 'link' as const },
    { name: t.services.title, id: '/servicii', type: 'link' as const },
    { name: t.nav.projects, id: '/proprietati', type: 'link' as const },
    { name: t.nav.calculator, id: '/calculator-credit', type: 'link' as const },
    { name: t.nav.contact, id: '/contact', type: 'link' as const }
  ];

  const services = language === 'ro' ? [
    'Vânzare Apartamente',
    'Consultanță Investiții',
    'Evaluări Profesionale',
    'Management Proprietăți',
    'Consultanță Juridică'
  ] : [
    'Apartment Sales',
    'Investment Consulting',
    'Professional Valuations',
    'Property Management',
    'Legal Consulting'
  ];

  return (
    <footer className="relative overflow-hidden border-t border-gold/20">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-section">
        <div className="absolute top-10 right-20 w-64 h-64 bg-gold/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-20 w-48 h-48 bg-gold/3 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 relative z-10">
        
        {/* Main Footer Content */}
        <div className="py-10 sm:py-14 lg:py-20">
          <div className="max-w-6xl mx-auto">
            <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
              
              {/* Logo & Description */}
              <div className="lg:col-span-2 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start space-x-3 sm:space-x-4 mb-4 sm:mb-6 group cursor-pointer touch-manipulation" onClick={scrollToTop}>
                  <div className="relative">
                    {/* Matching Luxury Footer Logo */}
                    <svg width="42" height="42" viewBox="0 0 42 42" className="transition-all duration-500 group-hover:scale-110 group-hover:rotate-2">
                      <defs>
                        <linearGradient id="footerLuxuryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#D4AF37" />
                          <stop offset="50%" stopColor="#FFD700" />
                          <stop offset="100%" stopColor="#B8860B" />
                        </linearGradient>
                        <linearGradient id="footerInnerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#1A1A1A" />
                          <stop offset="100%" stopColor="#2D2D2D" />
                        </linearGradient>
                      </defs>
                      
                      <circle cx="21" cy="21" r="20" fill="none" stroke="url(#footerLuxuryGradient)" strokeWidth="1.5" className="opacity-70" />
                      
                      <path 
                        d="M21 3 L37 12 L37 30 L21 39 L5 30 L5 12 Z" 
                        fill="url(#footerLuxuryGradient)" 
                        className="opacity-90 group-hover:opacity-100 transition-opacity"
                      />
                      
                      <path 
                        d="M21 6 L34 14 L34 28 L21 36 L8 28 L8 14 Z" 
                        fill="url(#footerInnerGradient)"
                      />
                      
                      <path 
                        d="M14 16 L17 16 L21 24 L25 16 L28 16 L28 26 L26.5 26 L26.5 18.5 L23.5 24 L18.5 24 L15.5 18.5 L15.5 26 L14 26 Z"
                        fill="url(#footerLuxuryGradient)"
                      />
                      
                      <circle cx="33" cy="9" r="1" fill="#FFD700" className="opacity-60" />
                      <circle cx="9" cy="33" r="0.8" fill="#D4AF37" className="opacity-40" />
                    </svg>
                    
                    <div className="absolute inset-0 bg-gradient-radial from-yellow-400/20 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                  
                  <div>
                    <div className="font-cinzel text-lg sm:text-xl font-bold tracking-wide bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent">
                      {companyName}
                    </div>
                    
                    <div className="w-0 group-hover:w-full h-[1.5px] bg-gradient-to-r from-yellow-400 to-yellow-600 mt-1 transition-all duration-700"></div>
                  </div>
                </div>
                
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4 sm:mb-6 max-w-md mx-auto md:mx-0">
                  {companyDescription}
                </p>
                
                <div className="flex justify-center md:justify-start space-x-3">
                  {facebookUrl && (
                    <a 
                      href={facebookUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-12 h-12 sm:w-11 sm:h-11 glass rounded-xl flex items-center justify-center hover:bg-gold/10 transition-all duration-300 group border border-gold/20 hover:border-gold/50 touch-manipulation hover:scale-110 hover:-translate-y-1"
                      title="Pagina noastră Facebook"
                    >
                      <svg className="w-5 h-5 text-gold group-hover:text-gold-light transition-colors" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </a>
                  )}
                  
                  <a 
                    href={`https://wa.me/${phoneNumber.replace(/^0/, '40')}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-12 h-12 sm:w-11 sm:h-11 glass rounded-xl flex items-center justify-center hover:bg-gold/10 transition-all duration-300 group border border-gold/20 hover:border-gold/50 touch-manipulation hover:scale-110 hover:-translate-y-1"
                    title="WhatsApp"
                  >
                    <svg className="w-5 h-5 text-gold group-hover:text-gold-light transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                  </a>

                  {/* PWA Install Button */}
                  {deferredPrompt && !isInstalled && (
                    <button
                      onClick={handleInstall}
                      className="w-12 h-12 sm:w-11 sm:h-11 glass rounded-xl flex items-center justify-center hover:bg-gold/10 transition-all duration-300 group border border-gold/20 hover:border-gold/50 touch-manipulation hover:scale-110 hover:-translate-y-1"
                      title={language === 'ro' ? 'Instalează Aplicația' : 'Install App'}
                    >
                      <Download className="w-5 h-5 text-gold group-hover:text-gold-light transition-colors" />
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Links */}
              <div className="text-center">
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6 flex items-center justify-center">
                  <span className="w-2 h-2 bg-gradient-gold rounded-full mr-3 glow-gold"></span>
                  <span className="text-gradient-gold">{language === 'ro' ? 'Navigare' : 'Navigation'}</span>
                </h3>
                <ul className="space-y-2 sm:space-y-3">
                  {quickLinks.map((link) => (
                    <li key={link.id}>
                      {link.type === 'link' ? (
                        <Link
                          to={link.id}
                          className="text-muted-foreground hover:text-gold transition-all duration-300 text-sm inline-block hover:translate-x-1"
                        >
                          {link.name}
                        </Link>
                      ) : (
                        <button 
                          onClick={() => handleNavigation(link)} 
                          className="text-muted-foreground hover:text-gold transition-all duration-300 text-sm inline-block hover:translate-x-1"
                        >
                          {link.name}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Services */}
              <div className="text-center md:text-left">
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6 flex items-center justify-center md:justify-start">
                  <span className="w-2 h-2 bg-gradient-gold rounded-full mr-3 glow-gold"></span>
                  <span className="text-gradient-gold">{t.services.title}</span>
                </h3>
                <ul className="space-y-2 sm:space-y-3">
                  {services.map((service, index) => (
                    <li key={index}>
                      <span className="text-muted-foreground text-sm block hover:text-foreground transition-colors">
                        {service}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>


        <Separator className="bg-gold/20" />

        {/* Bottom Footer */}
        <div className="py-4 sm:py-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-center sm:text-left">
                <p className="text-muted-foreground text-xs sm:text-sm">
                  © 2025 {companyName}. {t.footer.rights}.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                <div className="flex gap-3 sm:gap-4 text-xs">
                  <Link 
                    to="/politica-confidentialitate" 
                    className="text-muted-foreground hover:text-gold transition-colors touch-manipulation"
                  >
                    {t.footer.privacy}
                  </Link>
                  <Link 
                    to="/termeni-conditii" 
                    className="text-muted-foreground hover:text-gold transition-colors touch-manipulation"
                  >
                    {t.footer.terms}
                  </Link>
                </div>
                
                <button 
                  onClick={scrollToTop}
                  className="w-10 h-10 sm:w-9 sm:h-9 glass rounded-xl flex items-center justify-center hover:bg-gold/10 transition-all duration-300 group border border-gold/20 hover:border-gold/50 touch-manipulation hover:scale-110 hover:-translate-y-1 glow-gold"
                  title={language === 'ro' ? 'Înapoi sus' : 'Back to top'}
                >
                  <ArrowUp className="w-4 h-4 text-gold group-hover:text-gold-light transition-colors" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
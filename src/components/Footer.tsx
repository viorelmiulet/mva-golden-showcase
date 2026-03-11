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
    ? "Agenția imobiliară de încredere pentru complexe rezidențiale premium în vestul Bucureștiului."
    : "The trusted real estate agency for premium residential complexes in western Bucharest.")
  const facebookUrl = settings?.facebook || "https://www.facebook.com/profile.php?id=61575213335398"

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) { setIsInstalled(true); return; }
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e as BeforeInstallPromptEvent); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setIsInstalled(true);
      setDeferredPrompt(null);
    }
  }

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const quickLinks = [
    { name: t.nav.home, id: '/' },
    { name: t.nav.about, id: '/despre-noi' },
    { name: t.services.title, id: '/servicii' },
    { name: t.nav.projects, id: '/proprietati' },
    { name: t.nav.calculator, id: '/calculator-credit' },
    { name: t.nav.contact, id: '/contact' }
  ];

  const services = language === 'ro' 
    ? ['Vânzare Apartamente', 'Consultanță Investiții', 'Evaluări Profesionale', 'Management Proprietăți', 'Consultanță Juridică']
    : ['Apartment Sales', 'Investment Consulting', 'Professional Valuations', 'Property Management', 'Legal Consulting'];

  return (
    <footer className="border-t border-border/50">
      <div className="container mx-auto px-4 lg:px-6">
        
        <div className="py-10 lg:py-14">
          <div className="max-w-5xl mx-auto grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4 cursor-pointer" onClick={scrollToTop}>
                <div className="font-cinzel text-lg font-bold text-gradient-gold">{companyName}</div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 max-w-md">{companyDescription}</p>
              <div className="flex gap-2">
                {facebookUrl && (
                  <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="w-9 h-9 glass rounded-lg flex items-center justify-center hover:bg-gold/10 transition-colors border border-border/50" title="Facebook">
                    <svg className="w-4 h-4 text-gold" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                )}
                <a href={`https://wa.me/${phoneNumber.replace(/^0/, '40')}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 glass rounded-lg flex items-center justify-center hover:bg-gold/10 transition-colors border border-border/50" title="WhatsApp">
                  <svg className="w-4 h-4 text-gold" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/></svg>
                </a>
                {deferredPrompt && !isInstalled && (
                  <button onClick={handleInstall} className="w-9 h-9 glass rounded-lg flex items-center justify-center hover:bg-gold/10 transition-colors border border-border/50" title={language === 'ro' ? 'Instalează' : 'Install'}>
                    <Download className="w-4 h-4 text-gold" />
                  </button>
                )}
              </div>
            </div>

            {/* Links */}
            <div>
              <h3 className="text-sm font-semibold text-gradient-gold mb-4">{language === 'ro' ? 'Navigare' : 'Navigation'}</h3>
              <ul className="space-y-2">
                {quickLinks.map((link) => (
                  <li key={link.id}><Link to={link.id} className="text-xs text-muted-foreground hover:text-gold transition-colors">{link.name}</Link></li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-sm font-semibold text-gradient-gold mb-4">{t.services.title}</h3>
              <ul className="space-y-2">
                {services.map((s, i) => <li key={i}><span className="text-xs text-muted-foreground">{s}</span></li>)}
              </ul>
            </div>
          </div>
        </div>

        {/* Trustpilot */}
        <div className="py-4 max-w-5xl mx-auto">
          <div className="bg-white rounded-xl p-3">
            <div 
              ref={(el) => { if (el && (window as any).Trustpilot) (window as any).Trustpilot.loadFromElement(el, true); }}
              className="trustpilot-widget" data-locale="en-US" data-template-id="56278e9abfbbba0bdcd568bc" data-businessunit-id="69a352c6e12ef9724a882ef0" data-style-height="52px" data-style-width="100%" data-token="f1c5a477-f549-46aa-b8c6-cd1e0c6bae45"
            >
              <a href="https://www.trustpilot.com/review/mvaimobiliare.ro" target="_blank" rel="noopener">Trustpilot</a>
            </div>
          </div>
        </div>

        <Separator className="bg-border/30" />

        <div className="py-4 max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-muted-foreground text-xs">© 2025 {companyName}. {t.footer.rights}.</p>
          <div className="flex items-center gap-4">
            <Link to="/politica-confidentialitate" className="text-xs text-muted-foreground hover:text-gold transition-colors">{t.footer.privacy}</Link>
            <Link to="/termeni-conditii" className="text-xs text-muted-foreground hover:text-gold transition-colors">{t.footer.terms}</Link>
            <button onClick={scrollToTop} className="w-8 h-8 glass rounded-lg flex items-center justify-center hover:bg-gold/10 transition-colors border border-border/50" title={language === 'ro' ? 'Sus' : 'Top'}>
              <ArrowUp className="w-3 h-3 text-gold" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

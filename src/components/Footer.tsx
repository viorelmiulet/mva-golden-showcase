import { useState, useEffect } from "react"
import { ArrowUp, Download } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { useSiteSettings } from "@/hooks/useSiteSettings"
import { useLanguage } from "@/contexts/LanguageContext"

const LEGAL_BADGE_FALLBACKS = {
  anpc: "https://anpc.ro/wp-content/uploads/2022/07/SAL-PICTOGRAMA.png",
  sol: "https://anpc.ro/wp-content/uploads/2022/08/pictogramaSOL.png",
}

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
    ? "Agenția imobiliară de încredere în București, cu expertiză aprofundată în vestul Capitalei — Militari și Chiajna."
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

  const zoneLinks = [
    { name: 'Apartamente 2 camere Militari', to: '/apartamente-2-camere-militari' },
    { name: 'Apartamente 3 camere Militari', to: '/apartamente-3-camere-militari' },
    { name: 'Apartamente Drumul Taberei', to: '/apartamente-drumul-taberei' },
    { name: 'Apartamente Crângași & Giulești', to: '/apartamente-crangasi-giulesti' },
    { name: 'Apartamente Titan & Pantelimon', to: '/apartamente-titan-pantelimon' },
    { name: 'Apartamente Berceni & Giurgiului', to: '/apartamente-berceni-giurgiului' },
    { name: 'Apartamente Tineretului & Văcărești', to: '/apartamente-tineretului-vacaresti' },
    { name: 'Apartamente Sector 6', to: '/apartamente-sector-6' },
  ];


  return (
    <footer className="bg-ink text-paper border-t border-stone/20">
      <div className="container mx-auto px-4 lg:px-6">

        <div className="py-10 grid gap-10 md:grid-cols-3">

          {/* Col 1 — brand, company details, social */}
          <div>
            <button onClick={scrollToTop} className="text-title text-brass mb-3">{companyName}</button>
            <p className="text-small text-paper/70 leading-relaxed max-w-sm">{companyDescription}</p>
            <p className="text-small text-paper/50 mt-4">
              MVA PERFECT BUSINESS S.R.L. · CUI: 50477503 · Nr. Reg. Com.: J23/18361/2024
            </p>
            <p className="text-small text-paper/50 mt-1">
              <a href={`tel:${phoneNumber}`} className="hover:text-brass transition-colors">{phoneNumber}</a>
              {" · "}
              <a href="mailto:contact@mvaimobiliare.ro" className="hover:text-brass transition-colors">contact@mvaimobiliare.ro</a>
            </p>
            <div className="flex gap-2 mt-4">
              {facebookUrl && (
                <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="w-9 h-9 border border-stone/20 rounded-sm flex items-center justify-center text-brass hover:border-brass transition-colors" aria-label="Facebook MVA Imobiliare">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
              )}
              <a href={`https://wa.me/${phoneNumber.replace(/^0/, '40')}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 border border-stone/20 rounded-sm flex items-center justify-center text-brass hover:border-brass transition-colors" aria-label="WhatsApp MVA Imobiliare">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/></svg>
              </a>
              {deferredPrompt && !isInstalled && (
                <button onClick={handleInstall} className="w-9 h-9 border border-stone/20 rounded-sm flex items-center justify-center text-brass hover:border-brass transition-colors" aria-label={language === 'ro' ? 'Instalează aplicația' : 'Install app'}>
                  <Download className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Col 2 — navigation + services */}
          <div>
            <h3 className="text-spec text-brass mb-3">{language === 'ro' ? 'Navigare' : 'Navigation'}</h3>
            <ul className="space-y-1.5">
              {quickLinks.map((link) => (
                <li key={link.id}><Link to={link.id} className="text-small text-paper/70 hover:text-brass transition-colors">{link.name}</Link></li>
              ))}
            </ul>
            <h3 className="text-spec text-brass mt-6 mb-3">{t.services.title}</h3>
            <ul className="space-y-1.5">
              {services.map((s, i) => <li key={i}><span className="text-small text-paper/70">{s}</span></li>)}
            </ul>
          </div>

          {/* Col 3 — zones */}
          <div>
            <h3 className="text-spec text-brass mb-3">{language === 'ro' ? 'Zone acoperite' : 'Areas covered'}</h3>
            <ul className="space-y-1.5">
              {zoneLinks.map((z) => (
                <li key={z.to}>
                  <Link to={z.to} className="text-small text-paper/70 hover:text-brass transition-colors">{z.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-stone/20 py-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-small text-paper/50">© {new Date().getFullYear()} {companyName}. {t.footer.rights}.</p>

          <div className="flex flex-wrap items-center gap-4">
            <Link to="/politica-confidentialitate" className="text-small text-paper/70 hover:text-brass transition-colors">{t.footer.privacy}</Link>
            <Link to="/termeni-conditii" className="text-small text-paper/70 hover:text-brass transition-colors">{t.footer.terms}</Link>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event('open-cookie-settings'))}
              className="text-small text-paper/70 hover:text-brass transition-colors"
            >
              {language === 'ro' ? 'Setări Cookie-uri' : 'Cookie settings'}
            </button>
            <a href="https://anpc.ro/categorie/sal/" target="_blank" rel="noopener noreferrer" className="text-small text-paper/70 hover:text-brass transition-colors">
              Soluționare Alternativă a Litigiilor (SAL)
            </a>
            <button onClick={scrollToTop} className="w-8 h-8 border border-stone/20 rounded-sm flex items-center justify-center text-brass hover:border-brass transition-colors" aria-label={language === 'ro' ? 'Sus' : 'Back to top'}>
              <ArrowUp className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="border-t border-stone/20 py-5 flex flex-wrap items-center gap-3">
          <a href="https://anpc.ro/ce-este-sal/" target="_blank" rel="noopener noreferrer" aria-label="Soluționarea Alternativă a Litigiilor">
            <img src={LEGAL_BADGE_FALLBACKS.anpc} alt="ANPC - Soluționarea Alternativă a Litigiilor" loading="lazy" referrerPolicy="no-referrer" className="h-12 w-auto bg-white rounded-sm p-1" />
          </a>
          <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" aria-label="Soluționarea Online a Litigiilor">
            <img src={LEGAL_BADGE_FALLBACKS.sol} alt="SOL - Soluționarea Online a Litigiilor" loading="lazy" referrerPolicy="no-referrer" className="h-12 w-auto bg-white rounded-sm p-1" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


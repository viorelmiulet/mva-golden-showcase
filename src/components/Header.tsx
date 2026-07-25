import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import WhatsAppIcon from "@/components/icons/WhatsAppIcon"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePrefetch } from "@/hooks/usePrefetch"
import { useLanguage } from "@/contexts/LanguageContext"
import { LanguageToggle } from "@/components/LanguageToggle"

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { prefetchOnHover } = usePrefetch()
  const { t } = useLanguage()

  // Map route paths to prefetch keys
  const getPrefetchKey = (path: string) => {
    const map: Record<string, 'properties' | 'complexe' | 'calculatorCredit' | 'whyChooseUs' | 'faq'> = {
      '/proprietati': 'properties',
      '/complexe': 'complexe',
      '/calculator-credit': 'calculatorCredit',
      '/de-ce-sa-ne-alegi': 'whyChooseUs',
      '/faq': 'faq',
    }
    return map[path]
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])



  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLogoClick = () => {
    if (location.pathname === '/') {
      // If already on home page, scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // If not on home page, the Link component will handle navigation
  };

  type NavItem = {
    name: string;
    id: string;
    type: 'scroll' | 'link';
  };

  const handleNavigation = (item: NavItem) => {
    if (item.type === 'link') {
      // Navigate to different page - handled by Link component
      return;
    } else if (item.type === 'scroll') {
      // Scroll to section on current page
      if (location.pathname !== '/') {
        // If not on home page, navigate to home first then scroll
        window.location.href = `/#${item.id}`;
      } else {
        scrollToSection(item.id);
      }
    }
  };

  const navItems: NavItem[] = [
    { name: t.nav.home, id: '/', type: 'link' },
    { name: t.nav.about, id: '/despre-noi', type: 'link' },
    { name: t.services.title, id: '/servicii', type: 'link' },
    { name: t.nav.properties, id: '/proprietati', type: 'link' },
    { name: t.nav.complexes, id: '/complexe', type: 'link' },
    
    { name: t.nav.calculator, id: '/calculator-credit', type: 'link' },
    { name: t.nav.whyUs, id: '/de-ce-sa-ne-alegi', type: 'link' },
    { name: t.nav.blog, id: '/blog', type: 'link' },
    { name: 'Știri', id: '/news', type: 'link' },
    { name: t.nav.faq, id: '/faq', type: 'link' },
    { name: t.nav.contact, id: '/contact', type: 'link' }
  ]

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      isScrolled 
        ? 'glass-strong border-b border-gold/20 shadow-glass' 
        : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo - Optimized for mobile */}
          <Link to="/" aria-label="Logo MVA Imobiliare - Agenție imobiliară în București" className="flex items-center group cursor-pointer" onClick={handleLogoClick}>
            <img
              src="/mva-logo-luxury-horizontal.svg"
              alt="MVA Imobiliare"
              width="160"
              height="56"
              className="h-10 sm:h-14 w-auto transition-transform duration-500 group-hover:scale-105"
              fetchPriority="high"
              decoding="async"
            />
          </Link>
          
          {/* Desktop Navigation - Hidden on mobile/tablet */}
          <nav className="hidden xl:flex items-center space-x-1">
            {navItems.map((item) => {
              const prefetchKey = item.type === 'link' ? getPrefetchKey(item.id) : undefined
              const prefetchProps = prefetchKey ? prefetchOnHover(prefetchKey) : {}
              
              return item.type === 'link' ? (
                <Link 
                  key={item.id}
                  to={item.id}
                  className={`relative px-3 py-2 transition-all duration-300 hover:bg-gold/5 rounded-lg font-medium text-sm group ${
                    location.pathname === item.id 
                      ? 'text-gold bg-gold/10' 
                      : 'text-foreground hover:text-gold'
                  }`}
                  {...prefetchProps}
                >
                  {item.name}
                  <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-gradient-gold transition-all duration-300 ${
                    location.pathname === item.id ? 'w-1/2' : 'w-0 group-hover:w-1/3'
                  }`}></span>
                </Link>
              ) : (
                <button 
                  key={item.id}
                  onClick={() => handleNavigation(item)} 
                  className="relative px-3 py-2 text-foreground hover:text-gold transition-all duration-300 hover:bg-gold/5 rounded-lg font-medium text-sm group"
                >
                  {item.name}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-gold transition-all duration-300 group-hover:w-1/3"></span>
                </button>
              )
            })}
          </nav>

          {/* CTA Buttons - Desktop only */}
          <div className="hidden lg:flex items-center space-x-3">
            
            <a href="https://wa.me/40767941512" target="_blank" rel="noopener noreferrer">
              <Button variant="luxury" size="sm" className="glow-gold text-xs">
                <WhatsAppIcon className="w-3 h-3 mr-2" />
                {t.common.whatsapp}
              </Button>
            </a>
          </div>

          {/* Mobile Menu - Visible on mobile/tablet */}
          <Sheet>
            <SheetTrigger asChild className="xl:hidden">
              <Button variant="ghost" size="icon" className="relative w-10 h-10" aria-label="Deschide meniul">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 sm:w-96 overflow-y-auto">
              <div className="flex flex-col space-y-6 mt-8 pb-8">
                {/* Mobile Logo + Language Toggle */}
                <div className="flex items-center justify-between pb-6 border-b border-border/30">
                  <div className="text-center flex-1">
                    <div className="font-cinzel text-xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                      MVA IMOBILIARE
                    </div>
                  </div>
                  
                </div>

                {navItems.map((item) => (
                  item.type === 'link' ? (
                    <Link 
                      key={item.id}
                      to={item.id}
                      className={`text-left px-4 py-4 transition-colors text-base border-b border-border/30 rounded-lg ${
                        location.pathname === item.id 
                          ? 'text-gold bg-gold/10 border-gold/20' 
                          : 'text-foreground hover:text-gold hover:bg-gold/5'
                      }`}
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <button 
                      key={item.id}
                      onClick={() => handleNavigation(item)} 
                      className="text-left px-4 py-4 text-foreground hover:text-gold hover:bg-gold/5 transition-colors text-base border-b border-border/30 rounded-lg"
                    >
                      {item.name}
                    </button>
                  )
                ))}
                
                {/* Mobile CTA Buttons */}
                <div className="space-y-4 pt-4">
                  <a href="https://wa.me/40767941512" target="_blank" rel="noopener noreferrer">
                    <Button variant="luxury" className="w-full h-12 text-base">
                      <WhatsAppIcon className="w-4 h-4 mr-2" />
                      {t.common.whatsapp}
                    </Button>
                  </a>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

export default Header
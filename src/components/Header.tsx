import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, MessageCircle, Home, Building } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const location = useLocation()

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
    { name: 'Acasă', id: 'home', type: 'scroll' },
    { name: 'Despre', id: 'despre', type: 'scroll' },
    { name: 'Servicii', id: 'servicii', type: 'scroll' },
    { name: 'Proiecte', id: 'proprietati', type: 'scroll' },
    { name: 'Proprietăți', id: '/proprietati', type: 'link' },
    { name: 'De ce noi?', id: '/de-ce-sa-ne-alegi', type: 'link' },
    { name: 'Contact', id: 'contact', type: 'scroll' }
  ]

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      isScrolled 
        ? 'glass-strong border-b border-gold/20' 
        : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo - Optimized for mobile */}
          <Link to="/" className="flex items-center space-x-2 sm:space-x-4 group cursor-pointer" onClick={handleLogoClick}>
            <div className="relative flex items-center justify-center">
              {/* Ultra Luxury Premium Logo */}
              <div className="relative">
                <svg width="40" height="40" viewBox="0 0 50 50" className="sm:w-[50px] sm:h-[50px] transition-all duration-500 group-hover:scale-110 group-hover:rotate-2 filter drop-shadow-2xl">
                  <defs>
                    <linearGradient id="luxuryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#D4AF37" />
                      <stop offset="25%" stopColor="#FFD700" />
                      <stop offset="50%" stopColor="#F4E5B1" />
                      <stop offset="75%" stopColor="#FFD700" />
                      <stop offset="100%" stopColor="#B8860B" />
                    </linearGradient>
                    <linearGradient id="innerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1A1A1A" />
                      <stop offset="50%" stopColor="#2D2D2D" />
                      <stop offset="100%" stopColor="#1A1A1A" />
                    </linearGradient>
                    <filter id="luxuryGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                      <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                    <filter id="innerShadow">
                      <feOffset dx="0" dy="2"/>
                      <feGaussianBlur stdDeviation="2" result="offset-blur"/>
                      <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse"/>
                      <feFlood floodColor="#000000" floodOpacity="0.3"/>
                      <feComposite operator="in" in2="inverse"/>
                      <feComposite operator="over" in2="SourceGraphic"/>
                    </filter>
                  </defs>
                  
                  {/* Outer luxury ring */}
                  <circle 
                    cx="25" 
                    cy="25" 
                    r="24" 
                    fill="none"
                    stroke="url(#luxuryGradient)"
                    strokeWidth="2"
                    className="opacity-80 group-hover:opacity-100 transition-all duration-500"
                    filter="url(#luxuryGlow)"
                  />
                  
                  {/* Main luxury hexagon */}
                  <path 
                    d="M25 3 L43 13 L43 37 L25 47 L7 37 L7 13 Z" 
                    fill="url(#luxuryGradient)" 
                    className="opacity-95 group-hover:opacity-100 transition-all duration-500"
                    filter="url(#luxuryGlow)"
                  />
                  
                  {/* Inner dark background */}
                  <path 
                    d="M25 6 L40 15 L40 35 L25 44 L10 35 L10 15 Z" 
                    fill="url(#innerGradient)"
                    filter="url(#innerShadow)"
                  />
                  
                  {/* Premium "M" letterform */}
                  <path 
                    d="M16 18 L19.5 18 L25 28 L30.5 18 L34 18 L34 32 L31.5 32 L31.5 22 L27 30 L23 30 L18.5 22 L18.5 32 L16 32 Z"
                    fill="url(#luxuryGradient)"
                    className="drop-shadow-lg"
                  />
                  
                  {/* Luxury corner accents */}
                  <circle cx="40" cy="10" r="1.5" fill="#FFD700" className="opacity-80" />
                  <circle cx="10" cy="40" r="1" fill="#D4AF37" className="opacity-60" />
                  <polygon points="42,40 44,38 44,42" fill="#B8860B" className="opacity-40" />
                </svg>
                
                {/* Premium glow effects */}
                <div className="absolute inset-0 bg-gradient-radial from-yellow-400/30 via-yellow-600/20 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700 animate-pulse"></div>
                <div className="absolute inset-0 bg-gradient-conic from-yellow-300 via-yellow-500 to-yellow-300 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-all duration-1000"></div>
              </div>
            </div>
            
            <div className="hidden sm:block">
              <div className="relative overflow-hidden">
                <div className="font-cinzel text-2xl sm:text-3xl font-bold tracking-wider bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent group-hover:from-yellow-300 group-hover:via-yellow-400 group-hover:to-yellow-600 transition-all duration-500 filter drop-shadow-lg">
                  MVA
                </div>
                <div className="font-playfair text-muted-foreground/90 text-xs font-medium tracking-[0.4em] uppercase -mt-1 group-hover:text-muted-foreground transition-all duration-300 relative">
                  <span className="relative z-10">IMOBILIARE</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                </div>
                {/* Luxury accent line with animation */}
                <div className="relative mt-1 h-[2px] bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-600 scale-x-0 group-hover:scale-x-100 origin-center transition-transform duration-700 ease-out"></div>
                </div>
              </div>
            </div>
          </Link>
          
          {/* Desktop Navigation - Hidden on mobile/tablet */}
          <nav className="hidden xl:flex items-center space-x-1">
            {navItems.map((item) => (
              item.type === 'link' ? (
                <Link 
                  key={item.id}
                  to={item.id}
                  className={`px-3 py-2 transition-all duration-300 hover:bg-gold/5 rounded-lg font-medium text-sm ${
                    location.pathname === item.id 
                      ? 'text-gold bg-gold/10' 
                      : 'text-foreground hover:text-gold'
                  }`}
                >
                  {item.name}
                </Link>
              ) : (
                <button 
                  key={item.id}
                  onClick={() => handleNavigation(item)} 
                  className="px-3 py-2 text-foreground hover:text-gold transition-all duration-300 hover:bg-gold/5 rounded-lg font-medium text-sm"
                >
                  {item.name}
                </button>
              )
            ))}
          </nav>

          {/* CTA Buttons - Desktop only */}
          <div className="hidden lg:flex items-center space-x-3">
            <Link to="/proprietati">
              <Button variant="luxuryOutline" size="sm" className="shadow-lg shadow-gold/10 text-xs">
                <Building className="w-3 h-3 mr-2" />
                Vezi toate ofertele
              </Button>
            </Link>
            <a href="https://wa.me/40767941512" target="_blank" rel="noopener noreferrer">
              <Button variant="luxury" size="sm" className="shadow-lg shadow-gold/20 text-xs">
                <MessageCircle className="w-3 h-3 mr-2" />
                Contact WhatsApp
              </Button>
            </a>
          </div>

          {/* Mobile Menu - Visible on mobile/tablet */}
          <Sheet>
            <SheetTrigger asChild className="xl:hidden">
              <Button variant="ghost" size="icon" className="relative w-10 h-10">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 sm:w-96 overflow-y-auto">
              <div className="flex flex-col space-y-6 mt-8 pb-8">
                {/* Mobile Logo in Sheet */}
                <div className="flex items-center justify-center pb-6 border-b border-border/30">
                  <div className="text-center">
                    <div className="font-cinzel text-xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                      MVA IMOBILIARE
                    </div>
                    <div className="text-xs text-muted-foreground tracking-widest uppercase">Premium Real Estate</div>
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
                <div className="space-y-6 pt-4">
                  <Link to="/proprietati">
                    <Button variant="luxuryOutline" className="w-full h-12 text-base">
                      <Building className="w-4 h-4 mr-2" />
                      Vezi toate ofertele
                    </Button>
                  </Link>
                  <a href="https://wa.me/40767941512" target="_blank" rel="noopener noreferrer">
                    <Button variant="luxury" className="w-full h-12 text-base">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Contactează-ne pe WhatsApp
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
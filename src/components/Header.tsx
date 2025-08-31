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
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-background/95 backdrop-blur-lg shadow-lg border-b border-gold/10' 
        : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group cursor-pointer">
            <div className="relative flex items-center justify-center">
              {/* Modern SVG Logo */}
              <div className="relative">
                <svg width="48" height="48" viewBox="0 0 48 48" className="transition-transform group-hover:scale-105">
                  {/* Background gradient circle */}
                  <defs>
                    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="hsl(var(--gold))" stopOpacity="1" />
                      <stop offset="100%" stopColor="hsl(var(--gold-light))" stopOpacity="0.8" />
                    </linearGradient>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  
                  {/* Main circle background */}
                  <circle 
                    cx="24" 
                    cy="24" 
                    r="22" 
                    fill="url(#logoGradient)" 
                    className="opacity-90 group-hover:opacity-100 transition-opacity"
                    filter="url(#glow)"
                  />
                  
                  {/* Building icon */}
                  <g transform="translate(24, 24)">
                    <Building 
                      size={20} 
                      className="text-background translate-x-[-10] translate-y-[-10]" 
                      strokeWidth={2.5}
                    />
                  </g>
                  
                  {/* Decorative elements */}
                  <circle cx="12" cy="12" r="2" fill="hsl(var(--background))" className="opacity-60" />
                  <circle cx="36" cy="36" r="1.5" fill="hsl(var(--background))" className="opacity-40" />
                </svg>
                
                {/* Hover glow effect */}
                <div className="absolute inset-0 bg-gold/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
              </div>
            </div>
            
            <div className="hidden sm:block">
              <div className="relative">
                <div className="text-gold font-bold text-2xl tracking-wider bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                  MVA
                </div>
                <div className="text-muted-foreground text-sm -mt-1 font-medium tracking-widest">
                  IMOBILIARE
                </div>
                {/* Subtle underline decoration */}
                <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-gold/50 to-transparent mt-1"></div>
              </div>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              item.type === 'link' ? (
                <Link 
                  key={item.id}
                  to={item.id}
                  className={`px-4 py-2 transition-all duration-300 hover:bg-gold/5 rounded-lg font-medium ${
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
                  className="px-4 py-2 text-foreground hover:text-gold transition-all duration-300 hover:bg-gold/5 rounded-lg font-medium"
                >
                  {item.name}
                </button>
              )
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden md:block">
            <a href="https://wa.me/40767941512" target="_blank" rel="noopener noreferrer">
              <Button variant="luxury" className="shadow-lg shadow-gold/20">
                <MessageCircle className="w-4 h-4 mr-2" />
                Contactează-ne pe WhatsApp
              </Button>
            </a>
          </div>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col space-y-6 mt-8">
                {navItems.map((item) => (
                  item.type === 'link' ? (
                    <Link 
                      key={item.id}
                      to={item.id}
                      className={`text-left px-4 py-3 transition-colors text-lg border-b border-border/30 ${
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
                      className="text-left px-4 py-3 text-foreground hover:text-gold transition-colors text-lg border-b border-border/30"
                    >
                      {item.name}
                    </button>
                  )
                ))}
                <a href="https://wa.me/40767941512" target="_blank" rel="noopener noreferrer" className="mt-4">
                  <Button variant="luxury" className="w-full">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contactează-ne pe WhatsApp
                  </Button>
                </a>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

export default Header
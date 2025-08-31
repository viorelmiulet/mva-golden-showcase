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
              {/* Ultra Modern Minimal Logo */}
              <div className="relative">
                <svg width="44" height="44" viewBox="0 0 44 44" className="transition-all duration-300 group-hover:scale-105 group-hover:rotate-1">
                  <defs>
                    <linearGradient id="modernGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="hsl(var(--gold))" />
                      <stop offset="50%" stopColor="hsl(var(--gold-light))" />
                      <stop offset="100%" stopColor="hsl(var(--gold))" />
                    </linearGradient>
                    <filter id="modernGlow">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  
                  {/* Geometric Modern Shape */}
                  <path 
                    d="M22 2 L40 12 L40 32 L22 42 L4 32 L4 12 Z" 
                    fill="url(#modernGradient)" 
                    className="opacity-90 group-hover:opacity-100 transition-all duration-300"
                    filter="url(#modernGlow)"
                  />
                  
                  {/* Stylized M */}
                  <path 
                    d="M14 16 L18 16 L22 24 L26 16 L30 16 L30 28 L28 28 L28 18.5 L24.5 26 L19.5 26 L16 18.5 L16 28 L14 28 Z"
                    fill="hsl(var(--background))"
                    className="drop-shadow-sm"
                  />
                  
                  {/* Accent dots */}
                  <circle cx="35" cy="10" r="1.5" fill="hsla(var(--background), 0.7)" />
                  <circle cx="9" cy="34" r="1" fill="hsla(var(--background), 0.5)" />
                </svg>
                
                {/* Dynamic glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-gold/20 via-gold-light/30 to-gold/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500 animate-pulse"></div>
              </div>
            </div>
            
            <div className="hidden sm:block">
              <div className="relative overflow-hidden">
                <div className="text-2xl font-black tracking-tight bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent group-hover:from-gold-light group-hover:via-gold group-hover:to-gold-light transition-all duration-300">
                  MVA
                </div>
                <div className="text-xs font-semibold text-muted-foreground/80 tracking-[0.3em] uppercase -mt-0.5 group-hover:text-muted-foreground transition-colors">
                  IMOBILIARE
                </div>
                {/* Modern accent line */}
                <div className="w-0 group-hover:w-full h-[2px] bg-gradient-to-r from-gold to-gold-light mt-1 transition-all duration-500 ease-out"></div>
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
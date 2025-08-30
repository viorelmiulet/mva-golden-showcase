import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import mvaLogo from "@/assets/mva-logo.png"

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
            <div className="relative">
              <img src={mvaLogo} alt="MVA IMOBILIARE" className="h-12 w-auto transition-transform group-hover:scale-105" />
              <div className="absolute inset-0 bg-gold/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div className="hidden sm:block">
              <div className="text-gold font-bold text-xl tracking-wide">MVA</div>
              <div className="text-muted-foreground text-sm -mt-1">IMOBILIARE</div>
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
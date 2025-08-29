import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import mvaLogo from "@/assets/mva-logo.png"

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false)

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

  const navItems = [
    { name: 'Acasă', id: 'home' },
    { name: 'Despre', id: 'despre' },
    { name: 'Servicii', id: 'servicii' },
    { name: 'Proiecte', id: 'proprietati' },
    { name: 'Contact', id: 'contact' }
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
          <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => scrollToSection('home')}>
            <div className="relative">
              <img src={mvaLogo} alt="MVA IMOBILIARE" className="h-12 w-auto transition-transform group-hover:scale-105" />
              <div className="absolute inset-0 bg-gold/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div className="hidden sm:block">
              <div className="text-gold font-bold text-xl tracking-wide">MVA</div>
              <div className="text-muted-foreground text-sm -mt-1">IMOBILIARE</div>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <button 
                key={item.id}
                onClick={() => scrollToSection(item.id)} 
                className="px-4 py-2 text-foreground hover:text-gold transition-all duration-300 hover:bg-gold/5 rounded-lg font-medium"
              >
                {item.name}
              </button>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden md:block">
            <a href="https://wa.me/40767941512" target="_blank" rel="noopener noreferrer">
              <Button variant="luxury" className="shadow-lg shadow-gold/20">
                WhatsApp
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
                  <button 
                    key={item.id}
                    onClick={() => scrollToSection(item.id)} 
                    className="text-left px-4 py-3 text-foreground hover:text-gold transition-colors text-lg border-b border-border/30"
                  >
                    {item.name}
                  </button>
                ))}
                <a href="https://wa.me/40767941512" target="_blank" rel="noopener noreferrer" className="mt-4">
                  <Button variant="luxury" className="w-full">
                    Contactează pe WhatsApp
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
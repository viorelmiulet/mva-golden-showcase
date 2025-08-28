import { Button } from "@/components/ui/button"
import mvaLogo from "@/assets/mva-logo.png"

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-gold/20">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <img src={mvaLogo} alt="MVA IMOBILIARE" className="h-10 w-auto" />
          <div className="text-gold font-bold text-xl">MVA IMOBILIARE</div>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#home" className="text-foreground hover:text-gold transition-colors">Acasă</a>
          <a href="#despre" className="text-foreground hover:text-gold transition-colors">Despre Noi</a>
          <a href="#servicii" className="text-foreground hover:text-gold transition-colors">Servicii</a>
          <a href="#proprietati" className="text-foreground hover:text-gold transition-colors">Proprietăți</a>
          <a href="#contact" className="text-foreground hover:text-gold transition-colors">Contact</a>
        </nav>

        <Button variant="luxury" size="lg">
          Contactează-ne
        </Button>
      </div>
    </header>
  )
}

export default Header
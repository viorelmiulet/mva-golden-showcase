import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowUp, Building, Home } from "lucide-react"

const Footer = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const quickLinks = [
    { name: 'Acasă', id: 'home' },
    { name: 'Despre Noi', id: 'despre' },
    { name: 'Servicii', id: 'servicii' },
    { name: 'Proiecte', id: 'proprietati' },
    { name: 'Contact', id: 'contact' }
  ];

  const services = [
    'Vânzare Apartamente',
    'Consultanță Investiții',
    'Evaluări Profesionale',
    'Management Proprietăți',
    'Consultanță Juridică'
  ];

  return (
    <footer className="relative bg-gradient-to-b from-background to-secondary/20 border-t border-gold/10">
      <div className="container mx-auto px-4">
        
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
              
              {/* Logo & Description */}
              <div className="lg:col-span-2">
                <div className="flex items-center space-x-4 mb-6 group cursor-pointer" onClick={scrollToTop}>
                  <div className="relative">
                    {/* Matching Footer Logo */}
                    <svg width="36" height="36" viewBox="0 0 36 36" className="transition-all duration-300 group-hover:scale-105 group-hover:rotate-1">
                      <defs>
                        <linearGradient id="footerModernGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="hsl(var(--gold))" />
                          <stop offset="50%" stopColor="hsl(var(--gold-light))" />
                          <stop offset="100%" stopColor="hsl(var(--gold))" />
                        </linearGradient>
                      </defs>
                      
                      <path 
                        d="M18 2 L32 9 L32 27 L18 34 L4 27 L4 9 Z" 
                        fill="url(#footerModernGradient)" 
                        className="opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                      
                      <path 
                        d="M12 13 L15 13 L18 20 L21 13 L24 13 L24 23 L22.5 23 L22.5 15.5 L20 21 L16 21 L13.5 15.5 L13.5 23 L12 23 Z"
                        fill="hsl(var(--background))"
                        className="drop-shadow-sm"
                      />
                      
                      <circle cx="28" cy="8" r="1" fill="hsla(var(--background), 0.6)" />
                      <circle cx="8" cy="28" r="0.8" fill="hsla(var(--background), 0.4)" />
                    </svg>
                    
                    <div className="absolute inset-0 bg-gold/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  
                  <div>
                    <div className="text-xl font-black tracking-tight bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                      MVA IMOBILIARE
                    </div>
                    <div className="text-muted-foreground/80 text-xs font-semibold tracking-[0.2em] uppercase -mt-0.5">Premium Real Estate</div>
                    <div className="w-0 group-hover:w-full h-[1.5px] bg-gradient-to-r from-gold to-gold-light mt-1 transition-all duration-500"></div>
                  </div>
                </div>
                
                <p className="text-muted-foreground leading-relaxed mb-6 max-w-md">
                  Agenția imobiliară de încredere pentru complexe rezidențiale premium în vestul Bucureștiului. 
                  Transformăm visurile tale de locuință în realitate.
                </p>
                
                <div className="flex space-x-3">
                  <a 
                    href="https://www.facebook.com/profile.php?id=61575213335398" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center hover:bg-gold/20 transition-colors group border border-gold/20 hover:border-gold/40"
                    title="Pagina noastră Facebook"
                  >
                    <svg className="w-5 h-5 text-gold group-hover:text-gold-light transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  
                  <a 
                    href="https://wa.me/40767941512" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center hover:bg-gold/20 transition-colors group border border-gold/20 hover:border-gold/40"
                    title="WhatsApp"
                  >
                    <svg className="w-5 h-5 text-gold group-hover:text-gold-light transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                  </a>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center">
                  <span className="w-2 h-2 bg-gold rounded-full mr-3"></span>
                  Navigare
                </h3>
                <ul className="space-y-3">
                  {quickLinks.map((link) => (
                    <li key={link.id}>
                      <button 
                        onClick={() => scrollToSection(link.id)} 
                        className="text-muted-foreground hover:text-gold transition-colors text-sm hover:translate-x-1 transform duration-200 block"
                      >
                        {link.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Services */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center">
                  <span className="w-2 h-2 bg-gold rounded-full mr-3"></span>
                  Servicii
                </h3>
                <ul className="space-y-3">
                  {services.map((service, index) => (
                    <li key={index}>
                      <span className="text-muted-foreground text-sm block">
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
        <div className="py-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              
              <div className="flex items-center space-x-4">
                <p className="text-muted-foreground text-sm">
                  © 2025 MVA IMOBILIARE. Toate drepturile rezervate.
                </p>
                <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20 text-xs">
                  Premium Real Estate
                </Badge>
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="flex space-x-4 text-xs">
                  <button className="text-muted-foreground hover:text-gold transition-colors">
                    Politică Confidențialitate
                  </button>
                  <button className="text-muted-foreground hover:text-gold transition-colors">
                    Termeni & Condiții
                  </button>
                </div>
                
                <button 
                  onClick={scrollToTop}
                  className="w-8 h-8 bg-gold/10 rounded-lg flex items-center justify-center hover:bg-gold/20 transition-colors group border border-gold/20 hover:border-gold/40"
                  title="Înapoi sus"
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
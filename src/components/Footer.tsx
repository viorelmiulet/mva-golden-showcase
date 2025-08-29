import mvaLogo from "@/assets/mva-logo.png"

const Footer = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-black border-t border-gold/20">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Logo & Description */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <img src={mvaLogo} alt="MVA IMOBILIARE" className="h-8 w-auto" />
                <div className="text-gold font-bold text-xl">MVA IMOBILIARE</div>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Agenția imobiliară de încredere pentru proprietăți premium în România. 
                Transformăm visurile în realitate prin servicii imobiliare de excepție.
              </p>
              <div className="flex space-x-4">
                <a 
                  href="https://www.facebook.com/profile.php?id=61575213335398" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center hover:bg-gold/30 transition-colors group"
                  title="Pagina noastră Facebook"
                >
                  <svg className="w-5 h-5 text-gold group-hover:text-gold-light transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center hover:bg-gold/30 transition-colors">
                  <span className="text-gold">in</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center hover:bg-gold/30 transition-colors">
                  <span className="text-gold">ig</span>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold text-gold mb-6">Link-uri Rapide</h3>
              <ul className="space-y-3">
                <li><button onClick={() => scrollToSection('home')} className="text-muted-foreground hover:text-gold transition-colors">Acasă</button></li>
                <li><button onClick={() => scrollToSection('despre')} className="text-muted-foreground hover:text-gold transition-colors">Despre Noi</button></li>
                <li><button onClick={() => scrollToSection('servicii')} className="text-muted-foreground hover:text-gold transition-colors">Servicii</button></li>
                <li><button onClick={() => scrollToSection('proprietati')} className="text-muted-foreground hover:text-gold transition-colors">Proprietăți</button></li>
                <li><button onClick={() => scrollToSection('contact')} className="text-muted-foreground hover:text-gold transition-colors">Contact</button></li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-lg font-semibold text-gold mb-6">Servicii</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-muted-foreground hover:text-gold transition-colors">Vânzare Proprietăți</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-gold transition-colors">Consultanță Investiții</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-gold transition-colors">Evaluări</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-gold transition-colors">Management</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-gold transition-colors">Consultanță Juridică</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gold/20 mt-12 pt-8">
            <div className="flex md:flex-row flex-col md:justify-between md:items-center gap-4">
              <p className="text-muted-foreground text-sm">
                © 2024 MVA IMOBILIARE. Toate drepturile rezervate.
              </p>
              <div className="flex space-x-6 text-sm">
                <a href="#" className="text-muted-foreground hover:text-gold transition-colors">
                  Politică de Confidențialitate
                </a>
                <a href="#" className="text-muted-foreground hover:text-gold transition-colors">
                  Termeni și Condiții
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
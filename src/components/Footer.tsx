import mvaLogo from "@/assets/mva-logo.png"

const Footer = () => {
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
                <a href="#" className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center hover:bg-gold/30 transition-colors">
                  <span className="text-gold">f</span>
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
                <li><a href="#home" className="text-muted-foreground hover:text-gold transition-colors">Acasă</a></li>
                <li><a href="#despre" className="text-muted-foreground hover:text-gold transition-colors">Despre Noi</a></li>
                <li><a href="#servicii" className="text-muted-foreground hover:text-gold transition-colors">Servicii</a></li>
                <li><a href="#proprietati" className="text-muted-foreground hover:text-gold transition-colors">Proprietăți</a></li>
                <li><a href="#contact" className="text-muted-foreground hover:text-gold transition-colors">Contact</a></li>
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
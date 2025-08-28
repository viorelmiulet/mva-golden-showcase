import { Button } from "@/components/ui/button"
import heroProperty from "@/assets/hero-property.jpg"

const Hero = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src={heroProperty} 
          alt="Luxury Property" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center md:text-left">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-foreground">Proprietăți de</span>
            <br />
            <span className="text-gold bg-gradient-to-r from-gold to-gold-light bg-clip-text text-transparent">
              Excepție
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
            Descoperă cea mai selectă colecție de proprietăți de lux din România. 
            MVA IMOBILIARE - partenerul tău de încredere în investițiile imobiliare premium.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Button variant="luxury" size="lg" className="text-lg px-8 py-6">
              Explorează Proprietățile
            </Button>
            <Button variant="luxuryOutline" size="lg" className="text-lg px-8 py-6">
              Evaluare Gratuită
            </Button>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-gold rounded-full flex justify-center">
          <div className="w-1 h-3 bg-gold rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  )
}

export default Hero
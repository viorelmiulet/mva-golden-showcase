const About = () => {
  return (
    <section id="despre" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="text-foreground">Despre </span>
              <span className="text-gold">MVA IMOBILIARE</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-gold-dark to-gold mx-auto mb-6"></div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Cu peste 15 ani de experiență în domeniul imobiliar premium, MVA IMOBILIARE 
              este liderul în tranzacțiile de proprietăți de lux din România.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-gold to-gold-dark rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl font-bold text-primary-foreground">15+</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Ani de Experiență</h3>
              <p className="text-muted-foreground">
                Peste o decadă și jumătate de expertise în piața imobiliară de lux
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-gold to-gold-dark rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl font-bold text-primary-foreground">500+</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Tranzacții Reușite</h3>
              <p className="text-muted-foreground">
                Sute de clienți mulțumiți și tranzacții finalizate cu succes
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-gold to-gold-dark rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl font-bold text-primary-foreground">€50M+</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Valoare Tranzacții</h3>
              <p className="text-muted-foreground">
                Peste 50 de milioane de euro în proprietăți comercializate
              </p>
            </div>
          </div>

          <div className="mt-16 text-center">
            <p className="text-lg text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              <strong className="text-gold">Misiunea noastră</strong> este să oferim servicii imobiliare de 
              excepție, conectând clienții cu proprietățile perfecte pentru stilul lor de viață. 
              Echipa noastră de experți vă ghidează prin fiecare etapă a procesului, asigurându-se 
              că fiecare tranzacție este o experiență de neuitat.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default About
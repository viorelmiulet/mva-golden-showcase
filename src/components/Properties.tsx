import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import renewResidence from "@/assets/renew-residence.jpg"
import eurocasaResidence from "@/assets/eurocasa-residence.jpg"
import property3 from "@/assets/property-3.jpg"

const Properties = () => {
  // UPDATED PROPERTIES - NEW VERSION
  const projectsList = [
    {
      id: 1,
      title: "RENEW RESIDENCE",
      location: "Chiajna",
      price: "€44,000 - €90,000",
      size: "32 - 65 mp",
      rooms: "1-2 camere",
      image: renewResidence,
      description: "Proiect modern cu finisaje premium și facilități contemporane în vestul capitalei."
    },
    {
      id: 2,
      title: "EUROCASA RESIDENCE", 
      location: "Chiajna",
      price: "€40,000 - €102,000",
      size: "30 - 75 mp",
      rooms: "1-3 camere",
      image: eurocasaResidence,
      description: "Proiect imobiliar de excepție, situat în vestul capitalei."
    },
    {
      id: 3,
      title: "Vila de Lux Pipera",
      location: "Pipera, Ilfov", 
      price: "€1,200,000",
      size: "350 mp",
      rooms: "6 camere",
      image: property3,
      description: "Vila individuală cu grădină privată, piscină și sistem de securitate avansat."
    }
  ]

  return (
    <section id="proprietati" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="text-foreground">Proiecte </span>
              <span className="text-gold">Recomandate</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-gold-dark to-gold mx-auto mb-6"></div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Top proiecte imobiliare
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projectsList.map((property) => (
              <Card key={property.id} className="group overflow-hidden hover:shadow-2xl transition-all duration-500 border-border/50 hover:border-gold/50 bg-card">
                <div className="aspect-video overflow-hidden">
                  <img 
                    src={property.image} 
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-foreground group-hover:text-gold transition-colors">
                      {property.title}
                    </h3>
                    <span className="text-2xl font-bold text-gold">
                      {property.price}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-muted-foreground mb-3">
                    <span className="mr-4">📍 {property.location}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm text-muted-foreground mb-4">
                    <span>📐 {property.size}</span>
                    <span>🏠 {property.rooms}</span>
                  </div>
                  
                  <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                    {property.description}
                  </p>
                  
                  <Button variant="luxuryOutline" className="w-full">
                    Vezi Detalii
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <a href="https://www.storia.ro/ro/companii/agentii/mva-imobiliare-ID4660679" target="_blank" rel="noopener noreferrer">
              <Button variant="luxury" size="lg" className="px-8">
                Vezi Toate Proprietățile
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Properties
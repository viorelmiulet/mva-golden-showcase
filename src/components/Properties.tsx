import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  MapPin, 
  Home, 
  Ruler, 
  Euro,
  ArrowRight,
  Sparkles,
  Star
} from "lucide-react"

const Properties = () => {
  const projectsList = [
    {
      id: 1,
      title: "RENEW RESIDENCE",
      location: "Chiajna",
      price: "€44,000 - €90,000",
      size: "32 - 65 mp",
      rooms: "1-2 camere",
      image: "/lovable-uploads/7e4ce4f4-4a39-4844-be2f-f0cbfeedb2dd.png",
      description: "Proiect modern cu finisaje premium și facilități contemporane în vestul capitalei.",
      highlight: true,
      features: ["Finisaje Premium", "Spații Verzi"],
      category: "noi",
      status: "disponibil"
    },
    {
      id: 2,
      title: "EUROCASA RESIDENCE", 
      location: "Chiajna",
      price: "€40,000 - €102,000",
      size: "30 - 75 mp",
      rooms: "1-3 camere",
      image: "/lovable-uploads/8fc1d07f-c6c0-4e93-86ad-c6a6485cbfbc.png",
      description: "Proiect imobiliar de excepție, situat în vestul capitalei.",
      highlight: false,
      features: ["Design Modern", "Sistem Securitate", "Zonă Comercială"],
      category: "noi",
      status: "disponibil"
    },
    {
      id: 3,
      title: "CITY MILITARI",
      location: "Militari",
      price: "€45,000 - €100,000",
      size: "32 - 55 mp",
      rooms: "1-2 camere",
      image: "/lovable-uploads/604055e3-2ca9-4f0d-a745-ca3dcff103c0.png",
      description: "Complex rezidențial modern în zona Militari, cu apartamente compacte și funcționale.",
      highlight: false,
      features: ["Locuințe Moderne", "Acces Rapid", "Parcare"],
      category: "noi",
      status: "disponibil"
    }
  ]

  const allProjects = projectsList
  const newProjects = projectsList.filter(p => p.category === "noi")
  const availableProjects = projectsList.filter(p => p.status === "disponibil")

  // Structured Data for Properties
  const propertiesStructuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": projectsList.map((property, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Residence",
        "name": property.title,
        "description": property.description,
        "image": `https://mva-imobiliare.lovable.app${property.image}`,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": property.location,
          "addressCountry": "RO"
        },
        "offers": {
          "@type": "Offer",
          "priceCurrency": "EUR",
          "price": property.price.split(' - ')[0].replace('€', '').replace(',', ''),
          "seller": {
            "@type": "RealEstateAgent",
            "name": "MVA Imobiliare"
          }
        },
        "floorSize": {
          "@type": "QuantitativeValue",
          "value": property.size
        },
        "numberOfRooms": property.rooms
      }
    }))
  }

  const renderProjects = (projects: typeof projectsList) => (
    <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 lg:gap-8 xl:gap-12">
      {projects.map((property) => (
        <Card 
          key={property.id} 
          className={`group relative overflow-hidden transition-all duration-500 hover:shadow-2xl ${
            property.highlight 
              ? 'border-gold/30 bg-gradient-to-br from-gold/5 to-gold-dark/5' 
              : 'border-border/30 bg-card/50'
          } backdrop-blur-sm hover:border-gold/50 touch-manipulation`}
        >
          {property.highlight && (
            <div className="absolute top-3 sm:top-4 lg:top-6 left-3 sm:left-4 lg:left-6 z-10">
              <Badge className="bg-gold text-primary-foreground shadow-lg text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                Recomandat
              </Badge>
            </div>
          )}
          
          {/* Image */}
          <div className="relative aspect-video overflow-hidden">
            <img 
              src={property.image} 
              alt={`${property.title} - Apartamente premium în ${property.location}, ${property.size}, ${property.rooms}`}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Price Badge */}
            <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 bg-background/90 backdrop-blur-sm rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 border border-gold/20">
              <div className="flex items-center text-gold font-bold">
                <Euro className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="text-xs sm:text-sm">{property.price.split(' - ')[0]} +</span>
              </div>
            </div>
          </div>

          <CardContent className="p-4 sm:p-6 lg:p-8 space-y-3 sm:space-y-4 lg:space-y-6">
            
            {/* Title & Location */}
            <div className="space-y-2 sm:space-y-3">
            <h2 className={`text-lg sm:text-xl lg:text-2xl font-bold leading-tight ${
              property.highlight ? 'text-gold' : 'text-foreground'
            } group-hover:text-gold transition-colors`}>
              {property.title}
            </h2>
              
              <div className="flex items-center text-muted-foreground">
                <MapPin className="w-4 h-4 mr-2 text-gold" />
                <span className="font-medium text-sm sm:text-base">{property.location}</span>
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
              <div className="text-center p-2 sm:p-3 rounded-lg hover:bg-gold/5 transition-colors">
                <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-1 sm:mb-2">
                  <Euro className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-gold" />
                </div>
                <div className="text-xs text-muted-foreground">Preț</div>
                <div className="text-xs sm:text-sm font-semibold text-foreground leading-tight">{property.price}</div>
              </div>
              
              <div className="text-center p-2 sm:p-3 rounded-lg hover:bg-gold/5 transition-colors">
                <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-1 sm:mb-2">
                  <Ruler className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-gold" />
                </div>
                <div className="text-xs text-muted-foreground">Suprafață</div>
                <div className="text-xs sm:text-sm font-semibold text-foreground">{property.size}</div>
              </div>
              
              <div className="text-center p-2 sm:p-3 rounded-lg hover:bg-gold/5 transition-colors">
                <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-1 sm:mb-2">
                  <Home className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-gold" />
                </div>
                <div className="text-xs text-muted-foreground">Camere</div>
                <div className="text-xs sm:text-sm font-semibold text-foreground">{property.rooms}</div>
              </div>
            </div>
            
            {/* Description */}
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {property.description}
            </p>
            
            {/* Features */}
            <div className="flex flex-wrap gap-2">
              {property.features.map((feature, index) => (
                <Badge key={index} variant="secondary" className="bg-gold/10 text-gold border-gold/20 text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
            
            {/* CTA Button */}
            {property.title === "RENEW RESIDENCE" ? (
              <a href="https://renewresidence.ro/" target="_blank" rel="noopener noreferrer">
                <Button 
                  variant={property.highlight ? "luxury" : "luxuryOutline"} 
                  className="w-full group h-10 sm:h-11 text-sm sm:text-base"
                >
                  Vezi Detalii Complete
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
            ) : (
              <Button 
                variant={property.highlight ? "luxury" : "luxuryOutline"} 
                className="w-full group h-10 sm:h-11 text-sm sm:text-base"
              >
                Vezi Detalii Complete
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <section id="proprietati" className="py-12 sm:py-16 lg:py-24 bg-gradient-to-b from-background to-secondary/20">
      {/* Structured Data */}
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(propertiesStructuredData) }}
      />
      
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <header className="text-center mb-12 sm:mb-16 lg:mb-20">
            <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20 mb-4 sm:mb-6 text-xs sm:text-sm">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Proiecte Exclusive
            </Badge>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 lg:mb-8">
              <span className="text-foreground">Proprietăți </span>
              <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                Premium
              </span>
            </h1>
            
            <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
              Descoperă cele 3 proiecte disponibile din vestul Bucureștiului, 
              cu apartamente moderne și facilități premium.
            </p>
            
            {/* See All Apartments CTA */}
            <div className="mt-6 sm:mt-8">
              <Button 
                variant="luxuryOutline" 
                size="lg" 
                className="group h-11 sm:h-12 lg:h-14 px-6 sm:px-8 text-sm sm:text-base"
                onClick={() => {
                  window.open('https://wa.me/40767941512?text=Salut!%20Sunt%20interesat%20de%20apartamente%20in%20complexele%20voastre%20din%20Chiajna.%20Imi%20puteti%20oferi%20mai%20multe%20detalii%3F', '_blank');
                }}
              >
                Contactează-ne acum
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </header>

          {/* Properties Tabs */}
          <div className="mb-12 sm:mb-16">
            <Tabs defaultValue="toate" className="w-full">
              <TabsList className="grid w-full grid-cols-3 max-w-xs sm:max-w-md mx-auto mb-6 sm:mb-8 lg:mb-12 bg-background/50 backdrop-blur-sm border border-gold/20 h-auto p-1">
                <TabsTrigger 
                  value="toate" 
                  className="data-[state=active]:bg-gold data-[state=active]:text-primary-foreground text-xs sm:text-sm py-2 sm:py-2.5 px-2 sm:px-3 touch-manipulation"
                >
                  Toate
                </TabsTrigger>
                <TabsTrigger 
                  value="disponibile"
                  className="data-[state=active]:bg-gold data-[state=active]:text-primary-foreground text-xs sm:text-sm py-2 sm:py-2.5 px-2 sm:px-3 touch-manipulation"
                >
                  Disponibile
                </TabsTrigger>
                <TabsTrigger 
                  value="catalog"
                  className="data-[state=active]:bg-gold data-[state=active]:text-primary-foreground text-xs sm:text-sm py-2 sm:py-2.5 px-2 sm:px-3 cursor-pointer touch-manipulation"
                  onClick={() => window.open('https://wa.me/40767941512', '_blank')}
                >
                  Catalog
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="toate" className="mt-0">
                {renderProjects(allProjects)}
              </TabsContent>
              
              <TabsContent value="disponibile" className="mt-0">
                {renderProjects(availableProjects)}
              </TabsContent>
            </Tabs>
          </div>

          {/* CTA Section */}
          <footer className="text-center">
            <div className="bg-gradient-to-r from-gold/10 via-gold/5 to-gold/10 rounded-xl lg:rounded-2xl p-6 sm:p-8 border border-gold/20 max-w-4xl mx-auto">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-3 sm:mb-4">
                Explorează Toate Apartamentele Disponibile
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 leading-relaxed px-4 sm:px-0">
                Explorează catalogul nostru complet pentru a vedea toate opțiunile 
                disponibile, planuri detaliate și programarea vizitelor.
              </p>
              <a href="https://imobiliaremilitari.storia.ro" target="_blank" rel="noopener noreferrer">
                <Button variant="luxury" size="lg" className="group px-6 sm:px-8 h-11 sm:h-12 lg:h-14 text-sm sm:text-base">
                  Vezi toate proprietățile
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
            </div>
          </footer>
        </div>
      </div>
    </section>
  )
}

export default Properties
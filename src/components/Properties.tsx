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
      features: ["Finisaje Premium", "Parcare Subterană", "Spații Verzi"],
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
    }
  ]

  const allProjects = projectsList
  const newProjects = projectsList.filter(p => p.category === "noi")
  const availableProjects = projectsList.filter(p => p.status === "disponibil")

  const renderProjects = (projects: typeof projectsList) => (
    <div className="grid lg:grid-cols-2 gap-12">
      {projects.map((property) => (
        <Card 
          key={property.id} 
          className={`group relative overflow-hidden transition-all duration-500 hover:shadow-2xl ${
            property.highlight 
              ? 'border-gold/30 bg-gradient-to-br from-gold/5 to-gold-dark/5' 
              : 'border-border/30 bg-card/50'
          } backdrop-blur-sm hover:border-gold/50`}
        >
          {property.highlight && (
            <div className="absolute top-6 left-6 z-10">
              <Badge className="bg-gold text-primary-foreground shadow-lg">
                <Sparkles className="w-3 h-3 mr-1" />
                Recomandat
              </Badge>
            </div>
          )}
          
          {/* Image */}
          <div className="relative aspect-video overflow-hidden">
            <img 
              src={property.image} 
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Price Badge */}
            <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-gold/20">
              <div className="flex items-center text-gold font-bold">
                <Euro className="w-4 h-4 mr-1" />
                <span className="text-sm">{property.price.split(' - ')[0]} +</span>
              </div>
            </div>
          </div>

          <CardContent className="p-8 space-y-6">
            
            {/* Title & Location */}
            <div className="space-y-3">
              <h3 className={`text-2xl font-bold leading-tight ${
                property.highlight ? 'text-gold' : 'text-foreground'
              } group-hover:text-gold transition-colors`}>
                {property.title}
              </h3>
              
              <div className="flex items-center text-muted-foreground">
                <MapPin className="w-4 h-4 mr-2 text-gold" />
                <span className="font-medium">{property.location}</span>
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Euro className="w-5 h-5 text-gold" />
                </div>
                <div className="text-sm text-muted-foreground">Preț</div>
                <div className="text-sm font-semibold text-foreground">{property.price}</div>
              </div>
              
              <div className="text-center">
                <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Ruler className="w-5 h-5 text-gold" />
                </div>
                <div className="text-sm text-muted-foreground">Suprafață</div>
                <div className="text-sm font-semibold text-foreground">{property.size}</div>
              </div>
              
              <div className="text-center">
                <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Home className="w-5 h-5 text-gold" />
                </div>
                <div className="text-sm text-muted-foreground">Camere</div>
                <div className="text-sm font-semibold text-foreground">{property.rooms}</div>
              </div>
            </div>
            
            {/* Description */}
            <p className="text-muted-foreground leading-relaxed">
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
            <Button 
              variant={property.highlight ? "luxury" : "luxuryOutline"} 
              className="w-full group"
            >
              Vezi Detalii Complete
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <section id="proprietati" className="py-24 bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-20">
            <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20 mb-6">
              <Star className="w-4 h-4 mr-2" />
              Proiecte Exclusive
            </Badge>
            
            <h2 className="text-5xl md:text-6xl font-bold mb-8">
              <span className="text-foreground">Complexe </span>
              <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                Rezidențiale
              </span>
            </h2>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Descoperă cele mai selective complexe rezidențiale din vestul Bucureștiului, 
              cu apartamente moderne și facilități premium.
            </p>
          </div>

          {/* Properties Tabs */}
          <div className="mb-16">
            <Tabs defaultValue="toate" className="w-full">
              <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-12 bg-background/50 backdrop-blur-sm border border-gold/20">
                <TabsTrigger 
                  value="toate" 
                  className="data-[state=active]:bg-gold data-[state=active]:text-primary-foreground"
                >
                  Toate Proiectele
                </TabsTrigger>
                <TabsTrigger 
                  value="noi"
                  className="data-[state=active]:bg-gold data-[state=active]:text-primary-foreground"
                >
                  Proiecte Noi
                </TabsTrigger>
                <TabsTrigger 
                  value="disponibile"
                  className="data-[state=active]:bg-gold data-[state=active]:text-primary-foreground"
                >
                  Disponibile
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="toate" className="mt-0">
                {renderProjects(allProjects)}
              </TabsContent>
              
              <TabsContent value="noi" className="mt-0">
                {renderProjects(newProjects)}
              </TabsContent>
              
              <TabsContent value="disponibile" className="mt-0">
                {renderProjects(availableProjects)}
              </TabsContent>
            </Tabs>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-gold/10 via-gold/5 to-gold/10 rounded-2xl p-8 border border-gold/20 max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Explorează Toate Apartamentele Disponibile
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Vizitează profilul nostru complet pe Storia.ro pentru a vedea toate opțiunile 
                disponibile, planuri detaliate și programarea vizitelor.
              </p>
              <a href="https://www.storia.ro/ro/companii/agentii/mva-imobiliare-ID4660679" target="_blank" rel="noopener noreferrer">
                <Button variant="luxury" size="lg" className="group px-8">
                  Toate Proprietățile pe Storia
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Properties
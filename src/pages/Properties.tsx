import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { 
  Plus, 
  Search, 
  MapPin, 
  Euro, 
  Home, 
  Ruler,
  Loader2,
  ExternalLink,
  Trash2
} from "lucide-react"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { useQuery, useQueryClient } from "@tanstack/react-query"

interface ScrapedProperty {
  title: string
  description: string
  location: string
  images: string[]
  price_min: number
  price_max: number
  surface_min?: number
  surface_max?: number
  rooms: number
  features: string[]
}

const Properties = () => {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch existing properties
  const { data: properties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ['catalog_offers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog_offers')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    }
  })

  const scrapeProperty = async () => {
    if (!url) {
      toast({
        title: "Eroare",
        description: "Te rog să introduci un link valid",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      // Call edge function to scrape the URL
      const { data, error } = await supabase.functions.invoke('scrape-property', {
        body: { url }
      })

      if (error) throw error

      if (data.success) {
        // Add the scraped property to database
        const { error: insertError } = await supabase
          .from('catalog_offers')
          .insert({
            title: data.property.title,
            description: data.property.description,
            location: data.property.location,
            images: data.property.images,
            price_min: data.property.price_min,
            price_max: data.property.price_max,
            surface_min: data.property.surface_min,
            surface_max: data.property.surface_max,
            rooms: data.property.rooms,
            features: data.property.features,
            availability_status: 'available'
          })

        if (insertError) throw insertError

        toast({
          title: "Succes!",
          description: "Proprietatea a fost adăugată cu succes"
        })

        // Refresh the properties list
        queryClient.invalidateQueries({ queryKey: ['catalog_offers'] })
        setUrl("")
      } else {
        throw new Error(data.error || "Eroare la preluarea datelor")
      }
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message || "Nu am putut prelua datele din link",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const deleteProperty = async (id: string) => {
    try {
      const { error } = await supabase
        .from('catalog_offers')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Succes!",
        description: "Proprietatea a fost ștearsă"
      })

      queryClient.invalidateQueries({ queryKey: ['catalog_offers'] })
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: "Nu am putut șterge proprietatea",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="text-foreground">Gestionare </span>
                <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                  Proprietăți
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Adaugă proprietăți noi prin preluarea automată a datelor din linkuri
              </p>
            </div>

            <Tabs defaultValue="add" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
                <TabsTrigger value="add">Adaugă Proprietate</TabsTrigger>
                <TabsTrigger value="manage">Gestionează ({properties.length})</TabsTrigger>
              </TabsList>

              {/* Add Property Tab */}
              <TabsContent value="add">
                <Card className="max-w-2xl mx-auto">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="w-5 h-5 text-gold" />
                      Adaugă Proprietate Nouă
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Link către proprietate</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="https://www.imobiliare.ro/vanzare-apartamente/..."
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          className="flex-1"
                        />
                        <Button 
                          onClick={scrapeProperty}
                          disabled={isLoading || !url}
                          className="min-w-[100px]"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Preiau...
                            </>
                          ) : (
                            <>
                              <Search className="w-4 h-4 mr-2" />
                              Preia Date
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Introdu linkul către o proprietate pentru a prelua automat imaginile, descrierea și detaliile
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Manage Properties Tab */}
              <TabsContent value="manage">
                {isLoadingProperties ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-gold" />
                  </div>
                ) : properties.length === 0 ? (
                  <Card className="max-w-2xl mx-auto">
                    <CardContent className="py-12 text-center">
                      <Home className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Nu există proprietăți</h3>
                      <p className="text-muted-foreground">Adaugă prima proprietate pentru a începe</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid lg:grid-cols-2 gap-6">
                    {properties.map((property) => (
                      <Card key={property.id} className="group">
                        <CardContent className="p-6">
                          {/* Images */}
                          {property.images && Array.isArray(property.images) && property.images.length > 0 && (
                            <div className="aspect-video mb-4 overflow-hidden rounded-lg">
                              <img 
                                src={(property.images as string[])[0]} 
                                alt={property.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}
                          
                          {/* Title & Location */}
                          <div className="space-y-2 mb-4">
                            <h3 className="text-xl font-bold text-foreground group-hover:text-gold transition-colors">
                              {property.title}
                            </h3>
                            {property.location && (
                              <div className="flex items-center text-muted-foreground">
                                <MapPin className="w-4 h-4 mr-2 text-gold" />
                                <span>{property.location}</span>
                              </div>
                            )}
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="text-center">
                              <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                                <Euro className="w-5 h-5 text-gold" />
                              </div>
                              <div className="text-xs text-muted-foreground">Preț</div>
                              <div className="text-sm font-semibold">
                                €{property.price_min?.toLocaleString()}
                                {property.price_max && property.price_max !== property.price_min && 
                                  ` - €${property.price_max.toLocaleString()}`
                                }
                              </div>
                            </div>

                            {(property.surface_min || property.surface_max) && (
                              <div className="text-center">
                                <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                                  <Ruler className="w-5 h-5 text-gold" />
                                </div>
                                <div className="text-xs text-muted-foreground">Suprafață</div>
                                <div className="text-sm font-semibold">
                                  {property.surface_min}
                                  {property.surface_max && property.surface_max !== property.surface_min && 
                                    ` - ${property.surface_max}`
                                  } mp
                                </div>
                              </div>
                            )}

                            <div className="text-center">
                              <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                                <Home className="w-5 h-5 text-gold" />
                              </div>
                              <div className="text-xs text-muted-foreground">Camere</div>
                              <div className="text-sm font-semibold">{property.rooms}</div>
                            </div>
                          </div>

                          {/* Description */}
                          {property.description && (
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                              {property.description}
                            </p>
                          )}

                          {/* Features */}
                          {property.features && Array.isArray(property.features) && property.features.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {(property.features as string[]).slice(0, 3).map((feature, index) => (
                                <Badge key={index} variant="secondary" className="bg-gold/10 text-gold border-gold/20 text-xs">
                                  {feature}
                                </Badge>
                              ))}
                              {(property.features as string[]).length > 3 && (
                                <Badge variant="secondary" className="bg-muted text-muted-foreground text-xs">
                                  +{(property.features as string[]).length - 3} mai multe
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2">
                            {property.storia_link && (
                              <Button variant="outline" size="sm" asChild className="flex-1">
                                <a href={property.storia_link} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  Vezi Original
                                </a>
                              </Button>
                            )}
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => deleteProperty(property.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default Properties
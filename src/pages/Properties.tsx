import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { 
  MapPin, 
  Euro, 
  Home, 
  Ruler,
  Loader2,
  ExternalLink,
  Images,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"

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
  const [selectedProperty, setSelectedProperty] = useState<any>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
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


  const openPropertyGallery = (property: any) => {
    setSelectedProperty(property)
    setCurrentImageIndex(0)
  }

  const closeGallery = () => {
    setSelectedProperty(null)
    setCurrentImageIndex(0)
  }

  const nextImage = () => {
    if (selectedProperty && selectedProperty.images) {
      setCurrentImageIndex((prev) => 
        prev + 1 >= selectedProperty.images.length ? 0 : prev + 1
      )
    }
  }

  const prevImage = () => {
    if (selectedProperty && selectedProperty.images) {
      setCurrentImageIndex((prev) => 
        prev - 1 < 0 ? selectedProperty.images.length - 1 : prev - 1
      )
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
                <span className="text-foreground">Catalog </span>
                <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                  Proprietăți
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Descoperă proprietățile noastre disponibile pentru vânzare
              </p>
            </div>

            {/* Properties List */}
            {isLoadingProperties ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gold" />
              </div>
            ) : properties.length === 0 ? (
              <Card className="max-w-2xl mx-auto">
                <CardContent className="py-12 text-center">
                  <Home className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nu există proprietăți</h3>
                  <p className="text-muted-foreground">Proprietățile vor apărea aici după ce sunt adăugate</p>
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
                            {property.images && Array.isArray(property.images) && property.images.length > 0 && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => openPropertyGallery(property)}
                                className="flex-1"
                              >
                                <Images className="w-4 h-4 mr-2" />
                                Vezi Poze ({(property.images as string[]).length})
                              </Button>
                            )}
                            {property.storia_link && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={property.storia_link} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  Original
                                </a>
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
            )}
          </div>
        </div>
      </main>

      {/* Image Gallery Modal */}
      <Dialog open={!!selectedProperty} onOpenChange={closeGallery}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedProperty?.title}</span>
              <Button variant="ghost" size="sm" onClick={closeGallery}>
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {selectedProperty && selectedProperty.images && (
            <div className="relative">
              {/* Main Image */}
              <div className="relative aspect-video bg-muted">
                <img
                  src={(selectedProperty.images as string[])[currentImageIndex]}
                  alt={`${selectedProperty.title} - Imagine ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Navigation Buttons */}
                {(selectedProperty.images as string[]).length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                      onClick={nextImage}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </>
                )}
                
                {/* Image Counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {(selectedProperty.images as string[]).length}
                </div>
              </div>
              
              {/* Thumbnail Navigation */}
              {(selectedProperty.images as string[]).length > 1 && (
                <div className="p-4">
                  <div className="flex gap-2 overflow-x-auto">
                    {(selectedProperty.images as string[]).map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                          index === currentImageIndex 
                            ? 'border-primary' 
                            : 'border-transparent hover:border-muted-foreground'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Property Info */}
              <div className="p-6 pt-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gold">€{selectedProperty.price_min?.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Preț</div>
                  </div>
                  {selectedProperty.surface_min && (
                    <div>
                      <div className="text-2xl font-bold">{selectedProperty.surface_min} mp</div>
                      <div className="text-sm text-muted-foreground">Suprafață</div>
                    </div>
                  )}
                  <div>
                    <div className="text-2xl font-bold">{selectedProperty.rooms}</div>
                    <div className="text-sm text-muted-foreground">Camere</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gold">{(selectedProperty.images as string[]).length}</div>
                    <div className="text-sm text-muted-foreground">Poze</div>
                  </div>
                </div>
                
                {selectedProperty.location && (
                  <div className="mt-4 flex items-center text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-2 text-gold" />
                    <span>{selectedProperty.location}</span>
                  </div>
                )}
                
                {selectedProperty.storia_link && (
                  <div className="mt-4">
                    <Button asChild className="w-full">
                      <a href={selectedProperty.storia_link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Vezi Anunțul Original
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}

export default Properties
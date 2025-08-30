import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { 
  Plus, 
  Search, 
  Loader2,
  ArrowLeft,
  Trash2,
  Home,
  AlertTriangle,
  MapPin,
  Euro,
  Ruler,
  Images,
  ExternalLink
} from "lucide-react"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { Link } from "react-router-dom"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

const Admin = () => {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch properties
  const { data: properties, isLoading: propertiesLoading } = useQuery({
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
    setDeletingId(id)
    try {
      const { error } = await supabase
        .from('catalog_offers')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Succes!",
        description: "Proprietatea a fost ștearsă cu succes"
      })

      // Refresh the properties list
      queryClient.invalidateQueries({ queryKey: ['catalog_offers'] })
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message || "Nu am putut șterge proprietatea",
        variant: "destructive"
      })
    } finally {
      setDeletingId(null)
    }
  }

  const refreshAllProperties = async () => {
    setIsRefreshing(true)
    try {
      // Get all properties that have storia_link
      const { data: existingProperties, error: fetchError } = await supabase
        .from('catalog_offers')
        .select('id, storia_link, title')
        .not('storia_link', 'is', null)

      if (fetchError) throw fetchError

      if (!existingProperties || existingProperties.length === 0) {
        toast({
          title: "Info",
          description: "Nu există proprietăți cu link-uri pentru actualizare"
        })
        return
      }

      let successCount = 0
      let errorCount = 0

      // Process each property
      for (const property of existingProperties) {
        try {
          // Call edge function to scrape the updated data
          const { data, error } = await supabase.functions.invoke('scrape-property', {
            body: { url: property.storia_link }
          })

          if (error) {
            console.error(`Error scraping ${property.title}:`, error)
            errorCount++
            continue
          }

          if (data.success) {
            // Update the existing property with new data
            const { error: updateError } = await supabase
              .from('catalog_offers')
              .update({
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
                updated_at: new Date().toISOString()
              })
              .eq('id', property.id)

            if (updateError) {
              console.error(`Error updating ${property.title}:`, updateError)
              errorCount++
            } else {
              successCount++
            }
          } else {
            console.error(`Failed to scrape ${property.title}:`, data.error)
            errorCount++
          }
        } catch (error) {
          console.error(`Error processing ${property.title}:`, error)
          errorCount++
        }

        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      toast({
        title: "Actualizare completă!",
        description: `${successCount} proprietăți actualizate cu succes${errorCount > 0 ? `, ${errorCount} erori` : ''}`
      })

      // Refresh the properties list
      queryClient.invalidateQueries({ queryKey: ['catalog_offers'] })

    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message || "Nu am putut actualiza proprietățile",
        variant: "destructive"
      })
    } finally {
      setIsRefreshing(false)
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
              <div className="flex items-center justify-center mb-6">
                <Link 
                  to="/" 
                  className="flex items-center text-muted-foreground hover:text-foreground transition-colors mr-4"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Înapoi Acasă
                </Link>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="text-foreground">Administrare </span>
                <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                  Proprietăți
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Adaugă, gestionează și șterge proprietățile din catalog
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              
              {/* Add Property Section */}
              <Card>
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
                        className="min-w-[120px]"
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

                  {/* Tips Section */}
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">💡 Site-uri compatibile:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• imobiliare.ro - Anunțuri de apartamente și case</li>
                      <li>• olx.ro - Proprietăți rezidențiale</li>
                      <li>• storia.ro - Oferte imobiliare</li>
                    </ul>
                  </div>

                  {/* Refresh All Properties */}
                  <div className="border-t pt-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-gold">🔄 Actualizare în Masă</h4>
                      <p className="text-sm text-muted-foreground">
                        Reimportă toate proprietățile existente cu descrieri și date complete actualizate
                      </p>
                      <Button 
                        onClick={refreshAllProperties}
                        disabled={isRefreshing}
                        variant="outline"
                        className="w-full border-gold text-gold hover:bg-gold/10"
                      >
                        {isRefreshing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Actualizez toate proprietățile...
                          </>
                        ) : (
                          <>
                            <Search className="w-4 h-4 mr-2" />
                            Reimportă Toate Proprietățile
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Manage Properties Section */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="w-5 h-5 text-gold" />
                      Proprietăți Existente ({properties?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {propertiesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    ) : !properties || properties.length === 0 ? (
                      <div className="text-center py-8">
                        <Home className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Nu există proprietăți adăugate</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        <p className="text-sm text-muted-foreground mb-4">
                          Scroll pentru a vedea toate proprietățile în detaliu mai jos
                        </p>
                        {properties.slice(0, 5).map((property) => (
                          <div 
                            key={property.id} 
                            className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate text-sm">{property.title}</h4>
                              <p className="text-xs text-muted-foreground truncate">{property.location}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span>{property.rooms} camere</span>
                                <span>€{property.price_min.toLocaleString()}</span>
                              </div>
                            </div>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  disabled={deletingId === property.id}
                                >
                                  {deletingId === property.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-destructive" />
                                    Confirmi ștergerea?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Ești sigur că vrei să ștergi proprietatea "{property.title}"? 
                                    Această acțiune nu poate fi anulată.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Anulează</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteProperty(property.id)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Șterge Proprietatea
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        ))}
                        {properties.length > 5 && (
                          <p className="text-xs text-muted-foreground text-center pt-2 border-t">
                            +{properties.length - 5} proprietăți în plus - vezi mai jos
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Detailed Properties Grid */}
            {!propertiesLoading && properties && properties.length > 0 && (
              <div className="mt-12">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">Toate Proprietățile</h2>
                  <p className="text-muted-foreground">Vizualizare detaliată cu opțiuni de gestionare</p>
                </div>
                
                <div className="grid lg:grid-cols-2 gap-6">
                  {properties.map((property) => (
                    <Card key={property.id} className="group relative">
                      {/* Delete Button - Top Right Corner */}
                      <div className="absolute top-4 right-4 z-10">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="shadow-lg opacity-80 hover:opacity-100 transition-opacity"
                              disabled={deletingId === property.id}
                            >
                              {deletingId === property.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-destructive" />
                                Confirmi ștergerea?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Ești sigur că vrei să ștergi proprietatea "{property.title}"? 
                                Această acțiune nu poate fi anulată.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Anulează</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteProperty(property.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Șterge Proprietatea
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>

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
                            <Button variant="outline" size="sm" className="flex-1">
                              <Images className="w-4 h-4 mr-2" />
                              {(property.images as string[]).length} Poze
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
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default Admin
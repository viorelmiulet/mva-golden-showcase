import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  AlertTriangle
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
                      {properties.map((property) => (
                        <div 
                          key={property.id} 
                          className="flex items-center justify-between p-4 border rounded-lg bg-card"
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{property.title}</h4>
                            <p className="text-sm text-muted-foreground truncate">{property.location}</p>
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
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
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default Admin
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
  ExternalLink,
  Edit,
  Save,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle,
  Upload,
  FileText,
  Download,
  BarChart3
} from "lucide-react"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { Link } from "react-router-dom"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import XmlImportManager from "@/components/XmlImportManager"
import BusinessCardGenerator from "@/components/BusinessCardGenerator"
import ProjectsAdmin from "@/components/ProjectsAdmin"
import { FacebookContentGenerator } from "@/components/FacebookContentGenerator";
import { FurnishedImageGenerator } from "@/components/FurnishedImageGenerator";
import RenewApartmentsImporter from "@/components/RenewApartmentsImporter";
import { ExcelApartmentImporter } from "@/components/ExcelApartmentImporter";
import { ApartmentStatusManager } from "@/components/ApartmentStatusManager";


const Admin = () => {
  const [propertyIds, setPropertyIds] = useState(Array(5).fill(""))
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStates, setLoadingStates] = useState(Array(5).fill(false))
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingProperty, setEditingProperty] = useState<any>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [isUpdating, setIsUpdating] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Check if user is already authenticated on component mount
  useEffect(() => {
    const isAuth = localStorage.getItem('admin_authenticated') === 'true'
    setIsAuthenticated(isAuth)
  }, [])

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === '123456') {
      setIsAuthenticated(true)
      localStorage.setItem('admin_authenticated', 'true')
      toast({
        title: "Acces autorizat",
        description: "Bine ai venit în panoul de administrare!"
      })
    } else {
      toast({
        title: "Parolă incorectă",
        description: "Te rog să introduci parola corectă",
        variant: "destructive"
      })
    }
    setPassword("")
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('admin_authenticated')
    toast({
      title: "Deconectat",
      description: "Ai fost deconectat cu succes"
    })
  }

  const scrapeProperty = async (propertyId: string, index: number) => {
    if (!propertyId.trim()) {
      toast({
        title: "Eroare",
        description: "Te rog să introduci un ID valid",
        variant: "destructive"
      })
      return
    }

    // Construct the full URL
    const url = `https://web.immoflux.ro/publicproperty/p${propertyId.trim()}`

    console.log(`[ADMIN DEBUG] Incepem scraping pentru ID: ${propertyId}`)
    console.log(`[ADMIN DEBUG] URL construit: ${url}`)

    // Update loading state for this specific property ID
    setLoadingStates(prev => prev.map((state, i) => i === index ? true : state))
    
    try {
      // Call edge function to scrape the URL
      console.log(`[ADMIN DEBUG] Apelam edge function scrape-property cu URL: ${url}`)
      const { data, error } = await supabase.functions.invoke('scrape-property', {
        body: { url }
      })

      console.log(`[ADMIN DEBUG] Raspuns edge function:`, { data, error })

      if (error) {
        console.error(`[ADMIN DEBUG] Eroare edge function:`, error)
        throw error
      }

      if (data?.success) {
        console.log(`[ADMIN DEBUG] Datele primite de la scraper:`, data.property)
        
        // Add the scraped property to database
        const insertData = {
          title: data.property.title,
          description: data.property.description,
          location: data.property.location,
          images: data.property.images,
          price_min: data.property.price_min,
          price_max: data.property.price_max,
          currency: data.property.currency,
          surface_min: data.property.surface_min || 0,
          surface_max: data.property.surface_max || 0,
          rooms: data.property.rooms,
          features: data.property.features,
          availability_status: 'available'
        }
        
        console.log(`[ADMIN DEBUG] Inserez in baza de date:`, insertData)
        
        console.log(`[ADMIN DEBUG] Inserez prin edge function admin-offers:`, insertData)
        const { data: adminInsertData, error: adminInsertError } = await supabase.functions.invoke('admin-offers', {
          body: { action: 'insert_offer', offer: insertData }
        })

        console.log(`[ADMIN DEBUG] Raspuns admin-offers insert:`, { adminInsertData, adminInsertError })

        if (adminInsertError) {
          console.error(`[ADMIN DEBUG] Eroare admin-offers insert:`, adminInsertError)
          throw adminInsertError
        }

        if (!adminInsertData?.success) {
          console.error(`[ADMIN DEBUG] admin-offers a returnat success=false:`, adminInsertData)
          throw new Error(adminInsertData?.error || 'Insert failed in admin-offers')
        }

        console.log(`[ADMIN DEBUG] Inserare reusita!`)

        toast({
          title: "Succes!",
          description: `Proprietatea ${index + 1} (ID: ${propertyId}) a fost adăugată cu succes`
        })

        // Clear this property ID
        setPropertyIds(prev => prev.map((id, i) => i === index ? "" : id))
      } else {
        console.error(`[ADMIN DEBUG] Edge function returneaza success: false`, data)
        throw new Error(data?.error || "Eroare la preluarea datelor")
      }
    } catch (error: any) {
      console.error(`[ADMIN DEBUG] Eroare generala:`, error)
      toast({
        title: "Eroare",
        description: `ID ${propertyId}: ${error.message || "Nu am putut prelua datele"}`,
        variant: "destructive"
      })
    } finally {
      setLoadingStates(prev => prev.map((state, i) => i === index ? false : state))
    }
  }

  const scrapeAllProperties = async () => {
    console.log('[ADMIN DEBUG] Functia scrapeAllProperties a fost apelata!')
    console.log('[ADMIN DEBUG] Property IDs curente:', propertyIds)
    
    const validIds = propertyIds.filter(id => id.trim() !== "")
    console.log('[ADMIN DEBUG] Valid IDs filtrate:', validIds)
    
    if (validIds.length === 0) {
      console.log('[ADMIN DEBUG] Niciun ID valid gasit')
      toast({
        title: "Eroare",
        description: "Te rog să introduci cel puțin un ID valid",
        variant: "destructive"
      })
      return
    }

    console.log('[ADMIN DEBUG] Setez loading state la true')
    setIsLoading(true)
    
    try {
      console.log('[ADMIN DEBUG] Incepem procesarea proprietatilor')
      
      // Process all property IDs in parallel
      const promises = propertyIds.map((propertyId, index) => {
        if (propertyId.trim() !== "") {
          console.log(`[ADMIN DEBUG] Adaug promisiune pentru ID ${propertyId} la index ${index}`)
          return scrapeProperty(propertyId, index)
        }
        return Promise.resolve()
      })

      console.log('[ADMIN DEBUG] Astept toate promisiunile sa se finalizeze')
      await Promise.all(promises)
      
      console.log('[ADMIN DEBUG] Toate promisiunile finalizate, refresh properties list')
      // Refresh the properties list
      queryClient.invalidateQueries({ queryKey: ['catalog_offers'] })
      
      toast({
        title: "Procesare completă!",
        description: `Am procesat ${validIds.length} proprietăți`
      })
    } catch (error: any) {
      console.error('[ADMIN DEBUG] Eroare in scrapeAllProperties:', error)
      toast({
        title: "Eroare",
        description: "Eroare la procesarea proprietăților",
        variant: "destructive"
      })
    } finally {
      console.log('[ADMIN DEBUG] Setez loading state la false')
      setIsLoading(false)
    }
  }

  const updatePropertyId = (index: number, value: string) => {
    setPropertyIds(prev => prev.map((id, i) => i === index ? value : id))
  }

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


  const deleteProperty = async (id: string) => {
    setDeletingId(id)
    try {
      // Prefer edge function with service role to avoid any RLS issues
      const { data, error } = await supabase.functions.invoke('admin-offers', {
        body: { action: 'delete_offer', id }
      })

      if (error) throw error
      if (!data?.success) throw new Error(data?.error || 'Delete failed')

      toast({
        title: "Succes!",
        description: "Proprietatea a fost ștearsă cu succes"
      })

      // Refresh the properties list
      queryClient.invalidateQueries({ queryKey: ['catalog_offers'] })
    } catch (error: any) {
      // Fallback: try client-side delete in case function is unavailable
      try {
        const { error: fallbackError } = await supabase
          .from('catalog_offers')
          .delete()
          .eq('id', id)
        if (fallbackError) throw fallbackError

        toast({ title: 'Succes!', description: 'Proprietatea a fost ștearsă cu succes' })
        queryClient.invalidateQueries({ queryKey: ['catalog_offers'] })
      } catch (finalErr: any) {
        toast({
          title: 'Eroare',
          description: finalErr?.message || error?.message || 'Nu am putut șterge proprietatea',
          variant: 'destructive'
        })
      }
    } finally {
      setDeletingId(null)
    }
  }

  const deleteAllProperties = async () => {
    if (!properties || properties.length === 0) return
    
    setIsLoading(true)
    try {
      console.log(`[DELETE ALL] Ștergem ${properties.length} proprietăți`)
      
      // Delete all properties one by one using admin-offers edge function
      const deletePromises = properties.map(property => 
        supabase.functions.invoke('admin-offers', {
          body: { action: 'delete_offer', id: property.id }
        })
      )
      
      const results = await Promise.all(deletePromises)
      
      // Check for errors
      const errors = results.filter(r => r.error || !r.data?.success)
      if (errors.length > 0) {
        throw new Error(`Nu am putut șterge ${errors.length} proprietăți`)
      }

      toast({
        title: "Succes!",
        description: `Toate proprietățile (${properties.length}) au fost șterse cu succes`
      })

      queryClient.invalidateQueries({ queryKey: ['catalog_offers'] })
    } catch (error: any) {
      console.error('[DELETE ALL] Eroare:', error)
      toast({
        title: 'Eroare',
        description: error?.message || 'Nu am putut șterge proprietățile',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const openEditModal = (property: any) => {
    setEditingProperty(property)
    setEditForm({
      title: property.title || '',
      description: property.description || '',
      location: property.location || '',
      price_min: property.price_min || 0,
      price_max: property.price_max || 0,
      currency: property.currency || 'EUR',
      surface_min: property.surface_min || 0,
      surface_max: property.surface_max || 0,
      rooms: property.rooms || 1,
      project_name: property.project_name || '',
      features: Array.isArray(property.features) ? property.features.join(', ') : '',
      amenities: Array.isArray(property.amenities) ? property.amenities.join(', ') : ''
    })
  }

  const closeEditModal = () => {
    setEditingProperty(null)
    setEditForm({})
  }

  const updateProperty = async () => {
    if (!editingProperty) return
    
    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from('catalog_offers')
        .update({
          title: editForm.title,
          description: editForm.description,
          location: editForm.location,
          price_min: parseInt(editForm.price_min) || 0,
          price_max: parseInt(editForm.price_max) || 0,
          surface_min: parseInt(editForm.surface_min) || 0,
          surface_max: parseInt(editForm.surface_max) || 0,
          rooms: parseInt(editForm.rooms) || 1,
          project_name: editForm.project_name,
          features: editForm.features ? editForm.features.split(',').map((f: string) => f.trim()).filter(Boolean) : [],
          amenities: editForm.amenities ? editForm.amenities.split(',').map((a: string) => a.trim()).filter(Boolean) : [],
          updated_at: new Date().toISOString()
        })
        .eq('id', editingProperty.id)

      if (error) throw error

      toast({
        title: "Succes!",
        description: "Proprietatea a fost actualizată cu succes"
      })

      queryClient.invalidateQueries({ queryKey: ['catalog_offers'] })
      closeEditModal()
    } catch (error: any) {
      toast({
        title: "Eroare", 
        description: error.message || "Nu am putut actualiza proprietatea",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Show password form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-gold" />
            </div>
            <CardTitle className="text-2xl">Acces Administrare</CardTitle>
            <p className="text-muted-foreground">
              Introdu parola pentru a accesa panoul de administrare
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Parolă</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Introdu parola"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={!password}>
                <Lock className="w-4 h-4 mr-2" />
                Accesează Panoul
              </Button>
            </form>
            
            <div className="mt-6 pt-4 border-t">
              <Link 
                to="/" 
                className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Înapoi la site
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/10">
      <Header />
      
      <main className="pt-24 pb-16 px-3 sm:px-6">
        <div className="container mx-auto max-w-7xl">
          
          {/* Header Card with Glass Effect */}
          <Card className="glass mb-8 border-gold/20">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <Link 
                  to="/" 
                  className="flex items-center gap-2 text-muted-foreground hover:text-gold transition-colors group"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:transform group-hover:-translate-x-1 transition-transform" />
                  <span className="text-sm sm:text-base font-medium">Înapoi Acasă</span>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="border-gold/30 hover:bg-gold/10 hover:border-gold/50 transition-all"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  <span className="text-sm">Deconectare</span>
                </Button>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gold/20 to-gold-light/20 mb-4">
                  <BarChart3 className="w-8 h-8 text-gold" />
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3">
                  <span className="text-foreground">Panou </span>
                  <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                    Administrare
                  </span>
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                  Gestionează proprietățile, analizează performanțele și importă date noi
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            
            {/* Add Property Section */}
            <Card className="glass-hover border-gold/10">
              <CardHeader className="p-4 sm:p-6 border-b border-gold/10">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
                    <span className="text-sm sm:text-base">Adaugă Proprietate prin ID</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    {propertyIds.map((propertyId, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex gap-2 items-center">
                          <span className="text-xs sm:text-sm font-medium text-muted-foreground w-5 sm:w-6">{index + 1}.</span>
                          <Input
                            placeholder={`${index === 0 ? '190741 (obligatoriu)' : '190741 (opțional)'}`}
                            value={propertyId}
                            onChange={(e) => updatePropertyId(index, e.target.value)}
                            className="flex-1 font-mono text-sm sm:text-base"
                          />
                          {loadingStates[index] && (
                            <Loader2 className="w-4 h-4 animate-spin text-gold flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                    
                    <Button 
                      onClick={scrapeAllProperties}
                      disabled={isLoading || propertyIds.every(id => !id.trim())}
                      className="w-full text-sm sm:text-base h-10 sm:h-11"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          <span className="hidden sm:inline">Preluare în curs...</span>
                          <span className="sm:hidden">Preluare...</span>
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">Preia Proprietățile</span>
                          <span className="sm:hidden">Preia</span>
                        </>
                      )}
                    </Button>
                    
                    {/* Test button for debugging */}
                    <Button 
                      onClick={async () => {
                        console.log('[TEST] Butonul de test a fost apasat!')
                        toast({
                          title: "Test",
                          description: "Funcția de test a fost apelată!"
                        })
                        
                        try {
                          console.log('[TEST] Apelam direct edge function-ul')
                          const { data, error } = await supabase.functions.invoke('scrape-property', {
                            body: { url: 'https://web.immoflux.ro/publicproperty/p190741' }
                          })
                          console.log('[TEST] Raspuns direct:', { data, error })
                          
                          if (error) {
                            toast({
                              title: "Test Error",
                              description: `Edge function error: ${error.message}`,
                              variant: "destructive"
                            })
                          } else {
                            toast({
                              title: "Test Success",
                              description: `Edge function works: ${data?.success ? 'Success' : 'Failed'}`,
                            })
                          }
                        } catch (err: any) {
                          console.error('[TEST] Eroare generala:', err)
                          toast({
                            title: "Test Exception",
                            description: `Exception: ${err.message}`,
                            variant: "destructive"
                          })
                        }
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Test Edge Function
                    </Button>
                  </div>

                    </CardContent>
                  </Card>

                  {/* Manage Properties Section */}
                  <Card className="glass-hover border-gold/10">
                    <CardHeader className="p-4 sm:p-6 border-b border-gold/10">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                          <Home className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
                          <span className="text-sm sm:text-base">Proprietăți Existente ({properties?.length || 0})</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6">
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
                      <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto">
                        <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                          Scroll pentru a vedea toate proprietățile în detaliu mai jos
                        </p>
                        {properties.slice(0, 5).map((property) => (
                          <div 
                            key={property.id} 
                            className="flex items-start sm:items-center gap-2 sm:gap-3 p-2 sm:p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate text-xs sm:text-sm">{property.title}</h4>
                              <p className="text-xs text-muted-foreground truncate">{property.location}</p>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-xs text-muted-foreground">
                                <span>{property.rooms} camere</span>
                                <span>€{property.price_min.toLocaleString('de-DE')}</span>
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

          {/* Projects Admin Section */}
          <div className="mt-6">
            <ProjectsAdmin />
          </div>

          {/* Renew Apartments Importer */}
          <div className="mt-6">
            <RenewApartmentsImporter />
          </div>

          {/* Furnished Image Generator */}
          <div className="mt-6">
            <FurnishedImageGenerator />
          </div>

          {/* Facebook AI Generator */}
          <div className="mt-6">
            <FacebookContentGenerator />
          </div>

          {/* Business Card Generator */}
          <Card className="glass-hover border-gold/10 mt-6">
            <CardHeader className="p-4 sm:p-6 border-b border-gold/10">
              <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                <div className="p-2 rounded-lg bg-gold/10">
                  <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-gold" />
                </div>
                Generator Cărți de Vizită (cu Upload Logo)
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Creează cărți de vizită personalizate și încarcă logo-uri proprii
              </p>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <BusinessCardGenerator />
            </CardContent>
          </Card>

          {/* XML Import Manager */}
            <Card className="glass-hover border-gold/10 mt-6">
              <CardHeader className="p-4 sm:p-6 border-b border-gold/10">
              <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                <div className="p-2 rounded-lg bg-gold/10">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-gold" />
                </div>
                Sincronizare XML Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <XmlImportManager />
            </CardContent>
          </Card>

          {/* Detailed Properties Grid */}
          {!propertiesLoading && properties && properties.length > 0 && (
            <Card className="glass-hover border-gold/10 mt-8">
              <CardHeader className="p-4 sm:p-6 border-b border-gold/10">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl">
                    <div className="p-2 rounded-lg bg-gold/10">
                      <Home className="w-6 h-6 text-gold" />
                    </div>
                    Toate Proprietățile
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-base px-4 py-2">
                      {properties?.length || 0} proprietăți
                    </Badge>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-destructive/30 hover:bg-destructive/10 text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Șterge Toate
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                            Confirmare ștergere masivă
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Ești sigur că vrei să ștergi TOATE proprietățile ({properties?.length} proprietăți)?
                            <br />
                            <span className="font-semibold text-destructive">Această acțiune nu poate fi anulată!</span>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Anulează</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={deleteAllProperties}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Șterge Toate Proprietățile
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground max-w-2xl mt-3">
                  Portofoliul complet al proprietăților MVA Imobiliare - apartamente și garsoniere premium în Militari Residence
                </p>
                
                {/* Stats Overview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6">
                  <div className="p-3 sm:p-4 text-center rounded-lg border border-gold/20 bg-card">
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-gold mb-0.5 sm:mb-1">
                      {properties.filter(p => p.availability_status === 'available').length}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Disponibile</div>
                  </div>
                  <div className="p-3 sm:p-4 text-center rounded-lg border border-gold/20 bg-card">
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-gold mb-0.5 sm:mb-1">
                      {properties.filter(p => p.rooms === 1).length}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Garsoniere</div>
                  </div>
                  <div className="p-3 sm:p-4 text-center rounded-lg border border-gold/20 bg-card">
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-gold mb-0.5 sm:mb-1">
                      {properties.filter(p => p.rooms === 2).length}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">2 camere</div>
                  </div>
                  <div className="p-3 sm:p-4 text-center rounded-lg border border-gold/20 bg-card">
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-gold mb-0.5 sm:mb-1">
                      {properties.filter(p => p.rooms >= 3).length}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">3+ camere</div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {properties.map((property) => (
                    <Card key={property.id} className="group relative">
                      {/* Edit and Delete Buttons - Top Right Corner */}
                      <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10 flex gap-1 sm:gap-2">
                        {/* Edit Button */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(property)}
                              className="shadow-lg opacity-80 hover:opacity-100 transition-opacity bg-background h-8 w-8 sm:h-9 sm:w-9 p-0"
                            >
                              <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                            <DialogHeader>
                              <DialogTitle>Editează Proprietatea</DialogTitle>
                            </DialogHeader>
                            
                            {editingProperty && (
                              <div className="space-y-4 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="title">Titlu</Label>
                                    <Input
                                      id="title"
                                      value={editForm.title || ''}
                                      onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                                      placeholder="Titlul proprietății"
                                    />
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label htmlFor="location">Locație</Label>
                                    <Input
                                      id="location"
                                      value={editForm.location || ''}
                                      onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                                      placeholder="Locația proprietății"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="description">Descriere</Label>
                                  <Textarea
                                    id="description"
                                    rows={4}
                                    value={editForm.description || ''}
                                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                    placeholder="Descrierea proprietății"
                                  />
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Preț Min ({editForm.currency || 'EUR'})</label>
                        <Input
                          type="number"
                          value={editForm.price_min || ''}
                          onChange={(e) => setEditForm({...editForm, price_min: parseInt(e.target.value) || 0})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Preț Max ({editForm.currency || 'EUR'})</label>
                        <Input
                          type="number"
                          value={editForm.price_max || ''}
                          onChange={(e) => setEditForm({...editForm, price_max: parseInt(e.target.value) || 0})}
                        />
                      </div>
                                  
                                  <div className="space-y-2">
                                    <Label htmlFor="surface_min">Suprafață Min (mp)</Label>
                                    <Input
                                      id="surface_min"
                                      type="number"
                                      value={editForm.surface_min || ''}
                                      onChange={(e) => setEditForm({...editForm, surface_min: e.target.value})}
                                    />
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label htmlFor="rooms">Camere</Label>
                                    <Input
                                      id="rooms"
                                      type="number"
                                      value={editForm.rooms || ''}
                                      onChange={(e) => setEditForm({...editForm, rooms: e.target.value})}
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="project_name">Nume Proiect</Label>
                                  <Input
                                    id="project_name"
                                    value={editForm.project_name || ''}
                                    onChange={(e) => setEditForm({...editForm, project_name: e.target.value})}
                                    placeholder="Numele proiectului (opțional)"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="features">Caracteristici (separate prin virgulă)</Label>
                                  <Input
                                    id="features"
                                    value={editForm.features || ''}
                                    onChange={(e) => setEditForm({...editForm, features: e.target.value})}
                                    placeholder="balcon, parcare, centrală termică"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="amenities">Facilități (separate prin virgulă)</Label>
                                  <Input
                                    id="amenities"
                                    value={editForm.amenities || ''}
                                    onChange={(e) => setEditForm({...editForm, amenities: e.target.value})}
                                    placeholder="piscină, sală fitness, security"
                                  />
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                  <Button
                                    variant="outline"
                                    onClick={closeEditModal}
                                    disabled={isUpdating}
                                  >
                                    Anulează
                                  </Button>
                                  <Button
                                    onClick={updateProperty}
                                    disabled={isUpdating}
                                  >
                                    {isUpdating ? (
                                      <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Salvez...
                                      </>
                                    ) : (
                                      <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Salvează Modificările
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        {/* Delete Button */}
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
                               {property.price_min?.toLocaleString('de-DE')} {property.currency || 'EUR'}
                               {property.price_max && property.price_max !== property.price_min && 
                                 ` - ${property.price_max.toLocaleString('de-DE')} ${property.currency || 'EUR'}`
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
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <Link to={`/proprietati/${property.id}`} className="flex-1">
                              <Button 
                                variant="default" 
                                size="sm" 
                                className="w-full"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Vezi Proprietate
                              </Button>
                            </Link>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                const url = `${window.location.origin}/proprietati/${property.id}`;
                                navigator.clipboard.writeText(url);
                                toast({
                                  title: "Link copiat!",
                                  description: "Link-ul proprietății a fost copiat în clipboard"
                                });
                              }}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openEditModal(property)}
                              className="flex-1"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Editează
                            </Button>
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
                                  Storia
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
      
      {/* Edit Property Dialog */}
      <Dialog open={!!editingProperty} onOpenChange={closeEditModal}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editează Proprietatea</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Titlu</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Titlul proprietății"
              />
            </div>

            <div>
              <Label htmlFor="edit-description">Descriere</Label>
              <textarea
                id="edit-description"
                className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrierea proprietății"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-price-min">Preț Minim (EUR)</Label>
                <Input
                  id="edit-price-min"
                  type="number"
                  value={editForm.price_min || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, price_min: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-price-max">Preț Maxim (EUR)</Label>
                <Input
                  id="edit-price-max"
                  type="number"
                  value={editForm.price_max || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, price_max: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-surface-min">Suprafață Min (mp)</Label>
                <Input
                  id="edit-surface-min"
                  type="number"
                  value={editForm.surface_min || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, surface_min: parseInt(e.target.value) || null }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-surface-max">Suprafață Max (mp)</Label>
                <Input
                  id="edit-surface-max"
                  type="number"
                  value={editForm.surface_max || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, surface_max: parseInt(e.target.value) || null }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-rooms">Camere</Label>
                <Input
                  id="edit-rooms"
                  type="number"
                  value={editForm.rooms || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, rooms: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-location">Locație</Label>
              <Input
                id="edit-location"
                value={editForm.location}
                onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Orașul/Zona"
              />
            </div>

            <div>
              <Label htmlFor="edit-features">Caracteristici (separate prin virgulă)</Label>
              <Input
                id="edit-features"
                value={editForm.features}
                onChange={(e) => setEditForm(prev => ({ ...prev, features: e.target.value }))}
                placeholder="ex: Balcon, Parcare, Lift"
              />
            </div>

            <div>
              <Label htmlFor="edit-amenities">Facilități (separate prin virgulă)</Label>
              <Input
                id="edit-amenities"
                value={editForm.amenities}
                onChange={(e) => setEditForm(prev => ({ ...prev, amenities: e.target.value }))}
                placeholder="ex: Piscină, Sală fitness, Grădiniță"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={closeEditModal}>
              Anulează
            </Button>
            <Button 
              onClick={updateProperty}
              disabled={isUpdating || !editForm.title || !editForm.description}
            >
              {isUpdating ? "Se salvează..." : "Salvează"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Admin
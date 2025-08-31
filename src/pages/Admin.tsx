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
  Database,
  CheckCircle,
  Upload,
  FileText,
  Download
} from "lucide-react"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { Link } from "react-router-dom"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

const Admin = () => {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingProperty, setEditingProperty] = useState<any>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [isUpdating, setIsUpdating] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<string>('')
  const [isProcessingCsv, setIsProcessingCsv] = useState(false)
  const [csvStatus, setCsvStatus] = useState<'idle' | 'validated' | 'error'>('idle')
  const [csvValidation, setCsvValidation] = useState<any>(null)
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

  // Facebook Catalog CSV Import Functions
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'text/csv') {
      setCsvFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setCsvData(content)
        setCsvStatus('idle')
        setCsvValidation(null)
      }
      reader.readAsText(file)
    } else {
      toast({
        title: "Fișier invalid",
        description: "Te rog să selectezi un fișier CSV",
        variant: "destructive"
      })
    }
  }

  const validateCsv = async () => {
    if (!csvData) return
    
    setIsProcessingCsv(true)
    try {
      const { data, error } = await supabase.functions.invoke('facebook-catalog-import', {
        body: { action: 'validate_csv', csvData }
      })

      if (error) throw error

      if (data.success) {
        setCsvStatus('validated')
        setCsvValidation(data)
        toast({
          title: "CSV valid!",
          description: data.message,
        })
      } else {
        setCsvStatus('error')
        toast({
          title: "Eroare validare",
          description: data.error || "CSV-ul nu este valid",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      setCsvStatus('error')
      toast({
        title: "Eroare",
        description: error.message || "Nu am putut valida CSV-ul",
        variant: "destructive"
      })
    } finally {
      setIsProcessingCsv(false)
    }
  }

  // Immoflux Google Feed Import Functions  
  const GOOGLE_FEED_URL = 'https://web.immoflux.ro/api/bridges/googlefeed/68009c9368d89.csv'

  const testGoogleFeed = async () => {
    setIsProcessingCsv(true)
    try {
      const { data, error } = await supabase.functions.invoke('facebook-catalog-import', {
        body: { action: 'test_url', feedUrl: GOOGLE_FEED_URL }
      })

      if (error) throw error

      if (data.success) {
        setCsvStatus('validated')
        toast({
          title: "Google Feed valid!",
          description: data.message,
        })
      } else {
        setCsvStatus('error')
        toast({
          title: "Eroare Google Feed",
          description: data.error || "Nu am putut accesa Google feed-ul",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      setCsvStatus('error')
      toast({
        title: "Eroare",
        description: error.message || "Nu am putut testa Google feed-ul",
        variant: "destructive"
      })
    } finally {
      setIsProcessingCsv(false)
    }
  }

  const importGoogleFeed = async () => {
    setIsProcessingCsv(true)
    try {
      const { data, error } = await supabase.functions.invoke('facebook-catalog-import', {
        body: { action: 'import_from_url', feedUrl: GOOGLE_FEED_URL, feedType: 'google' }
      })

      if (error) throw error

      if (data.success) {
        toast({
          title: "Import Google Feed reușit!",
          description: data.message,
        })
        queryClient.invalidateQueries({ queryKey: ['catalog_offers'] })
        setCsvStatus('idle')
      } else {
        toast({
          title: "Eroare import Google Feed",
          description: data.error || "Nu am putut importa Google feed-ul",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message || "Nu am putut importa Google feed-ul",
        variant: "destructive"
      })
    } finally {
      setIsProcessingCsv(false)
    }
  }

  const importCsv = async () => {
    if (!csvData || csvStatus !== 'validated') return
    
    setIsProcessingCsv(true)
    try {
      const { data, error } = await supabase.functions.invoke('facebook-catalog-import', {
        body: { action: 'import_csv', csvData }
      })

      if (error) throw error

      if (data.success) {
        toast({
          title: "Import reușit!",
          description: data.message,
        })
        queryClient.invalidateQueries({ queryKey: ['catalog_offers'] })
        setCsvFile(null)
        setCsvData('')
        setCsvStatus('idle')
        setCsvValidation(null)
        // Reset file input
        const fileInput = document.getElementById('csv-file-input') as HTMLInputElement
        if (fileInput) fileInput.value = ''
      } else {
        toast({
          title: "Eroare import",
          description: data.error || "Nu am putut importa proprietățile",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message || "Nu am putut importa proprietățile",
        variant: "destructive"
      })
    } finally {
      setIsProcessingCsv(false)
    }
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
            currency: data.property.currency,
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Deconectare
                </Button>
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
                                <span>€{property.price_min.toLocaleString('de-DE')} EUR</span>
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

            {/* Immoflux Google Feed Import Section */}
            <div className="mt-8">
              <Card className="border-blue-200 bg-gradient-to-r from-blue-50/50 to-cyan-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      csvStatus === 'validated' ? 'bg-green-500' : 
                      csvStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
                    }`} />
                    <Database className="w-5 h-5 text-blue-600" />
                    Import Immoflux Google Feed
                    {csvStatus === 'validated' && <CheckCircle className="w-5 h-5 text-green-600" />}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Importă automat proprietățile din Google feed-ul de pe Immoflux
                  </p>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    
                    {/* Google Feed */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">Google Feed Immoflux</h4>
                        <Badge variant={
                          csvStatus === 'validated' ? 'default' :
                          csvStatus === 'error' ? 'destructive' : 'secondary'
                        }>
                          {csvStatus === 'validated' ? '✓ Valid' :
                           csvStatus === 'error' ? '✗ Eroare' : '○ Netest'}
                        </Badge>
                      </div>
                      
                      <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                        <div className="font-medium mb-1">🏠 Google Feed URL:</div>
                        <div className="font-mono text-xs break-all">
                          {GOOGLE_FEED_URL}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          onClick={testGoogleFeed}
                          disabled={isProcessingCsv}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          {isProcessingCsv ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Testez...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Test Google Feed
                            </>
                          )}
                        </Button>
                        
                        <Button 
                          onClick={importGoogleFeed}
                          disabled={isProcessingCsv || csvStatus !== 'validated'}
                          size="sm"
                          className="flex-1"
                        >
                          {isProcessingCsv ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Import...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Import Proprietăți
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Cum funcționează</h4>
                      
                      <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                        <div className="font-medium mb-1">⚡ Pași simpli:</div>
                        <div>1. Testează Google feed-ul mai întâi</div>
                        <div>2. Dacă este valid, apasă "Import Proprietăți"</div>
                        <div>3. Proprietățile vor fi marcate ca "IMMOFLUX_GOOGLE"</div>
                        <div>4. Datele vechi Google vor fi șterse automat</div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground bg-green-50 border border-green-200 p-3 rounded-lg">
                        <div className="font-medium mb-1 text-green-700">✨ Avantaje Google Feed:</div>
                        <div className="text-green-600">• Un singur feed pentru toate proprietățile</div>
                        <div className="text-green-600">• Structură optimizată pentru căutare</div>
                        <div className="text-green-600">• Import mai rapid și mai stabil</div>
                      </div>
                    </div>
                  </div>

                  {/* Manual CSV Upload Section */}
                  <div className="border-t pt-6">
                    <h4 className="font-medium mb-4">Sau încarcă manual fișier CSV</h4>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Input
                            id="csv-file-input"
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="cursor-pointer"
                          />
                          {csvFile && (
                            <p className="text-sm text-muted-foreground mt-2">
                              Fișier: {csvFile.name}
                            </p>
                          )}
                        </div>
                        
                        <Button 
                          onClick={validateCsv}
                          disabled={!csvData || isProcessingCsv}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          {isProcessingCsv ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Validez...
                            </>
                          ) : (
                            <>
                              <FileText className="w-4 h-4 mr-2" />
                              Validează CSV
                            </>
                          )}
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        <Button 
                          onClick={importCsv}
                          disabled={csvStatus !== 'validated' || isProcessingCsv}
                          size="sm"
                          className="w-full"
                        >
                          {isProcessingCsv ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Importez...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Import CSV Manual
                            </>
                          )}
                        </Button>
                        
                        <Button 
                          variant="outline"
                          size="sm"
                          className="w-full"
                          asChild
                        >
                          <a 
                            href="data:text/csv;charset=utf-8,id,title,description,availability,condition,price,link,image_link,brand,location,rooms,surface,features%0A1,%22Apartament 2 camere Militari%22,%22Apartament modern cu 2 camere in Militari Residence%22,available,new,75000,https://example.com,https://example.com/image.jpg,%22MVA Imobiliare%22,Bucuresti,2,60,%22Balcon,Centrala,Parcare%22"
                            download="template_facebook_catalog.csv"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Template CSV
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Stats Overview */}
                  {properties && (
                    <div className="border-t pt-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold text-blue-600">
                            {properties.filter(p => p.project_name === 'IMMOFLUX_GOOGLE').length}
                          </div>
                          <div className="text-xs text-muted-foreground">Google Feed</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-green-600">
                            {properties.filter(p => p.availability_status === 'available').length}
                          </div>
                          <div className="text-xs text-muted-foreground">Disponibile</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-gold">
                            {properties.filter(p => !p.project_name?.startsWith('IMMOFLUX_')).length}
                          </div>
                          <div className="text-xs text-muted-foreground">Altele</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-purple-600">
                            {properties.length}
                          </div>
                          <div className="text-xs text-muted-foreground">Total</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Validation Results */}
                  {csvValidation && (
                    <div className="border-t pt-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h5 className="font-medium text-green-800 mb-2">✅ Google Feed Validat</h5>
                        <div className="text-sm text-green-700">
                          {csvValidation.total_rows} proprietăți găsite și gata de import
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Detailed Properties Grid */}
            {!propertiesLoading && properties && properties.length > 0 && (
              <div className="mt-12">
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Home className="w-6 h-6 text-gold" />
                    <h2 className="text-3xl font-bold">Proprietățile Noastre</h2>
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {properties?.length || 0} proprietăți
                    </Badge>
                  </div>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Portofoliul complet al proprietăților MVA Imobiliare - apartamente și garsoniere premium în Militari Residence
                  </p>
                  
                  {/* Stats Overview */}
                  <div className="grid md:grid-cols-4 gap-4 mt-8 max-w-4xl mx-auto">
                    <Card className="p-4 text-center border-gold/20">
                      <div className="text-2xl font-bold text-gold mb-1">
                        {properties.filter(p => p.availability_status === 'available').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Disponibile</div>
                    </Card>
                    <Card className="p-4 text-center border-gold/20">
                      <div className="text-2xl font-bold text-gold mb-1">
                        {properties.filter(p => p.rooms === 1).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Garsoniere</div>
                    </Card>
                    <Card className="p-4 text-center border-gold/20">
                      <div className="text-2xl font-bold text-gold mb-1">
                        {properties.filter(p => p.rooms === 2).length}
                      </div>
                      <div className="text-sm text-muted-foreground">2 camere</div>
                    </Card>
                    <Card className="p-4 text-center border-gold/20">
                      <div className="text-2xl font-bold text-gold mb-1">
                        {properties.filter(p => p.rooms >= 3).length}
                      </div>
                      <div className="text-sm text-muted-foreground">3+ camere</div>
                    </Card>
                  </div>
                </div>
                
                <div className="grid lg:grid-cols-2 gap-6">
                  {properties.map((property) => (
                    <Card key={property.id} className="group relative">
                      {/* Edit and Delete Buttons - Top Right Corner */}
                      <div className="absolute top-4 right-4 z-10 flex gap-2">
                        {/* Edit Button */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(property)}
                              className="shadow-lg opacity-80 hover:opacity-100 transition-opacity bg-background"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
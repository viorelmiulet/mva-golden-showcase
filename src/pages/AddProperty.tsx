import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { 
  Plus, 
  Search, 
  Loader2,
  ArrowLeft
} from "lucide-react"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { useQueryClient } from "@tanstack/react-query"
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

const AddProperty = () => {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            
            {/* Header */}
            <div className="text-center mb-12">
              <div className="flex items-center justify-center mb-6">
                <Link 
                  to="/proprietati" 
                  className="flex items-center text-muted-foreground hover:text-foreground transition-colors mr-4"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Înapoi la Proprietăți
                </Link>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="text-foreground">Adaugă </span>
                <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                  Proprietate Nouă
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Introdu link-ul către proprietate pentru a prelua automat imaginile, descrierea și detaliile
              </p>
            </div>

            {/* Add Property Form */}
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-gold" />
                  Scraping Proprietate
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

            {/* Success Message */}
            <div className="mt-8 text-center">
              <p className="text-muted-foreground">
                După adăugare, proprietatea va apărea automat în 
                <Link 
                  to="/proprietati" 
                  className="text-gold hover:text-gold-light mx-1 underline"
                >
                  lista de proprietăți
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default AddProperty
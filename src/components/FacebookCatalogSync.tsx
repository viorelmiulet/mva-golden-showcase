import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Loader2, Facebook, CheckCircle, AlertCircle } from "lucide-react"

const FacebookCatalogSync = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const { toast } = useToast()

  const testConnection = async () => {
    setIsTesting(true)
    try {
      const { data, error } = await supabase.functions.invoke('facebook-catalog-import', {
        body: { action: 'test' }
      })

      if (error) throw error

      if (data.success) {
        toast({
          title: "Conexiunea este configurată",
          description: "Facebook App ID și Catalog ID sunt configurate corect",
        })
      } else {
        toast({
          title: "Eroare de configurare",
          description: data.error || "Facebook credentials nu sunt configurate",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Test connection error:', error)
      toast({
        title: "Eroare de conexiune",
        description: "Nu s-a putut testa conexiunea Facebook",
        variant: "destructive"
      })
    } finally {
      setIsTesting(false)
    }
  }

  const syncCatalog = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('facebook-catalog-import', {
        body: { action: 'sync' }
      })

      if (error) throw error

      if (data.success) {
        toast({
          title: "Sincronizare completă",
          description: `Au fost importate ${data.imported_count} proprietăți din Facebook Catalog`,
        })
        
        // Refresh the page to show new properties
        window.location.reload()
      } else {
        toast({
          title: "Eroare de sincronizare",
          description: data.error || "Nu s-au putut importa proprietățile",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Sync error:', error)
      toast({
        title: "Eroare de sincronizare",
        description: "Nu s-au putut importa proprietățile din Facebook Catalog",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Facebook className="w-5 h-5 text-blue-600" />
          Facebook Catalog Import
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Importă proprietățile din Facebook Catalog în baza de date locală
        </p>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={testConnection}
            disabled={isTesting}
            className="flex-1"
          >
            {isTesting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Test Conexiune
          </Button>
          
          <Button
            onClick={syncCatalog}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Facebook className="w-4 h-4 mr-2" />
            )}
            Sincronizează Catalog
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
          <AlertCircle className="w-4 h-4 inline-block mr-1" />
          <strong>Notă:</strong> Pentru a funcționa, ai nevoie de un Facebook App Access Token valid. 
          Contactează dezvoltatorul pentru configurarea completă a integrării.
        </div>
      </CardContent>
    </Card>
  )
}

export default FacebookCatalogSync
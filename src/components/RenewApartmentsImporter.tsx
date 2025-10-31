import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2 } from "lucide-react";

const RenewApartmentsImporter = () => {
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleImport = async () => {
    setIsImporting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('import-renew-apartments');

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Import reușit!",
          description: data.message,
        });
      } else {
        throw new Error(data.error || "Import failed");
      }
    } catch (error: any) {
      console.error("Import error:", error);
      toast({
        title: "Eroare la import",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card className="glass border-gold/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-gold" />
          Import Apartamente Renew Residence
        </CardTitle>
        <CardDescription>
          Importă toate cele 31 apartamente disponibile din complexul Renew Residence
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleImport} 
          disabled={isImporting}
          variant="luxury"
          className="w-full"
        >
          {isImporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Se importă...
            </>
          ) : (
            "Importă Apartamente"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default RenewApartmentsImporter;

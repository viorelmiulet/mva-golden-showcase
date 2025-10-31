import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";

const RenewResidenceImporter = () => {
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('import-renew-apartments');

      if (error) {
        console.error("Eroare la import:", error);
        toast.error("Eroare la importul apartamentelor");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success(data.message || `Au fost importate ${data.count} apartamente cu succes!`);
    } catch (error) {
      console.error("Eroare:", error);
      toast.error("A apărut o eroare la import");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Apartamente Renew Residence</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Importă 48 apartamente din Excel în baza de date.
          </p>
          <Button
            onClick={handleImport}
            disabled={isImporting}
            className="w-full"
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Se importă...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Importă Apartamente
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RenewResidenceImporter;

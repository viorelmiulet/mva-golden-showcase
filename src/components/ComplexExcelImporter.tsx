import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { FileSpreadsheet, Upload, Loader2 } from "lucide-react";

const ComplexExcelImporter = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
        toast.error("Vă rugăm să încărcați un fișier Excel (.xlsx sau .xls)");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Vă rugăm să selectați un fișier");
      return;
    }

    setIsLoading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64 = reader.result?.toString().split(',')[1];
        
        if (!base64) {
          throw new Error("Eroare la citirea fișierului");
        }

        // Call edge function to process Excel
        const { data, error } = await supabase.functions.invoke('import-complexes-excel', {
          body: { fileData: base64, fileName: file.name }
        });

        if (error) throw error;

        if (data.success) {
          toast.success(`${data.imported} complexe importate cu succes!`);
          setFile(null);
          // Reset file input
          const fileInput = document.getElementById('excel-file') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
        } else {
          throw new Error(data.error || "Eroare la import");
        }
      };

      reader.onerror = () => {
        throw new Error("Eroare la citirea fișierului");
      };

    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(error.message || "Eroare la importul complexelor");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Import Excel Complexe
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground space-y-2">
          <p>Fișierul Excel trebuie să conțină următoarele coloane:</p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li><strong>Nume</strong> - numele complexului (obligatoriu)</li>
            <li><strong>Locatie</strong> - adresa/zona (obligatoriu)</li>
            <li><strong>Descriere</strong> - descriere generală</li>
            <li><strong>Dezvoltator</strong> - numele dezvoltatorului</li>
            <li><strong>Pret Min</strong> - prețul minim (ex: 65000)</li>
            <li><strong>Pret Max</strong> - prețul maxim (ex: 120000)</li>
            <li><strong>Suprafata Min</strong> - suprafața minimă (ex: 45)</li>
            <li><strong>Suprafata Max</strong> - suprafața maximă (ex: 85)</li>
            <li><strong>Camere</strong> - intervalul de camere (ex: 2-3 camere)</li>
            <li><strong>Data Finalizare</strong> - data estimată</li>
            <li><strong>Status</strong> - disponibil/vandut/in_curand</li>
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {file ? file.name : "Click pentru a selecta fișier Excel"}
              </p>
            </div>
            <input
              id="excel-file"
              type="file"
              className="hidden"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={isLoading}
            />
          </label>

          <Button
            onClick={handleImport}
            disabled={!file || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Se importă...
              </>
            ) : (
              <>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Importă Complexe
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComplexExcelImporter;

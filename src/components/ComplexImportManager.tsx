import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const ComplexImportManager = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (validTypes.includes(selectedFile.type) || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
      } else {
        toast({
          title: "Format invalid",
          description: "Vă rugăm să încărcați un fișier CSV sau Excel (.xlsx, .xls)",
          variant: "destructive",
        });
      }
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "Eroare",
        description: "Vă rugăm să selectați un fișier",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64 = reader.result as string;
          resolve(base64.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke('import-complexes-excel', {
        body: { 
          fileData: fileBase64,
          fileName: file.name
        }
      });

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['crm-users'] });
      await queryClient.invalidateQueries({ queryKey: ['real_estate_projects'] });

      const dataType = data?.dataType === 'apartments' ? 'apartamente' : 'complexe';
      toast({
        title: "Import finalizat cu succes",
        description: `${data?.imported ?? 0} ${dataType} importate din ${data?.total ?? 0}${data?.errors?.length ? `. Erori: ${data.errors.length}` : ''}`,
      });

      setFile(null);
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Eroare la import",
        description: error.message || "A apărut o eroare la importul datelor",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Ansambluri Rezidențiale
          </CardTitle>
          <CardDescription>
            Importați ansambluri din fișiere CSV sau Excel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Input
                id="file-input"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                disabled={isImporting}
              />
            </div>
            <Button
              onClick={handleImport}
              disabled={!file || isImporting}
              className="min-w-[120px]"
            >
              {isImporting ? (
                <>Importare...</>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Importă
                </>
              )}
            </Button>
          </div>

          {file && (
            <div className="text-sm text-muted-foreground">
              Fișier selectat: {file.name}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Format fișier
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Cerințe pentru fișierul CSV/Excel:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Prima linie trebuie să conțină headerele coloanelor</li>
              <li><strong>Nume</strong> (obligatoriu) - numele ansamblului</li>
              <li><strong>Locatie</strong> (opțional) - adresa sau zona</li>
              <li><strong>Descriere</strong> (opțional) - detalii despre ansamblu</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Exemplu de format CSV:</h4>
            <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
              Nume,Locatie,Descriere{'\n'}
              Eurocasa Residence,Cluj-Napoca,Complex rezidențial modern{'\n'}
              Renew Residence,București,Apartamente noi cu facilități premium
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplexImportManager;

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
      const fileContent = await file.text();
      const lines = fileContent.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error("Fișierul trebuie să conțină cel puțin un rând cu date");
      }

      // Parse CSV (simple implementation)
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const nameIndex = headers.findIndex(h => h.includes('nume') || h.includes('name'));
      const locationIndex = headers.findIndex(h => h.includes('locatie') || h.includes('location') || h.includes('adresa'));
      const descriptionIndex = headers.findIndex(h => h.includes('descriere') || h.includes('description'));

      if (nameIndex === -1) {
        throw new Error("Fișierul trebuie să conțină o coloană 'Nume' sau 'Name'");
      }

      let imported = 0;
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        
        const name = values[nameIndex];
        if (!name) continue;

        const complexData = {
          name,
          location: locationIndex !== -1 ? values[locationIndex] : null,
          description: descriptionIndex !== -1 ? values[descriptionIndex] : null,
        };

        const { error } = await supabase
          .from('complexes')
          .insert(complexData);

        if (error) {
          errors.push(`Linia ${i + 1}: ${error.message}`);
        } else {
          imported++;
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['crm-users'] });

      toast({
        title: "Import finalizat",
        description: `${imported} ansambluri importate${errors.length > 0 ? `, ${errors.length} erori` : ''}`,
      });

      if (errors.length > 0) {
        console.error("Import errors:", errors);
      }

      setFile(null);
      // Reset file input
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

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileSpreadsheet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ExcelApartmentImporterProps {
  projectId: string;
  onImportComplete?: () => void;
}

export const ExcelApartmentImporter = ({ projectId, onImportComplete }: ExcelApartmentImporterProps) => {
  const [isImporting, setIsImporting] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const parseExcelData = (text: string) => {
    const apartments: any[] = [];
    const lines = text.split('\n');
    let currentFloor = '';
    
    lines.forEach((line, index) => {
      const cells = line.split('\t').map(c => c.trim());
      
      // Detect floor markers
      if (cells[0] === 'P') {
        currentFloor = 'Parter';
        return;
      }
      if (cells[0]?.match(/^E\d+$/)) {
        currentFloor = `Etaj ${cells[0].substring(1)}`;
        return;
      }
      
      // Skip header and empty lines
      if (cells[0] === 'Nr. ap.' || !cells[0] || cells.length < 5) return;
      
      // Parse apartment data
      if (cells[1] && cells[2] && cells[3] && cells[4]) {
        apartments.push({
          nr: cells[0],
          tip: cells[1],
          suprafata: cells[2],
          pret_credit: cells[3],
          pret_cash: cells[4],
          floor: currentFloor
        });
      }
    });
    
    return apartments;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Selectează un fișier Excel");
      return;
    }

    setIsImporting(true);
    try {
      // Read file as base64 to support real Excel formats
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke('import-complexes-excel', {
        body: { fileData: base64, fileName: file.name, projectId }
      });

      if (error) throw error;

      if (data?.success) {
        const dataType = data?.dataType === 'apartments' ? 'apartamente' : 'complexe';
        toast.success(`Import reușit: ${data?.imported ?? 0} ${dataType} din ${data?.total ?? 0}`);
        setFile(null);
        onImportComplete?.();
      } else {
        throw new Error(data?.error || 'Eroare la import');
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error('Eroare la import: ' + (error?.message || 'necunoscută'));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Import Apartamente din Excel</h3>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="excel-file">Selectează fișierul Excel</Label>
          <Input
            id="excel-file"
            type="file"
            accept=".xlsx,.xls,.csv,.tsv,.txt"
            onChange={handleFileChange}
            disabled={isImporting}
          />
          <p className="text-sm text-muted-foreground">
            Fișierul trebuie să conțină coloanele: Nr. ap., Tip Apartament, Suprafata, Pret Credit, Pret Cash
          </p>
        </div>

        <Button
          onClick={handleImport}
          disabled={!file || isImporting}
          className="w-full"
        >
          <Upload className="mr-2 h-4 w-4" />
          {isImporting ? "Se importă..." : "Importă Apartamente"}
        </Button>
      </div>
    </Card>
  );
};

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";

const RenewResidenceImporter = () => {
  const [isImporting, setIsImporting] = useState(false);

  // Data din Excel
  const apartmentsData = [
    // Parter
    { nr: "1", tip: "garsoniera", suprafata: 31, pretCredit: 49700, pretCash: 47500, etaj: "P" },
    { nr: "2", tip: "garsoniera", suprafata: 35, pretCredit: 54500, pretCash: 52000, etaj: "P" },
    { nr: "3", tip: "garsoniera", suprafata: 35, pretCredit: 54500, pretCash: 52000, etaj: "P" },
    { nr: "4", tip: "garsoniera", suprafata: 31, pretCredit: 49700, pretCash: 47500, etaj: "P" },
    { nr: "5", tip: "garsoniera", suprafata: 31, pretCredit: 49700, pretCash: 47500, etaj: "P" },
    { nr: "6", tip: "studio", suprafata: 43, pretCredit: 67500, pretCash: 65000, etaj: "P" },
    { nr: "7", tip: "studio", suprafata: 43, pretCredit: 67500, pretCash: 65000, etaj: "P" },
    { nr: "8", tip: "garsoniera", suprafata: 31, pretCredit: 49700, pretCash: 47500, etaj: "P" },
    // E1
    { nr: "9", tip: "garsoniera", suprafata: 32, pretCredit: 54064, pretCash: 43616, etaj: "E1" },
    { nr: "10", tip: "ap decomandat", suprafata: 52, pretCredit: 76000, pretCash: 73500, etaj: "E1" },
    { nr: "11", tip: "ap decomandat", suprafata: 52, pretCredit: 76000, pretCash: 73500, etaj: "E1" },
    { nr: "12", tip: "garsoniera", suprafata: 32, pretCredit: 54064, pretCash: 43616, etaj: "E1" },
    { nr: "13", tip: "ap decomandat", suprafata: 54, pretCredit: 77000, pretCash: 74500, etaj: "E1" },
    { nr: "14", tip: "garsoniera", suprafata: 35, pretCredit: 56000, pretCash: 53500, etaj: "E1" },
    { nr: "15", tip: "garsoniera", suprafata: 35, pretCredit: 65450, pretCash: 52850, etaj: "E1" },
    { nr: "16", tip: "garsoniera", suprafata: 32, pretCredit: 54064, pretCash: 43616, etaj: "E1" },
    // E2
    { nr: "17", tip: "garsoniera", suprafata: 32, pretCredit: 54064, pretCash: 43616, etaj: "E2" },
    { nr: "18", tip: "ap decomandat", suprafata: 52, pretCredit: 76000, pretCash: 73500, etaj: "E2" },
    { nr: "19", tip: "ap decomandat", suprafata: 52, pretCredit: 76000, pretCash: 73500, etaj: "E2" },
    { nr: "20", tip: "garsoniera", suprafata: 32, pretCredit: 54064, pretCash: 43616, etaj: "E2" },
    { nr: "21", tip: "ap decomandat", suprafata: 54, pretCredit: 77000, pretCash: 74500, etaj: "E2" },
    { nr: "22", tip: "garsoniera", suprafata: 35, pretCredit: 56500, pretCash: 54000, etaj: "E2" },
    { nr: "23", tip: "garsoniera", suprafata: 35, pretCredit: 56000, pretCash: 53500, etaj: "E2" },
    { nr: "24", tip: "garsoniera", suprafata: 32, pretCredit: 54064, pretCash: 43616, etaj: "E2" },
    // E3
    { nr: "25", tip: "garsoniera", suprafata: 32, pretCredit: 54064, pretCash: 43616, etaj: "E3" },
    { nr: "26", tip: "ap decomandat", suprafata: 52, pretCredit: 76000, pretCash: 73500, etaj: "E3" },
    { nr: "27", tip: "ap decomandat", suprafata: 52, pretCredit: 76000, pretCash: 73500, etaj: "E3" },
    { nr: "28", tip: "garsoniera", suprafata: 32, pretCredit: 59840, pretCash: 48320, etaj: "E3" },
    { nr: "29", tip: "ap decomandat", suprafata: 54, pretCredit: 77000, pretCash: 74500, etaj: "E3" },
    { nr: "30", tip: "garsoniera", suprafata: 35, pretCredit: 56500, pretCash: 54000, etaj: "E3" },
    { nr: "31", tip: "garsoniera", suprafata: 35, pretCredit: 56000, pretCash: 53500, etaj: "E3" },
    { nr: "32", tip: "garsoniera", suprafata: 32, pretCredit: 59840, pretCash: 48320, etaj: "E3" },
    // E4
    { nr: "33", tip: "garsoniera", suprafata: 32, pretCredit: 51000, pretCash: 49000, etaj: "E4" },
    { nr: "34", tip: "ap decomandat", suprafata: 52, pretCredit: 76000, pretCash: 73500, etaj: "E4" },
    { nr: "35", tip: "ap decomandat", suprafata: 52, pretCredit: 76000, pretCash: 73500, etaj: "E4" },
    { nr: "36", tip: "garsoniera", suprafata: 32, pretCredit: 51000, pretCash: 49000, etaj: "E4" },
    { nr: "37", tip: "ap decomandat", suprafata: 54, pretCredit: 77000, pretCash: 74500, etaj: "E4" },
    { nr: "38", tip: "garsoniera", suprafata: 35, pretCredit: 56500, pretCash: 54000, etaj: "E4" },
    { nr: "39", tip: "garsoniera", suprafata: 35, pretCredit: 56500, pretCash: 54000, etaj: "E4" },
    { nr: "40", tip: "garsoniera", suprafata: 32, pretCredit: 51000, pretCash: 49000, etaj: "E4" },
    // E5
    { nr: "41", tip: "garsoniera", suprafata: 32, pretCredit: 48500, pretCash: 46500, etaj: "E5" },
    { nr: "42", tip: "ap decomandat", suprafata: 52, pretCredit: 72000, pretCash: 70000, etaj: "E5" },
    { nr: "43", tip: "ap decomandat", suprafata: 52, pretCredit: 72000, pretCash: 70000, etaj: "E5" },
    { nr: "44", tip: "garsoniera", suprafata: 32, pretCredit: 48500, pretCash: 46000, etaj: "E5" },
    { nr: "45", tip: "ap decomandat", suprafata: 54, pretCredit: 73000, pretCash: 70500, etaj: "E5" },
    { nr: "46", tip: "garsoniera", suprafata: 35, pretCredit: 53500, pretCash: 51000, etaj: "E5" },
    { nr: "47", tip: "garsoniera", suprafata: 35, pretCredit: 53500, pretCash: 51000, etaj: "E5" },
    { nr: "48", tip: "garsoniera", suprafata: 32, pretCredit: 48500, pretCash: 46500, etaj: "E5" },
  ];

  const getRoomCount = (tip: string): number => {
    if (tip === "garsoniera" || tip === "studio") return 1;
    if (tip === "ap decomandat") return 2;
    return 1;
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      // Găsește proiectul Renew Residence
      const { data: project, error: projectError } = await supabase
        .from("real_estate_projects")
        .select("id")
        .eq("name", "RENEW RESIDENCE")
        .single();

      if (projectError || !project) {
        toast.error("Nu s-a găsit proiectul Renew Residence");
        return;
      }

      // Pregătește datele pentru inserare
      const offersToInsert = apartmentsData.map((apt) => ({
        title: `Apartament ${apt.nr} - ${apt.tip}`,
        description: `${apt.tip.charAt(0).toUpperCase() + apt.tip.slice(1)} cu suprafața de ${apt.suprafata} mp, situat la ${apt.etaj}`,
        project_id: project.id,
        project_name: "RENEW RESIDENCE",
        location: "Chiajna",
        rooms: getRoomCount(apt.tip),
        surface_min: apt.suprafata,
        surface_max: apt.suprafata,
        price_min: apt.pretCash,
        price_max: apt.pretCredit,
        currency: "EUR",
        availability_status: "available",
        available_units: 1,
        source: "excel_import",
        features: [
          `Etaj: ${apt.etaj}`,
          `Suprafață: ${apt.suprafata} mp`,
          `Tip: ${apt.tip}`,
          `Preț cash: ${apt.pretCash.toLocaleString()} EUR`,
          `Preț credit: ${apt.pretCredit.toLocaleString()} EUR`,
        ],
      }));

      // Inserează apartamentele
      const { error: insertError } = await supabase
        .from("catalog_offers")
        .insert(offersToInsert);

      if (insertError) {
        console.error("Eroare la inserare:", insertError);
        toast.error("Eroare la importul apartamentelor");
        return;
      }

      toast.success(`Au fost importate ${apartmentsData.length} apartamente cu succes!`);
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
            Importă {apartmentsData.length} apartamente din Excel în baza de date.
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

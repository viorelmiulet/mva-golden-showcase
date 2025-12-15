import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileText, Download, Loader2, BarChart3, Euro, Building2, CalendarCheck } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, parseISO } from "date-fns";
import { ro } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ReportsPage = () => {
  const [reportType, setReportType] = useState<string>("monthly");
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));
  const [selectedYear, setSelectedYear] = useState<string>(format(new Date(), "yyyy"));
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Get available months (last 12 months)
  const availableMonths = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: format(date, "yyyy-MM"),
      label: format(date, "MMMM yyyy", { locale: ro })
    };
  });

  // Get available years
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 5 }, (_, i) => ({
    value: String(currentYear - i),
    label: String(currentYear - i)
  }));

  // Fetch all data for reports
  const { data: reportData, isLoading } = useQuery({
    queryKey: ['report-data', reportType, selectedMonth, selectedYear],
    queryFn: async () => {
      let startDate: Date, endDate: Date;
      
      if (reportType === "monthly") {
        const [year, month] = selectedMonth.split("-").map(Number);
        startDate = startOfMonth(new Date(year, month - 1));
        endDate = endOfMonth(new Date(year, month - 1));
      } else {
        startDate = startOfYear(new Date(Number(selectedYear), 0));
        endDate = endOfYear(new Date(Number(selectedYear), 0));
      }

      // Fetch commissions
      const { data: commissions } = await supabase
        .from("commissions")
        .select("*")
        .gte("date", format(startDate, "yyyy-MM-dd"))
        .lte("date", format(endDate, "yyyy-MM-dd"))
        .order("date", { ascending: true });

      // Fetch viewings
      const { data: viewings } = await supabase
        .from("viewing_appointments")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      // Fetch properties count
      const { count: propertiesCount } = await supabase
        .from("catalog_offers")
        .select("*", { count: "exact", head: true })
        .is("project_id", null);

      // Fetch complexes count
      const { count: complexesCount } = await supabase
        .from("real_estate_projects")
        .select("*", { count: "exact", head: true });

      // Calculate totals
      const totalEUR = commissions?.filter(c => c.currency === "EUR").reduce((sum, c) => sum + Number(c.amount), 0) || 0;
      const totalRON = commissions?.filter(c => c.currency === "RON").reduce((sum, c) => sum + Number(c.amount), 0) || 0;
      const salesCount = commissions?.filter(c => c.transaction_type === "vânzare").length || 0;
      const rentCount = commissions?.filter(c => c.transaction_type === "chirie").length || 0;

      const viewingsTotal = viewings?.length || 0;
      const viewingsCompleted = viewings?.filter(v => v.status === "completed").length || 0;
      const viewingsPending = viewings?.filter(v => v.status === "pending").length || 0;

      return {
        commissions: commissions || [],
        totalEUR,
        totalRON,
        salesCount,
        rentCount,
        viewingsTotal,
        viewingsCompleted,
        viewingsPending,
        propertiesCount: propertiesCount || 0,
        complexesCount: complexesCount || 0,
        startDate,
        endDate
      };
    }
  });

  const generatePDF = async () => {
    if (!reportData) return;
    
    setIsGenerating(true);
    
    try {
      const doc = new jsPDF();
      const periodLabel = reportType === "monthly" 
        ? format(reportData.startDate, "MMMM yyyy", { locale: ro })
        : selectedYear;

      // Header
      doc.setFontSize(20);
      doc.setTextColor(218, 165, 32); // Gold color
      doc.text("MVA Imobiliare", 105, 20, { align: "center" });
      
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(`Raport ${reportType === "monthly" ? "Lunar" : "Anual"}`, 105, 30, { align: "center" });
      
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(periodLabel, 105, 38, { align: "center" });
      
      doc.setFontSize(10);
      doc.text(`Generat la: ${format(new Date(), "d MMMM yyyy, HH:mm", { locale: ro })}`, 105, 45, { align: "center" });

      // Summary section
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("Sumar General", 14, 60);

      // Stats table
      autoTable(doc, {
        startY: 65,
        head: [["Indicator", "Valoare"]],
        body: [
          ["Total Comisioane EUR", `${reportData.totalEUR.toLocaleString()} €`],
          ["Total Comisioane RON", `${reportData.totalRON.toLocaleString()} RON`],
          ["Tranzacții Vânzare", String(reportData.salesCount)],
          ["Tranzacții Chirie", String(reportData.rentCount)],
          ["Vizionări Total", String(reportData.viewingsTotal)],
          ["Vizionări Finalizate", String(reportData.viewingsCompleted)],
          ["Vizionări în Așteptare", String(reportData.viewingsPending)],
          ["Proprietăți Active", String(reportData.propertiesCount)],
          ["Complexe Rezidențiale", String(reportData.complexesCount)],
        ],
        theme: "striped",
        headStyles: { fillColor: [218, 165, 32] },
      });

      // Commissions detail
      if (reportData.commissions.length > 0) {
        const finalY = (doc as any).lastAutoTable.finalY || 120;
        
        doc.setFontSize(14);
        doc.text("Detalii Comisioane", 14, finalY + 15);

        autoTable(doc, {
          startY: finalY + 20,
          head: [["Data", "Tip", "Sumă", "Monedă", "Factură"]],
          body: reportData.commissions.map(c => [
            format(parseISO(c.date), "dd.MM.yyyy"),
            c.transaction_type,
            Number(c.amount).toLocaleString(),
            c.currency,
            c.invoice_number || "-"
          ]),
          theme: "striped",
          headStyles: { fillColor: [218, 165, 32] },
        });
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Pagina ${i} din ${pageCount} | MVA Imobiliare © ${new Date().getFullYear()}`,
          105,
          doc.internal.pageSize.height - 10,
          { align: "center" }
        );
      }

      // Save
      const filename = `raport-${reportType === "monthly" ? selectedMonth : selectedYear}.pdf`;
      doc.save(filename);

      toast({
        title: "Raport generat",
        description: `Fișierul ${filename} a fost descărcat`,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut genera raportul PDF",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rapoarte</h1>
        <p className="text-muted-foreground">Generează rapoarte PDF cu statistici</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Configuration */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Configurare Raport
            </CardTitle>
            <CardDescription>Selectează tipul și perioada</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tip Raport</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Lunar</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {reportType === "monthly" ? (
              <div className="space-y-2">
                <Label>Luna</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMonths.map(month => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>An</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map(year => (
                      <SelectItem key={year.value} value={year.value}>
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button 
              onClick={generatePDF} 
              disabled={isLoading || isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Se generează...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Descarcă PDF
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Previzualizare Date
            </CardTitle>
            <CardDescription>
              {reportType === "monthly" 
                ? availableMonths.find(m => m.value === selectedMonth)?.label
                : selectedYear}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : reportData ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Euro className="h-4 w-4" />
                    <span className="text-xs">Comisioane EUR</span>
                  </div>
                  <p className="text-xl font-bold">{reportData.totalEUR.toLocaleString()} €</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Euro className="h-4 w-4" />
                    <span className="text-xs">Comisioane RON</span>
                  </div>
                  <p className="text-xl font-bold">{reportData.totalRON.toLocaleString()} RON</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Building2 className="h-4 w-4" />
                    <span className="text-xs">Tranzacții</span>
                  </div>
                  <p className="text-xl font-bold">{reportData.salesCount + reportData.rentCount}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <CalendarCheck className="h-4 w-4" />
                    <span className="text-xs">Vizionări</span>
                  </div>
                  <p className="text-xl font-bold">{reportData.viewingsTotal}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Building2 className="h-4 w-4" />
                    <span className="text-xs">Proprietăți</span>
                  </div>
                  <p className="text-xl font-bold">{reportData.propertiesCount}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Building2 className="h-4 w-4" />
                    <span className="text-xs">Complexe</span>
                  </div>
                  <p className="text-xl font-bold">{reportData.complexesCount}</p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportsPage;
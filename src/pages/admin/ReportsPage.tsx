import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { FileText, Download, Loader2, BarChart3, Euro, Building2, CalendarCheck } from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, parseISO } from "date-fns";
import { ro } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Function to remove Romanian diacritics
const removeDiacritics = (text: string): string => {
  const diacriticsMap: { [key: string]: string } = {
    'ă': 'a', 'â': 'a', 'î': 'i', 'ș': 's', 'ț': 't',
    'Ă': 'A', 'Â': 'A', 'Î': 'I', 'Ș': 'S', 'Ț': 'T',
    'ş': 's', 'ţ': 't', 'Ş': 'S', 'Ţ': 'T' // Also handle cedilla variants
  };
  return text.replace(/[ăâîșțĂÂÎȘȚşţŞŢ]/g, char => diacriticsMap[char] || char);
};

// Generate bar chart as base64 image
const generateBarChart = (
  data: { label: string; value: number }[],
  title: string,
  width: number = 500,
  height: number = 200,
  barColor: string = "#DAA520"
): string => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const padding = { top: 30, right: 20, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Title
  ctx.fillStyle = "#000000";
  ctx.font = "bold 14px Arial";
  ctx.textAlign = "center";
  ctx.fillText(title, width / 2, 18);

  if (data.length === 0) {
    ctx.fillStyle = "#666666";
    ctx.font = "12px Arial";
    ctx.fillText("Nu exista date", width / 2, height / 2);
    return canvas.toDataURL("image/png");
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const barWidth = Math.min(40, (chartWidth / data.length) * 0.7);
  const gap = (chartWidth - barWidth * data.length) / (data.length + 1);

  // Draw Y axis
  ctx.strokeStyle = "#cccccc";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, height - padding.bottom);
  ctx.lineTo(width - padding.right, height - padding.bottom);
  ctx.stroke();

  // Y axis labels
  ctx.fillStyle = "#666666";
  ctx.font = "10px Arial";
  ctx.textAlign = "right";
  const ySteps = 5;
  for (let i = 0; i <= ySteps; i++) {
    const value = Math.round((maxValue / ySteps) * i);
    const y = height - padding.bottom - (chartHeight / ySteps) * i;
    ctx.fillText(value.toLocaleString(), padding.left - 5, y + 3);
    
    // Grid line
    ctx.strokeStyle = "#eeeeee";
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }

  // Draw bars
  data.forEach((item, index) => {
    const x = padding.left + gap + index * (barWidth + gap);
    const barHeight = (item.value / maxValue) * chartHeight;
    const y = height - padding.bottom - barHeight;

    // Bar
    ctx.fillStyle = barColor;
    ctx.fillRect(x, y, barWidth, barHeight);

    // Bar border
    ctx.strokeStyle = "#B8860B";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);

    // Value on top
    if (item.value > 0) {
      ctx.fillStyle = "#333333";
      ctx.font = "bold 9px Arial";
      ctx.textAlign = "center";
      ctx.fillText(item.value.toLocaleString(), x + barWidth / 2, y - 5);
    }

    // Label
    ctx.fillStyle = "#333333";
    ctx.font = "9px Arial";
    ctx.textAlign = "center";
    ctx.save();
    ctx.translate(x + barWidth / 2, height - padding.bottom + 10);
    ctx.fillText(item.label, 0, 10);
    ctx.restore();
  });

  return canvas.toDataURL("image/png");
};

// Get short month names without diacritics
const getShortMonthName = (monthIndex: number): string => {
  const months = ["Ian", "Feb", "Mar", "Apr", "Mai", "Iun", "Iul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months[monthIndex];
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const ReportsPage = () => {
  const [reportType, setReportType] = useState<string>("monthly");
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));
  const [selectedYear, setSelectedYear] = useState<string>(format(new Date(), "yyyy"));
  const [isGenerating, setIsGenerating] = useState(false);

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
      const periodLabel = removeDiacritics(reportType === "monthly" 
        ? format(reportData.startDate, "MMMM yyyy", { locale: ro })
        : selectedYear);

      // Header
      doc.setFontSize(20);
      doc.setTextColor(218, 165, 32); // Gold color
      doc.text("MVA Imobiliare", 105, 20, { align: "center" });
      
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(removeDiacritics(`Raport ${reportType === "monthly" ? "Lunar" : "Anual"}`), 105, 30, { align: "center" });
      
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(periodLabel, 105, 38, { align: "center" });
      
      doc.setFontSize(10);
      doc.text(removeDiacritics(`Generat la: ${format(new Date(), "d MMMM yyyy, HH:mm", { locale: ro })}`), 105, 45, { align: "center" });

      // Summary section
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("Sumar General", 14, 60);

      // Stats table
      autoTable(doc, {
        startY: 65,
        head: [["Indicator", "Valoare"]],
        body: [
          ["Total Comisioane EUR", `${reportData.totalEUR.toLocaleString()} EUR`],
          ["Total Comisioane RON", `${reportData.totalRON.toLocaleString()} RON`],
          [removeDiacritics("Tranzactii Vanzare"), String(reportData.salesCount)],
          [removeDiacritics("Tranzactii Chirie"), String(reportData.rentCount)],
          [removeDiacritics("Vizionari Total"), String(reportData.viewingsTotal)],
          [removeDiacritics("Vizionari Finalizate"), String(reportData.viewingsCompleted)],
          [removeDiacritics("Vizionari in Asteptare"), String(reportData.viewingsPending)],
          [removeDiacritics("Proprietati Active"), String(reportData.propertiesCount)],
          [removeDiacritics("Complexe Rezidentiale"), String(reportData.complexesCount)],
        ],
        theme: "striped",
        headStyles: { fillColor: [218, 165, 32] },
      });

      // Generate monthly chart for annual reports
      if (reportType === "yearly" && reportData.commissions.length > 0) {
        const finalY = (doc as any).lastAutoTable.finalY || 120;
        
        // Group commissions by month
        const monthlyEUR: { [key: number]: number } = {};
        const monthlyRON: { [key: number]: number } = {};
        
        for (let i = 0; i < 12; i++) {
          monthlyEUR[i] = 0;
          monthlyRON[i] = 0;
        }
        
        reportData.commissions.forEach(c => {
          const month = parseISO(c.date).getMonth();
          if (c.currency === "EUR") {
            monthlyEUR[month] += Number(c.amount);
          } else if (c.currency === "RON") {
            monthlyRON[month] += Number(c.amount);
          }
        });

        // EUR Chart
        const eurData = Object.entries(monthlyEUR).map(([month, value]) => ({
          label: getShortMonthName(Number(month)),
          value: Math.round(value)
        }));

        doc.setFontSize(14);
        doc.text("Grafic Comisioane Lunare", 14, finalY + 15);

        const eurChart = generateBarChart(eurData, "Comisioane EUR pe luni", 500, 180, "#DAA520");
        if (eurChart) {
          doc.addImage(eurChart, "PNG", 14, finalY + 20, 180, 65);
        }

        // RON Chart
        const ronData = Object.entries(monthlyRON).map(([month, value]) => ({
          label: getShortMonthName(Number(month)),
          value: Math.round(value)
        }));

        const ronChart = generateBarChart(ronData, "Comisioane RON pe luni", 500, 180, "#4A90D9");
        if (ronChart) {
          doc.addImage(ronChart, "PNG", 14, finalY + 90, 180, 65);
        }

        // Add new page for details
        doc.addPage();
        doc.setFontSize(14);
        doc.text("Detalii Comisioane", 14, 20);

        autoTable(doc, {
          startY: 25,
          head: [["Data", "Tip", "Suma", "Moneda", "Factura"]],
          body: reportData.commissions.map(c => [
            format(parseISO(c.date), "dd.MM.yyyy"),
            removeDiacritics(c.transaction_type),
            Number(c.amount).toLocaleString(),
            c.currency,
            c.invoice_number || "-"
          ]),
          theme: "striped",
          headStyles: { fillColor: [218, 165, 32] },
        });
      } else if (reportData.commissions.length > 0) {
        // Monthly report - just show details table
        const finalY = (doc as any).lastAutoTable.finalY || 120;
        
        doc.setFontSize(14);
        doc.text("Detalii Comisioane", 14, finalY + 15);

        autoTable(doc, {
          startY: finalY + 20,
          head: [["Data", "Tip", "Suma", "Moneda", "Factura"]],
          body: reportData.commissions.map(c => [
            format(parseISO(c.date), "dd.MM.yyyy"),
            removeDiacritics(c.transaction_type),
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

      toast.success(`Raport generat: ${filename}`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Nu s-a putut genera raportul PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-gold/40 to-gold/10 rounded-2xl blur-xl" />
          <div className="relative p-3 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20">
            <FileText className="h-6 w-6 text-gold" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rapoarte</h1>
          <p className="text-muted-foreground text-sm">Generează rapoarte PDF cu statistici</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Configuration */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gold/10 text-gold">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Configurare Raport</h3>
                  <p className="text-sm text-muted-foreground">Selectează tipul și perioada</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">Tip Raport</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="bg-white/5 border-white/10">
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
                  <Label className="text-sm">Luna</Label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="bg-white/5 border-white/10">
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
                  <Label className="text-sm">An</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="bg-white/5 border-white/10">
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
                className="w-full bg-gradient-to-r from-gold to-gold-light text-black hover:shadow-lg hover:shadow-gold/25"
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
            </div>
          </div>
        </motion.div>

        {/* Preview */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Previzualizare Date</h3>
                  <p className="text-sm text-muted-foreground">
                    {reportType === "monthly" 
                      ? availableMonths.find(m => m.value === selectedMonth)?.label
                      : selectedYear}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin text-gold/50" />
                </div>
              ) : reportData ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { icon: Euro, label: "Comisioane EUR", value: `${reportData.totalEUR.toLocaleString()} €`, gradient: "from-gold/20 to-amber-500/20", iconColor: "text-gold" },
                    { icon: Euro, label: "Comisioane RON", value: `${reportData.totalRON.toLocaleString()} RON`, gradient: "from-blue-500/20 to-cyan-500/20", iconColor: "text-blue-400" },
                    { icon: Building2, label: "Tranzacții", value: reportData.salesCount + reportData.rentCount, gradient: "from-emerald-500/20 to-green-500/20", iconColor: "text-emerald-400" },
                    { icon: CalendarCheck, label: "Vizionări", value: reportData.viewingsTotal, gradient: "from-purple-500/20 to-violet-500/20", iconColor: "text-purple-400" },
                    { icon: Building2, label: "Proprietăți", value: reportData.propertiesCount, gradient: "from-orange-500/20 to-red-500/20", iconColor: "text-orange-400" },
                    { icon: Building2, label: "Complexe", value: reportData.complexesCount, gradient: "from-pink-500/20 to-rose-500/20", iconColor: "text-pink-400" },
                  ].map((stat, index) => (
                    <div key={stat.label} className={`p-4 rounded-xl bg-gradient-to-br ${stat.gradient} border border-white/5 hover:border-white/10 transition-all`}>
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                        <span className="text-xs">{stat.label}</span>
                      </div>
                      <p className="text-xl font-bold">{stat.value}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ReportsPage;
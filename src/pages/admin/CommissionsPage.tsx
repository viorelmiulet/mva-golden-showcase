import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { adminApi } from "@/lib/adminApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  Plus, 
  Euro, 
  Calendar, 
  FileText, 
  Trash2, 
  Edit, 
  TrendingUp,
  Home,
  Key,
  Loader2,
  Filter,
  BarChart3,
  PieChart,
  ChevronDown,
  ChevronUp,
  Download,
  Upload,
  File,
  X,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO, getMonth, getYear } from "date-fns";
import { ro } from "date-fns/locale";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileTableCard, MobileCardRow, MobileCardActions, MobileCardHeader } from "@/components/admin/MobileTableCard";
import { MobileFilterSort } from "@/components/admin/MobileFilterSort";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/admin/PullToRefreshIndicator";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

interface Commission {
  id: string;
  date: string;
  amount: number;
  currency: string;
  invoice_number: string | null;
  invoice_file_url: string | null;
  transaction_type: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const TRANSACTION_TYPES = ["vânzare", "chirie"];

const MONTHS = [
  "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
  "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"
];

const CommissionsPage = () => {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCommission, setEditingCommission] = useState<Commission | null>(null);
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [filterType, setFilterType] = useState<string>("all");
  const [filterInvoice, setFilterInvoice] = useState<string>("all");
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    date: "",
    amount: "",
    currency: "EUR",
    has_invoice: "nu",
    invoice_number: "",
    transaction_type: "vânzare",
    notes: ""
  });
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [existingInvoiceUrl, setExistingInvoiceUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['commissions'] });
  }, [queryClient]);

  const { containerRef, pullDistance, isRefreshing, progress } = usePullToRefresh({
    onRefresh: handleRefresh,
    disabled: !isMobile,
  });

  const { data: commissions, isLoading } = useQuery({
    queryKey: ['commissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commissions')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data as Commission[];
    }
  });

  const addMutation = useMutation({
    mutationFn: async (data: Omit<Commission, 'id' | 'created_at' | 'updated_at'>) => {
      const result = await adminApi.insert('commissions', data);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      toast.success("Comision adăugat cu succes!");
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: () => toast.error("Eroare la adăugarea comisionului")
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Commission> }) => {
      const result = await adminApi.update('commissions', id, data);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      toast.success("Comision actualizat cu succes!");
      setEditingCommission(null);
      resetForm();
    },
    onError: () => toast.error("Eroare la actualizarea comisionului")
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await adminApi.delete('commissions', id);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      toast.success("Comision șters cu succes!");
    },
    onError: () => toast.error("Eroare la ștergerea comisionului")
  });

  const resetForm = () => {
    setFormData({
      date: "",
      amount: "",
      currency: "EUR",
      has_invoice: "nu",
      invoice_number: "",
      transaction_type: "vânzare",
      notes: ""
    });
    setInvoiceFile(null);
    setExistingInvoiceUrl(null);
  };

  const uploadInvoiceFile = async (file: File, commissionId: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${commissionId}-${Date.now()}.${fileExt}`;
    const filePath = `invoices/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('invoice-files')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('invoice-files').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    
    try {
      const data: Partial<Commission> = {
        date: formData.date,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        invoice_number: formData.has_invoice === "da" ? (formData.invoice_number || "Da") : null,
        transaction_type: formData.transaction_type,
        notes: formData.notes || null
      };

      if (editingCommission) {
        if (invoiceFile) {
          const fileUrl = await uploadInvoiceFile(invoiceFile, editingCommission.id);
          data.invoice_file_url = fileUrl;
        }
        updateMutation.mutate({ id: editingCommission.id, data });
      } else {
        const result = await adminApi.insert('commissions', data as any);
        if (!result.success) throw new Error(result.error);
        const insertedCommission = result.data?.[0] as any;

        if (invoiceFile && insertedCommission) {
          const fileUrl = await uploadInvoiceFile(invoiceFile, insertedCommission.id);
          await adminApi.update('commissions', insertedCommission.id, { invoice_file_url: fileUrl });
        }

        queryClient.invalidateQueries({ queryKey: ['commissions'] });
        toast.success("Comision adăugat cu succes!");
        setIsAddDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error saving commission:', error);
      toast.error("Eroare la salvarea comisionului");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error("Doar fișiere PDF sunt acceptate");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Fișierul trebuie să fie mai mic de 10MB");
        return;
      }
      setInvoiceFile(file);
    }
  };

  const removeInvoiceFile = () => setInvoiceFile(null);

  const deleteExistingInvoiceFile = async (commissionId: string, fileUrl: string) => {
    try {
      const urlParts = fileUrl.split('/invoice-files/');
      if (urlParts.length > 1) {
        await supabase.storage.from('invoice-files').remove([urlParts[1]]);
      }
      await adminApi.update('commissions', commissionId, { invoice_file_url: null });
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      setExistingInvoiceUrl(null);
      toast.success("Fișierul facturii a fost șters");
    } catch (error) {
      console.error('Error deleting invoice file:', error);
      toast.error("Eroare la ștergerea fișierului");
    }
  };

  const openEditDialog = (commission: Commission) => {
    setEditingCommission(commission);
    setFormData({
      date: commission.date,
      amount: commission.amount.toString(),
      currency: commission.currency,
      has_invoice: commission.invoice_number ? "da" : "nu",
      invoice_number: commission.invoice_number || "",
      transaction_type: commission.transaction_type,
      notes: commission.notes || ""
    });
    setExistingInvoiceUrl(commission.invoice_file_url);
    setInvoiceFile(null);
  };

  const filteredCommissions = commissions?.filter(c => {
    const date = parseISO(c.date);
    const monthMatch = filterMonth === "all" || getMonth(date) === parseInt(filterMonth);
    const yearMatch = filterYear === "all" || getYear(date) === parseInt(filterYear);
    const typeMatch = filterType === "all" || c.transaction_type.toLowerCase() === filterType.toLowerCase();
    const invoiceMatch = filterInvoice === "all" || 
      (filterInvoice === "da" && c.invoice_number) || 
      (filterInvoice === "nu" && !c.invoice_number);
    return monthMatch && yearMatch && typeMatch && invoiceMatch;
  }) || [];

  const totalAmount = filteredCommissions.reduce((sum, c) => sum + c.amount, 0);
  const salesCount = filteredCommissions.filter(c => 
    c.transaction_type.toLowerCase().includes('vânzare') || c.transaction_type.toLowerCase().includes('vanzare')
  ).length;
  const rentCount = filteredCommissions.filter(c => c.transaction_type.toLowerCase().includes('chirie')).length;

  const years = [...new Set(commissions?.map(c => getYear(parseISO(c.date))) || [])].sort((a, b) => b - a);

  const monthlyTotals = MONTHS.map((month, index) => {
    const monthCommissions = commissions?.filter(c => {
      const date = parseISO(c.date);
      return getMonth(date) === index && (filterYear === "all" || getYear(date) === parseInt(filterYear));
    }) || [];
    
    return {
      month,
      total: monthCommissions.reduce((sum, c) => sum + c.amount, 0),
      count: monthCommissions.length,
      salesCount: monthCommissions.filter(c => c.transaction_type.toLowerCase().includes('vânzare') || c.transaction_type.toLowerCase().includes('vanzare')).length,
      rentCount: monthCommissions.filter(c => c.transaction_type.toLowerCase().includes('chirie')).length
    };
  }).filter(m => m.count > 0);

  const getTransactionBadgeColor = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('chirie')) return "bg-blue-500";
    if (lowerType.includes('parcare') || lowerType.includes('boxă') || lowerType.includes('boxa')) return "bg-orange-500";
    return "bg-green-600";
  };

  const handleExportExcel = () => {
    const dataToExport = filteredCommissions.map(c => ({
      "Data": format(parseISO(c.date), "dd.MM.yyyy", { locale: ro }),
      "Sumă": c.amount,
      "Monedă": c.currency,
      "Tip Tranzacție": c.transaction_type,
      "Factură": c.invoice_number || "Nu",
      "Notițe": c.notes || ""
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Comisioane");
    
    const fileName = filterYear !== "all" ? `Comisioane_${filterYear}.xlsx` : `Comisioane_Export.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success("Export Excel realizat cu succes!");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div 
      ref={containerRef}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {isMobile && (
        <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} progress={progress} />
      )}
      
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-gold/40 to-gold/10 rounded-2xl blur-xl" />
              <div className="relative p-3 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20">
                <Euro className="h-6 w-6 text-gold" />
              </div>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Comisioane</h1>
              <p className="text-muted-foreground text-sm">Gestionează comisioanele</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportExcel} size="sm" className="flex-1 sm:flex-none">
              <Download className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            
            <Dialog open={isAddDialogOpen || !!editingCommission} onOpenChange={(open) => {
              if (!open) {
                setIsAddDialogOpen(false);
                setEditingCommission(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsAddDialogOpen(true)} size="sm" className="flex-1 sm:flex-none">
                  <Plus className="mr-1.5 h-4 w-4" />
                  <span className="hidden sm:inline">Adaugă</span>
                </Button>
              </DialogTrigger>
              <DialogContent 
                className="max-w-[95vw] sm:max-w-[425px] max-h-[90vh] overflow-y-auto"
                onPointerDownOutside={(e) => {
                  // Prevent dialog from closing when clicking on Select dropdown (portaled outside dialog)
                  const target = e.target as HTMLElement;
                  if (target?.closest('[data-radix-select-content]') || target?.closest('[role="listbox"]') || target?.closest('[role="option"]')) {
                    e.preventDefault();
                  }
                }}
                onInteractOutside={(e) => {
                  const target = e.target as HTMLElement;
                  if (target?.closest('[data-radix-select-content]') || target?.closest('[role="listbox"]') || target?.closest('[role="option"]')) {
                    e.preventDefault();
                  }
                }}
              >
                <DialogHeader>
                  <DialogTitle className="text-base md:text-lg">
                    {editingCommission ? "Editează Comision" : "Adaugă Comision"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Data</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Sumă</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        placeholder="1000"
                        value={formData.amount}
                        onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Monedă</Label>
                      <Select 
                        value={formData.currency} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="RON">RON</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transaction_type">Tip Tranzacție</Label>
                    <Select 
                      value={formData.transaction_type} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, transaction_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRANSACTION_TYPES.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Factură</Label>
                    <Select 
                      value={formData.has_invoice} 
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        has_invoice: value,
                        invoice_number: value === "nu" ? "" : prev.invoice_number
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="da">Cu Factură</SelectItem>
                        <SelectItem value="nu">Fără Factură</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.has_invoice === "da" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="invoice_number">Număr Factură</Label>
                        <Input
                          id="invoice_number"
                          placeholder="MVA-2025-001"
                          value={formData.invoice_number}
                          onChange={(e) => setFormData(prev => ({ ...prev, invoice_number: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Fișier Factură (PDF)</Label>
                        {existingInvoiceUrl && !invoiceFile && editingCommission && (
                          <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                            <File className="h-4 w-4 text-primary" />
                            <a 
                              href={existingInvoiceUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline truncate flex-1"
                            >
                              Factură existentă
                            </a>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Șterge fișierul facturii?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Această acțiune va șterge permanent fișierul PDF al facturii.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Anulează</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteExistingInvoiceFile(editingCommission.id, existingInvoiceUrl)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Șterge
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                        {invoiceFile ? (
                          <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                            <File className="h-4 w-4 text-primary" />
                            <span className="text-sm truncate flex-1">{invoiceFile.name}</span>
                            <Button type="button" variant="ghost" size="sm" onClick={removeInvoiceFile}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="relative">
                            <Input
                              type="file"
                              accept=".pdf"
                              onChange={handleFileChange}
                              className="hidden"
                              id="invoice-file-input"
                            />
                            <Label
                              htmlFor="invoice-file-input"
                              className="flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-md cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors"
                            >
                              <Upload className="h-4 w-4" />
                              <span className="text-sm">Încarcă PDF factură</span>
                            </Label>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="notes">Note (opțional)</Label>
                    <Input
                      id="notes"
                      placeholder="Detalii suplimentare..."
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={addMutation.isPending || updateMutation.isPending || isUploading}
                  >
                    {(addMutation.isPending || updateMutation.isPending || isUploading) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isUploading ? "Se încarcă..." : "Se salvează..."}
                      </>
                    ) : editingCommission ? "Actualizează" : "Adaugă"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Euro className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
                  <p className="text-lg sm:text-2xl font-bold">€{totalAmount.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Tranzacții</p>
                  <p className="text-lg sm:text-2xl font-bold">{filteredCommissions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Home className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Vânzări</p>
                  <p className="text-lg sm:text-2xl font-bold">{salesCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Key className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Chirii</p>
                  <p className="text-lg sm:text-2xl font-bold">{rentCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Charts Section */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <Card className="hidden sm:block bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <BarChart3 className="h-4 w-4 md:h-5 md:w-5" />
                Evoluție {filterYear !== "all" ? filterYear : ""}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0">
              <div className="h-[200px] md:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTotals} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => value.substring(0, 3)}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                      className="text-muted-foreground"
                      width={45}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`€${value.toLocaleString()}`, 'Total']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))',
                        fontSize: '11px'
                      }}
                    />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="hidden sm:block bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <PieChart className="h-4 w-4 md:h-5 md:w-5" />
                Distribuție Tipuri
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0">
              <div className="h-[250px] md:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={(() => {
                        const typeData: Record<string, number> = {};
                        const yearFilteredCommissions = commissions?.filter(c => {
                          const date = parseISO(c.date);
                          return filterYear === "all" || getYear(date) === parseInt(filterYear);
                        }) || [];
                        
                        yearFilteredCommissions.forEach(c => {
                          const type = c.transaction_type.toLowerCase();
                          let category = 'Vânzări';
                          if (type.includes('chirie')) category = 'Chirii';
                          else if (type.includes('parcare') || type.includes('boxă') || type.includes('boxa')) category = 'Parcare/Boxă';
                          
                          typeData[category] = (typeData[category] || 0) + c.amount;
                        });
                        
                        return Object.entries(typeData).map(([name, value]) => ({ name, value }));
                      })()}
                      cx="50%"
                      cy="45%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ cx, cy, midAngle, outerRadius: or, value, name }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = or + 18;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                          <text x={x} y={y} fill="hsl(var(--foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11}>
                            €{value.toLocaleString()}
                          </text>
                        );
                      }}
                    >
                      <Cell fill="#22c55e" />
                      <Cell fill="#3b82f6" />
                      <Cell fill="#f97316" />
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`€${value.toLocaleString()}`, 'Total']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '11px'
                      }}
                    />
                    <Legend verticalAlign="bottom" height={30} formatter={(value) => <span className="text-xs">{value}</span>} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Monthly Summary */}
        {monthlyTotals.length > 0 && (
          <motion.div variants={itemVariants}>
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader className="flex flex-row items-center justify-between p-4 md:p-6 pb-2 md:pb-3">
                <CardTitle className="text-base md:text-lg">Sumar {filterYear !== "all" ? filterYear : ""}</CardTitle>
                <div className="text-xs md:text-sm text-muted-foreground">
                  <span className="font-bold text-primary">{monthlyTotals.reduce((sum, m) => sum + m.count, 0)}</span> tranzacții
                </div>
              </CardHeader>
              <CardContent className="p-3 md:p-6 pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3">
                  {monthlyTotals.map(({ month, total, salesCount: mSalesCount, rentCount: mRentCount }) => (
                    <div key={month} className="p-2 md:p-3 bg-muted/50 rounded-lg border border-border/50">
                      <p className="text-[10px] md:text-xs font-medium text-muted-foreground text-center mb-1 md:mb-2">{month.substring(0, 3)}</p>
                      <p className="text-xs md:text-base font-bold text-primary text-center mb-1 md:mb-2">€{total.toLocaleString()}</p>
                      <div className="space-y-0.5 md:space-y-1 border-t border-border/50 pt-1 md:pt-2 mt-1 md:mt-2">
                        <div className="flex items-center justify-between text-[9px] md:text-[10px]">
                          <span className="text-green-500">Vânz.</span>
                          <span className="font-medium">{mSalesCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] md:text-[10px]">
                          <span className="text-blue-500">Chir.</span>
                          <span className="font-medium">{mRentCount}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div variants={itemVariants}>
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Filter className="h-5 w-5" />
                  Filtre
                </CardTitle>
                {isMobile && (
                  <MobileFilterSort
                    filters={[
                      { key: "year", label: "An", type: "select", options: [{ value: "all", label: "Toți anii" }, ...years.map(year => ({ value: year.toString(), label: year.toString() }))] },
                      { key: "month", label: "Lună", type: "select", options: [{ value: "all", label: "Toate lunile" }, ...MONTHS.map((month, index) => ({ value: index.toString(), label: month }))] },
                      { key: "type", label: "Tip Tranzacție", type: "select", options: [{ value: "all", label: "Toate tipurile" }, ...TRANSACTION_TYPES.map(type => ({ value: type, label: type }))] },
                      { key: "invoice", label: "Factură", type: "select", options: [{ value: "all", label: "Toate" }, { value: "da", label: "Cu Factură" }, { value: "nu", label: "Fără Factură" }] }
                    ]}
                    filterValues={{ year: filterYear, month: filterMonth, type: filterType, invoice: filterInvoice }}
                    onFilterChange={(key, value) => {
                      if (key === "year") setFilterYear(value);
                      if (key === "month") setFilterMonth(value);
                      if (key === "type") setFilterType(value);
                      if (key === "invoice") setFilterInvoice(value);
                    }}
                    sortOptions={[{ key: "date", label: "Dată" }, { key: "amount", label: "Sumă" }]}
                    onReset={() => { setFilterYear(new Date().getFullYear().toString()); setFilterMonth("all"); setFilterType("all"); setFilterInvoice("all"); }}
                    activeFiltersCount={(filterYear !== new Date().getFullYear().toString() ? 1 : 0) + (filterMonth !== "all" ? 1 : 0) + (filterType !== "all" ? 1 : 0) + (filterInvoice !== "all" ? 1 : 0)}
                  />
                )}
              </div>
            </CardHeader>
            {!isMobile && (
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>An</Label>
                    <Select value={filterYear} onValueChange={setFilterYear}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toți anii</SelectItem>
                        {years.map(year => (<SelectItem key={year} value={year.toString()}>{year}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Lună</Label>
                    <Select value={filterMonth} onValueChange={setFilterMonth}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toate lunile</SelectItem>
                        {MONTHS.map((month, index) => (<SelectItem key={month} value={index.toString()}>{month}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tip Tranzacție</Label>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toate tipurile</SelectItem>
                        {TRANSACTION_TYPES.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Factură</Label>
                    <Select value={filterInvoice} onValueChange={setFilterInvoice}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toate</SelectItem>
                        <SelectItem value="da">Cu Factură</SelectItem>
                        <SelectItem value="nu">Fără Factură</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </motion.div>

        {/* Commissions List */}
        <motion.div variants={itemVariants}>
          {filteredCommissions.length === 0 ? (
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Lista Comisioane (0)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center py-8 text-muted-foreground">Nu există comisioane pentru filtrele selectate</p>
              </CardContent>
            </Card>
          ) : (
            (() => {
              const groupedByMonth: Record<string, typeof filteredCommissions> = {};
              filteredCommissions.forEach(commission => {
                const date = parseISO(commission.date);
                const monthKey = format(date, 'yyyy-MM');
                if (!groupedByMonth[monthKey]) groupedByMonth[monthKey] = [];
                groupedByMonth[monthKey].push(commission);
              });

              return Object.keys(groupedByMonth).sort((a, b) => b.localeCompare(a)).map(monthKey => {
                const monthCommissions = groupedByMonth[monthKey];
                const monthDate = parseISO(monthKey + '-01');
                const monthLabel = format(monthDate, 'MMMM yyyy', { locale: ro });
                const monthTotal = monthCommissions.reduce((sum, c) => sum + c.amount, 0);
                const isExpanded = expandedMonths.has(monthKey);
                
                const toggleMonth = () => {
                  setExpandedMonths(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(monthKey)) newSet.delete(monthKey);
                    else newSet.add(monthKey);
                    return newSet;
                  });
                };

                return (
                  <Collapsible key={monthKey} open={isExpanded} onOpenChange={toggleMonth}>
                    <Card className="bg-card/50 backdrop-blur-sm border-border/50 mb-4">
                      <CollapsibleTrigger asChild>
                        <CardHeader className="pb-0 cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between pb-3">
                            <div className="flex items-center gap-2">
                              {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                              <CardTitle className="text-lg capitalize">{monthLabel}</CardTitle>
                            </div>
                            <span className="font-bold text-primary">€{monthTotal.toLocaleString()}</span>
                          </div>
                          <div className="h-[2px] bg-gradient-to-r from-gold/50 via-gold to-gold/50 rounded-full" />
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="p-3 sm:p-6 pt-3">
                          {isMobile ? (
                            <div className="space-y-3">
                              {[...monthCommissions].sort((a, b) => a.date.localeCompare(b.date)).map((commission) => (
                                <MobileTableCard key={commission.id}>
                                  <MobileCardHeader
                                    title={<div className="flex items-center gap-2"><span className="font-bold text-primary">€{commission.amount.toLocaleString()}</span>{commission.invoice_file_url && <FileText className="h-4 w-4 text-green-500" />}</div>}
                                    subtitle={format(parseISO(commission.date), "dd MMMM yyyy", { locale: ro })}
                                    badge={<Badge className={`${getTransactionBadgeColor(commission.transaction_type)} text-white text-xs`}>{commission.transaction_type}</Badge>}
                                  />
                                  <MobileCardRow label="Factură" icon={<FileText className="h-3 w-3" />}>
                                    <Badge variant={commission.invoice_number ? "destructive" : "default"} className={`text-xs ${!commission.invoice_number ? 'bg-green-600' : ''}`}>{commission.invoice_number ? "Da" : "Nu"}</Badge>
                                  </MobileCardRow>
                                  {commission.notes && <MobileCardRow label="Notițe" icon={<FileText className="h-3 w-3" />}><span className="text-sm truncate max-w-[150px]">{commission.notes}</span></MobileCardRow>}
                                  <MobileCardActions>
                                    {commission.invoice_file_url && (
                                      <>
                                        <Button variant="ghost" size="icon" onClick={() => setPreviewPdfUrl(commission.invoice_file_url)}><Eye className="h-4 w-4 text-primary" /></Button>
                                        <Button variant="ghost" size="icon" asChild><a href={commission.invoice_file_url} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4" /></a></Button>
                                      </>
                                    )}
                                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(commission)}><Edit className="h-4 w-4" /></Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>Șterge comisionul</AlertDialogTitle><AlertDialogDescription>Ești sigur că vrei să ștergi acest comision?</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel>Anulează</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate(commission.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Șterge</AlertDialogAction></AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </MobileCardActions>
                                </MobileTableCard>
                              ))}
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Sumă</TableHead>
                                    <TableHead>Tip</TableHead>
                                    <TableHead>Factură</TableHead>
                                    <TableHead className="text-right">Acțiuni</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {[...monthCommissions].sort((a, b) => a.date.localeCompare(b.date)).map((commission) => (
                                    <TableRow key={commission.id}>
                                      <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                          <Calendar className="h-4 w-4 text-muted-foreground hidden sm:block" />
                                          {format(parseISO(commission.date), "dd MMM", { locale: ro })}
                                          {commission.invoice_file_url && <span title="Factură PDF atașată"><FileText className="h-4 w-4 text-green-500" /></span>}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center gap-1 font-bold text-primary">
                                          <Euro className="h-3 w-3" />
                                          {commission.amount.toLocaleString()}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <Badge className={`${getTransactionBadgeColor(commission.transaction_type)} text-white`}>{commission.transaction_type}</Badge>
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant={commission.invoice_number ? "destructive" : "default"} className={!commission.invoice_number ? 'bg-green-600 text-white' : ''}>{commission.invoice_number ? "Da" : "Nu"}</Badge>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                          {commission.invoice_file_url && (
                                            <>
                                              <Button variant="ghost" size="icon" onClick={() => setPreviewPdfUrl(commission.invoice_file_url)} title="Previzualizare"><Eye className="h-4 w-4" /></Button>
                                              <Button variant="ghost" size="icon" asChild title="Descarcă"><a href={commission.invoice_file_url} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4" /></a></Button>
                                            </>
                                          )}
                                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(commission)}><Edit className="h-4 w-4" /></Button>
                                          <AlertDialog>
                                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                            <AlertDialogContent>
                                              <AlertDialogHeader><AlertDialogTitle>Șterge comisionul</AlertDialogTitle><AlertDialogDescription>Ești sigur că vrei să ștergi acest comision de {commission.amount.toLocaleString()} {commission.currency}?</AlertDialogDescription></AlertDialogHeader>
                                              <AlertDialogFooter><AlertDialogCancel>Anulează</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate(commission.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Șterge</AlertDialogAction></AlertDialogFooter>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              });
            })()
          )}
        </motion.div>

        {/* PDF Preview Modal */}
        <Dialog open={!!previewPdfUrl} onOpenChange={(open) => !open && setPreviewPdfUrl(null)}>
          <DialogContent className="max-w-4xl h-[85vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Previzualizare Factură
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 h-full min-h-0">
              {previewPdfUrl && (
                <iframe src={previewPdfUrl} className="w-full h-[calc(85vh-100px)] rounded-lg border" title="Previzualizare PDF" />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>
  );
};

export default CommissionsPage;

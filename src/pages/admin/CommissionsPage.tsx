import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
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
  Download
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

interface Commission {
  id: string;
  date: string;
  amount: number;
  currency: string;
  invoice_number: string | null;
  transaction_type: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const TRANSACTION_TYPES = [
  "vânzare",
  "chirie",
  "colaborare vânzare"
];

const MONTHS = [
  "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
  "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"
];

const CommissionsPage = () => {
  const queryClient = useQueryClient();
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
    invoice_number: "",
    transaction_type: "vânzare",
    notes: ""
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
      const { error } = await supabase
        .from('commissions')
        .insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      toast.success("Comision adăugat cu succes!");
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Error adding commission:', error);
      toast.error("Eroare la adăugarea comisionului");
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Commission> }) => {
      const { error } = await supabase
        .from('commissions')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      toast.success("Comision actualizat cu succes!");
      setEditingCommission(null);
      resetForm();
    },
    onError: (error) => {
      console.error('Error updating commission:', error);
      toast.error("Eroare la actualizarea comisionului");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('commissions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      toast.success("Comision șters cu succes!");
    },
    onError: (error) => {
      console.error('Error deleting commission:', error);
      toast.error("Eroare la ștergerea comisionului");
    }
  });

  const resetForm = () => {
    setFormData({
      date: "",
      amount: "",
      currency: "EUR",
      invoice_number: "",
      transaction_type: "vânzare",
      notes: ""
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      date: formData.date,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      invoice_number: formData.invoice_number || null,
      transaction_type: formData.transaction_type,
      notes: formData.notes || null
    };

    if (editingCommission) {
      updateMutation.mutate({ id: editingCommission.id, data });
    } else {
      addMutation.mutate(data);
    }
  };

  const openEditDialog = (commission: Commission) => {
    setEditingCommission(commission);
    setFormData({
      date: commission.date,
      amount: commission.amount.toString(),
      currency: commission.currency,
      invoice_number: commission.invoice_number || "",
      transaction_type: commission.transaction_type,
      notes: commission.notes || ""
    });
  };

  // Filter commissions
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

  // Calculate statistics
  const totalAmount = filteredCommissions.reduce((sum, c) => sum + c.amount, 0);
  const salesCount = filteredCommissions.filter(c => 
    c.transaction_type.toLowerCase().includes('vânzare') || 
    c.transaction_type.toLowerCase().includes('vanzare')
  ).length;
  const rentCount = filteredCommissions.filter(c => 
    c.transaction_type.toLowerCase().includes('chirie')
  ).length;

  // Get unique years from data
  const years = [...new Set(commissions?.map(c => getYear(parseISO(c.date))) || [])].sort((a, b) => b - a);

  // Group by month for summary
  const monthlyTotals = MONTHS.map((month, index) => {
    const monthCommissions = commissions?.filter(c => {
      const date = parseISO(c.date);
      return getMonth(date) === index && (filterYear === "all" || getYear(date) === parseInt(filterYear));
    }) || [];
    
    // Count by transaction type
    const salesCount = monthCommissions.filter(c => 
      c.transaction_type.toLowerCase().includes('vânzare') || 
      c.transaction_type.toLowerCase().includes('vanzare')
    ).length;
    const rentCount = monthCommissions.filter(c => 
      c.transaction_type.toLowerCase().includes('chirie')
    ).length;
    const collaborationCount = monthCommissions.filter(c => 
      c.transaction_type.toLowerCase().includes('colaborare')
    ).length;
    
    return {
      month,
      total: monthCommissions.reduce((sum, c) => sum + c.amount, 0),
      count: monthCommissions.length,
      salesCount,
      rentCount,
      collaborationCount
    };
  }).filter(m => m.count > 0);

  const getTransactionBadgeColor = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('chirie')) return "bg-blue-500";
    if (lowerType.includes('colaborare')) return "bg-purple-500";
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
    
    const fileName = filterYear !== "all" 
      ? `Comisioane_${filterYear}.xlsx` 
      : `Comisioane_Export.xlsx`;
    
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Comisioane</h1>
          <p className="text-muted-foreground">Gestionează comisioanele din tranzacții</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          
          <Dialog open={isAddDialogOpen || !!editingCommission} onOpenChange={(open) => {
            if (!open) {
              setIsAddDialogOpen(false);
              setEditingCommission(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adaugă Comision
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingCommission ? "Editează Comision" : "Adaugă Comision Nou"}
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
                <Label htmlFor="invoice_number">Număr Factură (opțional)</Label>
                <Input
                  id="invoice_number"
                  placeholder="MVA-2025-001"
                  value={formData.invoice_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoice_number: e.target.value }))}
                />
              </div>

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
                disabled={addMutation.isPending || updateMutation.isPending}
              >
                {(addMutation.isPending || updateMutation.isPending) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Se salvează...
                  </>
                ) : editingCommission ? "Actualizează" : "Adaugă"}
              </Button>
            </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
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
        
        <Card>
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
        
        <Card>
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
        
        <Card>
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
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5" />
              Evoluție Lunară {filterYear !== "all" ? filterYear : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTotals} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => value.substring(0, 3)}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    formatter={(value: number) => [`€${value.toLocaleString()}`, 'Total']}
                    labelFormatter={(label) => label}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="total" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Types Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <PieChart className="h-5 w-5" />
              Distribuție pe Tipuri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
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
                        else if (type.includes('colaborare')) category = 'Colaborări';
                        else if (type.includes('parcare') || type.includes('boxă') || type.includes('boxa')) category = 'Parcare/Boxă';
                        
                        typeData[category] = (typeData[category] || 0) + c.amount;
                      });
                      
                      return Object.entries(typeData).map(([name, value]) => ({ name, value }));
                    })()}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ cx, cy, midAngle, outerRadius, name, percent, value }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = outerRadius + 35;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      return (
                        <text
                          x={x}
                          y={y}
                          fill="hsl(var(--foreground))"
                          textAnchor={x > cx ? 'start' : 'end'}
                          dominantBaseline="central"
                          fontSize={11}
                          fontWeight={500}
                        >
                          {`${name} ${(percent * 100).toFixed(0)}%`}
                          <tspan x={x} dy={14} fontSize={10} fill="hsl(var(--muted-foreground))">
                            €{value.toLocaleString()}
                          </tspan>
                        </text>
                      );
                    }}
                    labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                  >
                    {[
                      { name: 'Vânzări', color: '#22c55e' },
                      { name: 'Chirii', color: '#3b82f6' },
                      { name: 'Colaborări', color: '#a855f7' },
                      { name: 'Parcare/Boxă', color: '#f97316' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`€${value.toLocaleString()}`, 'Total']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Facturi Emise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={(() => {
                      const yearFilteredCommissions = commissions?.filter(c => {
                        const date = parseISO(c.date);
                        return filterYear === "all" || getYear(date) === parseInt(filterYear);
                      }) || [];
                      
                      const withInvoice = yearFilteredCommissions.filter(c => c.invoice_number).reduce((sum, c) => sum + c.amount, 0);
                      const withoutInvoice = yearFilteredCommissions.filter(c => !c.invoice_number).reduce((sum, c) => sum + c.amount, 0);
                      
                      return [
                        { name: 'Cu Factură', value: withInvoice },
                        { name: 'Fără Factură', value: withoutInvoice }
                      ];
                    })()}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ cx, cy, midAngle, outerRadius, name, percent }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = outerRadius + 25;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      return (
                        <text
                          x={x}
                          y={y}
                          fill="hsl(var(--foreground))"
                          textAnchor={x > cx ? 'start' : 'end'}
                          dominantBaseline="central"
                          fontSize={11}
                          fontWeight={500}
                        >
                          {`${name} ${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                    labelLine={false}
                  >
                    <Cell fill="#ef4444" />
                    <Cell fill="#22c55e" />
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`€${value.toLocaleString()}`, 'Total']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Summary Cards */}
      {monthlyTotals.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Sumar Lunar {filterYear !== "all" ? filterYear : ""}</CardTitle>
            <div className="text-sm text-muted-foreground">
              Total: <span className="font-bold text-primary">{monthlyTotals.reduce((sum, m) => sum + m.count, 0)} tranzacții</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {monthlyTotals.map(({ month, total, count, salesCount, rentCount, collaborationCount }) => (
                <div key={month} className="p-3 bg-muted/50 rounded-lg border border-border/50">
                  <p className="text-xs font-medium text-muted-foreground text-center mb-2">{month}</p>
                  <p className="text-sm sm:text-base font-bold text-primary text-center">€{total.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground text-center mb-2">{count} tranzacții</p>
                  <div className="space-y-1 border-t border-border/50 pt-2 mt-2">
                    <div className="flex items-center justify-between text-[10px] pb-1 border-b border-border/30 mb-1">
                      <span className="text-foreground font-semibold">Total</span>
                      <span className="font-bold text-foreground">{count}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-green-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        Vânzări
                      </span>
                      <span className="font-medium text-foreground">{salesCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-blue-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        Chirii
                      </span>
                      <span className="font-medium text-foreground">{rentCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-purple-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                        Colaborări
                      </span>
                      <span className="font-medium text-foreground">{collaborationCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filtre
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>An</Label>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toți anii</SelectItem>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Lună</Label>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate lunile</SelectItem>
                  {MONTHS.map((month, index) => (
                    <SelectItem key={month} value={index.toString()}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Tip Tranzacție</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate tipurile</SelectItem>
                  {TRANSACTION_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Factură</Label>
              <Select value={filterInvoice} onValueChange={setFilterInvoice}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate</SelectItem>
                  <SelectItem value="da">Cu Factură</SelectItem>
                  <SelectItem value="nu">Fără Factură</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commissions Table - Grouped by Month */}
      {(() => {
        // Group commissions by month
        const groupedByMonth: Record<string, typeof filteredCommissions> = {};
        filteredCommissions.forEach(commission => {
          const date = parseISO(commission.date);
          const monthKey = format(date, 'yyyy-MM');
          const monthLabel = format(date, 'MMMM yyyy', { locale: ro });
          if (!groupedByMonth[monthKey]) {
            groupedByMonth[monthKey] = [];
          }
          groupedByMonth[monthKey].push(commission);
        });

        const sortedMonths = Object.keys(groupedByMonth).sort((a, b) => a.localeCompare(b));

        if (filteredCommissions.length === 0) {
          return (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lista Comisioane (0)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center py-8 text-muted-foreground">
                  Nu există comisioane pentru filtrele selectate
                </p>
              </CardContent>
            </Card>
          );
        }

        return sortedMonths.map(monthKey => {
          const monthCommissions = groupedByMonth[monthKey];
          const monthDate = parseISO(monthKey + '-01');
          const monthLabel = format(monthDate, 'MMMM yyyy', { locale: ro });
          const monthTotal = monthCommissions.reduce((sum, c) => sum + c.amount, 0);

          const isExpanded = expandedMonths.has(monthKey);
          
          const toggleMonth = () => {
            setExpandedMonths(prev => {
              const newSet = new Set(prev);
              if (newSet.has(monthKey)) {
                newSet.delete(monthKey);
              } else {
                newSet.add(monthKey);
              }
              return newSet;
            });
          };

          return (
            <Collapsible key={monthKey} open={isExpanded} onOpenChange={toggleMonth}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="pb-0 cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between pb-3">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                        <CardTitle className="text-lg capitalize">{monthLabel}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{monthCommissions.length} tranzacții</span>
                        <span className="font-bold text-primary">€{monthTotal.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="h-[2px] bg-gradient-to-r from-gold/50 via-gold to-gold/50 rounded-full" />
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="p-0 sm:p-6 pt-3 sm:pt-3">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Sumă</TableHead>
                            <TableHead>Tip</TableHead>
                            <TableHead className="hidden sm:table-cell">Factură</TableHead>
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
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 font-bold text-primary">
                                  <Euro className="h-3 w-3" />
                                  {commission.amount.toLocaleString()}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={commission.transaction_type}
                                  onValueChange={(value) => {
                                    updateMutation.mutate({
                                      id: commission.id,
                                      data: { transaction_type: value }
                                    });
                                  }}
                                >
                                  <SelectTrigger className={`w-[140px] h-8 ${getTransactionBadgeColor(commission.transaction_type)} text-white border-0 text-[10px] sm:text-xs font-medium`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {TRANSACTION_TYPES.map(type => (
                                      <SelectItem key={type} value={type}>
                                        <div className="flex items-center gap-2">
                                          <div className={`w-2 h-2 rounded-full ${getTransactionBadgeColor(type)}`} />
                                          {type}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                <Select
                                  value={commission.invoice_number ? "da" : "nu"}
                                  onValueChange={(value) => {
                                    updateMutation.mutate({
                                      id: commission.id,
                                      data: { invoice_number: value === "da" ? "Da" : null }
                                    });
                                  }}
                                >
                                  <SelectTrigger className={`w-[80px] h-8 text-xs font-medium ${commission.invoice_number ? 'bg-red-500 text-white border-0' : 'bg-green-600 text-white border-0'}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="da">
                                      <span className="text-red-500 font-medium">Da</span>
                                    </SelectItem>
                                    <SelectItem value="nu">
                                      <span className="text-green-600 font-medium">Nu</span>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditDialog(commission)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        });
      })()}
    </div>
  );
};

export default CommissionsPage;

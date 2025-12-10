import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Filter
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO, startOfMonth, endOfMonth, getMonth, getYear } from "date-fns";
import { ro } from "date-fns/locale";

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
  "vânzare parcare",
  "vânzare boxă",
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
    return monthMatch && yearMatch && typeMatch;
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
    return {
      month,
      total: monthCommissions.reduce((sum, c) => sum + c.amount, 0),
      count: monthCommissions.length
    };
  }).filter(m => m.count > 0);

  const getTransactionBadgeColor = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('chirie')) return "bg-blue-500";
    if (lowerType.includes('colaborare')) return "bg-purple-500";
    if (lowerType.includes('parcare') || lowerType.includes('boxă') || lowerType.includes('boxa')) return "bg-orange-500";
    return "bg-green-600";
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

      {/* Monthly Summary */}
      {monthlyTotals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sumar Lunar {filterYear !== "all" ? filterYear : ""}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {monthlyTotals.map(({ month, total, count }) => (
                <div key={month} className="p-3 bg-muted/50 rounded-lg text-center">
                  <p className="text-xs font-medium text-muted-foreground">{month}</p>
                  <p className="text-sm sm:text-base font-bold text-primary">€{total.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">{count} tranzacții</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          </div>
        </CardContent>
      </Card>

      {/* Commissions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lista Comisioane ({filteredCommissions.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Sumă</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead className="hidden sm:table-cell">Factură</TableHead>
                  <TableHead className="hidden md:table-cell">Note</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCommissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nu există comisioane pentru filtrele selectate
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCommissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground hidden sm:block" />
                          {format(parseISO(commission.date), "dd MMM yyyy", { locale: ro })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 font-bold text-primary">
                          <Euro className="h-3 w-3" />
                          {commission.amount.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getTransactionBadgeColor(commission.transaction_type)} text-white text-[10px] sm:text-xs`}>
                          {commission.transaction_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {commission.invoice_number ? (
                          <div className="flex items-center gap-1 text-sm">
                            <FileText className="h-3 w-3" />
                            {commission.invoice_number}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                        {commission.notes || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(commission)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Șterge Comision</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Ești sigur că vrei să ștergi acest comision de €{commission.amount.toLocaleString()}? Această acțiune nu poate fi anulată.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Anulează</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(commission.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Șterge
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommissionsPage;

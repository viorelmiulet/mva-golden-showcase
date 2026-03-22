import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Home,
  Trash2,
  Edit,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  RefreshCw,
  CalendarCheck,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileTableCard, MobileCardRow, MobileCardActions, MobileCardHeader } from "@/components/admin/MobileTableCard";

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

interface ViewingAppointment {
  id: string;
  created_at: string;
  updated_at: string;
  property_id: string | null;
  property_title: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  preferred_date: string;
  preferred_time: string;
  message: string | null;
  status: string;
  notes: string | null;
}

const statusConfig = {
  pending: { label: "În așteptare", color: "bg-yellow-500", icon: AlertCircle },
  confirmed: { label: "Confirmat", color: "bg-green-500", icon: CheckCircle },
  completed: { label: "Finalizat", color: "bg-blue-500", icon: CheckCircle },
  cancelled: { label: "Anulat", color: "bg-red-500", icon: XCircle },
};

const ViewingAppointmentsPage = () => {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingAppointment, setEditingAppointment] = useState<ViewingAppointment | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState("");

  const { data: appointments, isLoading, refetch } = useQuery({
    queryKey: ['viewing-appointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('viewing_appointments')
        .select('*')
        .order('preferred_date', { ascending: true })
        .order('preferred_time', { ascending: true });
      
      if (error) throw error;
      return data as ViewingAppointment[];
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      const { error } = await supabase
        .from('viewing_appointments')
        .update({ status, notes })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['viewing-appointments'] });
      toast.success("Programarea a fost actualizată");
      setEditingAppointment(null);
    },
    onError: (error) => {
      console.error('Error updating appointment:', error);
      toast.error("Eroare la actualizarea programării");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('viewing_appointments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['viewing-appointments'] });
      toast.success("Programarea a fost ștearsă");
    },
    onError: (error) => {
      console.error('Error deleting appointment:', error);
      toast.error("Eroare la ștergerea programării");
    }
  });

  const filteredAppointments = appointments?.filter(apt => {
    const matchesSearch = 
      apt.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.customer_phone.includes(searchTerm) ||
      apt.property_title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (appointment: ViewingAppointment) => {
    setEditingAppointment(appointment);
    setEditNotes(appointment.notes || "");
    setEditStatus(appointment.status);
  };

  const handleSaveEdit = () => {
    if (!editingAppointment) return;
    updateMutation.mutate({
      id: editingAppointment.id,
      status: editStatus,
      notes: editNotes
    });
  };

  const handleWhatsApp = (appointment: ViewingAppointment) => {
    const message = `Bună ziua, ${appointment.customer_name}! Vă contactăm referitor la vizionarea programată pentru ${appointment.property_title} în data de ${format(new Date(appointment.preferred_date), 'dd MMMM yyyy', { locale: ro })} la ora ${appointment.preferred_time}.`;
    window.open(`https://wa.me/${appointment.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const pendingCount = appointments?.filter(a => a.status === 'pending').length || 0;
  const confirmedCount = appointments?.filter(a => a.status === 'confirmed').length || 0;
  const todayCount = appointments?.filter(a => a.preferred_date === new Date().toISOString().split('T')[0]).length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-gold/40 to-gold/10 rounded-2xl blur-xl" />
            <div className="relative p-3 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 shadow-lg shadow-gold/10">
              <CalendarCheck className="h-6 w-6 text-gold" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Programări Vizionări</h1>
            <p className="text-muted-foreground/70 text-sm">Gestionează cererile de vizionare</p>
          </div>
        </div>
        <Button onClick={() => refetch()} variant="outline" className="border-white/10 hover:bg-white/5">
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizează
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative group">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20 opacity-0 group-hover:opacity-50 transition-opacity blur-xl" />
          <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-5 hover:border-yellow-500/30 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <AlertCircle className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground/70">În așteptare</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative group">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 opacity-0 group-hover:opacity-50 transition-opacity blur-xl" />
          <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-5 hover:border-emerald-500/30 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground/70">Confirmate</p>
                <p className="text-2xl font-bold">{confirmedCount}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative group">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-50 transition-opacity blur-xl" />
          <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-5 hover:border-blue-500/30 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Calendar className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground/70">Azi</p>
                <p className="text-2xl font-bold">{todayCount}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants}>
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-4 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Caută după nume, telefon sau proprietate..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 focus:border-gold/50"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-white/5 border-white/10">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-popover/95 backdrop-blur-xl border-white/10">
                <SelectItem value="all">Toate</SelectItem>
                <SelectItem value="pending">În așteptare</SelectItem>
                <SelectItem value="confirmed">Confirmate</SelectItem>
                <SelectItem value="completed">Finalizate</SelectItem>
                <SelectItem value="cancelled">Anulate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      {/* Appointments */}
      <motion.div variants={itemVariants}>
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent overflow-hidden backdrop-blur-sm">
          <div className="p-6 border-b border-white/5">
            <h3 className="text-lg font-semibold">Lista programărilor ({filteredAppointments?.length || 0})</h3>
          </div>
          <div className="p-6">
          {filteredAppointments && filteredAppointments.length > 0 ? (
            isMobile ? (
              /* Mobile Card View */
              <div className="space-y-3">
                {filteredAppointments.map((apt) => {
                  const config = statusConfig[apt.status as keyof typeof statusConfig] || statusConfig.pending;
                  const StatusIcon = config.icon;
                  const isToday = apt.preferred_date === new Date().toISOString().split('T')[0];
                  
                  return (
                    <MobileTableCard key={apt.id} highlight={isToday}>
                      <MobileCardHeader
                        title={apt.customer_name}
                        subtitle={apt.property_title}
                        badge={
                          <Badge className={`${config.color} text-white gap-1 text-xs`}>
                            <StatusIcon className="w-3 h-3" />
                            {config.label}
                          </Badge>
                        }
                      />
                      <MobileCardRow label="Telefon" icon={<Phone className="h-3 w-3" />}>
                        <span className="text-sm">{apt.customer_phone}</span>
                      </MobileCardRow>
                      <MobileCardRow label="Data" icon={<Calendar className="h-3 w-3" />}>
                        <div className="flex items-center gap-1">
                          <span className="text-sm">{format(new Date(apt.preferred_date), 'dd MMM', { locale: ro })}</span>
                          {isToday && <Badge variant="secondary" className="text-[10px] px-1">Azi</Badge>}
                        </div>
                      </MobileCardRow>
                      <MobileCardRow label="Ora" icon={<Clock className="h-3 w-3" />}>
                        <span className="text-sm">{apt.preferred_time}</span>
                      </MobileCardRow>
                      {apt.message && (
                        <MobileCardRow label="Mesaj" icon={<MessageSquare className="h-3 w-3" />}>
                          <span className="text-sm truncate max-w-[150px]">{apt.message}</span>
                        </MobileCardRow>
                      )}
                      <MobileCardActions>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleWhatsApp(apt)}
                          aria-label="Trimite mesaj pe WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCall(apt.customer_phone)}
                          aria-label="Apelează clientul"
                        >
                          <Phone className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(apt)}
                          aria-label="Editează programarea"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Sigur doriți să ștergeți această programare?")) {
                              deleteMutation.mutate(apt.id);
                            }
                          }}
                          aria-label="Șterge programarea"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </MobileCardActions>
                    </MobileTableCard>
                  );
                })}
              </div>
            ) : (
              /* Desktop Table View */
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Proprietate</TableHead>
                      <TableHead>Data & Ora</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Acțiuni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAppointments.map((apt) => {
                      const config = statusConfig[apt.status as keyof typeof statusConfig] || statusConfig.pending;
                      const StatusIcon = config.icon;
                      const isToday = apt.preferred_date === new Date().toISOString().split('T')[0];
                      
                      return (
                        <TableRow key={apt.id} className={isToday ? "bg-primary/5" : ""}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 font-medium">
                                <User className="w-4 h-4 text-muted-foreground" />
                                {apt.customer_name}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="w-3 h-3" />
                                {apt.customer_phone}
                              </div>
                              {apt.customer_email && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Mail className="w-3 h-3" />
                                  {apt.customer_email}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Home className="w-4 h-4 text-primary" />
                              <span className="max-w-[200px] truncate">{apt.property_title}</span>
                            </div>
                            {apt.message && (
                              <div className="mt-1 text-xs text-muted-foreground max-w-[200px] truncate">
                                💬 {apt.message}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                {format(new Date(apt.preferred_date), 'dd MMM yyyy', { locale: ro })}
                                {isToday && <Badge variant="secondary" className="text-xs">Azi</Badge>}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {apt.preferred_time}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${config.color} text-white gap-1`}>
                              <StatusIcon className="w-3 h-3" />
                              {config.label}
                            </Badge>
                            {apt.notes && (
                              <div className="mt-1 text-xs text-muted-foreground max-w-[150px] truncate">
                                📝 {apt.notes}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleWhatsApp(apt)}
                                title="WhatsApp"
                                aria-label="Trimite mesaj pe WhatsApp"
                              >
                                <MessageSquare className="w-4 h-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCall(apt.customer_phone)}
                                title="Apelează"
                                aria-label="Apelează clientul"
                              >
                                <Phone className="w-4 h-4 text-blue-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(apt)}
                                title="Editează"
                                aria-label="Editează programarea"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (confirm("Sigur doriți să ștergeți această programare?")) {
                                    deleteMutation.mutate(apt.id);
                                  }
                                }}
                                title="Șterge"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nu există programări</p>
            </div>
          )}
          </div>
        </div>
      </motion.div>

      {/* Edit Dialog */}
      <Dialog open={!!editingAppointment} onOpenChange={(open) => !open && setEditingAppointment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editează Programarea</DialogTitle>
          </DialogHeader>
          {editingAppointment && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="font-medium">{editingAppointment.customer_name}</p>
                <p className="text-sm text-muted-foreground">{editingAppointment.property_title}</p>
                <p className="text-sm">
                  {format(new Date(editingAppointment.preferred_date), 'dd MMMM yyyy', { locale: ro })} la {editingAppointment.preferred_time}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">În așteptare</SelectItem>
                    <SelectItem value="confirmed">Confirmat</SelectItem>
                    <SelectItem value="completed">Finalizat</SelectItem>
                    <SelectItem value="cancelled">Anulat</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Note interne</label>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Adaugă note despre această programare..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditingAppointment(null)}
                >
                  Anulează
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSaveEdit}
                  disabled={updateMutation.isPending}
                >
                  Salvează
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default ViewingAppointmentsPage;

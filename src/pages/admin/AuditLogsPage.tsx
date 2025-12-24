import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  History, 
  Search, 
  Eye, 
  Plus, 
  Pencil, 
  Trash2, 
  Download, 
  LogIn, 
  LogOut,
  FileText,
  Mail,
  Upload,
  RefreshCw,
} from "lucide-react";

interface AuditLog {
  id: string;
  created_at: string;
  user_id: string | null;
  user_email: string | null;
  action_type: string;
  table_name: string | null;
  record_id: string | null;
  record_title: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  user_agent: string | null;
}

const actionTypeLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  create: { label: "Creare", color: "bg-green-500/20 text-green-400", icon: <Plus className="h-3 w-3" /> },
  update: { label: "Modificare", color: "bg-blue-500/20 text-blue-400", icon: <Pencil className="h-3 w-3" /> },
  delete: { label: "Ștergere", color: "bg-red-500/20 text-red-400", icon: <Trash2 className="h-3 w-3" /> },
  view: { label: "Vizualizare", color: "bg-gray-500/20 text-gray-400", icon: <Eye className="h-3 w-3" /> },
  export: { label: "Export", color: "bg-purple-500/20 text-purple-400", icon: <Download className="h-3 w-3" /> },
  import: { label: "Import", color: "bg-orange-500/20 text-orange-400", icon: <Upload className="h-3 w-3" /> },
  login: { label: "Autentificare", color: "bg-emerald-500/20 text-emerald-400", icon: <LogIn className="h-3 w-3" /> },
  logout: { label: "Deconectare", color: "bg-yellow-500/20 text-yellow-400", icon: <LogOut className="h-3 w-3" /> },
  generate_pdf: { label: "Generare PDF", color: "bg-indigo-500/20 text-indigo-400", icon: <FileText className="h-3 w-3" /> },
  send_email: { label: "Trimitere Email", color: "bg-cyan-500/20 text-cyan-400", icon: <Mail className="h-3 w-3" /> },
  sign_contract: { label: "Semnare Contract", color: "bg-gold/20 text-gold", icon: <FileText className="h-3 w-3" /> },
};

const tableNameLabels: Record<string, string> = {
  catalog_offers: "Proprietăți",
  real_estate_projects: "Proiecte",
  complexes: "Complexe",
  contracts: "Contracte",
  clients: "Clienți",
  commissions: "Comisioane",
  viewing_appointments: "Vizionări",
  business_cards: "Cărți Vizită",
  user_roles: "Roluri Utilizatori",
  profiles: "Profile",
  contract_inventory: "Inventar Contract",
  site_settings: "Setări Site",
};

const AuditLogsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ["audit-logs", page, actionFilter, tableFilter, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (actionFilter !== "all") {
        query = query.eq("action_type", actionFilter);
      }
      if (tableFilter !== "all") {
        query = query.eq("table_name", tableFilter);
      }
      if (searchTerm) {
        query = query.or(`user_email.ilike.%${searchTerm}%,record_title.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AuditLog[];
    },
  });

  const getActionBadge = (actionType: string) => {
    const config = actionTypeLabels[actionType] || { 
      label: actionType, 
      color: "bg-gray-500/20 text-gray-400",
      icon: <Eye className="h-3 w-3" />
    };
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getTableLabel = (tableName: string | null) => {
    if (!tableName) return "-";
    return tableNameLabels[tableName] || tableName;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy, HH:mm", { locale: ro });
  };

  const JsonViewer = ({ data, title }: { data: Record<string, unknown> | null; title: string }) => {
    if (!data) return <span className="text-muted-foreground">-</span>;
    
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 px-2">
            <Eye className="h-3 w-3 mr-1" />
            Vezi
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <History className="h-8 w-8 text-gold" />
          <div>
            <h1 className="text-2xl font-bold">Istoric Activități</h1>
            <p className="text-muted-foreground">Toate acțiunile efectuate în panoul de administrare</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reîmprospătează
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtre</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Caută după email sau titlu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tip acțiune" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate acțiunile</SelectItem>
                <SelectItem value="create">Creare</SelectItem>
                <SelectItem value="update">Modificare</SelectItem>
                <SelectItem value="delete">Ștergere</SelectItem>
                <SelectItem value="export">Export</SelectItem>
                <SelectItem value="import">Import</SelectItem>
                <SelectItem value="login">Autentificare</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tableFilter} onValueChange={setTableFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tabel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate tabelele</SelectItem>
                <SelectItem value="catalog_offers">Proprietăți</SelectItem>
                <SelectItem value="contracts">Contracte</SelectItem>
                <SelectItem value="clients">Clienți</SelectItem>
                <SelectItem value="commissions">Comisioane</SelectItem>
                <SelectItem value="viewing_appointments">Vizionări</SelectItem>
                <SelectItem value="complexes">Complexe</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
            </div>
          ) : logs && logs.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Utilizator</TableHead>
                      <TableHead>Acțiune</TableHead>
                      <TableHead>Tabel</TableHead>
                      <TableHead>Înregistrare</TableHead>
                      <TableHead>Date Vechi</TableHead>
                      <TableHead>Date Noi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {formatDate(log.created_at)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.user_email || "-"}
                        </TableCell>
                        <TableCell>
                          {getActionBadge(log.action_type)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {getTableLabel(log.table_name)}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm">
                          {log.record_title || log.record_id || "-"}
                        </TableCell>
                        <TableCell>
                          <JsonViewer data={log.old_data} title="Date anterioare" />
                        </TableCell>
                        <TableCell>
                          <JsonViewer data={log.new_data} title="Date noi" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between p-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Pagina anterioară
                </Button>
                <span className="text-sm text-muted-foreground">
                  Pagina {page + 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={logs.length < pageSize}
                >
                  Pagina următoare
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mb-4 opacity-50" />
              <p>Nu există înregistrări în istoric</p>
              <p className="text-sm">Acțiunile vor fi înregistrate automat</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogsPage;

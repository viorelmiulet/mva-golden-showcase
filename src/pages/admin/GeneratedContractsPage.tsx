import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Download, 
  Eye, 
  Trash2, 
  Search, 
  Calendar,
  Home,
  Building2,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  ExternalLink
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RentalContract {
  id: string;
  created_at: string;
  client_name: string;
  client_prenume: string | null;
  proprietar_name: string | null;
  proprietar_prenume: string | null;
  property_address: string;
  property_price: number | null;
  property_currency: string | null;
  contract_date: string;
  duration_months: number | null;
  proprietar_signed: boolean | null;
  chirias_signed: boolean | null;
  pdf_url: string | null;
  docx_url: string | null;
}

interface ExclusiveContract {
  id: string;
  created_at: string;
  beneficiary_name: string;
  beneficiary_prenume: string | null;
  property_address: string;
  sales_price: number | null;
  currency: string | null;
  contract_date: string;
  duration_months: number | null;
  commission_percent: number | null;
  status: string | null;
  beneficiary_signed_at: string | null;
  agent_signed_at: string | null;
  pdf_url: string | null;
}

const GeneratedContractsPage = () => {
  const [rentalContracts, setRentalContracts] = useState<RentalContract[]>([]);
  const [exclusiveContracts, setExclusiveContracts] = useState<ExclusiveContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<{ id: string; type: "rental" | "exclusive" } | null>(null);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    setIsLoading(true);
    try {
      const [rentalRes, exclusiveRes] = await Promise.all([
        supabase
          .from("contracts")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("exclusive_contracts")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      if (rentalRes.error) throw rentalRes.error;
      if (exclusiveRes.error) throw exclusiveRes.error;

      setRentalContracts(rentalRes.data || []);
      setExclusiveContracts(exclusiveRes.data || []);
    } catch (error) {
      console.error("Error fetching contracts:", error);
      toast.error("Eroare la încărcarea contractelor");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!contractToDelete) return;

    try {
      const table = contractToDelete.type === "rental" ? "contracts" : "exclusive_contracts";
      const { error } = await supabase.from(table).delete().eq("id", contractToDelete.id);

      if (error) throw error;

      toast.success("Contract șters cu succes");
      fetchContracts();
    } catch (error) {
      console.error("Error deleting contract:", error);
      toast.error("Eroare la ștergerea contractului");
    } finally {
      setDeleteDialogOpen(false);
      setContractToDelete(null);
    }
  };

  const getSignatureStatus = (contract: RentalContract) => {
    const propSigned = contract.proprietar_signed;
    const chiriSigned = contract.chirias_signed;

    if (propSigned && chiriSigned) {
      return { label: "Complet semnat", color: "bg-green-500/20 text-green-400", icon: CheckCircle };
    } else if (propSigned || chiriSigned) {
      return { label: "Parțial semnat", color: "bg-yellow-500/20 text-yellow-400", icon: Clock };
    }
    return { label: "Nesemnat", color: "bg-muted text-muted-foreground", icon: AlertCircle };
  };

  const getExclusiveStatus = (contract: ExclusiveContract) => {
    if (contract.beneficiary_signed_at && contract.agent_signed_at) {
      return { label: "Complet semnat", color: "bg-green-500/20 text-green-400", icon: CheckCircle };
    } else if (contract.beneficiary_signed_at || contract.agent_signed_at) {
      return { label: "Parțial semnat", color: "bg-yellow-500/20 text-yellow-400", icon: Clock };
    }
    return { label: contract.status === "draft" ? "Draft" : "Nesemnat", color: "bg-muted text-muted-foreground", icon: AlertCircle };
  };

  const filterContracts = <T extends { property_address: string }>(
    contracts: T[],
    getName: (c: T) => string,
    getStatus: (c: T) => { label: string }
  ) => {
    return contracts.filter((contract) => {
      const matchesSearch =
        getName(contract).toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.property_address.toLowerCase().includes(searchTerm.toLowerCase());

      if (statusFilter === "all") return matchesSearch;

      const status = getStatus(contract).label;
      if (statusFilter === "signed" && status === "Complet semnat") return matchesSearch;
      if (statusFilter === "partial" && status === "Parțial semnat") return matchesSearch;
      if (statusFilter === "unsigned" && (status === "Nesemnat" || status === "Draft")) return matchesSearch;

      return false;
    });
  };

  const filteredRental = filterContracts(
    rentalContracts,
    (c) => `${c.client_name} ${c.client_prenume || ""}`,
    getSignatureStatus
  );

  const filteredExclusive = filterContracts(
    exclusiveContracts,
    (c) => `${c.beneficiary_name} ${c.beneficiary_prenume || ""}`,
    getExclusiveStatus
  );

  const RentalContractCard = ({ contract }: { contract: RentalContract }) => {
    const status = getSignatureStatus(contract);
    const StatusIcon = status.icon;

    return (
      <Card className="border-border/50 bg-card/50 hover:border-gold/30 transition-all">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Home className="h-4 w-4 text-cyan-400 shrink-0" />
                <span className="font-medium text-foreground truncate">
                  {contract.client_name} {contract.client_prenume}
                </span>
                <Badge className={`${status.color} shrink-0`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.label}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground truncate mb-1">
                {contract.property_address}
              </p>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(contract.contract_date), "dd MMM yyyy", { locale: ro })}
                </span>
                {contract.property_price && (
                  <span>
                    {contract.property_price} {contract.property_currency || "EUR"}/lună
                  </span>
                )}
                {contract.duration_months && (
                  <span>{contract.duration_months} luni</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {contract.pdf_url && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => window.open(contract.pdf_url!, "_blank")}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              {contract.docx_url && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => window.open(contract.docx_url!, "_blank")}
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => {
                  setContractToDelete({ id: contract.id, type: "rental" });
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const ExclusiveContractCard = ({ contract }: { contract: ExclusiveContract }) => {
    const status = getExclusiveStatus(contract);
    const StatusIcon = status.icon;

    return (
      <Card className="border-border/50 bg-card/50 hover:border-gold/30 transition-all">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-purple-400 shrink-0" />
                <span className="font-medium text-foreground truncate">
                  {contract.beneficiary_name} {contract.beneficiary_prenume}
                </span>
                <Badge className={`${status.color} shrink-0`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.label}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground truncate mb-1">
                {contract.property_address}
              </p>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(contract.contract_date), "dd MMM yyyy", { locale: ro })}
                </span>
                {contract.sales_price && (
                  <span>
                    {contract.sales_price.toLocaleString()} {contract.currency || "EUR"}
                  </span>
                )}
                {contract.commission_percent && (
                  <span>Comision: {contract.commission_percent}%</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {contract.pdf_url && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => window.open(contract.pdf_url!, "_blank")}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => {
                  setContractToDelete({ id: contract.id, type: "exclusive" });
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Contracte Generate
        </h1>
        <p className="text-muted-foreground">
          Vizualizează și gestionează toate contractele generate
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Caută după nume sau adresă..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrează după status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate</SelectItem>
            <SelectItem value="signed">Complet semnate</SelectItem>
            <SelectItem value="partial">Parțial semnate</SelectItem>
            <SelectItem value="unsigned">Nesemnate</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">
              {rentalContracts.length + exclusiveContracts.length}
            </p>
            <p className="text-xs text-muted-foreground">Total contracte</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-cyan-500/10">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-cyan-400">{rentalContracts.length}</p>
            <p className="text-xs text-muted-foreground">Închiriere</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-purple-500/10">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-400">{exclusiveContracts.length}</p>
            <p className="text-xs text-muted-foreground">Reprezentare</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-green-500/10">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-400">
              {rentalContracts.filter((c) => c.proprietar_signed && c.chirias_signed).length +
                exclusiveContracts.filter((c) => c.beneficiary_signed_at && c.agent_signed_at).length}
            </p>
            <p className="text-xs text-muted-foreground">Complet semnate</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            Toate ({filteredRental.length + filteredExclusive.length})
          </TabsTrigger>
          <TabsTrigger value="rental">
            <Home className="h-4 w-4 mr-1" />
            Închiriere ({filteredRental.length})
          </TabsTrigger>
          <TabsTrigger value="exclusive">
            <Building2 className="h-4 w-4 mr-1" />
            Reprezentare ({filteredExclusive.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          {filteredRental.length === 0 && filteredExclusive.length === 0 ? (
            <Card className="border-border/50 bg-card/50">
              <CardContent className="py-12 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nu există contracte generate</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {filteredRental.map((contract) => (
                <RentalContractCard key={contract.id} contract={contract} />
              ))}
              {filteredExclusive.map((contract) => (
                <ExclusiveContractCard key={contract.id} contract={contract} />
              ))}
            </>
          )}
        </TabsContent>

        <TabsContent value="rental" className="space-y-3">
          {filteredRental.length === 0 ? (
            <Card className="border-border/50 bg-card/50">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nu există contracte de închiriere</p>
              </CardContent>
            </Card>
          ) : (
            filteredRental.map((contract) => (
              <RentalContractCard key={contract.id} contract={contract} />
            ))
          )}
        </TabsContent>

        <TabsContent value="exclusive" className="space-y-3">
          {filteredExclusive.length === 0 ? (
            <Card className="border-border/50 bg-card/50">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nu există contracte de reprezentare exclusivă</p>
              </CardContent>
            </Card>
          ) : (
            filteredExclusive.map((contract) => (
              <ExclusiveContractCard key={contract.id} contract={contract} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ești sigur?</AlertDialogTitle>
            <AlertDialogDescription>
              Această acțiune nu poate fi anulată. Contractul va fi șters permanent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GeneratedContractsPage;

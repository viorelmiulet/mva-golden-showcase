import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Handshake,
  Users,
  Mail
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
import SendSignatureLinkDialog from "@/components/admin/SendSignatureLinkDialog";

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
  contract_type: string;
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

interface ComodatContract {
  id: string;
  created_at: string;
  comodant_name: string;
  comodant_prenume: string | null;
  comodatar_name: string;
  comodatar_prenume: string | null;
  property_address: string;
  property_type: string | null;
  contract_date: string;
  duration_months: number | null;
  purpose: string | null;
  comodant_signed_at: string | null;
  comodatar_signed_at: string | null;
  pdf_url: string | null;
  status: string | null;
}

type ContractTab = "toate" | "inchiriere" | "comodat" | "exclusiv" | "intermediere";

const GeneratedContractsPage = () => {
  const [rentalContracts, setRentalContracts] = useState<RentalContract[]>([]);
  const [exclusiveContracts, setExclusiveContracts] = useState<ExclusiveContract[]>([]);
  const [comodatContracts, setComodatContracts] = useState<ComodatContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<ContractTab>("toate");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<{ id: string; type: "rental" | "exclusive" | "comodat" } | null>(null);
  
  // Email signature dialog state
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailDialogData, setEmailDialogData] = useState<{
    contractId: string;
    contractType: "inchiriere" | "comodat" | "exclusiv" | "intermediere";
    propertyAddress: string;
    parties: { value: string; label: string }[];
  } | null>(null);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    setIsLoading(true);
    try {
      const [rentalRes, exclusiveRes, comodatRes] = await Promise.all([
        supabase
          .from("contracts")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("exclusive_contracts")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("comodat_contracts")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      if (rentalRes.error) throw rentalRes.error;
      if (exclusiveRes.error) throw exclusiveRes.error;
      if (comodatRes.error) throw comodatRes.error;

      setRentalContracts(rentalRes.data || []);
      setExclusiveContracts(exclusiveRes.data || []);
      setComodatContracts(comodatRes.data || []);
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
      const table = contractToDelete.type === "rental" 
        ? "contracts" 
        : contractToDelete.type === "exclusive" 
          ? "exclusive_contracts" 
          : "comodat_contracts";
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
      return { label: "Semnat", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle };
    } else if (propSigned || chiriSigned) {
      return { label: "Parțial", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Clock };
    }
    return { label: "Nesemnat", color: "bg-muted text-muted-foreground border-border", icon: AlertCircle };
  };

  const getExclusiveStatus = (contract: ExclusiveContract) => {
    if (contract.beneficiary_signed_at && contract.agent_signed_at) {
      return { label: "Semnat", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle };
    } else if (contract.beneficiary_signed_at || contract.agent_signed_at) {
      return { label: "Parțial", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Clock };
    }
    return { label: "Nesemnat", color: "bg-muted text-muted-foreground border-border", icon: AlertCircle };
  };

  const getComodatStatus = (contract: ComodatContract) => {
    if (contract.comodant_signed_at && contract.comodatar_signed_at) {
      return { label: "Semnat", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle };
    } else if (contract.comodant_signed_at || contract.comodatar_signed_at) {
      return { label: "Parțial", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Clock };
    }
    return { label: "Nesemnat", color: "bg-muted text-muted-foreground border-border", icon: AlertCircle };
  };

  // Filter contracts based on search
  const filterBySearch = <T extends { property_address: string }>(
    contracts: T[],
    getName: (c: T) => string
  ) => {
    if (!searchTerm.trim()) return contracts;
    const query = searchTerm.toLowerCase();
    return contracts.filter((contract) =>
      getName(contract).toLowerCase().includes(query) ||
      contract.property_address.toLowerCase().includes(query)
    );
  };

  const filteredRental = filterBySearch(
    rentalContracts,
    (c) => `${c.client_name} ${c.client_prenume || ""}`
  );

  const filteredExclusive = filterBySearch(
    exclusiveContracts,
    (c) => `${c.beneficiary_name} ${c.beneficiary_prenume || ""}`
  );

  const filteredComodat = filterBySearch(
    comodatContracts,
    (c) => `${c.comodatar_name} ${c.comodatar_prenume || ""}`
  );

  // Get contracts by tab
  const getContractsByTab = () => {
    switch (activeTab) {
      case "inchiriere":
        return { rental: filteredRental, exclusive: [], comodat: [] };
      case "exclusiv":
        return { rental: [], exclusive: filteredExclusive, comodat: [] };
      case "comodat":
        return { rental: [], exclusive: [], comodat: filteredComodat };
      case "intermediere":
        return { rental: [], exclusive: [], comodat: [] };
      default:
        return { rental: filteredRental, exclusive: filteredExclusive, comodat: filteredComodat };
    }
  };

  const { rental: displayRental, exclusive: displayExclusive, comodat: displayComodat } = getContractsByTab();
  const totalCount = displayRental.length + displayExclusive.length + displayComodat.length;

  const openFile = (url: string | null) => {
    if (!url) {
      toast.error("Fișierul nu este disponibil");
      return;
    }
    window.open(url, "_blank");
  };

  const openEmailDialog = (
    contractId: string,
    contractType: "inchiriere" | "comodat" | "exclusiv" | "intermediere",
    propertyAddress: string,
    parties: { value: string; label: string }[]
  ) => {
    setEmailDialogData({ contractId, contractType, propertyAddress, parties });
    setEmailDialogOpen(true);
  };

  const RentalContractCard = ({ contract }: { contract: RentalContract }) => {
    const status = getSignatureStatus(contract);
    const StatusIcon = status.icon;
    const isIntermediere = contract.contract_type === "intermediere";

    return (
      <Card className="border-border/50 bg-card/50 hover:border-gold/30 transition-all">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {isIntermediere ? (
                  <Users className="h-4 w-4 text-orange-400 shrink-0" />
                ) : (
                  <Home className="h-4 w-4 text-cyan-400 shrink-0" />
                )}
                <span className="font-medium text-foreground truncate">
                  {contract.client_name} {contract.client_prenume}
                </span>
                <Badge variant="outline" className={`${status.color} shrink-0 text-xs`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.label}
                </Badge>
                {isIntermediere && (
                  <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                    Intermediere
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground truncate mb-1">
                {contract.property_address}
              </p>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(contract.contract_date), "dd MMM yyyy", { locale: ro })}
                </span>
                {contract.property_price && !isIntermediere && (
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
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => openEmailDialog(
                  contract.id,
                  isIntermediere ? "intermediere" : "inchiriere",
                  contract.property_address,
                  isIntermediere 
                    ? [
                        { value: "client", label: "Client" },
                        { value: "intermediar", label: "Intermediar" },
                      ]
                    : [
                        { value: "proprietar", label: "Proprietar" },
                        { value: "chirias", label: "Chiriaș" },
                      ]
                )}
                title="Trimite link semnare"
              >
                <Mail className="h-4 w-4" />
              </Button>
              {contract.pdf_url && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openFile(contract.pdf_url)}
                  title="Previzualizare PDF"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              {contract.docx_url && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openFile(contract.docx_url)}
                  title="Descarcă DOCX"
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
                title="Șterge"
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
                <Badge variant="outline" className={`${status.color} shrink-0 text-xs`}>
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
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => openEmailDialog(
                  contract.id,
                  "exclusiv",
                  contract.property_address,
                  [
                    { value: "beneficiary", label: "Beneficiar" },
                    { value: "agent", label: "Prestator/Agent" },
                  ]
                )}
                title="Trimite link semnare"
              >
                <Mail className="h-4 w-4" />
              </Button>
              {contract.pdf_url && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openFile(contract.pdf_url)}
                  title="Previzualizare PDF"
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
                title="Șterge"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const ComodatContractCard = ({ contract }: { contract: ComodatContract }) => {
    const status = getComodatStatus(contract);
    const StatusIcon = status.icon;

    return (
      <Card className="border-border/50 bg-card/50 hover:border-gold/30 transition-all">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Handshake className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="font-medium text-foreground truncate">
                  {contract.comodatar_name} {contract.comodatar_prenume}
                </span>
                <Badge variant="outline" className={`${status.color} shrink-0 text-xs`}>
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
                {contract.property_type && (
                  <span>{contract.property_type}</span>
                )}
                {contract.duration_months && (
                  <span>{contract.duration_months} luni</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => openEmailDialog(
                  contract.id,
                  "comodat",
                  contract.property_address,
                  [
                    { value: "comodant", label: "Comodant (Proprietar)" },
                    { value: "comodatar", label: "Comodatar (Beneficiar)" },
                  ]
                )}
                title="Trimite link semnare"
              >
                <Mail className="h-4 w-4" />
              </Button>
              {contract.pdf_url && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openFile(contract.pdf_url)}
                  title="Previzualizare PDF"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => {
                  setContractToDelete({ id: contract.id, type: "comodat" });
                  setDeleteDialogOpen(true);
                }}
                title="Șterge"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
      <p className="text-lg text-muted-foreground mb-1">Nu ai contracte generate încă.</p>
      <p className="text-sm text-muted-foreground/70">
        Selectează un tip de contract de mai sus pentru a începe.
      </p>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-gold" />
          <h1 className="text-xl font-semibold text-foreground">Contracte Generate</h1>
          <Badge variant="secondary" className="rounded-full">
            {rentalContracts.length + exclusiveContracts.length}
          </Badge>
        </div>
        
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Caută contracte..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-muted/50 border-border/50"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ContractTab)}>
        <TabsList className="bg-muted/30 p-1">
          <TabsTrigger value="toate" className="gap-2 data-[state=active]:bg-background">
            <FileText className="h-4 w-4" />
            Toate
          </TabsTrigger>
          <TabsTrigger value="inchiriere" className="gap-2 data-[state=active]:bg-background">
            <Home className="h-4 w-4" />
            Închiriere
          </TabsTrigger>
          <TabsTrigger value="comodat" className="gap-2 data-[state=active]:bg-background">
            <Handshake className="h-4 w-4" />
            Comodat
          </TabsTrigger>
          <TabsTrigger value="exclusiv" className="gap-2 data-[state=active]:bg-background">
            <Building2 className="h-4 w-4" />
            Exclusiv
          </TabsTrigger>
          <TabsTrigger value="intermediere" className="gap-2 data-[state=active]:bg-background">
            <Users className="h-4 w-4" />
            Intermediere
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {totalCount === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {displayRental.map((contract) => (
                <RentalContractCard key={contract.id} contract={contract} />
              ))}
              {displayExclusive.map((contract) => (
                <ExclusiveContractCard key={contract.id} contract={contract} />
              ))}
              {displayComodat.map((contract) => (
                <ComodatContractCard key={contract.id} contract={contract} />
              ))}
            </div>
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

      {/* Send Signature Link Dialog */}
      {emailDialogData && (
        <SendSignatureLinkDialog
          open={emailDialogOpen}
          onOpenChange={setEmailDialogOpen}
          contractId={emailDialogData.contractId}
          contractType={emailDialogData.contractType}
          propertyAddress={emailDialogData.propertyAddress}
          parties={emailDialogData.parties}
        />
      )}
    </div>
  );
};

export default GeneratedContractsPage;

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";

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
  Mail,
  FileDown,
  Filter,
  MoreHorizontal
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { adminApi } from "@/lib/adminApi";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import SendSignatureLinkDialog from "@/components/admin/SendSignatureLinkDialog";
import ContractPreviewDialog from "@/components/admin/ContractPreviewDialog";
import { 
  generateComodatContractPdf, 
  generateExclusiveContractPdf, 
  generateIntermediationContractPdf,
  type ComodatContractData,
  type ExclusiveContractData,
  type IntermediationContractData
} from "@/lib/pdf/allContractsPdf";
import { generateRentalContractPdf } from "@/lib/pdf/rentalContractPdf";

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
type StatusFilter = "toate" | "semnat" | "partial" | "nesemnat";

const GeneratedContractsPage = () => {
  const isMobile = useIsMobile();
  const [rentalContracts, setRentalContracts] = useState<RentalContract[]>([]);
  const [exclusiveContracts, setExclusiveContracts] = useState<ExclusiveContract[]>([]);
  const [comodatContracts, setComodatContracts] = useState<ComodatContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<ContractTab>("toate");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("toate");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<{ id: string; type: "rental" | "exclusive" | "comodat" } | null>(null);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  
  // Email signature dialog state
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailDialogData, setEmailDialogData] = useState<{
    contractId: string;
    contractType: "inchiriere" | "comodat" | "exclusiv" | "intermediere";
    propertyAddress: string;
    parties: { value: string; label: string }[];
  } | null>(null);

  // Preview dialog state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [currentPreviewContract, setCurrentPreviewContract] = useState<{
    id: string;
    type: "rental" | "exclusive" | "comodat" | "intermediere";
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
      
      const result = await adminApi.delete(table, contractToDelete.id);
      if (!result.success) throw new Error(result.error);

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

  // Helper to get status label for filtering
  const getRentalStatusLabel = (contract: RentalContract): string => {
    const propSigned = contract.proprietar_signed;
    const chiriSigned = contract.chirias_signed;
    if (propSigned && chiriSigned) return "semnat";
    if (propSigned || chiriSigned) return "partial";
    return "nesemnat";
  };

  const getExclusiveStatusLabel = (contract: ExclusiveContract): string => {
    if (contract.beneficiary_signed_at && contract.agent_signed_at) return "semnat";
    if (contract.beneficiary_signed_at || contract.agent_signed_at) return "partial";
    return "nesemnat";
  };

  const getComodatStatusLabel = (contract: ComodatContract): string => {
    if (contract.comodant_signed_at && contract.comodatar_signed_at) return "semnat";
    if (contract.comodant_signed_at || contract.comodatar_signed_at) return "partial";
    return "nesemnat";
  };

  // Filter contracts based on search and status
  const filterContracts = <T extends { property_address: string }>(
    contracts: T[],
    getName: (c: T) => string,
    getStatusLabel: (c: T) => string
  ) => {
    let filtered = contracts;
    
    // Filter by search
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter((contract) =>
        getName(contract).toLowerCase().includes(query) ||
        contract.property_address.toLowerCase().includes(query)
      );
    }
    
    // Filter by status
    if (statusFilter !== "toate") {
      filtered = filtered.filter((contract) => getStatusLabel(contract) === statusFilter);
    }
    
    return filtered;
  };

  const filteredRental = filterContracts(
    rentalContracts,
    (c) => `${c.client_name} ${c.client_prenume || ""}`,
    getRentalStatusLabel
  );

  const filteredExclusive = filterContracts(
    exclusiveContracts,
    (c) => `${c.beneficiary_name} ${c.beneficiary_prenume || ""}`,
    getExclusiveStatusLabel
  );

  const filteredComodat = filterContracts(
    comodatContracts,
    (c) => `${c.comodatar_name} ${c.comodatar_prenume || ""}`,
    getComodatStatusLabel
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

  // Helper to extract relative path from full storage URL
  const getRelativeStoragePath = (fullUrl: string): string => {
    const match = fullUrl.match(/\/contracts\/(.+)$/);
    return match ? match[1] : fullUrl;
  };

  const openFile = async (url: string | null) => {
    if (!url) {
      toast.error("Fișierul nu este disponibil");
      return;
    }
    
    try {
      // Extract relative path from full URL and create signed URL
      const relativePath = getRelativeStoragePath(url);
      const { data } = await supabase.storage
        .from('contracts')
        .createSignedUrl(relativePath, 3600);
      
      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank");
      } else {
        toast.error("Nu s-a putut accesa fișierul");
      }
    } catch (error) {
      console.error('Error opening file:', error);
      toast.error("Eroare la deschiderea fișierului");
    }
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

  // Preview Comodat contract
  const previewComodatPdf = async (contractId: string, contractName: string) => {
    setPreviewLoading(true);
    setPreviewTitle(`Contract Comodat - ${contractName}`);
    setPreviewOpen(true);
    setCurrentPreviewContract({ id: contractId, type: "comodat" });

    try {
      const { data, error } = await supabase
        .from('comodat_contracts')
        .select('*')
        .eq('id', contractId)
        .single();

      if (error || !data) {
        toast.error("Eroare la încărcarea contractului");
        setPreviewOpen(false);
        return;
      }

      const pdf = generateComodatContractPdf(data as ComodatContractData);
      const blob = pdf.output('blob');
      setPreviewBlob(blob);
    } catch (err) {
      console.error('Error previewing comodat PDF:', err);
      toast.error("Eroare la generarea previzualizării");
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Download Comodat PDF
  const downloadComodatPdf = async (contractId: string) => {
    try {
      const { data, error } = await supabase
        .from('comodat_contracts')
        .select('*')
        .eq('id', contractId)
        .single();

      if (error || !data) {
        toast.error("Eroare la încărcarea contractului");
        return;
      }

      const pdf = generateComodatContractPdf(data as ComodatContractData);
      const fileName = `contract_comodat_${data.comodatar_name}_${Date.now()}.pdf`;
      pdf.save(fileName);
      toast.success("PDF descărcat cu succes!");
    } catch (err) {
      console.error('Error downloading comodat PDF:', err);
      toast.error("Eroare la generarea PDF");
    }
  };

  // Preview Exclusive contract
  const previewExclusivePdf = async (contractId: string, contractName: string) => {
    setPreviewLoading(true);
    setPreviewTitle(`Contract Exclusiv - ${contractName}`);
    setPreviewOpen(true);
    setCurrentPreviewContract({ id: contractId, type: "exclusive" });

    try {
      const { data, error } = await supabase
        .from('exclusive_contracts')
        .select('*')
        .eq('id', contractId)
        .single();

      if (error || !data) {
        toast.error("Eroare la încărcarea contractului");
        setPreviewOpen(false);
        return;
      }

      const pdf = generateExclusiveContractPdf(data as ExclusiveContractData);
      const blob = pdf.output('blob');
      setPreviewBlob(blob);
    } catch (err) {
      console.error('Error previewing exclusive PDF:', err);
      toast.error("Eroare la generarea previzualizării");
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Download Exclusive PDF
  const downloadExclusivePdf = async (contractId: string) => {
    try {
      const { data, error } = await supabase
        .from('exclusive_contracts')
        .select('*')
        .eq('id', contractId)
        .single();

      if (error || !data) {
        toast.error("Eroare la încărcarea contractului");
        return;
      }

      const pdf = generateExclusiveContractPdf(data as ExclusiveContractData);
      const fileName = `contract_exclusiv_${data.beneficiary_name}_${Date.now()}.pdf`;
      pdf.save(fileName);
      toast.success("PDF descărcat cu succes!");
    } catch (err) {
      console.error('Error downloading exclusive PDF:', err);
      toast.error("Eroare la generarea PDF");
    }
  };

  // Preview Intermediation contract
  const previewIntermediationPdf = async (contractId: string, contractName: string) => {
    setPreviewLoading(true);
    setPreviewTitle(`Contract Intermediere - ${contractName}`);
    setPreviewOpen(true);
    setCurrentPreviewContract({ id: contractId, type: "intermediere" });

    try {
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', contractId)
        .single();

      if (contractError || !contract) {
        toast.error("Eroare la încărcarea contractului");
        setPreviewOpen(false);
        return;
      }

      const { data: signatures } = await supabase
        .from('contract_signatures')
        .select('*')
        .eq('contract_id', contractId);

      let clientSignature: string | null = null;
      let agentSignature: string | null = null;

      if (signatures) {
        const clientSig = signatures.find(s => s.party_type === 'chirias' || s.party_type === 'client');
        const agentSig = signatures.find(s => s.party_type === 'proprietar' || s.party_type === 'intermediar');
        clientSignature = clientSig?.signature_data || null;
        agentSignature = agentSig?.signature_data || null;
      }

      const pdf = generateIntermediationContractPdf(contract as IntermediationContractData, clientSignature, agentSignature);
      const blob = pdf.output('blob');
      setPreviewBlob(blob);
    } catch (err) {
      console.error('Error previewing intermediation PDF:', err);
      toast.error("Eroare la generarea previzualizării");
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Download Intermediation PDF
  const downloadIntermediationPdf = async (contractId: string) => {
    try {
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', contractId)
        .single();

      if (contractError || !contract) {
        toast.error("Eroare la încărcarea contractului");
        return;
      }

      const { data: signatures } = await supabase
        .from('contract_signatures')
        .select('*')
        .eq('contract_id', contractId);

      let clientSignature: string | null = null;
      let agentSignature: string | null = null;

      if (signatures) {
        const clientSig = signatures.find(s => s.party_type === 'chirias' || s.party_type === 'client');
        const agentSig = signatures.find(s => s.party_type === 'proprietar' || s.party_type === 'intermediar');
        clientSignature = clientSig?.signature_data || null;
        agentSignature = agentSig?.signature_data || null;
      }

      const pdf = generateIntermediationContractPdf(contract as IntermediationContractData, clientSignature, agentSignature);
      const fileName = `contract_intermediere_${contract.client_name}_${Date.now()}.pdf`;
      pdf.save(fileName);
      toast.success("PDF descărcat cu succes!");
    } catch (err) {
      console.error('Error downloading intermediation PDF:', err);
      toast.error("Eroare la generarea PDF");
    }
  };

  // Handle download from preview
  const handleDownloadFromPreview = async () => {
    if (!currentPreviewContract) return;
    
    switch (currentPreviewContract.type) {
      case "comodat":
        await downloadComodatPdf(currentPreviewContract.id);
        break;
      case "exclusive":
        await downloadExclusivePdf(currentPreviewContract.id);
        break;
      case "intermediere":
        await downloadIntermediationPdf(currentPreviewContract.id);
        break;
    }
  };

  const RentalContractCard = ({ contract }: { contract: RentalContract }) => {
    const status = getSignatureStatus(contract);
    const StatusIcon = status.icon;
    const isIntermediere = contract.contract_type === "intermediere";

    const actionItems = [
      {
        label: "Trimite link semnare",
        icon: Mail,
        onClick: () => openEmailDialog(
          contract.id,
          isIntermediere ? "intermediere" : "inchiriere",
          contract.property_address,
          isIntermediere 
            ? [{ value: "client", label: "Client" }, { value: "intermediar", label: "Intermediar" }]
            : [{ value: "proprietar", label: "Proprietar" }, { value: "chirias", label: "Chiriaș" }]
        ),
      },
      ...(isIntermediere ? [{
        label: "Previzualizare PDF",
        icon: Eye,
        onClick: () => previewIntermediationPdf(contract.id, `${contract.client_name} ${contract.client_prenume || ''}`),
      }] : contract.pdf_url ? [{
        label: "Previzualizare PDF",
        icon: Eye,
        onClick: () => openFile(contract.pdf_url),
      }] : []),
      ...(contract.docx_url ? [{
        label: "Descarcă DOCX",
        icon: Download,
        onClick: () => openFile(contract.docx_url),
      }] : []),
      {
        label: "Șterge",
        icon: Trash2,
        onClick: () => {
          setContractToDelete({ id: contract.id, type: "rental" });
          setDeleteDialogOpen(true);
        },
        destructive: true,
      },
    ];

    return (
      <Card className="border-border/50 bg-card/50 hover:border-gold/30 transition-all">
        <CardContent className="p-3 md:p-4">
          <div className="flex items-start justify-between gap-2 md:gap-4">
            <div className="flex-1 min-w-0">
              {/* Header with name and status */}
              <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-1.5">
                {isIntermediere ? (
                  <Users className="h-4 w-4 text-orange-400 shrink-0" />
                ) : (
                  <Home className="h-4 w-4 text-cyan-400 shrink-0" />
                )}
                <span className="font-medium text-foreground text-sm md:text-base truncate max-w-[150px] md:max-w-none">
                  {contract.client_name} {contract.client_prenume}
                </span>
                <Badge variant="outline" className={`${status.color} shrink-0 text-[10px] md:text-xs px-1.5 py-0`}>
                  <StatusIcon className="h-2.5 w-2.5 md:h-3 md:w-3 mr-0.5 md:mr-1" />
                  <span className="hidden sm:inline">{status.label}</span>
                </Badge>
                {isIntermediere && (
                  <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px] md:text-xs hidden sm:flex">
                    Intermediere
                  </Badge>
                )}
              </div>
              
              <p className="text-xs md:text-sm text-muted-foreground truncate mb-1">
                {contract.property_address}
              </p>
              
              <div className="flex flex-wrap items-center gap-2 md:gap-4 text-[10px] md:text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(contract.contract_date), "dd MMM", { locale: ro })}
                </span>
                {contract.property_price && !isIntermediere && (
                  <span className="hidden sm:inline">
                    {contract.property_price} {contract.property_currency || "EUR"}/lună
                  </span>
                )}
                {contract.duration_months && (
                  <span>{contract.duration_months} luni</span>
                )}
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-1 shrink-0">
              {actionItems.map((action, idx) => (
                <Button
                  key={idx}
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${action.destructive ? "text-destructive hover:text-destructive" : ""}`}
                  onClick={action.onClick}
                  title={action.label}
                >
                  <action.icon className="h-4 w-4" />
                </Button>
              ))}
            </div>

            {/* Mobile Dropdown */}
            <div className="md:hidden shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover">
                  {actionItems.map((action, idx) => (
                    <DropdownMenuItem
                      key={idx}
                      onClick={action.onClick}
                      className={action.destructive ? "text-destructive" : ""}
                    >
                      <action.icon className="h-4 w-4 mr-2" />
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const ExclusiveContractCard = ({ contract }: { contract: ExclusiveContract }) => {
    const status = getExclusiveStatus(contract);
    const StatusIcon = status.icon;

    const actionItems = [
      {
        label: "Trimite link semnare",
        icon: Mail,
        onClick: () => openEmailDialog(
          contract.id,
          "exclusiv",
          contract.property_address,
          [{ value: "beneficiary", label: "Beneficiar" }, { value: "agent", label: "Prestator/Agent" }]
        ),
      },
      {
        label: "Previzualizare PDF",
        icon: Eye,
        onClick: () => previewExclusivePdf(contract.id, `${contract.beneficiary_name} ${contract.beneficiary_prenume || ''}`),
      },
      {
        label: "Șterge",
        icon: Trash2,
        onClick: () => {
          setContractToDelete({ id: contract.id, type: "exclusive" });
          setDeleteDialogOpen(true);
        },
        destructive: true,
      },
    ];

    return (
      <Card className="border-border/50 bg-card/50 hover:border-gold/30 transition-all">
        <CardContent className="p-3 md:p-4">
          <div className="flex items-start justify-between gap-2 md:gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-1.5">
                <Building2 className="h-4 w-4 text-purple-400 shrink-0" />
                <span className="font-medium text-foreground text-sm md:text-base truncate max-w-[150px] md:max-w-none">
                  {contract.beneficiary_name} {contract.beneficiary_prenume}
                </span>
                <Badge variant="outline" className={`${status.color} shrink-0 text-[10px] md:text-xs px-1.5 py-0`}>
                  <StatusIcon className="h-2.5 w-2.5 md:h-3 md:w-3 mr-0.5 md:mr-1" />
                  <span className="hidden sm:inline">{status.label}</span>
                </Badge>
              </div>
              
              <p className="text-xs md:text-sm text-muted-foreground truncate mb-1">
                {contract.property_address}
              </p>
              
              <div className="flex flex-wrap items-center gap-2 md:gap-4 text-[10px] md:text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(contract.contract_date), "dd MMM", { locale: ro })}
                </span>
                {contract.sales_price && (
                  <span className="hidden sm:inline">
                    {contract.sales_price.toLocaleString()} {contract.currency || "EUR"}
                  </span>
                )}
                {contract.commission_percent && (
                  <span>{contract.commission_percent}%</span>
                )}
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-1 shrink-0">
              {actionItems.map((action, idx) => (
                <Button
                  key={idx}
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${action.destructive ? "text-destructive hover:text-destructive" : ""}`}
                  onClick={action.onClick}
                  title={action.label}
                >
                  <action.icon className="h-4 w-4" />
                </Button>
              ))}
            </div>

            {/* Mobile Dropdown */}
            <div className="md:hidden shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover">
                  {actionItems.map((action, idx) => (
                    <DropdownMenuItem
                      key={idx}
                      onClick={action.onClick}
                      className={action.destructive ? "text-destructive" : ""}
                    >
                      <action.icon className="h-4 w-4 mr-2" />
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const ComodatContractCard = ({ contract }: { contract: ComodatContract }) => {
    const status = getComodatStatus(contract);
    const StatusIcon = status.icon;

    const actionItems = [
      {
        label: "Trimite link semnare",
        icon: Mail,
        onClick: () => openEmailDialog(
          contract.id,
          "comodat",
          contract.property_address,
          [{ value: "comodant", label: "Comodant (Proprietar)" }, { value: "comodatar", label: "Comodatar (Beneficiar)" }]
        ),
      },
      {
        label: "Previzualizare PDF",
        icon: Eye,
        onClick: () => previewComodatPdf(contract.id, `${contract.comodatar_name} ${contract.comodatar_prenume || ''}`),
      },
      {
        label: "Șterge",
        icon: Trash2,
        onClick: () => {
          setContractToDelete({ id: contract.id, type: "comodat" });
          setDeleteDialogOpen(true);
        },
        destructive: true,
      },
    ];

    return (
      <Card className="border-border/50 bg-card/50 hover:border-gold/30 transition-all">
        <CardContent className="p-3 md:p-4">
          <div className="flex items-start justify-between gap-2 md:gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-1.5">
                <Handshake className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="font-medium text-foreground text-sm md:text-base truncate max-w-[150px] md:max-w-none">
                  {contract.comodatar_name} {contract.comodatar_prenume}
                </span>
                <Badge variant="outline" className={`${status.color} shrink-0 text-[10px] md:text-xs px-1.5 py-0`}>
                  <StatusIcon className="h-2.5 w-2.5 md:h-3 md:w-3 mr-0.5 md:mr-1" />
                  <span className="hidden sm:inline">{status.label}</span>
                </Badge>
              </div>
              
              <p className="text-xs md:text-sm text-muted-foreground truncate mb-1">
                {contract.property_address}
              </p>
              
              <div className="flex flex-wrap items-center gap-2 md:gap-4 text-[10px] md:text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(contract.contract_date), "dd MMM", { locale: ro })}
                </span>
                {contract.property_type && (
                  <span className="hidden sm:inline">{contract.property_type}</span>
                )}
                {contract.duration_months && (
                  <span>{contract.duration_months} luni</span>
                )}
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-1 shrink-0">
              {actionItems.map((action, idx) => (
                <Button
                  key={idx}
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${action.destructive ? "text-destructive hover:text-destructive" : ""}`}
                  onClick={action.onClick}
                  title={action.label}
                >
                  <action.icon className="h-4 w-4" />
                </Button>
              ))}
            </div>

            {/* Mobile Dropdown */}
            <div className="md:hidden shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover">
                  {actionItems.map((action, idx) => (
                    <DropdownMenuItem
                      key={idx}
                      onClick={action.onClick}
                      className={action.destructive ? "text-destructive" : ""}
                    >
                      <action.icon className="h-4 w-4 mr-2" />
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
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

  // Mobile filter options
  const tabOptions = [
    { value: "toate", label: "Toate", icon: FileText },
    { value: "inchiriere", label: "Închiriere", icon: Home },
    { value: "comodat", label: "Comodat", icon: Handshake },
    { value: "exclusiv", label: "Exclusiv", icon: Building2 },
    { value: "intermediere", label: "Intermediere", icon: Users },
  ];

  const statusOptions = [
    { value: "toate", label: "Toate statusurile" },
    { value: "semnat", label: "Semnate", icon: CheckCircle, color: "text-green-400" },
    { value: "partial", label: "Parțiale", icon: Clock, color: "text-yellow-400" },
    { value: "nesemnat", label: "Nesemnate", icon: AlertCircle, color: "text-muted-foreground" },
  ];

  return (
    <motion.div 
      className="space-y-4 md:space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header - Mobile optimized */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-gold/40 to-amber-600/10 rounded-2xl blur-xl" />
            <div className="relative p-3 rounded-2xl bg-gradient-to-br from-gold/20 to-amber-600/5 border border-gold/20">
              <FileText className="h-6 w-6 text-gold" />
            </div>
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Contracte Generate</h1>
            <p className="text-muted-foreground text-sm">{rentalContracts.length + exclusiveContracts.length + comodatContracts.length} contracte în total</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Mobile Filter Button */}
          {isMobile && (
            <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filtre
                  {(activeTab !== "toate" || statusFilter !== "toate") && (
                    <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {(activeTab !== "toate" ? 1 : 0) + (statusFilter !== "toate" ? 1 : 0)}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[70vh]">
                <SheetHeader>
                  <SheetTitle>Filtre</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-full py-4">
                  <div className="space-y-6">
                    {/* Type Filter */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-muted-foreground">Tip contract</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {tabOptions.map((tab) => {
                          const Icon = tab.icon;
                          return (
                            <button
                              key={tab.value}
                              onClick={() => {
                                setActiveTab(tab.value as ContractTab);
                              }}
                              className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${
                                activeTab === tab.value 
                                  ? "border-gold bg-gold/10 text-gold" 
                                  : "border-border bg-muted/30 text-muted-foreground"
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                              {tab.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {statusOptions.map((status) => {
                          const Icon = status.icon;
                          return (
                            <button
                              key={status.value}
                              onClick={() => {
                                setStatusFilter(status.value as StatusFilter);
                              }}
                              className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${
                                statusFilter === status.value 
                                  ? "border-gold bg-gold/10 text-gold" 
                                  : "border-border bg-muted/30 text-muted-foreground"
                              }`}
                            >
                              {Icon && <Icon className={`h-4 w-4 ${status.color || ""}`} />}
                              {status.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={() => setFilterSheetOpen(false)}
                    >
                      Aplică filtre
                    </Button>
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          )}
          
          <div className="relative flex-1 sm:w-48 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Caută..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-muted/50 border-border/50 text-sm"
            />
          </div>
        </div>
      </motion.div>

      {/* Contract Type Tabs - Desktop only */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="hidden md:flex items-center gap-4 border-b border-border/50 pb-4 overflow-x-auto"
      >
        {tabOptions.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value as ContractTab)}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.value 
                  ? "text-gold" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </motion.div>

      {/* Status Filter - Desktop only */}
      <div className="hidden md:flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Status:</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setStatusFilter("toate")}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              statusFilter === "toate" 
                ? "bg-gold/20 text-gold border border-gold/30" 
                : "bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent"
            }`}
          >
            Toate
          </button>
          <button
            onClick={() => setStatusFilter("semnat")}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              statusFilter === "semnat" 
                ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                : "bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent"
            }`}
          >
            <CheckCircle className="h-3 w-3" />
            Semnat
          </button>
          <button
            onClick={() => setStatusFilter("partial")}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              statusFilter === "partial" 
                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" 
                : "bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent"
            }`}
          >
            <Clock className="h-3 w-3" />
            Parțial
          </button>
          <button
            onClick={() => setStatusFilter("nesemnat")}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              statusFilter === "nesemnat" 
                ? "bg-muted text-foreground border border-border" 
                : "bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent"
            }`}
          >
            <AlertCircle className="h-3 w-3" />
            Nesemnat
          </button>
        </div>
      </div>

      {/* Mobile Active Filters */}
      {isMobile && (activeTab !== "toate" || statusFilter !== "toate") && (
        <div className="flex flex-wrap gap-2">
          {activeTab !== "toate" && (
            <Badge variant="secondary" className="gap-1 py-1">
              {tabOptions.find(t => t.value === activeTab)?.label}
              <button onClick={() => setActiveTab("toate")} className="ml-1 hover:text-destructive">
                ×
              </button>
            </Badge>
          )}
          {statusFilter !== "toate" && (
            <Badge variant="secondary" className="gap-1 py-1">
              {statusOptions.find(s => s.value === statusFilter)?.label}
              <button onClick={() => setStatusFilter("toate")} className="ml-1 hover:text-destructive">
                ×
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Contracts List */}
      {totalCount === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-2 md:space-y-3">
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

      {/* Contract Preview Dialog */}
      <ContractPreviewDialog
        open={previewOpen}
        onOpenChange={(open) => {
          setPreviewOpen(open);
          if (!open) {
            setPreviewBlob(null);
            setCurrentPreviewContract(null);
          }
        }}
        pdfBlob={previewBlob}
        title={previewTitle}
        onDownload={handleDownloadFromPreview}
        isLoading={previewLoading}
      />
    </motion.div>
  );
};

export default GeneratedContractsPage;

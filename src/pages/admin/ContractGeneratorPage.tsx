import { useState, useRef, useEffect, useMemo } from "react";
import SignaturePad from "@/components/SignaturePad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { Upload, FileText, Download, Loader2, Camera, Sparkles, User, Home, Calendar, History, Trash2, RefreshCw, Users, FileType, PenTool, FilePlus2, Mail, Send, Package, Plus, X, Pencil, Check, ImageIcon, MessageCircle, Eye, Files, Settings, Eraser, Search, ArrowUpDown, Filter } from "lucide-react";
import InventoryImageUpload from "@/components/InventoryImageUpload";
import { SwipeableContractCard } from "@/components/admin/SwipeableContractCard";
import ContractClausesEditor from "@/components/admin/ContractClausesEditor";
import { MobileFilterSort, FilterOption, SortOption } from "@/components/admin/MobileFilterSort";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { adminApi } from "@/lib/adminApi";
import { fetchContractClauses, type ContractClause } from "@/hooks/useContractClauses";
import { replaceDiacritics } from "@/lib/utils";
import { getSignedContractUrl } from "@/lib/storageUrl";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

// Import types and utilities from extracted modules
import type { 
  ExtractedData, 
  PersonData, 
  ContractData, 
  SavedContract, 
  ContractSignature, 
  InventoryItem as InventoryItemType
} from "@/types/contract";
import { emptyPerson, conditionLabels as conditionLabelsConst, imageSizeConfig as imageSizeConfigConst } from "@/types/contract";
import { 
  formatDateRomanian, 
  imageUrlToBase64,
  createPdfContext,
  addSectionTitle,
  addParagraph,
  drawPartyBox,
  addSignatureSection,
  addInventoryTable,
  addPageFooter
} from "@/lib/pdf/contractPdfUtils";
import { generateRentalContractPdf, generateSignedRentalContractPdf, generatePreviewPdf } from "@/lib/pdf/rentalContractPdf";
import { generateRentalContractDocx, generateDocxFilename, downloadDocxBlob } from "@/lib/pdf/rentalContractDocx";

const ContractGeneratorPage = () => {
  const [isExtractingProprietar, setIsExtractingProprietar] = useState(false);
  const [isExtractingChirias, setIsExtractingChirias] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingBoth, setIsGeneratingBoth] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [regeneratingContractId, setRegeneratingContractId] = useState<string | null>(null);
  
  // Email dialog state
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailDialogData, setEmailDialogData] = useState<{
    contractId: string;
    partyType: 'proprietar' | 'chirias';
    propertyAddress: string;
  } | null>(null);
  const [emailRecipient, setEmailRecipient] = useState({ name: '', email: '' });
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  // Preview dialog state
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewContractName, setPreviewContractName] = useState<string>('');
  const [previewingContractId, setPreviewingContractId] = useState<string | null>(null);
  const [isPreviewingNew, setIsPreviewingNew] = useState(false);
  const [isDownloadingUnsigned, setIsDownloadingUnsigned] = useState(false);
  
  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<{ id: string; name: string } | null>(null);
  
  const [uploadedImageProprietar, setUploadedImageProprietar] = useState<string | null>(null);
  const [uploadedImageChirias, setUploadedImageChirias] = useState<string | null>(null);
  const [extractedDataProprietar, setExtractedDataProprietar] = useState<ExtractedData | null>(null);
  const [extractedDataChirias, setExtractedDataChirias] = useState<ExtractedData | null>(null);
  
  const [contracts, setContracts] = useState<SavedContract[]>([]);
  const [isLoadingContracts, setIsLoadingContracts] = useState(true);
  
  // Mobile filter/sort state
  const isMobile = useIsMobile();
  const [contractFilterValues, setContractFilterValues] = useState<Record<string, string>>({});
  const [contractSort, setContractSort] = useState<{ key: string; direction: "asc" | "desc" }>({ key: "date", direction: "desc" });
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter and sort options for contracts
  const contractFilterOptions: FilterOption[] = [
    {
      key: "signatureStatus",
      label: "Status semnături",
      type: "select",
      options: [
        { value: "all", label: "Toate" },
        { value: "both_signed", label: "Ambii au semnat" },
        { value: "partial", label: "Semnat parțial" },
        { value: "none", label: "Nesemnat" },
      ]
    },
    {
      key: "hasDocuments",
      label: "Documente",
      type: "select",
      options: [
        { value: "all", label: "Toate" },
        { value: "has_pdf", label: "Cu PDF" },
        { value: "has_docx", label: "Cu Word" },
        { value: "no_docs", label: "Fără documente" },
      ]
    }
  ];
  
  const contractSortOptions: SortOption[] = [
    { key: "date", label: "Data" },
    { key: "name", label: "Nume chiriaș" },
    { key: "price", label: "Chirie" },
  ];
  
  // Filtered and sorted contracts
  const filteredContracts = useMemo(() => {
    let result = [...contracts];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(contract => 
        contract.client_name?.toLowerCase().includes(query) ||
        contract.client_prenume?.toLowerCase().includes(query) ||
        contract.property_address?.toLowerCase().includes(query) ||
        contract.proprietar_name?.toLowerCase().includes(query) ||
        contract.proprietar_prenume?.toLowerCase().includes(query)
      );
    }
    
    // Apply signature status filter
    const signatureStatus = contractFilterValues.signatureStatus;
    if (signatureStatus && signatureStatus !== "all") {
      result = result.filter(contract => {
        if (signatureStatus === "both_signed") return contract.proprietar_signed && contract.chirias_signed;
        if (signatureStatus === "partial") return (contract.proprietar_signed && !contract.chirias_signed) || (!contract.proprietar_signed && contract.chirias_signed);
        if (signatureStatus === "none") return !contract.proprietar_signed && !contract.chirias_signed;
        return true;
      });
    }
    
    // Apply documents filter
    const hasDocuments = contractFilterValues.hasDocuments;
    if (hasDocuments && hasDocuments !== "all") {
      result = result.filter(contract => {
        if (hasDocuments === "has_pdf") return !!contract.pdf_url;
        if (hasDocuments === "has_docx") return !!contract.docx_url;
        if (hasDocuments === "no_docs") return !contract.pdf_url && !contract.docx_url;
        return true;
      });
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (contractSort.key) {
        case "date":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "name":
          const nameA = `${a.client_prenume || ''} ${a.client_name || ''}`.toLowerCase();
          const nameB = `${b.client_prenume || ''} ${b.client_name || ''}`.toLowerCase();
          comparison = nameA.localeCompare(nameB);
          break;
        case "price":
          comparison = (a.property_price || 0) - (b.property_price || 0);
          break;
        default:
          comparison = 0;
      }
      return contractSort.direction === "asc" ? comparison : -comparison;
    });
    
    return result;
  }, [contracts, searchQuery, contractFilterValues, contractSort]);
  
  const activeFiltersCount = Object.values(contractFilterValues).filter(v => v && v !== "all").length + (searchQuery.trim() ? 1 : 0);
  
  const resetContractFilters = () => {
    setContractFilterValues({});
    setSearchQuery("");
    setContractSort({ key: "date", direction: "desc" });
  };
  
  // Inventory state
  interface InventoryItem {
    id: string;
    item_name: string;
    quantity: number;
    condition: string;
    location: string;
    notes: string;
    images: string[];
  }
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [newInventoryItem, setNewInventoryItem] = useState<Omit<InventoryItem, 'id'>>({
    item_name: '',
    quantity: 1,
    condition: 'buna',
    location: '',
    notes: '',
    images: []
  });
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [inventoryImageSize, setInventoryImageSize] = useState<'small' | 'medium' | 'large'>('medium');
  
  const imageSizeConfig = {
    small: { width: 35, height: 28, perRow: 4 },
    medium: { width: 50, height: 40, perRow: 3 },
    large: { width: 70, height: 56, perRow: 2 }
  };
  
  const updateInventoryItem = (id: string, field: keyof InventoryItem, value: string | number | string[]) => {
    setInventoryItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };
  
  const [contractData, setContractData] = useState<ContractData>({
    proprietar: { ...emptyPerson },
    chirias: { ...emptyPerson },
    proprietate_adresa: "",
    proprietate_pret: "",
    garantie: "",
    garantie_status: "platita",
    moneda: "EUR",
    numar_camere: "1",
    data_contract: new Date().toISOString().split('T')[0],
    data_incepere: new Date().toISOString().split('T')[0],
    durata_inchiriere: "12",
    semnatura_proprietar: "",
    semnatura_chirias: "",
  });
  
  const fileInputProprietarRef = useRef<HTMLInputElement>(null);
  const fileInputChiriasRef = useRef<HTMLInputElement>(null);

  // Track contracts that need auto-regeneration
  const autoRegeneratedRef = useRef<Set<string>>(new Set());
  
  // Contract clauses from database
  const [contractClauses, setContractClauses] = useState<ContractClause[]>([]);

  useEffect(() => {
    fetchContracts();
    loadContractClauses();
  }, []);
  
  const loadContractClauses = async () => {
    const clauses = await fetchContractClauses();
    setContractClauses(clauses);
  };

  // Auto-regenerate PDF when both parties have signed
  useEffect(() => {
    const checkAndAutoRegenerate = async () => {
      for (const contract of contracts) {
        // Check if both parties signed and we haven't auto-regenerated yet
        if (
          contract.proprietar_signed && 
          contract.chirias_signed && 
          !autoRegeneratedRef.current.has(contract.id)
        ) {
          // Mark as processed to prevent duplicate regeneration
          autoRegeneratedRef.current.add(contract.id);
          
          console.log('Auto-regenerating PDF for contract:', contract.id);
          
          // Automatically regenerate the PDF with signatures
          await regeneratePdfWithSignatures(contract);
        }
      }
    };
    
    if (contracts.length > 0) {
      checkAndAutoRegenerate();
    }
  }, [contracts]);

  const fetchContracts = async () => {
    setIsLoadingContracts(true);
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setContracts(data || []);
    } catch (error: any) {
      console.error('Error fetching contracts:', error);
      toast.error("Eroare la încărcarea istoricului");
    } finally {
      setIsLoadingContracts(false);
    }
  };

  const formatAddress = (adresa: ExtractedData['adresa']) => {
    if (!adresa) return '';
    return [
      adresa.strada ? `Str. ${adresa.strada}` : '',
      adresa.numar ? `Nr. ${adresa.numar}` : '',
      adresa.bloc ? `Bl. ${adresa.bloc}` : '',
      adresa.scara ? `Sc. ${adresa.scara}` : '',
      adresa.etaj ? `Et. ${adresa.etaj}` : '',
      adresa.apartament ? `Ap. ${adresa.apartament}` : '',
      adresa.localitate,
      adresa.judet ? `Jud. ${adresa.judet}` : '',
    ].filter(Boolean).join(', ');
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'proprietar' | 'chirias'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Vă rugăm selectați o imagine");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Imaginea este prea mare. Maxim 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (type === 'proprietar') {
        setUploadedImageProprietar(base64);
      } else {
        setUploadedImageChirias(base64);
      }
      await extractDataFromImage(base64, type);
    };
    reader.readAsDataURL(file);
  };

  const extractDataFromImage = async (imageBase64: string, type: 'proprietar' | 'chirias') => {
    if (type === 'proprietar') {
      setIsExtractingProprietar(true);
    } else {
      setIsExtractingChirias(true);
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('extract-id-data', {
        body: { imageBase64 }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      const extracted = data.data as ExtractedData;
      const fullAddress = formatAddress(extracted.adresa);

      // Convert data_emiterii from DD.MM.YYYY to YYYY-MM-DD for input type="date"
      let formattedDataEmiterii = "";
      if (extracted.data_emiterii) {
        const parts = extracted.data_emiterii.split('.');
        if (parts.length === 3) {
          formattedDataEmiterii = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }

      const personData: PersonData = {
        nume: extracted.nume || "",
        prenume: extracted.prenume || "",
        cnp: extracted.cnp || "",
        seria_ci: extracted.seria || "",
        numar_ci: extracted.numar || "",
        ci_emitent: extracted.emitent || "",
        ci_data_emiterii: formattedDataEmiterii,
        adresa: fullAddress,
        cetatenie: extracted.cetatenie || "romana",
      };

      if (type === 'proprietar') {
        setExtractedDataProprietar(extracted);
        setContractData(prev => ({
          ...prev,
          proprietar: personData,
        }));
      } else {
        setExtractedDataChirias(extracted);
        setContractData(prev => ({
          ...prev,
          chirias: personData,
        }));
      }

      toast.success(`Date ${type === 'proprietar' ? 'proprietar' : 'chiriaș'} extrase cu succes!`);
    } catch (error: any) {
      console.error('Error extracting data:', error);
      toast.error(error.message || "Eroare la extragerea datelor");
    } finally {
      if (type === 'proprietar') {
        setIsExtractingProprietar(false);
      } else {
        setIsExtractingChirias(false);
      }
    }
  };

  const saveContractToDatabase = async (pdfUrl?: string, docxUrl?: string) => {
    try {
      const result = await adminApi.insert('contracts', {
        client_name: contractData.chirias.nume,
        client_prenume: contractData.chirias.prenume || null,
        client_cnp: contractData.chirias.cnp || null,
        client_seria_ci: contractData.chirias.seria_ci || null,
        client_numar_ci: contractData.chirias.numar_ci || null,
        client_adresa: contractData.chirias.adresa || null,
        client_ci_emitent: contractData.chirias.ci_emitent || null,
        client_ci_data_emiterii: contractData.chirias.ci_data_emiterii || null,
        proprietar_name: contractData.proprietar.nume || null,
        proprietar_prenume: contractData.proprietar.prenume || null,
        proprietar_cnp: contractData.proprietar.cnp || null,
        proprietar_seria_ci: contractData.proprietar.seria_ci || null,
        proprietar_numar_ci: contractData.proprietar.numar_ci || null,
        proprietar_adresa: contractData.proprietar.adresa || null,
        proprietar_ci_emitent: contractData.proprietar.ci_emitent || null,
        proprietar_ci_data_emiterii: contractData.proprietar.ci_data_emiterii || null,
        client_is_company: !!contractData.chirias.is_company,
        client_company_name: contractData.chirias.company_name || null,
        client_company_cui: contractData.chirias.company_cui || null,
        client_company_reg_com: contractData.chirias.company_reg_com || null,
        client_company_sediu: contractData.chirias.company_sediu || null,
        client_function_title: contractData.chirias.function_title || null,
        proprietar_is_company: !!contractData.proprietar.is_company,
        proprietar_company_name: contractData.proprietar.company_name || null,
        proprietar_company_cui: contractData.proprietar.company_cui || null,
        proprietar_company_reg_com: contractData.proprietar.company_reg_com || null,
        proprietar_company_sediu: contractData.proprietar.company_sediu || null,
        proprietar_function_title: contractData.proprietar.function_title || null,
        property_address: contractData.proprietate_adresa,
        property_price: contractData.proprietate_pret ? parseFloat(contractData.proprietate_pret) : null,
        property_surface: contractData.garantie ? parseFloat(contractData.garantie) : null,
        garantie_amount: contractData.garantie ? parseFloat(contractData.garantie) : null,
        garantie_status: contractData.garantie_status,
        property_currency: contractData.moneda || 'EUR',
        contract_type: 'inchiriere',
        contract_date: contractData.data_contract,
        duration_months: contractData.durata_inchiriere ? parseInt(contractData.durata_inchiriere) : null,
        pdf_generated: true,
        pdf_url: pdfUrl || null,
        docx_url: docxUrl || null,
      });

      if (!result.success) throw new Error(result.error);
      const insertedContract = result.data?.[0] as any;

      if (insertedContract) {
        await createSignatureLinks(insertedContract.id);
        
        if (inventoryItems.length > 0) {
          const inventoryToSave = inventoryItems.map(item => ({
            contract_id: insertedContract.id,
            item_name: item.item_name,
            quantity: item.quantity,
            condition: item.condition,
            location: item.location || null,
            notes: item.notes || null,
            images: item.images || []
          }));
          
          const invResult = await adminApi.insert('contract_inventory', inventoryToSave as any);
          if (!invResult.success) {
            console.error('Error saving inventory:', invResult.error);
            toast.error('Eroare la salvarea procesului verbal / inventarului');
          } else {
            console.log(`Saved ${inventoryItems.length} inventory items for contract ${insertedContract.id}`);
          }
        }
      }

      await fetchContracts();
    } catch (error: any) {
      console.error('Error saving contract:', error);
      throw error;
    }
  };
  
  // Inventory management functions
  const addInventoryItem = () => {
    if (!newInventoryItem.item_name.trim()) {
      toast.error('Introduceți denumirea articolului');
      return;
    }
    
    const newItem: InventoryItem = {
      id: crypto.randomUUID(),
      ...newInventoryItem
    };
    
    setInventoryItems(prev => [...prev, newItem]);
    setNewInventoryItem({
      item_name: '',
      quantity: 1,
      condition: 'buna',
      location: '',
      notes: '',
      images: []
    });
    toast.success('Articol adăugat în inventar');
  };
  
  const removeInventoryItem = (id: string) => {
    setInventoryItems(prev => prev.filter(item => item.id !== id));
  };
  
  const addPresetInventoryItems = async () => {
    // Fetch preset items from database
    const { data: presetItems, error } = await supabase
      .from('preset_inventory_items')
      .select('item_name, quantity, condition, location, notes')
      .order('sort_order', { ascending: true });
    
    if (error) {
      console.error('Error fetching preset items:', error);
      toast.error('Eroare la încărcarea articolelor presetate');
      return;
    }
    
    if (!presetItems || presetItems.length === 0) {
      toast.info('Nu există articole presetate. Configurați-le din meniul Inventar Presetat.');
      return;
    }
    
    const newItems = presetItems.map(item => ({
      id: crypto.randomUUID(),
      item_name: item.item_name,
      quantity: item.quantity || 1,
      condition: item.condition || 'buna',
      location: item.location || '',
      notes: item.notes || '',
      images: []
    }));
    
    setInventoryItems(prev => [...prev, ...newItems]);
    toast.success('Articole standard adăugate');
  };

  const uploadContractFile = async (blob: Blob, fileName: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('contracts')
        .upload(fileName, blob, {
          contentType: blob.type,
          upsert: true,
        });

      if (error) {
        console.error('Error uploading contract:', error);
        return null;
      }

      // Return the full public URL instead of just the path
      const { data: urlData } = supabase.storage
        .from('contracts')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading contract:', error);
      return null;
    }
  };

  const downloadContract = async (contract: SavedContract, type: 'pdf' | 'docx') => {
    if (type === 'docx' && contract.docx_url) {
      try {
        const signedUrl = await getSignedContractUrl(contract.docx_url);
        if (signedUrl) {
          window.open(signedUrl, '_blank', 'noopener,noreferrer');
          return;
        }
      } catch (error) {
        console.error('Error downloading docx:', error);
      }
      toast.error('Fișierul DOCX nu este disponibil');
      return;
    }

    // For PDF, generate in memory
    if (type === 'pdf') {
      try {
        // Fetch signatures
        const { data: signatures } = await supabase
          .from('contract_signatures')
          .select('party_type, signature_data')
          .eq('contract_id', contract.id);

        const { data: savedInventory } = await supabase
          .from('contract_inventory')
          .select('*')
          .eq('contract_id', contract.id);

        const proprietarSig = signatures?.find(s => s.party_type === 'proprietar')?.signature_data;
        const chiriasSig = signatures?.find(s => s.party_type === 'chirias' || s.party_type === 'client')?.signature_data;

        const { data: siteSettingsData } = await supabase
          .from('site_settings')
          .select('key, value');
        const settingsMap: Record<string, string> = {};
        siteSettingsData?.forEach((item: any) => { settingsMap[item.key] = item.value || ''; });

        const pdf = await generateSignedRentalContractPdf({
          contract,
          contractClauses,
          inventoryItems: savedInventory || [],
          proprietarSignature: proprietarSig,
          chiriasSignature: chiriasSig,
          siteSettings: {
            companyName: settingsMap.companyName,
            phone: settingsMap.phone,
            email: settingsMap.email,
            websiteUrl: settingsMap.websiteUrl,
          },
        });
        pdf.save(`contract-${contract.client_name}-${contract.contract_date}.pdf`);
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast.error('Eroare la generarea PDF-ului');
      }
      return;
    }

    toast.error(`Fișierul ${type.toUpperCase()} nu este disponibil`);
  };

  const createSignatureLinks = async (contractId: string) => {
    try {
      const { error } = await supabase
        .from('contract_signatures')
        .insert([
          { contract_id: contractId, party_type: 'proprietar' },
          { contract_id: contractId, party_type: 'chirias' }
        ]);

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Error creating signature links:', error);
      return false;
    }
  };

  const fetchSignatureLinks = async (contractId: string): Promise<ContractSignature[]> => {
    try {
      const { data, error } = await supabase
        .from('contract_signatures')
        .select('*')
        .eq('contract_id', contractId);

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching signature links:', error);
      return [];
    }
  };

  const getSignatureUrl = async (contractId: string, partyType: 'proprietar' | 'chirias'): Promise<string | null> => {
    try {
      let { data, error } = await supabase
        .from('contract_signatures')
        .select('signature_token')
        .eq('contract_id', contractId)
        .eq('party_type', partyType)
        .maybeSingle();

      // If no signature exists, create it
      if (!data) {
        console.log(`Creating signature link for ${partyType}...`);
        const { data: newSig, error: insertError } = await supabase
          .from('contract_signatures')
          .insert({ contract_id: contractId, party_type: partyType })
          .select('signature_token')
          .single();
        
        if (insertError) {
          console.error('Error creating signature:', insertError);
          return null;
        }
        data = newSig;
      }

      if (error || !data) {
        return null;
      }

      // Use production domain for signature links
      const baseUrl = 'https://mvaimobiliare.ro';
      return `${baseUrl}/sign/${data.signature_token}`;
    } catch (error: any) {
      console.error('Error getting signature URL:', error);
      return null;
    }
  };

  const copySignatureLink = async (contractId: string, partyType: 'proprietar' | 'chirias') => {
    const signatureUrl = await getSignatureUrl(contractId, partyType);
    if (!signatureUrl) {
      toast.error('Eroare la obținerea linkului de semnătură');
      return;
    }
    
    // Try multiple methods for mobile compatibility
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(signatureUrl);
        toast.success(`Link de semnătură ${partyType === 'proprietar' ? 'proprietar' : 'chiriaș'} copiat!`);
      } else {
        // Fallback for mobile browsers that don't support clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = signatureUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            toast.success(`Link de semnătură ${partyType === 'proprietar' ? 'proprietar' : 'chiriaș'} copiat!`);
          } else {
            // If copy fails, show the link for manual copy
            toast.info(`Link generat: ${signatureUrl}`, { duration: 10000 });
          }
        } catch (err) {
          toast.info(`Link generat: ${signatureUrl}`, { duration: 10000 });
        }
        
        document.body.removeChild(textArea);
      }
    } catch (error) {
      console.error('Copy failed:', error);
      // Show link in toast as last resort
      toast.info(`Link generat: ${signatureUrl}`, { duration: 10000 });
    }
  };

  const sendSignatureLinkWhatsApp = async (contractId: string, partyType: 'proprietar' | 'chirias', contract: SavedContract) => {
    const signatureUrl = await getSignatureUrl(contractId, partyType);
    if (!signatureUrl) {
      toast.error('Eroare la obținerea linkului de semnătură');
      return;
    }
    
    const partyName = partyType === 'proprietar' 
      ? (contract.proprietar_name || 'Proprietar')
      : `${contract.client_prenume || ''} ${contract.client_name}`.trim();
    
    const message = encodeURIComponent(
      `Bună ziua ${partyName},\n\n` +
      `Vă rugăm să accesați următorul link pentru a semna contractul de închiriere pentru imobilul din ${contract.property_address}:\n\n` +
      `${signatureUrl}\n\n` +
      `Cu stimă,\nMVA Imobiliare`
    );
    
    const whatsappUrl = `https://wa.me/?text=${message}`;
    
    // Use location.href for mobile compatibility (window.open often gets blocked)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      window.location.href = whatsappUrl;
    } else {
      const newWindow = window.open(whatsappUrl, '_blank');
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // Popup was blocked, try location.href as fallback
        window.location.href = whatsappUrl;
      }
    }
  };

  const shareSignatureLink = async (contractId: string, partyType: 'proprietar' | 'chirias', contract: SavedContract) => {
    const signatureUrl = await getSignatureUrl(contractId, partyType);
    if (!signatureUrl) {
      toast.error('Eroare la obținerea linkului de semnătură');
      return;
    }
    
    const partyName = partyType === 'proprietar' 
      ? (contract.proprietar_name || 'Proprietar')
      : `${contract.client_prenume || ''} ${contract.client_name}`.trim();
    
    const shareData = {
      title: 'Semnare Contract - MVA Imobiliare',
      text: `Bună ziua ${partyName},\n\nVă rugăm să accesați linkul pentru a semna contractul de închiriere pentru imobilul din ${contract.property_address}.\n\nCu stimă,\nMVA Imobiliare`,
      url: signatureUrl
    };
    
    // Check if Web Share API is available and can share this data
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        toast.success('Link partajat cu succes!');
      } catch (error: any) {
        // User cancelled or share failed - fallback to WhatsApp
        if (error.name !== 'AbortError') {
          sendSignatureLinkWhatsApp(contractId, partyType, contract);
        }
      }
    } else {
      // Fallback to WhatsApp for browsers without Web Share API
      sendSignatureLinkWhatsApp(contractId, partyType, contract);
    }
  };

  const generateSignatureLinks = async (contractId: string) => {
    const existing = await fetchSignatureLinks(contractId);
    if (existing.length === 0) {
      await createSignatureLinks(contractId);
    }
    toast.success('Linkuri de semnătură generate!');
    await fetchContracts();
  };

  const regeneratePdfWithSignatures = async (contract: SavedContract) => {
    setRegeneratingContractId(contract.id);
    
    try {
      // Fetch site settings for footer
      const { data: siteSettingsData } = await supabase
        .from('site_settings')
        .select('key, value');
      
      const siteSettings: Record<string, string> = {};
      siteSettingsData?.forEach(item => {
        siteSettings[item.key] = item.value || '';
      });
      
      const companyName = siteSettings.companyName || 'MVA Imobiliare';
      const companyPhone = siteSettings.phone || '+40 757 117 442';
      const companyEmail = siteSettings.email || 'contact@mvaimobiliare.ro';
      const companyWebsite = siteSettings.websiteUrl || 'www.mvaimobiliare.ro';

      // Fetch signatures from database
      const { data: signatures, error: sigError } = await supabase
        .from('contract_signatures')
        .select('party_type, signature_data, signer_name')
        .eq('contract_id', contract.id);

      if (sigError) throw sigError;

      // Fetch inventory items for this contract
      const { data: savedInventory, error: invError } = await supabase
        .from('contract_inventory')
        .select('*')
        .eq('contract_id', contract.id);

      if (invError) {
        console.error('Error fetching inventory:', invError);
      }

      const contractInventory = savedInventory || [];

      const proprietarSignature = signatures?.find(s => s.party_type === 'proprietar')?.signature_data;
      const chiriasSignature = signatures?.find(s => s.party_type === 'chirias')?.signature_data;

      if (!proprietarSignature && !chiriasSignature) {
        toast.error('Nu există semnături pentru acest contract');
        return;
      }

      // Generate new PDF with signatures - matching the style of unsigned contracts
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const textWidth = pageWidth - 2 * margin;
      let y = 25;

      // Helper function to add section title (bold, blue)
      const addSectionTitle = (title: string) => {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 51, 153); // Blue color
        doc.text(title, margin, y);
        y += 8;
        doc.setTextColor(0, 0, 0); // Reset to black
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
      };


      // Helper function to add paragraph with indent
      const addParagraph = (text: string, indent: number = 8) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(replaceDiacritics(text), textWidth - indent);
        for (let i = 0; i < lines.length; i++) {
          doc.text(lines[i], margin + indent, y);
          y += 5;
        }
        y += 2;
      };

      // Helper function to draw a box with text content
      const drawPartyBox = (title: string, data: {
        nume: string;
        cnp: string;
        seria: string;
        numar: string;
        emitent: string;
        dataEmiterii: string;
        domiciliu: string;
        cetatenie: string;
      }) => {
        if (y > 200) {
          doc.addPage();
          y = 20;
        }
        
        const boxStartY = y;
        const lineHeight = 6;
        const boxPadding = 5;
        const initialOffset = 4;
        const contentWidth = textWidth - 2 * boxPadding;
        
        // Pre-calculate all multi-line texts
        const eliberatText = `Eliberat de: ${replaceDiacritics(data.emitent)} la data de ${data.dataEmiterii}`;
        const eliberatLines = doc.splitTextToSize(eliberatText, contentWidth);
        const domiciliuText = `Domiciliu: ${replaceDiacritics(data.domiciliu)}`;
        const domiciliuLines = doc.splitTextToSize(domiciliuText, contentWidth);
        
        // Calculate total box height correctly
        const boxHeight = boxPadding + initialOffset + (lineHeight + 2) +
          lineHeight * 3 +
          eliberatLines.length * 5 +
          domiciliuLines.length * 5 +
          lineHeight +
          boxPadding;
        
        // Draw box border
        doc.setLineWidth(0.5);
        doc.setDrawColor(0, 0, 0);
        doc.rect(margin, boxStartY, textWidth, boxHeight);
        
        y = boxStartY + boxPadding + initialOffset;
        
        // Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(replaceDiacritics(title), margin + boxPadding, y);
        y += lineHeight + 2;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        
        doc.text(`Nume: ${replaceDiacritics(data.nume)}`, margin + boxPadding, y);
        y += lineHeight;
        doc.text(`CNP: ${data.cnp}`, margin + boxPadding, y);
        y += lineHeight;
        doc.text(`C.I.: seria ${data.seria} nr. ${data.numar}`, margin + boxPadding, y);
        y += lineHeight;
        
        for (let i = 0; i < eliberatLines.length; i++) {
          doc.text(eliberatLines[i], margin + boxPadding, y);
          y += 5;
        }
        
        for (let i = 0; i < domiciliuLines.length; i++) {
          doc.text(domiciliuLines[i], margin + boxPadding, y);
          y += 5;
        }
        
        doc.text(`Cetatenie: ${replaceDiacritics(data.cetatenie)}`, margin + boxPadding, y);
        
        y = boxStartY + boxHeight + 8;
      };

      const moneda = contract.property_currency || 'EUR';
      const garantieVal = contract.property_price?.toString() || '';
      const durataLuni = contract.duration_months?.toString() || '12';

      // TITLU
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("CONTRACT DE INCHIRIERE", pageWidth / 2, y, { align: "center" });
      y += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text("(Semnat electronic)", pageWidth / 2, y, { align: "center" });
      y += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Incheiat astazi, ${formatDateRomanian(contract.contract_date)} intre:`, pageWidth / 2, y, { align: "center" });
      y += 12;

      // 1. PROPRIETAR BOX
      drawPartyBox("1. PROPRIETAR (LOCATOR):", {
        nume: `${contract.proprietar_prenume || ''} ${contract.proprietar_name || 'N/A'}`,
        cnp: contract.proprietar_cnp || '-',
        seria: contract.proprietar_seria_ci || '-',
        numar: contract.proprietar_numar_ci || '-',
        emitent: contract.proprietar_ci_emitent || '-',
        dataEmiterii: formatDateRomanian(contract.proprietar_ci_data_emiterii) || '-',
        domiciliu: contract.proprietar_adresa || '-',
        cetatenie: 'Romana'
      });

      // 2. CHIRIAS BOX
      drawPartyBox("2. CHIRIAS (LOCATAR):", {
        nume: `${contract.client_prenume || ''} ${contract.client_name}`,
        cnp: contract.client_cnp || '-',
        seria: contract.client_seria_ci || '-',
        numar: contract.client_numar_ci || '-',
        emitent: contract.client_ci_emitent || '-',
        dataEmiterii: formatDateRomanian(contract.client_ci_data_emiterii) || '-',
        domiciliu: contract.client_adresa || '-',
        cetatenie: 'Romana'
      });

      // I. OBIECTUL CONTRACTULUI
      addSectionTitle("I. OBIECTUL CONTRACTULUI");
      addParagraph(`Proprietarul inchiriaza chiriasului imobilul situat in ${contract.property_address}`);

      // II. DESTINATIA
      addSectionTitle("II. DESTINATIA");
      addParagraph("Imobilul va fi folosit de chirias cu destinatia LOCUINTA. Destinatia spatiului inchiriat nu poate fi schimbata.");

      // III. DURATA
      addSectionTitle("III. DURATA");
      addParagraph(`Acest contract este incheiat pentru o perioada de ${durataLuni} luni.`);
      addParagraph("Cu 30 de zile inaintea expirarii contractului, chiriasul va putea prelungi acest contract pentru aceeasi perioada sau pentru o perioada mai mica, numai cu acordul scris al proprietarului.");

      // IV. CHIRIA SI MODALITATI DE PLATA
      addSectionTitle("IV. CHIRIA SI MODALITATI DE PLATA");
      addParagraph(`Chiria lunara convenita de comun acord este de ${contract.property_price || 'N/A'} ${moneda}/ luna.`);
      addParagraph(`Garantia in valoare de ${garantieVal} ${moneda} s-a achitat la data semnarii contractului de inchiriere.`);
      addParagraph("Garantia se va restitui in termen de 30 de zile de la incetarea contractului.");

      // V. OBLIGATIILE SI DREPTURILE PROPRIETARULUI
      addSectionTitle("V. OBLIGATIILE SI DREPTURILE PROPRIETARULUI");
      addParagraph("Obligatii: proprietarul isi asuma raspunderea ca spatiul este liber si va ramane astfel pe toata perioada contractului.");
      addParagraph("Drepturi: sa viziteze imobilul cu anuntarea prealabila; sa verifice achitarea obligatiilor de plata.");

      // VI. OBLIGATIILE SI DREPTURILE CHIRIASULUI
      addSectionTitle("VI. OBLIGATIILE SI DREPTURILE CHIRIASULUI");
      addParagraph("Obligatii: sa foloseasca imobilul conform destinatiei; sa nu subinchirieze; sa achite utilitatile; sa mentina bunurile in buna stare; sa predea spatiul in starea initiala.");
      addParagraph("Drepturi: sa utilizeze imobilul in exclusivitate; sa faca imbunatatiri cu acordul proprietarului.");

      // VII. PREDAREA IMOBILULUI
      addSectionTitle("VII. PREDAREA IMOBILULUI");
      addParagraph("Dupa expirarea contractului chiriasul va preda imobilul in starea in care l-a primit.");

      // VIII. FORTA MAJORA - from database
      const fortaMajoraClause = contractClauses.find(c => c.section_key === 'forta_majora');
      addSectionTitle(fortaMajoraClause?.section_title || "VIII. FORTA MAJORA");
      const fortaMajoraContent = fortaMajoraClause?.content || "Orice cauza neprevazuta si imposibil de evitat va fi considerata cauza de forta majora si va exonera de raspundere partea care o invoca.";
      fortaMajoraContent.split('\n').forEach(line => {
        if (line.trim()) addParagraph(line.trim());
      });

      // IX. CONDITIILE DE INCETARE A CONTRACTULUI - from database
      const incetareClause = contractClauses.find(c => c.section_key === 'incetare_contract');
      addSectionTitle(incetareClause?.section_title || "IX. CONDITIILE DE INCETARE A CONTRACTULUI");
      const incetareContent = incetareClause?.content || "a) la expirarea duratei pentru care a fost incheiat;\nb) in situatia nerespectarii clauzelor contractuale;\nc) clauza fortei majore;\nd) prin denuntare unilaterala cu notificare prealabila de 30 de zile.";
      incetareContent.split('\n').forEach(line => {
        if (line.trim()) addParagraph(line.trim());
      });

      // Signature dimensions
      const signatureHeight = 25;
      const signatureWidth = 50;

      // SEMNATURI CONTRACT
      if (y > 200) {
        doc.addPage();
        y = 30;
      }
      y += 15;
      doc.setFont("helvetica", "bold");
      doc.text("PROPRIETAR", margin, y);
      doc.text("CHIRIAS", pageWidth - margin - 30, y);
      y += 8;
      doc.setFont("helvetica", "normal");
      doc.text(replaceDiacritics(`${contract.proprietar_prenume || ''} ${contract.proprietar_name || ''}`), margin, y);
      doc.text(replaceDiacritics(`${contract.client_prenume || ''} ${contract.client_name}`), pageWidth - margin - 50, y);
      y += 8;
      
      // Add signatures
      if (proprietarSignature) {
        try {
          doc.addImage(proprietarSignature, 'PNG', margin, y, signatureWidth, signatureHeight);
        } catch (e) {
          console.error('Error adding proprietar signature:', e);
        }
      } else {
        doc.text("_______________", margin, y + 10);
      }
      
      if (chiriasSignature) {
        try {
          doc.addImage(chiriasSignature, 'PNG', pageWidth - margin - signatureWidth, y, signatureWidth, signatureHeight);
        } catch (e) {
          console.error('Error adding chirias signature:', e);
        }
      } else {
        doc.text("_______________", pageWidth - margin - 40, y + 10);
      }

      // INVENTAR - Add inventory section if items exist (pe pagină separată, fără semnături)
      if (contractInventory.length > 0) {
        doc.addPage();
        y = 25;
        
        doc.setFontSize(14);
        doc.setFont("times", "bold");
        doc.text("ANEXA 1 - INVENTAR IMOBIL", pageWidth / 2, y, { align: "center" });
        y += 12;
        
        doc.setFontSize(10);
        doc.setFont("times", "normal");
        addParagraph(`Inventar al bunurilor aflate in imobilul situat in ${contract.property_address}, predate de proprietar chiriasului la data inceperii contractului de inchiriere.`);
        y += 5;
        
        // Table header
        const startX = margin;
        
        doc.setFont("times", "bold");
        doc.setFillColor(240, 240, 240);
        doc.rect(startX, y - 4, textWidth, 8, 'F');
        doc.text("Denumire", startX + 2, y);
        doc.text("Cant.", startX + 55, y);
        doc.text("Stare", startX + 70, y);
        doc.text("Locatie", startX + 105, y);
        doc.text("Observatii", startX + 130, y);
        y += 8;
        
        doc.setFont("times", "normal");
        
        const conditionLabels: Record<string, string> = {
          'noua': 'Noua',
          'foarte_buna': 'F. buna',
          'buna': 'Buna',
          'satisfacatoare': 'Satisf.',
          'uzata': 'Uzata'
        };
        
        contractInventory.forEach((item: any, index: number) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          
          // Alternate row background
          if (index % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(startX, y - 4, textWidth, 6, 'F');
          }
          
          doc.text(replaceDiacritics((item.item_name || '').substring(0, 25)), startX + 2, y);
          doc.text((item.quantity || 1).toString(), startX + 55, y);
          doc.text(replaceDiacritics(conditionLabels[item.condition] || item.condition || ''), startX + 70, y);
          doc.text(replaceDiacritics((item.location || '-').substring(0, 12)), startX + 105, y);
          doc.text(replaceDiacritics((item.notes || '-').substring(0, 20)), startX + 130, y);
          y += 6;
        });
        
        y += 10;
        addParagraph(`Total articole inventariate: ${contractInventory.length}`);
        y += 10;
        
        addParagraph("Prezentul inventar a fost intocmit in 2 (doua) exemplare, cate unul pentru fiecare parte, si face parte integranta din contractul de inchiriere.");
        y += 15;
        
        // Add inventory images section if any item has images
        const itemsWithImages = contractInventory.filter((item: any) => item.images && item.images.length > 0);
        
        if (itemsWithImages.length > 0) {
          doc.addPage();
          y = 25;
          
          doc.setFontSize(12);
          doc.setFont("times", "bold");
          doc.text("FOTOGRAFII INVENTAR", pageWidth / 2, y, { align: "center" });
          y += 12;
          
          doc.setFontSize(10);
          doc.setFont("times", "normal");
          
          for (const item of itemsWithImages) {
            if (y > 250) {
              doc.addPage();
              y = 20;
            }
            
            doc.setFont("times", "bold");
            doc.text(replaceDiacritics(`${item.item_name}${item.location ? ` - ${item.location}` : ''}`), margin, y);
            y += 6;
            doc.setFont("times", "normal");
            
            let imageX = margin;
            const { width: imageWidth, height: imageHeight, perRow: imagesPerRow } = imageSizeConfig[inventoryImageSize];
            
            for (let i = 0; i < item.images.length; i++) {
              try {
                // Check if we need a new row
                if (i > 0 && i % imagesPerRow === 0) {
                  y += imageHeight + 5;
                  imageX = margin;
                }
                
                // Check page break
                if (y + imageHeight > 280) {
                  doc.addPage();
                  y = 20;
                  imageX = margin;
                }
                
                // Convert image URL to base64 before adding to PDF
                const base64Image = await imageUrlToBase64(item.images[i]);
                
                if (base64Image) {
                  doc.addImage(base64Image, 'JPEG', imageX, y, imageWidth, imageHeight);
                } else {
                  // Add placeholder if image conversion fails
                  doc.setFillColor(240, 240, 240);
                  doc.rect(imageX, y, imageWidth, imageHeight, 'F');
                  doc.setFontSize(8);
                  doc.text('[Imagine indisponibila]', imageX + 5, y + imageHeight / 2);
                  doc.setFontSize(10);
                }
                imageX += imageWidth + 5;
              } catch (imgError) {
                console.warn('Could not add image to PDF:', imgError);
                // Add placeholder text if image fails
                doc.setFillColor(240, 240, 240);
                doc.rect(imageX, y, imageWidth, imageHeight, 'F');
                doc.setFontSize(8);
                doc.text('[Eroare imagine]', imageX + 10, y + imageHeight / 2);
                doc.setFontSize(10);
                imageX += imageWidth + 5;
              }
            }
            
            y += imageHeight + 10;
          }
        }
      }

      // Add page numbers and footer with contact info to all pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setFont("times", "normal");
        doc.setTextColor(100, 100, 100);
        
        // Contact info line - using settings from database
        doc.text(`${companyName} | Tel: ${companyPhone} | Email: ${companyEmail} | ${companyWebsite.replace('https://', '')}`, pageWidth / 2, 285, { align: "center" });
        
        // Page number
        doc.text(`Pagina ${i} din ${totalPages}`, pageWidth / 2, 290, { align: "center" });
        
        // Reset text color
        doc.setTextColor(0, 0, 0);
      }

      // Generate and upload new PDF
      const fileName = `contract_semnat_${contract.client_name}_${Date.now()}.pdf`;
      const pdfBlob = doc.output('blob');
      const pdfPath = await uploadContractFile(pdfBlob, fileName);

      // Update contract in database with new PDF URL
      if (pdfPath) {
        await supabase
          .from('contracts')
          .update({ pdf_url: pdfPath })
          .eq('id', contract.id);
      }

      // Don't auto-download - user can download manually from the contracts list
      
      await fetchContracts();
      toast.success("PDF cu semnături regenerat cu succes!");
    } catch (error: any) {
      console.error('Error regenerating PDF:', error);
      toast.error("Eroare la regenerarea PDF-ului");
    } finally {
      setRegeneratingContractId(null);
    }
  };

  const openEmailDialog = (contractId: string, partyType: 'proprietar' | 'chirias', propertyAddress: string) => {
    setEmailDialogData({ contractId, partyType, propertyAddress });
    setEmailRecipient({ name: '', email: '' });
    setEmailDialogOpen(true);
  };

  const openPreviewDialog = async (contract: SavedContract) => {
    // Always generate PDF in memory for reliable preview
    if (contract.proprietar_signed || contract.chirias_signed || contract.contract_type === 'inchiriere' || contract.contract_type === 'intermediere') {
      setPreviewingContractId(contract.id);
      setPreviewContractName(`${contract.client_prenume || ''} ${contract.client_name}`.trim());
      setPreviewPdfUrl(null);
      setPreviewDialogOpen(true);

      try {
        const { data: signatures, error: sigError } = await supabase
          .from('contract_signatures')
          .select('party_type, signature_data, signer_name')
          .eq('contract_id', contract.id);

        if (sigError) throw sigError;

        const { data: savedInventory } = await supabase
          .from('contract_inventory')
          .select('*')
          .eq('contract_id', contract.id);

        const { data: siteSettingsData } = await supabase
          .from('site_settings')
          .select('key, value');
        const settingsMap: Record<string, string> = {};
        siteSettingsData?.forEach((item: any) => { settingsMap[item.key] = item.value || ''; });

        const proprietarSignature = signatures?.find(s => s.party_type === 'proprietar')?.signature_data;
        const chiriasSignature = signatures?.find(s => s.party_type === 'chirias' || s.party_type === 'client')?.signature_data;

        const pdf = await generateSignedRentalContractPdf({
          contract,
          contractClauses,
          inventoryItems: savedInventory || [],
          proprietarSignature,
          chiriasSignature,
          siteSettings: {
            companyName: settingsMap.companyName,
            phone: settingsMap.phone,
            email: settingsMap.email,
            websiteUrl: settingsMap.websiteUrl,
          },
        });

        const blob = pdf.output('blob');
        const blobUrl = URL.createObjectURL(blob);
        setPreviewPdfUrl(blobUrl);
      } catch (error) {
        console.error('Error generating preview:', error);
        toast.error('Eroare la generarea previzualizării');
        setPreviewDialogOpen(false);
      } finally {
        setPreviewingContractId(null);
      }
      return;
    }

    // Generate preview for contracts without signatures (draft preview)
    setPreviewingContractId(contract.id);
    setPreviewContractName(`${contract.client_prenume || ''} ${contract.client_name}`.trim());
    setPreviewPdfUrl(null);
    setPreviewDialogOpen(true);

    try {
      // Fetch inventory items for this contract
      const { data: savedInventory, error: invError } = await supabase
        .from('contract_inventory')
        .select('*')
        .eq('contract_id', contract.id);

      if (invError) {
        console.error('Error fetching inventory:', invError);
      }

      const contractInventory = savedInventory || [];

      // Generate PDF in memory (draft - no signatures) - using same style as main contract
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const textWidth = pageWidth - 2 * margin;
      let y = 25;

      // Helper function to add section title (bold, blue)
      const addSectionTitle = (title: string) => {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 51, 153); // Blue color
        doc.text(title, margin, y);
        y += 8;
        doc.setTextColor(0, 0, 0); // Reset to black
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
      };

      // Functie pentru inlocuirea diacriticelor romanesti cu litere normale
      const replaceDiacritics = (text: string): string => {
        const normalized = text.normalize('NFD');
        const withoutCombining = normalized.replace(/[\u0300-\u036f]/g, '');
        return withoutCombining
          .replace(/ă/g, 'a').replace(/Ă/g, 'A')
          .replace(/â/g, 'a').replace(/Â/g, 'A')
          .replace(/î/g, 'i').replace(/Î/g, 'I')
          .replace(/ș/g, 's').replace(/Ș/g, 'S')
          .replace(/ț/g, 't').replace(/Ț/g, 'T')
          .replace(/ş/g, 's').replace(/Ş/g, 'S')
          .replace(/ţ/g, 't').replace(/Ţ/g, 'T');
      };

      // Helper function to add paragraph with indent
      const addParagraph = (text: string, indent: number = 8) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(replaceDiacritics(text), textWidth - indent);
        for (let i = 0; i < lines.length; i++) {
          doc.text(lines[i], margin + indent, y);
          y += 5;
        }
        y += 2;
      };

      // Helper function to draw a box with text content
      const drawPartyBox = (title: string, data: {
        nume: string;
        cnp: string;
        seria: string;
        numar: string;
        emitent: string;
        dataEmiterii: string;
        domiciliu: string;
        cetatenie: string;
      }) => {
        if (y > 200) {
          doc.addPage();
          y = 20;
        }
        
        const boxStartY = y;
        const lineHeight = 6;
        const boxPadding = 5;
        const initialOffset = 4;
        const contentWidth = textWidth - 2 * boxPadding;
        
        // Pre-calculate all multi-line texts
        const eliberatText = `Eliberat de: ${replaceDiacritics(data.emitent)} la data de ${data.dataEmiterii}`;
        const eliberatLines = doc.splitTextToSize(eliberatText, contentWidth);
        const domiciliuText = `Domiciliu: ${replaceDiacritics(data.domiciliu)}`;
        const domiciliuLines = doc.splitTextToSize(domiciliuText, contentWidth);
        
        // Calculate total box height correctly
        const boxHeight = boxPadding + initialOffset + (lineHeight + 2) +
          lineHeight * 3 +
          eliberatLines.length * 5 +
          domiciliuLines.length * 5 +
          lineHeight +
          boxPadding;
        
        doc.setLineWidth(0.5);
        doc.setDrawColor(0, 0, 0);
        doc.rect(margin, boxStartY, textWidth, boxHeight);
        
        y = boxStartY + boxPadding + initialOffset;
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(replaceDiacritics(title), margin + boxPadding, y);
        y += lineHeight + 2;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        
        doc.text(`Nume: ${replaceDiacritics(data.nume)}`, margin + boxPadding, y);
        y += lineHeight;
        doc.text(`CNP: ${data.cnp}`, margin + boxPadding, y);
        y += lineHeight;
        doc.text(`C.I.: seria ${data.seria} nr. ${data.numar}`, margin + boxPadding, y);
        y += lineHeight;
        
        for (let i = 0; i < eliberatLines.length; i++) {
          doc.text(eliberatLines[i], margin + boxPadding, y);
          y += 5;
        }
        
        for (let i = 0; i < domiciliuLines.length; i++) {
          doc.text(domiciliuLines[i], margin + boxPadding, y);
          y += 5;
        }
        
        doc.text(`Cetatenie: ${replaceDiacritics(data.cetatenie)}`, margin + boxPadding, y);
        
        y = boxStartY + boxHeight + 8;
      };

      const moneda = contract.property_currency || 'EUR';
      const garantieVal = contract.property_price?.toString() || '';
      const durataLuni = contract.duration_months?.toString() || '12';

      // TITLU
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("CONTRACT DE INCHIRIERE", pageWidth / 2, y, { align: "center" });
      y += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text("(CIORNA - nesemnat)", pageWidth / 2, y, { align: "center" });
      y += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Incheiat astazi, ${formatDateRomanian(contract.contract_date)} intre:`, pageWidth / 2, y, { align: "center" });
      y += 12;

      // 1. PROPRIETAR BOX
      drawPartyBox("1. PROPRIETAR (LOCATOR):", {
        nume: `${contract.proprietar_prenume || ''} ${contract.proprietar_name || 'N/A'}`,
        cnp: contract.proprietar_cnp || '-',
        seria: contract.proprietar_seria_ci || '-',
        numar: contract.proprietar_numar_ci || '-',
        emitent: contract.proprietar_ci_emitent || '-',
        dataEmiterii: formatDateRomanian(contract.proprietar_ci_data_emiterii) || '-',
        domiciliu: contract.proprietar_adresa || '-',
        cetatenie: 'Romana'
      });

      // 2. CHIRIAS BOX
      drawPartyBox("2. CHIRIAS (LOCATAR):", {
        nume: `${contract.client_prenume || ''} ${contract.client_name}`,
        cnp: contract.client_cnp || '-',
        seria: contract.client_seria_ci || '-',
        numar: contract.client_numar_ci || '-',
        emitent: contract.client_ci_emitent || '-',
        dataEmiterii: formatDateRomanian(contract.client_ci_data_emiterii) || '-',
        domiciliu: contract.client_adresa || '-',
        cetatenie: 'Romana'
      });

      // I. OBIECTUL CONTRACTULUI
      addSectionTitle("I. OBIECTUL CONTRACTULUI");
      addParagraph(`Proprietarul inchiriaza chiriasului imobilul situat in ${contract.property_address}`);

      // II. DESTINATIA
      addSectionTitle("II. DESTINATIA");
      addParagraph("Imobilul va fi folosit de chirias cu destinatia LOCUINTA. Destinatia spatiului inchiriat nu poate fi schimbata.");

      // III. DURATA
      addSectionTitle("III. DURATA");
      addParagraph(`Acest contract este incheiat pentru o perioada de ${durataLuni} luni.`);
      addParagraph("Cu 30 de zile inaintea expirarii contractului, chiriasul va putea prelungi acest contract pentru aceeasi perioada sau pentru o perioada mai mica, numai cu acordul scris al proprietarului.");

      // IV. CHIRIA SI MODALITATI DE PLATA
      addSectionTitle("IV. CHIRIA SI MODALITATI DE PLATA");
      addParagraph(`Chiria lunara convenita de comun acord este de ${contract.property_price || 'N/A'} ${moneda}/ luna.`);
      addParagraph(`Garantia in valoare de ${garantieVal} ${moneda} se va plati la data semnarii contractului.`);
      addParagraph("Garantia se va restitui in termen de 30 de zile de la incetarea contractului.");

      // V. OBLIGATIILE SI DREPTURILE PROPRIETARULUI
      addSectionTitle("V. OBLIGATIILE SI DREPTURILE PROPRIETARULUI");
      addParagraph("Obligatii: proprietarul isi asuma raspunderea ca spatiul este liber si va ramane astfel pe toata perioada contractului.");
      addParagraph("Drepturi: sa viziteze imobilul cu anuntarea prealabila; sa verifice achitarea obligatiilor de plata.");

      // VI. OBLIGATIILE SI DREPTURILE CHIRIASULUI
      addSectionTitle("VI. OBLIGATIILE SI DREPTURILE CHIRIASULUI");
      addParagraph("Obligatii: sa foloseasca imobilul conform destinatiei; sa nu subinchirieze; sa achite utilitatile; sa mentina bunurile in buna stare; sa predea spatiul in starea initiala.");
      addParagraph("Drepturi: sa utilizeze imobilul in exclusivitate; sa faca imbunatatiri cu acordul proprietarului.");

      // VII. PREDAREA IMOBILULUI
      addSectionTitle("VII. PREDAREA IMOBILULUI");
      addParagraph("Dupa expirarea contractului chiriasul va preda imobilul in starea in care l-a primit.");

      // VIII. FORTA MAJORA - from database
      const fortaMajoraClausePreview = contractClauses.find(c => c.section_key === 'forta_majora');
      addSectionTitle(fortaMajoraClausePreview?.section_title || "VIII. FORTA MAJORA");
      const fortaMajoraContentPreview = fortaMajoraClausePreview?.content || "Orice cauza neprevazuta si imposibil de evitat va fi considerata cauza de forta majora si va exonera de raspundere partea care o invoca.";
      fortaMajoraContentPreview.split('\n').forEach(line => {
        if (line.trim()) addParagraph(line.trim());
      });

      // IX. CONDITIILE DE INCETARE A CONTRACTULUI - from database
      const incetareClausePreview = contractClauses.find(c => c.section_key === 'incetare_contract');
      addSectionTitle(incetareClausePreview?.section_title || "IX. CONDITIILE DE INCETARE A CONTRACTULUI");
      const incetareContentPreview = incetareClausePreview?.content || "a) la expirarea duratei pentru care a fost incheiat;\nb) in situatia nerespectarii clauzelor contractuale;\nc) clauza fortei majore;\nd) prin denuntare unilaterala cu notificare prealabila de 30 de zile.";
      incetareContentPreview.split('\n').forEach(line => {
        if (line.trim()) addParagraph(line.trim());
      });

      // INVENTAR
      if (contractInventory.length > 0) {
        doc.addPage();
        y = 25;
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Lista de Inventar", pageWidth / 2, y, { align: "center" });
        y += 12;
        
        const colWidths = [15, 65, 25, 30, 35];
        const startX = margin;
        const rowHeight = 8;
        
        doc.setFillColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setLineWidth(0.3);
        
        let currentX = startX;
        const headers = ["Nr.", "Denumire", "Cantitate", "Stare", "Observatii"];
        
        headers.forEach((header, i) => {
          doc.rect(currentX, y, colWidths[i], rowHeight);
          doc.text(header, currentX + 2, y + 5.5);
          currentX += colWidths[i];
        });
        y += rowHeight;
        
        doc.setFont("helvetica", "normal");
        
        const conditionLabels: Record<string, string> = {
          'noua': 'Noua',
          'foarte_buna': 'F. buna',
          'buna': 'Buna',
          'satisfacatoare': 'Satisf.',
          'uzata': 'Uzata'
        };
        
        contractInventory.forEach((item: any, index: number) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
            
            currentX = startX;
            doc.setFont("helvetica", "bold");
            headers.forEach((header, i) => {
              doc.rect(currentX, y, colWidths[i], rowHeight);
              doc.text(header, currentX + 2, y + 5.5);
              currentX += colWidths[i];
            });
            y += rowHeight;
            doc.setFont("helvetica", "normal");
          }
          
          currentX = startX;
          const rowData = [
            (index + 1).toString(),
            replaceDiacritics((item.item_name || '').substring(0, 28)),
            (item.quantity || 1).toString(),
            conditionLabels[item.condition] || 'Buna',
            replaceDiacritics((item.notes || '-').substring(0, 15))
          ];
          
          rowData.forEach((text, i) => {
            doc.rect(currentX, y, colWidths[i], rowHeight);
            doc.text(text, currentX + 2, y + 5.5);
            currentX += colWidths[i];
          });
          y += rowHeight;
        });
      }

      // SEMNATURI CONTRACT
      if (y > 200) {
        doc.addPage();
        y = 30;
      }
      y += 15;
      doc.setFont("helvetica", "bold");
      doc.text("PROPRIETAR", margin, y);
      doc.text("CHIRIAS", pageWidth - margin - 30, y);
      y += 8;
      doc.setFont("helvetica", "normal");
      doc.text(replaceDiacritics(`${contract.proprietar_prenume || ''} ${contract.proprietar_name || ''}`), margin, y);
      doc.text(replaceDiacritics(`${contract.client_prenume || ''} ${contract.client_name}`), pageWidth - margin - 50, y);
      y += 15;
      
      doc.text("_______________", margin, y);
      doc.text("_______________", pageWidth - margin - 40, y);

      // Convert to blob URL for reliable multi-page preview
      const blob = doc.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      setPreviewPdfUrl(blobUrl);
    } catch (error) {
      console.error('Error generating draft preview:', error);
      toast.error('Eroare la generarea previzualizării');
      setPreviewDialogOpen(false);
    } finally {
      setPreviewingContractId(null);
    }
  };

  const sendSignatureLinkEmail = async () => {
    if (!emailDialogData || !emailRecipient.email) {
      toast.error('Vă rugăm introduceți adresa de email');
      return;
    }

    setIsSendingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-signature-link', {
        body: {
          contractId: emailDialogData.contractId,
          contractType: "inchiriere",
          partyType: emailDialogData.partyType,
          recipientEmail: emailRecipient.email,
          recipientName: emailRecipient.name,
          propertyAddress: emailDialogData.propertyAddress,
        }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success(`Email trimis cu succes către ${emailRecipient.email}`);
      setEmailDialogOpen(false);
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error('Eroare la trimiterea emailului');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const generateContract = async (format: 'pdf' | 'docx' = 'pdf') => {
    if (!contractData.proprietar.nume || !contractData.chirias.nume) {
      toast.error("Va rugam completati datele proprietarului si chiriasului");
      return;
    }

    if (!contractData.proprietate_adresa) {
      toast.error("Va rugam completati adresa proprietatii");
      return;
    }

    setIsGenerating(true);
    setIsSaving(true);
    
    try {
      if (format === 'docx') {
        // Generate Word document using extracted function
        const docxBlob = await generateRentalContractDocx({
          contractData,
          contractClauses,
          inventoryItems
        });
        
        const fileName = generateDocxFilename(contractData);
        
        // Upload to storage
        const docxPath = await uploadContractFile(docxBlob, fileName);
        
        // Download locally
        downloadDocxBlob(docxBlob, fileName);
        
        // Save to database with file path
        await saveContractToDatabase(undefined, docxPath || undefined);
        
        toast.success("Contract generat si salvat cu succes!");
        return;
      } else {
        // Generate PDF using extracted function
        const pdf = await generateRentalContractPdf({
          contractData,
          contractClauses,
          inventoryItems,
          inventoryImageSize
        });
        
        const fileName = `contract_inchiriere_${contractData.chirias.nume}_${contractData.chirias.prenume}_${Date.now()}.pdf`;
        
        // Get PDF as blob for storage upload
        const pdfBlob = pdf.output('blob');
        const pdfPath = await uploadContractFile(pdfBlob, fileName);
        
        // Download locally
        pdf.save(fileName);
        
        // Save to database with file path
        await saveContractToDatabase(pdfPath || undefined, undefined);
      }
      
      toast.success("Contract generat si salvat cu succes!");
    } catch (error: any) {
      console.error('Error generating contract:', error);
      toast.error("Eroare la generarea contractului");
    } finally {
      setIsGenerating(false);
      setIsSaving(false);
    }
  };

  const generateBothFormats = async () => {
    if (!contractData.proprietar.nume || !contractData.chirias.nume) {
      toast.error("Va rugam completati datele proprietarului si chiriasului");
      return;
    }

    if (!contractData.proprietate_adresa) {
      toast.error("Va rugam completati adresa proprietatii");
      return;
    }

    setIsGeneratingBoth(true);
    setIsSaving(true);
    
    try {
      const timestamp = Date.now();

      // Generate DOCX using extracted function
      const docxBlob = await generateRentalContractDocx({
        contractData,
        contractClauses,
        inventoryItems
      });
      
      const docxFileName = `contract_inchiriere_${contractData.chirias.nume}_${contractData.chirias.prenume}_${timestamp}.docx`;
      const docxPath = await uploadContractFile(docxBlob, docxFileName);
      
      // Download DOCX
      downloadDocxBlob(docxBlob, docxFileName);

      // Generate PDF using extracted function
      const pdf = await generateRentalContractPdf({
        contractData,
        contractClauses,
        inventoryItems,
        inventoryImageSize
      });

      const pdfFileName = `contract_inchiriere_${contractData.chirias.nume}_${contractData.chirias.prenume}_${timestamp}.pdf`;
      const pdfBlob = pdf.output('blob');
      const pdfPath = await uploadContractFile(pdfBlob, pdfFileName);
      pdf.save(pdfFileName);

      // Save to database with both paths
      await saveContractToDatabase(pdfPath || undefined, docxPath || undefined);
      
      toast.success("Ambele formate (PDF + DOCX) au fost generate si salvate cu succes!");
    } catch (error: any) {
      console.error('Error generating contracts:', error);
      toast.error("Eroare la generarea contractelor");
    } finally {
      setIsGeneratingBoth(false);
      setIsSaving(false);
    }
  };

  const previewNewContract = async () => {
    if (!contractData.proprietar.nume || !contractData.chirias.nume) {
      toast.error("Va rugam completati datele proprietarului si chiriasului");
      return;
    }

    if (!contractData.proprietate_adresa) {
      toast.error("Va rugam completati adresa proprietatii");
      return;
    }

    setIsPreviewingNew(true);
    setPreviewDialogOpen(true);
    setPreviewContractName(`Contract ${contractData.chirias.prenume} ${contractData.chirias.nume}`);
    
    try {
      const pdf = await generateRentalContractPdf({
        contractData,
        contractClauses,
        inventoryItems,
      });
      const blob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      setPreviewPdfUrl(blobUrl);
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Eroare la generarea previzualizării');
      setPreviewDialogOpen(false);
    } finally {
      setIsPreviewingNew(false);
    }
  };

  // Download unsigned contract (without signatures)
  const downloadUnsignedContract = async () => {
    if (!contractData.proprietar.nume || !contractData.chirias.nume) {
      toast.error("Vă rugăm completați datele proprietarului și chiriașului");
      return;
    }

    if (!contractData.proprietate_adresa) {
      toast.error("Vă rugăm completați adresa proprietății");
      return;
    }

    setIsDownloadingUnsigned(true);

    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const textWidth = pageWidth - 2 * margin;
      let y = 25;

      const formatDateRomanianLocal = (dateStr: string | null | undefined) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr || "-";
        return format(date, "dd.MM.yyyy", { locale: ro });
      };

      // Helper function to add section title (bold, blue)
      const addSectionTitle = (title: string) => {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 51, 153); // Blue color
        doc.text(title, margin, y);
        y += 8;
        doc.setTextColor(0, 0, 0); // Reset to black
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
      };


      // Helper function to add paragraph with indent
      const addParagraph = (text: string, indent: number = 8) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(replaceDiacritics(text), textWidth - indent);
        for (let i = 0; i < lines.length; i++) {
          doc.text(lines[i], margin + indent, y);
          y += 5;
        }
        y += 2;
      };

      // Helper function to draw a box with text content
      const drawPartyBox = (title: string, data: {
        nume: string;
        cnp: string;
        seria: string;
        numar: string;
        emitent: string;
        dataEmiterii: string;
        domiciliu: string;
        cetatenie: string;
      }) => {
        if (y > 200) {
          doc.addPage();
          y = 20;
        }
        
        const boxStartY = y;
        const lineHeight = 6;
        const boxPadding = 5;
        const contentWidth = textWidth - 2 * boxPadding;
        
        // Pre-calculate all multi-line texts
        const eliberatText = `Eliberat de: ${replaceDiacritics(data.emitent)} la data de ${data.dataEmiterii}`;
        const eliberatLines = doc.splitTextToSize(eliberatText, contentWidth);
        const domiciliuText = `Domiciliu: ${replaceDiacritics(data.domiciliu)}`;
        const domiciliuLines = doc.splitTextToSize(domiciliuText, contentWidth);
        
        // Calculate total box height
        const boxHeight = boxPadding + (lineHeight + 2) + // title
          lineHeight * 3 + // Nume, CNP, C.I.
          eliberatLines.length * 5 + // Eliberat de (multi-line)
          domiciliuLines.length * 5 + // Domiciliu (multi-line)
          lineHeight + // Cetatenie
          boxPadding;
        
        // Draw box border
        doc.setLineWidth(0.5);
        doc.setDrawColor(0, 0, 0);
        doc.rect(margin, boxStartY, textWidth, boxHeight);
        
        y = boxStartY + boxPadding + 4;
        
        // Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(replaceDiacritics(title), margin + boxPadding, y);
        y += lineHeight + 2;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        
        // Nume
        doc.text(`Nume: ${replaceDiacritics(data.nume)}`, margin + boxPadding, y);
        y += lineHeight;
        
        // CNP
        doc.text(`CNP: ${data.cnp}`, margin + boxPadding, y);
        y += lineHeight;
        
        // CI
        doc.text(`C.I.: seria ${data.seria} nr. ${data.numar}`, margin + boxPadding, y);
        y += lineHeight;
        
        // Eliberat de (multi-line)
        for (let i = 0; i < eliberatLines.length; i++) {
          doc.text(eliberatLines[i], margin + boxPadding, y);
          y += 5;
        }
        
        // Domiciliu (may wrap)
        for (let i = 0; i < domiciliuLines.length; i++) {
          doc.text(domiciliuLines[i], margin + boxPadding, y);
          y += 5;
        }
        
        // Cetatenie
        doc.text(`Cetatenie: ${replaceDiacritics(data.cetatenie)}`, margin + boxPadding, y);
        
        y = boxStartY + boxHeight + 8;
      };

      const numCamere = parseInt(contractData.numar_camere) || 1;
      const camereText = numCamere === 1 ? "o camera" : numCamere === 2 ? "doua camere" : numCamere === 3 ? "trei camere" : numCamere === 4 ? "patru camere" : `${numCamere} camere`;
      const moneda = contractData.moneda || "EUR";
      const garantieVal = contractData.garantie || contractData.proprietate_pret;

      // TITLU
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("CONTRACT DE INCHIRIERE", pageWidth / 2, y, { align: "center" });
      y += 12;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Incheiat astazi, ${formatDateRomanianLocal(contractData.data_contract)} intre:`, pageWidth / 2, y, { align: "center" });
      y += 12;

      // 1. PROPRIETAR BOX
      drawPartyBox("1. PROPRIETAR (LOCATOR):", {
        nume: `${contractData.proprietar.prenume} ${contractData.proprietar.nume}`,
        cnp: contractData.proprietar.cnp,
        seria: contractData.proprietar.seria_ci,
        numar: contractData.proprietar.numar_ci,
        emitent: contractData.proprietar.ci_emitent || '-',
        dataEmiterii: formatDateRomanianLocal(contractData.proprietar.ci_data_emiterii) || '-',
        domiciliu: contractData.proprietar.adresa,
        cetatenie: contractData.proprietar.cetatenie || 'Romana'
      });

      // 2. CHIRIAS BOX
      drawPartyBox("2. CHIRIAS (LOCATAR):", {
        nume: `${contractData.chirias.prenume} ${contractData.chirias.nume}`,
        cnp: contractData.chirias.cnp,
        seria: contractData.chirias.seria_ci,
        numar: contractData.chirias.numar_ci,
        emitent: contractData.chirias.ci_emitent || '-',
        dataEmiterii: formatDateRomanianLocal(contractData.chirias.ci_data_emiterii) || '-',
        domiciliu: contractData.chirias.adresa,
        cetatenie: contractData.chirias.cetatenie || 'romana'
      });

      // I. OBIECTUL CONTRACTULUI
      addSectionTitle("I. OBIECTUL CONTRACTULUI");
      addParagraph(`Proprietarul inchiriaza chiriasului imobilul format din ${camereText} situat in ${contractData.proprietate_adresa}`);

      // II. DESTINATIA
      addSectionTitle("II. DESTINATIA");
      addParagraph("Imobilul va fi folosit de chirias cu destinatia LOCUINTA. Destinatia spatiului inchiriat nu poate fi schimbata.");

      // III. DURATA
      addSectionTitle("III. DURATA");
      addParagraph(`Acest contract este incheiat pentru o perioada de ${contractData.durata_inchiriere || "12"} luni, incepand cu data de ${formatDateRomanianLocal(contractData.data_incepere || contractData.data_contract)}.`);
      addParagraph("Cu 30 de zile inaintea expirarii contractului, chiriasul va putea prelungi acest contract pentru aceeasi perioada sau pentru o perioada mai mica, numai cu acordul scris al proprietarului.");

      // IV. CHIRIA SI MODALITATI DE PLATA
      addSectionTitle("IV. CHIRIA SI MODALITATI DE PLATA");
      addParagraph(`Chiria lunara convenita de comun acord este de ${contractData.proprietate_pret} ${moneda}/ luna.`);
      
      const garantieTextUnsigned = contractData.garantie_status === "platita" 
        ? `Garantia in valoare de ${garantieVal} ${moneda} s-a platit la data semnarii contractului.`
        : `Garantia in valoare de ${garantieVal} ${moneda} se va plati in termen de 10 zile lucratoare de la data semnarii contractului.`;
      addParagraph(garantieTextUnsigned);
      addParagraph("Garantia se va restitui in termen de 30 de zile de la incetarea contractului.");

      // V. OBLIGATIILE SI DREPTURILE PROPRIETARULUI
      addSectionTitle("V. OBLIGATIILE SI DREPTURILE PROPRIETARULUI");
      addParagraph("Obligatii: proprietarul isi asuma raspunderea ca spatiul este liber si va ramane astfel pe toata perioada contractului.");
      addParagraph("Drepturi: sa viziteze imobilul cu anuntarea prealabila; sa verifice achitarea obligatiilor de plata.");

      // VI. OBLIGATIILE SI DREPTURILE CHIRIASULUI
      addSectionTitle("VI. OBLIGATIILE SI DREPTURILE CHIRIASULUI");
      addParagraph("Obligatii: sa foloseasca imobilul conform destinatiei; sa nu subinchirieze; sa achite utilitatile; sa mentina bunurile in buna stare; sa predea spatiul in starea initiala.");
      addParagraph("Drepturi: sa utilizeze imobilul in exclusivitate; sa faca imbunatatiri cu acordul proprietarului.");

      // VII. PREDAREA IMOBILULUI
      addSectionTitle("VII. PREDAREA IMOBILULUI");
      addParagraph("Dupa expirarea contractului chiriasul va preda imobilul in starea in care l-a primit.");

      // VIII. FORTA MAJORA - from database
      const fortaMajoraUnsigned = contractClauses.find(c => c.section_key === 'forta_majora');
      addSectionTitle(fortaMajoraUnsigned?.section_title || "VIII. FORTA MAJORA");
      const fortaMajoraUnsignedContent = fortaMajoraUnsigned?.content || "Orice cauza neprevazuta si imposibil de evitat va fi considerata cauza de forta majora si va exonera de raspundere partea care o invoca.";
      fortaMajoraUnsignedContent.split('\n').forEach(line => {
        if (line.trim()) addParagraph(line.trim());
      });

      // IX. CONDITIILE DE INCETARE A CONTRACTULUI - from database
      const incetareUnsigned = contractClauses.find(c => c.section_key === 'incetare_contract');
      addSectionTitle(incetareUnsigned?.section_title || "IX. CONDITIILE DE INCETARE A CONTRACTULUI");
      const incetareUnsignedContent = incetareUnsigned?.content || "a) la expirarea duratei pentru care a fost incheiat;\nb) in situatia nerespectarii clauzelor contractuale;\nc) clauza fortei majore;\nd) prin denuntare unilaterala cu notificare prealabila de 30 de zile.";
      incetareUnsignedContent.split('\n').forEach(line => {
        if (line.trim()) addParagraph(line.trim());
      });

      // Art. 8 - INVENTAR IMOBIL with table
      if (inventoryItems.length > 0) {
        addSectionTitle("Art. 8 - INVENTAR IMOBIL");
        addParagraph("Lista bunurilor care fac parte din imobil:");
        
        // New page for inventory table
        doc.addPage();
        y = 25;
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Lista de Inventar", pageWidth / 2, y, { align: "center" });
        y += 12;
        
        // Table configuration
        const colWidths = [15, 65, 25, 30, 35];
        const startX = margin;
        const rowHeight = 8;
        
        // Draw table header
        doc.setFillColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setLineWidth(0.3);
        
        let currentX = startX;
        const headers = ["Nr.", "Denumire", "Cantitate", "Stare", "Observatii"];
        
        headers.forEach((header, i) => {
          doc.rect(currentX, y, colWidths[i], rowHeight);
          doc.text(header, currentX + 2, y + 5.5);
          currentX += colWidths[i];
        });
        y += rowHeight;
        
        // Draw table rows
        doc.setFont("helvetica", "normal");
        
        const conditionLabels: Record<string, string> = {
          'noua': 'Noua',
          'foarte_buna': 'F. buna',
          'buna': 'Buna',
          'satisfacatoare': 'Satisf.',
          'uzata': 'Uzata'
        };
        
        inventoryItems.forEach((item, index) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
            
            // Redraw header on new page
            currentX = startX;
            doc.setFont("helvetica", "bold");
            headers.forEach((header, i) => {
              doc.rect(currentX, y, colWidths[i], rowHeight);
              doc.text(header, currentX + 2, y + 5.5);
              currentX += colWidths[i];
            });
            y += rowHeight;
            doc.setFont("helvetica", "normal");
          }
          
          currentX = startX;
          const rowData = [
            (index + 1).toString(),
            item.item_name.substring(0, 28),
            item.quantity.toString(),
            conditionLabels[item.condition] || 'Buna',
            (item.notes || '-').substring(0, 15)
          ];
          
          rowData.forEach((text, i) => {
            doc.rect(currentX, y, colWidths[i], rowHeight);
            doc.text(text, currentX + 2, y + 5.5);
            currentX += colWidths[i];
          });
          y += rowHeight;
        });
      }

      // Signature area without actual signatures
      if (y > 220) {
        doc.addPage();
        y = 30;
      }
      y += 15;
      doc.setFont("helvetica", "bold");
      doc.text("PROPRIETAR", margin, y);
      doc.text("CHIRIAS", pageWidth - margin - 30, y);
      y += 8;
      doc.setFont("helvetica", "normal");
      doc.text(`${contractData.proprietar.prenume} ${contractData.proprietar.nume}`, margin, y);
      doc.text(`${contractData.chirias.prenume} ${contractData.chirias.nume}`, pageWidth - margin - 50, y);
      y += 15;
      
      // Add signature lines (without actual signatures)
      doc.text("_______________", margin, y);
      doc.text("_______________", pageWidth - margin - 40, y);

      // Generate filename
      const clientName = `${contractData.chirias.prenume}_${contractData.chirias.nume}`.replace(/\s+/g, '_');
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const filename = `Contract_Nesemnat_${clientName}_${dateStr}.pdf`;

      // Download
      doc.save(filename);
      toast.success("Contract nesemnat descărcat cu succes!");
    } catch (error) {
      console.error('Error downloading unsigned contract:', error);
      toast.error('Eroare la descărcarea contractului nesemnat');
    } finally {
      setIsDownloadingUnsigned(false);
    }
  };

  const handleDeleteContract = async (id: string) => {
    try {
      const result = await adminApi.delete('contracts', id);
      if (!result.success) throw new Error(result.error);
      
      setContracts(prev => prev.filter(c => c.id !== id));
      setDeleteDialogOpen(false);
      setContractToDelete(null);
      toast.success("Contract șters din istoric");
    } catch (error: any) {
      console.error('Error deleting contract:', error);
      toast.error("Eroare la ștergerea contractului");
    }
  };

  const openDeleteDialog = (contract: SavedContract) => {
    setContractToDelete({
      id: contract.id,
      name: `${contract.client_prenume || ''} ${contract.client_name}`.trim()
    });
    setDeleteDialogOpen(true);
  };

  const handleReset = () => {
    setUploadedImageProprietar(null);
    setUploadedImageChirias(null);
    setExtractedDataProprietar(null);
    setExtractedDataChirias(null);
    setContractData({
      proprietar: { ...emptyPerson },
      chirias: { ...emptyPerson },
      proprietate_adresa: "",
      proprietate_pret: "",
      garantie: "",
      garantie_status: "platita",
      moneda: "EUR",
      numar_camere: "1",
      data_contract: new Date().toISOString().split('T')[0],
      data_incepere: new Date().toISOString().split('T')[0],
      durata_inchiriere: "12",
      semnatura_proprietar: "",
      semnatura_chirias: "",
    });
    if (fileInputProprietarRef.current) fileInputProprietarRef.current.value = "";
    if (fileInputChiriasRef.current) fileInputChiriasRef.current.value = "";
    setInventoryItems([]);
  };

  // Save contract without downloading
  const saveContractOnly = async () => {
    if (!contractData.proprietar.nume || !contractData.chirias.nume) {
      toast.error("Vă rugăm completați datele proprietarului și chiriașului");
      return;
    }

    if (!contractData.proprietate_adresa) {
      toast.error("Vă rugăm completați adresa proprietății");
      return;
    }

    setIsSaving(true);
    
    try {
      await saveContractToDatabase();
      toast.success("Contract salvat cu succes!");
      handleReset();
    } catch (error: any) {
      console.error('Error saving contract:', error);
      toast.error("Eroare la salvarea contractului");
    } finally {
      setIsSaving(false);
    }
  };

  const renderUploadCard = (
    type: 'proprietar' | 'chirias',
    title: string,
    isExtracting: boolean,
    uploadedImage: string | null,
    extractedData: ExtractedData | null,
    fileInputRef: React.RefObject<HTMLInputElement>
  ) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            uploadedImage ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, type)}
            className="hidden"
          />
          
          {isExtracting ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">Se extrag datele cu AI...</p>
            </div>
          ) : uploadedImage ? (
            <div className="space-y-3">
              <img 
                src={uploadedImage} 
                alt="CI" 
                className="max-h-32 mx-auto rounded-lg shadow-md"
              />
              <p className="text-xs text-muted-foreground">Click pentru a schimba</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Încărcați CI</p>
                <p className="text-xs text-muted-foreground">JPG, PNG - Max 10MB</p>
              </div>
            </div>
          )}
        </div>

        {extractedData && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <Sparkles className="h-3 w-3" />
              <span className="font-medium text-xs">Date extrase</span>
            </div>
            <div className="text-xs space-y-0.5 text-muted-foreground">
              <p><strong>Nume:</strong> {extractedData.prenume} {extractedData.nume}</p>
              <p><strong>CNP:</strong> {extractedData.cnp}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderPersonForm = (
    type: 'proprietar' | 'chirias',
    title: string,
    icon: React.ReactNode
  ) => {
    const data = contractData[type];
    const updateData = (field: keyof PersonData, value: string | boolean) => {
      setContractData(prev => ({
        ...prev,
        [type]: { ...prev[type], [field]: value }
      }));
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Tip parte: persoană fizică sau firmă */}
          <div className="flex items-center justify-between rounded-md border p-2 bg-muted/30">
            <Label className="text-xs font-medium">Tip parte contractuală</Label>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${!data.is_company ? 'font-semibold' : 'text-muted-foreground'}`}>Persoană fizică</span>
              <Switch
                checked={!!data.is_company}
                onCheckedChange={(checked) => updateData('is_company', checked)}
              />
              <span className={`text-xs ${data.is_company ? 'font-semibold' : 'text-muted-foreground'}`}>Firmă</span>
            </div>
          </div>

          {/* Date firmă (când e firmă) */}
          {data.is_company && (
            <div className="space-y-3 rounded-md border border-dashed p-3 bg-muted/20">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date firmă</div>
              <div className="space-y-1">
                <Label className="text-xs">Denumire firmă</Label>
                <Input
                  value={data.company_name || ''}
                  onChange={(e) => updateData('company_name', e.target.value)}
                  placeholder="Ex: SC Exemplu SRL"
                  className="h-9"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">CUI</Label>
                  <Input
                    value={data.company_cui || ''}
                    onChange={(e) => updateData('company_cui', e.target.value)}
                    placeholder="RO12345678"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Nr. Reg. Comerțului</Label>
                  <Input
                    value={data.company_reg_com || ''}
                    onChange={(e) => updateData('company_reg_com', e.target.value)}
                    placeholder="J40/1234/2020"
                    className="h-9"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Sediu social</Label>
                <Textarea
                  value={data.company_sediu || ''}
                  onChange={(e) => updateData('company_sediu', e.target.value)}
                  placeholder="Adresa sediului social"
                  rows={2}
                  className="text-sm"
                />
              </div>
            </div>
          )}

          {/* Date persoană fizică / reprezentant legal */}
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {data.is_company ? 'Reprezentant legal' : 'Date personale'}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Prenume</Label>
              <Input
                value={data.prenume}
                onChange={(e) => updateData('prenume', e.target.value)}
                placeholder="Prenume"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nume</Label>
              <Input
                value={data.nume}
                onChange={(e) => updateData('nume', e.target.value)}
                placeholder="Nume"
                className="h-9"
              />
            </div>
          </div>

          {data.is_company && (
            <div className="space-y-1">
              <Label className="text-xs">Funcție reprezentant</Label>
              <Input
                value={data.function_title || ''}
                onChange={(e) => updateData('function_title', e.target.value)}
                placeholder="Ex: Administrator"
                className="h-9"
              />
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs">CNP</Label>
            <Input
              value={data.cnp}
              onChange={(e) => updateData('cnp', e.target.value)}
              placeholder="Cod Numeric Personal"
              className="h-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Seria CI</Label>
              <Input
                value={data.seria_ci}
                onChange={(e) => updateData('seria_ci', e.target.value)}
                placeholder="XX"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Număr CI</Label>
              <Input
                value={data.numar_ci}
                onChange={(e) => updateData('numar_ci', e.target.value)}
                placeholder="123456"
                className="h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Emitent CI</Label>
              <Input
                value={data.ci_emitent}
                onChange={(e) => updateData('ci_emitent', e.target.value)}
                placeholder="SPCLEP Sector 1"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Data emiterii CI</Label>
              <Input
                type="date"
                value={data.ci_data_emiterii}
                onChange={(e) => updateData('ci_data_emiterii', e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">{data.is_company ? 'Adresa reprezentant' : 'Adresa'}</Label>
              <Textarea
                value={data.adresa}
                onChange={(e) => updateData('adresa', e.target.value)}
                placeholder="Adresa completă"
                rows={2}
                className="text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Cetățenie</Label>
              <Input
                value={data.cetatenie}
                onChange={(e) => updateData('cetatenie', e.target.value)}
                placeholder="romana"
                className="h-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Generator Contracte Închiriere
        </h1>
        <p className="text-muted-foreground">
          Încărcați fotografiile CI ale proprietarului și chiriașului pentru completare automată
        </p>
      </div>

      {/* Upload Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderUploadCard(
          'proprietar',
          'CI Proprietar',
          isExtractingProprietar,
          uploadedImageProprietar,
          extractedDataProprietar,
          fileInputProprietarRef
        )}
        {renderUploadCard(
          'chirias',
          'CI Chiriaș',
          isExtractingChirias,
          uploadedImageChirias,
          extractedDataChirias,
          fileInputChiriasRef
        )}
      </div>

      {/* Person Data Forms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderPersonForm('proprietar', 'Date Proprietar', <User className="h-5 w-5" />)}
        {renderPersonForm('chirias', 'Date Chiriaș', <Users className="h-5 w-5" />)}
      </div>

      {/* Property & Contract Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Date Proprietate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Adresa Proprietate</Label>
              <Textarea
                value={contractData.proprietate_adresa}
                onChange={(e) => setContractData(prev => ({ ...prev, proprietate_adresa: e.target.value }))}
                placeholder="Adresa completă a proprietății"
                rows={2}
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Nr. camere</Label>
                <Input
                  type="number"
                  value={contractData.numar_camere}
                  onChange={(e) => setContractData(prev => ({ ...prev, numar_camere: e.target.value }))}
                  placeholder="1"
                  className="h-9"
                  min="1"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Monedă</Label>
                <Select
                  value={contractData.moneda}
                  onValueChange={(value: "EUR" | "RON") => setContractData(prev => ({ ...prev, moneda: value }))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="RON">RON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Chirie</Label>
                <Input
                  type="number"
                  value={contractData.proprietate_pret}
                  onChange={(e) => setContractData(prev => ({ ...prev, proprietate_pret: e.target.value }))}
                  placeholder="500"
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Garanție</Label>
                <Input
                  type="number"
                  value={contractData.garantie}
                  onChange={(e) => setContractData(prev => ({ ...prev, garantie: e.target.value }))}
                  placeholder="500"
                  className="h-9"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs">Status Garanție</Label>
              <Select
                value={contractData.garantie_status}
                onValueChange={(value: "platita" | "de_platit") => setContractData(prev => ({ ...prev, garantie_status: value }))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="platita">Plătită la semnare</SelectItem>
                  <SelectItem value="de_platit">De plătit în 10 zile</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Setări Contract
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Data Semnării</Label>
                <Input
                  type="date"
                  value={contractData.data_contract}
                  onChange={(e) => setContractData(prev => ({ ...prev, data_contract: e.target.value }))}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Data Începerii</Label>
                <Input
                  type="date"
                  value={contractData.data_incepere}
                  onChange={(e) => setContractData(prev => ({ ...prev, data_incepere: e.target.value }))}
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Durată (luni)</Label>
              <Input
                type="number"
                value={contractData.durata_inchiriere}
                onChange={(e) => setContractData(prev => ({ ...prev, durata_inchiriere: e.target.value }))}
                placeholder="12"
                className="h-9"
              />
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="flex-1"
                >
                  Resetează
                </Button>
                <Button
                  onClick={saveContractOnly}
                  disabled={isSaving || isGenerating}
                  className="flex-1"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvare...
                    </>
                  ) : (
                    <>
                      <FilePlus2 className="h-4 w-4 mr-2" />
                      Generează
                    </>
                  )}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => generateContract('pdf')}
                  disabled={isGenerating || isGeneratingBoth}
                  variant="outline"
                  className="flex-1"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generare...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      PDF
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => generateContract('docx')}
                  disabled={isGenerating || isGeneratingBoth}
                  variant="outline"
                  className="flex-1"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generare...
                    </>
                  ) : (
                    <>
                      <FileType className="h-4 w-4 mr-2" />
                      Word
                    </>
                  )}
                </Button>
              </div>
              <Button
                onClick={generateBothFormats}
                disabled={isGenerating || isGeneratingBoth}
                variant="default"
                className="w-full"
              >
                {isGeneratingBoth ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Se generează ambele formate...
                  </>
                ) : (
                  <>
                    <Files className="h-4 w-4 mr-2" />
                    PDF + Word (ambele)
                  </>
                )}
              </Button>
              <Button
                onClick={previewNewContract}
                disabled={isGenerating || isGeneratingBoth || isPreviewingNew}
                variant="secondary"
                className="w-full"
              >
                {isPreviewingNew ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Se încarcă previzualizarea...
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Previzualizare Contract
                  </>
                )}
              </Button>
              <Button
                onClick={downloadUnsignedContract}
                disabled={isGenerating || isGeneratingBoth || isDownloadingUnsigned}
                variant="outline"
                className="w-full"
              >
                {isDownloadingUnsigned ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Se descarcă...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Descarcă Nesemnat
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Inventar Imobil
            </CardTitle>
            <Button variant="outline" size="sm" onClick={addPresetInventoryItems}>
              <Plus className="h-4 w-4 mr-2" />
              Adaugă articole standard
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new item form */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 p-3 bg-muted/50 rounded-lg">
            <div className="md:col-span-2">
              <Input
                placeholder="Denumire articol *"
                value={newInventoryItem.item_name}
                onChange={(e) => setNewInventoryItem(prev => ({ ...prev, item_name: e.target.value }))}
                className="h-9"
              />
            </div>
            <div>
              <Input
                type="number"
                placeholder="Cant."
                min={1}
                value={newInventoryItem.quantity}
                onChange={(e) => setNewInventoryItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                className="h-9"
              />
            </div>
            <div>
              <Select
                value={newInventoryItem.condition}
                onValueChange={(value) => setNewInventoryItem(prev => ({ ...prev, condition: value }))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="noua">Nouă</SelectItem>
                  <SelectItem value="foarte_buna">Foarte bună</SelectItem>
                  <SelectItem value="buna">Bună</SelectItem>
                  <SelectItem value="satisfacatoare">Satisfăcătoare</SelectItem>
                  <SelectItem value="uzata">Uzată</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button onClick={addInventoryItem} className="w-full h-9">
                <Plus className="h-4 w-4 mr-1" />
                Adaugă
              </Button>
            </div>
          </div>

          {/* Image size selector */}
          {inventoryItems.some(item => item.images && item.images.length > 0) && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Dimensiune imagini în PDF:</span>
              <Select
                value={inventoryImageSize}
                onValueChange={(value: 'small' | 'medium' | 'large') => setInventoryImageSize(value)}
              >
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Mici (4/rând)</SelectItem>
                  <SelectItem value="medium">Medii (3/rând)</SelectItem>
                  <SelectItem value="large">Mari (2/rând)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Inventory list */}
          {inventoryItems.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Denumire</TableHead>
                    <TableHead className="w-[70px]">Cant.</TableHead>
                    <TableHead>Stare</TableHead>
                    
                    <TableHead>Notițe</TableHead>
                    <TableHead>Fotografii</TableHead>
                    <TableHead className="w-[100px]">Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {editingItemId === item.id ? (
                          <Input
                            value={item.item_name}
                            onChange={(e) => updateInventoryItem(item.id, 'item_name', e.target.value)}
                            className="h-8"
                          />
                        ) : (
                          <span className="font-medium">{item.item_name}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingItemId === item.id ? (
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateInventoryItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                            className="h-8 w-16"
                            min={1}
                          />
                        ) : (
                          item.quantity
                        )}
                      </TableCell>
                      <TableCell>
                        {editingItemId === item.id ? (
                          <Select
                            value={item.condition}
                            onValueChange={(value) => updateInventoryItem(item.id, 'condition', value)}
                          >
                            <SelectTrigger className="h-8 w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="noua">Nouă</SelectItem>
                              <SelectItem value="foarte_buna">Foarte bună</SelectItem>
                              <SelectItem value="buna">Bună</SelectItem>
                              <SelectItem value="satisfacatoare">Satisfăcătoare</SelectItem>
                              <SelectItem value="uzata">Uzată</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline">
                            {item.condition === 'noua' && 'Nouă'}
                            {item.condition === 'foarte_buna' && 'Foarte bună'}
                            {item.condition === 'buna' && 'Bună'}
                            {item.condition === 'satisfacatoare' && 'Satisfăcătoare'}
                            {item.condition === 'uzata' && 'Uzată'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingItemId === item.id ? (
                          <Input
                            value={item.notes}
                            onChange={(e) => updateInventoryItem(item.id, 'notes', e.target.value)}
                            className="h-8"
                            placeholder="Observații"
                          />
                        ) : (
                          <span className="text-muted-foreground text-sm">{item.notes || '-'}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <InventoryImageUpload
                          images={item.images}
                          onImagesChange={(images) => updateInventoryItem(item.id, 'images', images)}
                          itemName={item.item_name}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {editingItemId === item.id ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingItemId(null)}
                              className="h-8 w-8 text-green-600 hover:text-green-700"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingItemId(item.id)}
                              className="h-8 w-8"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeInventoryItem(item.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nu există articole în inventar</p>
              <p className="text-xs">Adăugați articole manual sau folosiți butonul "Adaugă articole standard"</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Electronic Signatures - Full Width */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-primary">
            <PenTool className="h-5 w-5" />
            Semnaturi Digitale
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Proprietar Signature */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-primary">Semnatura Proprietar</span>
                {contractData.semnatura_proprietar && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setContractData(prev => ({ ...prev, semnatura_proprietar: "" }))}
                    className="h-7 text-xs"
                  >
                    <Eraser className="h-3 w-3 mr-1" />
                    Șterge
                  </Button>
                )}
              </div>
              {contractData.semnatura_proprietar ? (
                <div className="border-2 border-dashed rounded-lg p-4 bg-white min-h-[200px] flex items-center justify-center">
                  <img 
                    src={contractData.semnatura_proprietar} 
                    alt="Semnătură Proprietar" 
                    className="max-h-40"
                  />
                </div>
              ) : (
                <SignaturePad
                  title=""
                  savedSignature=""
                  onSave={(sig) => setContractData(prev => ({ ...prev, semnatura_proprietar: sig }))}
                />
              )}
              <p className="text-xs text-muted-foreground text-center">
                Desenați semnătura cu mouse-ul sau degetul
              </p>
            </div>

            {/* Chirias Signature */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-primary">Semnatura Chirias</span>
                {contractData.semnatura_chirias && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setContractData(prev => ({ ...prev, semnatura_chirias: "" }))}
                    className="h-7 text-xs"
                  >
                    <Eraser className="h-3 w-3 mr-1" />
                    Șterge
                  </Button>
                )}
              </div>
              {contractData.semnatura_chirias ? (
                <div className="border-2 border-dashed rounded-lg p-4 bg-white min-h-[200px] flex items-center justify-center">
                  <img 
                    src={contractData.semnatura_chirias} 
                    alt="Semnătură Chiriași" 
                    className="max-h-40"
                  />
                </div>
              ) : (
                <SignaturePad
                  title=""
                  savedSignature=""
                  onSave={(sig) => setContractData(prev => ({ ...prev, semnatura_chirias: sig }))}
                />
              )}
              <p className="text-xs text-muted-foreground text-center">
                Desenați semnătura cu mouse-ul sau degetul
              </p>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground text-center pt-2 border-t">
            Semnăturile digitale vor fi incluse în documentele PDF și Word generate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Istoric Contracte
                {contracts.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{filteredContracts.length}</Badge>
                )}
              </CardTitle>
              <Button variant="outline" size="sm" onClick={fetchContracts} disabled={isLoadingContracts}>
                <RefreshCw className={`h-4 w-4 ${isLoadingContracts ? 'animate-spin' : ''} ${isMobile ? '' : 'mr-2'}`} />
                {!isMobile && 'Reîmprospătează'}
              </Button>
            </div>
            
            {/* Mobile search and filter */}
            {isMobile && contracts.length > 0 && (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Caută contracte..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <MobileFilterSort
                  filters={contractFilterOptions}
                  filterValues={contractFilterValues}
                  onFilterChange={(key, value) => setContractFilterValues(prev => ({ ...prev, [key]: value }))}
                  sortOptions={contractSortOptions}
                  currentSort={contractSort}
                  onSortChange={(key, direction) => setContractSort({ key, direction })}
                  onReset={resetContractFilters}
                  activeFiltersCount={activeFiltersCount}
                />
              </div>
            )}
            
            {/* Desktop search */}
            {!isMobile && contracts.length > 0 && (
              <div className="flex gap-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Caută după nume, adresă..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select
                  value={contractFilterValues.signatureStatus || "all"}
                  onValueChange={(value) => setContractFilterValues(prev => ({ ...prev, signatureStatus: value }))}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Status semnături" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toate</SelectItem>
                    <SelectItem value="both_signed">Ambii au semnat</SelectItem>
                    <SelectItem value="partial">Semnat parțial</SelectItem>
                    <SelectItem value="none">Nesemnat</SelectItem>
                  </SelectContent>
                </Select>
                {(searchQuery || Object.values(contractFilterValues).some(v => v && v !== "all")) && (
                  <Button variant="ghost" size="sm" onClick={resetContractFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Resetează
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingContracts ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nu există contracte generate încă</p>
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nu s-au găsit contracte</p>
              <p className="text-sm">Încercați alte criterii de căutare</p>
              <Button variant="link" size="sm" onClick={resetContractFilters} className="mt-2">
                Resetează filtrele
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile view - Swipeable cards */}
              <div className="md:hidden space-y-0">
                {filteredContracts.map((contract) => (
                  <SwipeableContractCard
                    key={contract.id}
                    contract={contract}
                    onPreview={() => openPreviewDialog(contract)}
                    onDownloadPdf={() => downloadContract(contract, 'pdf')}
                    onDownloadDocx={() => downloadContract(contract, 'docx')}
                    onRegenerate={() => regeneratePdfWithSignatures(contract)}
                    onCopySignatureLink={(partyType) => copySignatureLink(contract.id, partyType)}
                    onSendWhatsApp={(partyType) => sendSignatureLinkWhatsApp(contract.id, partyType, contract)}
                    onShareLink={(partyType) => shareSignatureLink(contract.id, partyType, contract)}
                    onSendEmail={(partyType) => openEmailDialog(contract.id, partyType, contract.property_address)}
                    onDelete={() => handleDeleteContract(contract.id)}
                    isRegenerating={regeneratingContractId === contract.id}
                    isPreviewing={previewingContractId === contract.id}
                  />
                ))}
              </div>

              {/* Desktop view - Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Chiriaș</TableHead>
                      <TableHead>Proprietate</TableHead>
                      <TableHead>Chirie</TableHead>
                      <TableHead>Garanție</TableHead>
                      <TableHead>Semnături</TableHead>
                      <TableHead>Linkuri Semnare</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Acțiuni</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContracts.map((contract) => (
                      <TableRow key={contract.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(contract.created_at), 'dd MMM yyyy', { locale: ro })}
                        </TableCell>
                        <TableCell>
                          {contract.client_prenume} {contract.client_name}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {contract.property_address}
                        </TableCell>
                        <TableCell>
                          {contract.property_price ? `${contract.property_price.toLocaleString()} €` : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-xs">
                              {contract.garantie_amount ? `${contract.garantie_amount.toLocaleString()} €` : '-'}
                            </span>
                            {contract.garantie_status && (
                              <Badge 
                                variant="outline"
                                className={contract.garantie_status === 'platita' 
                                  ? "bg-green-500/20 text-green-400 border-green-500/30 text-[10px]" 
                                  : "bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px]"
                                }
                              >
                                {contract.garantie_status === 'platita' ? 'Plătită' : 'De plătit'}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Badge 
                              className={contract.proprietar_signed 
                                ? "bg-green-500/20 text-green-400 border-green-500/30" 
                                : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                              }
                            >
                              P: {contract.proprietar_signed ? '✓' : '○'}
                            </Badge>
                            <Badge 
                              className={contract.chirias_signed 
                                ? "bg-green-500/20 text-green-400 border-green-500/30" 
                                : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                              }
                            >
                              C: {contract.chirias_signed ? '✓' : '○'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => copySignatureLink(contract.id, 'proprietar')}
                              title="Copiază link semnare proprietar"
                            >
                              <PenTool className="h-3 w-3 mr-1" />
                              Prop.
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-green-600 hover:text-green-700"
                              onClick={() => sendSignatureLinkWhatsApp(contract.id, 'proprietar', contract)}
                              title="Trimite link semnare proprietar pe WhatsApp"
                            >
                              <MessageCircle className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => copySignatureLink(contract.id, 'chirias')}
                              title="Copiază link semnare chiriaș"
                            >
                              <PenTool className="h-3 w-3 mr-1" />
                              Chir.
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-green-600 hover:text-green-700"
                              onClick={() => sendSignatureLinkWhatsApp(contract.id, 'chirias', contract)}
                              title="Trimite link semnare chiriaș pe WhatsApp"
                            >
                              <MessageCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-7 w-7 ${contract.proprietar_signed ? 'text-green-500' : 'text-blue-500 hover:text-blue-600'}`}
                              onClick={() => openEmailDialog(contract.id, 'proprietar', contract.property_address)}
                              title={contract.proprietar_signed ? "Proprietar a semnat" : "Trimite email proprietar"}
                              disabled={contract.proprietar_signed}
                            >
                              {contract.proprietar_signed ? (
                                <span className="text-xs">✓P</span>
                              ) : (
                                <Mail className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-7 w-7 ${contract.chirias_signed ? 'text-green-500' : 'text-blue-500 hover:text-blue-600'}`}
                              onClick={() => openEmailDialog(contract.id, 'chirias', contract.property_address)}
                              title={contract.chirias_signed ? "Chiriaș a semnat" : "Trimite email chiriaș"}
                              disabled={contract.chirias_signed}
                            >
                              {contract.chirias_signed ? (
                                <span className="text-xs">✓C</span>
                              ) : (
                                <Mail className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:text-blue-700"
                              onClick={() => openPreviewDialog(contract)}
                              disabled={previewingContractId === contract.id}
                              title="Previzualizare PDF"
                            >
                              {previewingContractId === contract.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            {(contract.proprietar_signed || contract.chirias_signed) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600 hover:text-green-700"
                                onClick={() => regeneratePdfWithSignatures(contract)}
                                disabled={regeneratingContractId === contract.id}
                                title="Regenerează PDF cu semnături"
                              >
                                {regeneratingContractId === contract.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <FilePlus2 className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            {contract.pdf_url && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => downloadContract(contract, 'pdf')}
                                title="Descarcă PDF"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            {contract.docx_url && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => downloadContract(contract, 'docx')}
                                title="Descarcă Word"
                              >
                                <FileType className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => openDeleteDialog(contract)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Contract Clauses Editor */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="clauses" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <span className="font-semibold">Clauze Standard Contract</span>
              <Badge variant="secondary" className="ml-2">Editabile</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <ContractClausesEditor />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Trimite Link Semnătură
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tip Parte</Label>
              <div className="text-sm text-muted-foreground">
                {emailDialogData?.partyType === 'proprietar' ? 'Proprietar' : 'Chiriaș'}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipient-name">Nume destinatar</Label>
              <Input
                id="recipient-name"
                placeholder="Ex: Ion Popescu"
                value={emailRecipient.name}
                onChange={(e) => setEmailRecipient(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipient-email">Adresă email *</Label>
              <Input
                id="recipient-email"
                type="email"
                placeholder="Ex: ion.popescu@email.com"
                value={emailRecipient.email}
                onChange={(e) => setEmailRecipient(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Anulează
            </Button>
            <Button 
              onClick={sendSignatureLinkEmail} 
              disabled={isSendingEmail || !emailRecipient.email}
            >
              {isSendingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Se trimite...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Trimite Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="w-[95vw] max-w-4xl h-[85vh] sm:h-[90vh] flex flex-col p-3 sm:p-6">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="truncate">Previzualizare - {previewContractName}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 -mx-3 sm:mx-0">
            {previewPdfUrl ? (
              <iframe 
                src={previewPdfUrl}
                className="w-full h-full sm:rounded-lg border-y sm:border"
                title="Contract Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          <DialogFooter className="flex-row gap-2 pt-2">
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)} className="flex-1 sm:flex-none">
              Închide
            </Button>
            {previewPdfUrl && (
              <Button onClick={() => window.open(previewPdfUrl, '_blank')} className="flex-1 sm:flex-none">
                <Download className="h-4 w-4 mr-2" />
                Descarcă
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmați ștergerea?</AlertDialogTitle>
            <AlertDialogDescription>
              Sunteți sigur că doriți să ștergeți contractul pentru{" "}
              <span className="font-medium text-foreground">
                {contractToDelete?.name}
              </span>
              ? Această acțiune nu poate fi anulată.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => contractToDelete && handleDeleteContract(contractToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <Button
          className="fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 hover:scale-110 hover:shadow-[0_0_25px_hsl(var(--primary)/0.5)]"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Contract nou"
        >
          <Plus className="h-6 w-6" />
          {/* Pulse ring animation */}
          <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
        </Button>
      )}
    </div>
  );
};

export default ContractGeneratorPage;

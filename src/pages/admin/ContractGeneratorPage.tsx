import { useState, useRef, useEffect } from "react";
import SignaturePad from "@/components/SignaturePad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Upload, FileText, Download, Loader2, Camera, Sparkles, User, Home, Calendar, History, Trash2, RefreshCw, Users, FileType, PenTool, FilePlus2, Mail, Send, Package, Plus, X, Pencil, Check, ImageIcon, MessageCircle, Eye } from "lucide-react";
import InventoryImageUpload from "@/components/InventoryImageUpload";
import { SwipeableContractCard } from "@/components/admin/SwipeableContractCard";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

interface ExtractedData {
  nume: string;
  prenume: string;
  cnp: string;
  seria: string;
  numar: string;
  emitent: string | null;
  data_emiterii: string | null;
  adresa: {
    strada: string;
    numar: string;
    bloc: string | null;
    scara: string | null;
    etaj: string | null;
    apartament: string | null;
    localitate: string;
    judet: string;
  };
  data_nasterii: string;
  locul_nasterii: string;
  sex: string;
  cetatenie: string;
  data_expirarii: string;
}

interface PersonData {
  nume: string;
  prenume: string;
  cnp: string;
  seria_ci: string;
  numar_ci: string;
  ci_emitent: string;
  ci_data_emiterii: string;
  adresa: string;
  cetatenie: string;
}

interface ContractData {
  proprietar: PersonData;
  chirias: PersonData;
  proprietate_adresa: string;
  proprietate_pret: string;
  garantie: string;
  moneda: "EUR" | "RON";
  numar_camere: string;
  data_contract: string;
  data_incepere: string;
  durata_inchiriere: string;
  semnatura_proprietar: string;
  semnatura_chirias: string;
}

interface SavedContract {
  id: string;
  created_at: string;
  client_name: string;
  client_prenume: string | null;
  client_cnp: string | null;
  client_seria_ci: string | null;
  client_numar_ci: string | null;
  client_adresa: string | null;
  client_ci_emitent: string | null;
  client_ci_data_emiterii: string | null;
  // Proprietar data
  proprietar_name: string | null;
  proprietar_prenume: string | null;
  proprietar_cnp: string | null;
  proprietar_seria_ci: string | null;
  proprietar_numar_ci: string | null;
  proprietar_adresa: string | null;
  proprietar_ci_emitent: string | null;
  proprietar_ci_data_emiterii: string | null;
  // Property data
  property_address: string;
  property_price: number | null;
  property_currency: string | null;
  contract_type: string;
  contract_date: string;
  duration_months: number | null;
  pdf_url: string | null;
  docx_url: string | null;
  proprietar_signed: boolean;
  chirias_signed: boolean;
}

interface ContractSignature {
  id: string;
  contract_id: string;
  party_type: string;
  signature_token: string;
  signature_data: string | null;
  signed_at: string | null;
}

const emptyPerson: PersonData = {
  nume: "",
  prenume: "",
  cnp: "",
  seria_ci: "",
  numar_ci: "",
  ci_emitent: "",
  ci_data_emiterii: "",
  adresa: "",
  cetatenie: "romana",
};

// Helper function to format dates as DD.MM.YYYY
const formatDateRomanian = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  try {
    // Handle both ISO format (YYYY-MM-DD) and already formatted dates
    if (dateString.includes('.')) return dateString; // Already formatted
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  } catch {
    return dateString;
  }
};

const ContractGeneratorPage = () => {
  const [isExtractingProprietar, setIsExtractingProprietar] = useState(false);
  const [isExtractingChirias, setIsExtractingChirias] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
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
  
  const [uploadedImageProprietar, setUploadedImageProprietar] = useState<string | null>(null);
  const [uploadedImageChirias, setUploadedImageChirias] = useState<string | null>(null);
  const [extractedDataProprietar, setExtractedDataProprietar] = useState<ExtractedData | null>(null);
  const [extractedDataChirias, setExtractedDataChirias] = useState<ExtractedData | null>(null);
  
  const [contracts, setContracts] = useState<SavedContract[]>([]);
  const [isLoadingContracts, setIsLoadingContracts] = useState(true);
  
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

  useEffect(() => {
    fetchContracts();
  }, []);

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
        .select('id, created_at, client_name, client_prenume, client_cnp, client_seria_ci, client_numar_ci, client_adresa, client_ci_emitent, client_ci_data_emiterii, proprietar_name, proprietar_prenume, proprietar_cnp, proprietar_seria_ci, proprietar_numar_ci, proprietar_adresa, proprietar_ci_emitent, proprietar_ci_data_emiterii, property_address, property_price, property_currency, contract_type, contract_date, duration_months, pdf_url, docx_url, proprietar_signed, chirias_signed')
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
      const { data: insertedContract, error } = await supabase.from('contracts').insert({
        // Chiriaș data
        client_name: contractData.chirias.nume,
        client_prenume: contractData.chirias.prenume || null,
        client_cnp: contractData.chirias.cnp || null,
        client_seria_ci: contractData.chirias.seria_ci || null,
        client_numar_ci: contractData.chirias.numar_ci || null,
        client_adresa: contractData.chirias.adresa || null,
        client_ci_emitent: contractData.chirias.ci_emitent || null,
        client_ci_data_emiterii: contractData.chirias.ci_data_emiterii || null,
        // Proprietar data
        proprietar_name: contractData.proprietar.nume || null,
        proprietar_prenume: contractData.proprietar.prenume || null,
        proprietar_cnp: contractData.proprietar.cnp || null,
        proprietar_seria_ci: contractData.proprietar.seria_ci || null,
        proprietar_numar_ci: contractData.proprietar.numar_ci || null,
        proprietar_adresa: contractData.proprietar.adresa || null,
        proprietar_ci_emitent: contractData.proprietar.ci_emitent || null,
        proprietar_ci_data_emiterii: contractData.proprietar.ci_data_emiterii || null,
        // Property data
        property_address: contractData.proprietate_adresa,
        property_price: contractData.proprietate_pret ? parseFloat(contractData.proprietate_pret) : null,
        property_surface: contractData.garantie ? parseFloat(contractData.garantie) : null,
        property_currency: contractData.moneda || 'EUR',
        contract_type: 'inchiriere',
        contract_date: contractData.data_contract,
        duration_months: contractData.durata_inchiriere ? parseInt(contractData.durata_inchiriere) : null,
        pdf_generated: true,
        pdf_url: pdfUrl || null,
        docx_url: docxUrl || null,
      }).select('id').single();

      if (error) throw error;

      // Create signature links for the new contract
      if (insertedContract) {
        await createSignatureLinks(insertedContract.id);
        
        // Save inventory items for the contract
        if (inventoryItems.length > 0) {
          const inventoryToSave = inventoryItems.map(item => ({
            contract_id: insertedContract.id,
            item_name: item.item_name,
            quantity: item.quantity,
            condition: item.condition,
            location: item.location || null,
            notes: item.notes || null
          }));
          
          const { error: invError } = await supabase
            .from('contract_inventory')
            .insert(inventoryToSave);
          
          if (invError) {
            console.error('Error saving inventory:', invError);
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

      return data.path;
    } catch (error) {
      console.error('Error uploading contract:', error);
      return null;
    }
  };

  const downloadContract = async (contract: SavedContract, type: 'pdf' | 'docx') => {
    const filePath = type === 'pdf' ? contract.pdf_url : contract.docx_url;
    if (!filePath) {
      toast.error(`Fișierul ${type.toUpperCase()} nu este disponibil`);
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('contracts')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = filePath.split('/').pop() || `contract.${type}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading contract:', error);
      toast.error('Eroare la descărcarea contractului');
    }
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

      return `${window.location.origin}/sign/${data.signature_token}`;
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
    
    await navigator.clipboard.writeText(signatureUrl);
    toast.success(`Link de semnătură ${partyType === 'proprietar' ? 'proprietar' : 'chiriaș'} copiat!`);
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
    
    window.open(`https://wa.me/?text=${message}`, '_blank');
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

      // Generate new PDF with signatures
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const textWidth = pageWidth - 2 * margin;
      let y = 25;

      const addSection = (title: string) => {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(11);
        doc.setFont("times", "bolditalic");
        doc.text(title, margin, y);
        // Add underline
        const titleWidth = doc.getTextWidth(title);
        doc.setLineWidth(0.3);
        doc.line(margin, y + 1, margin + titleWidth, y + 1);
        y += 8;
        doc.setFontSize(10);
        doc.setFont("times", "normal");
      };

      // Functie pentru eliminarea diacriticelor romanesti
      const removeDiacritics = (text: string): string => {
        return text
          .replace(/ă/g, 'a').replace(/Ă/g, 'A')
          .replace(/â/g, 'a').replace(/Â/g, 'A')
          .replace(/î/g, 'i').replace(/Î/g, 'I')
          .replace(/ș/g, 's').replace(/Ș/g, 'S')
          .replace(/ț/g, 't').replace(/Ț/g, 'T')
          .replace(/ş/g, 's').replace(/Ş/g, 'S')
          .replace(/ţ/g, 't').replace(/Ţ/g, 'T');
      };

      const addParagraph = (text: string) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.setFont("times", "normal");
        const lines = doc.splitTextToSize(removeDiacritics(text), textWidth);
        for (let i = 0; i < lines.length; i++) {
          if (i < lines.length - 1) {
            doc.text(lines[i], margin, y, { align: "justify", maxWidth: textWidth });
          } else {
            doc.text(lines[i], margin, y);
          }
          y += 5;
        }
        y += 2;
      };

      const addBullet = (text: string) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.setFont("times", "normal");
        const bulletIndent = 8;
        const bulletTextWidth = textWidth - bulletIndent;
        doc.text("-", margin + 3, y);
        const lines = doc.splitTextToSize(removeDiacritics(text), bulletTextWidth);
        for (let i = 0; i < lines.length; i++) {
          if (i < lines.length - 1) {
            doc.text(lines[i], margin + bulletIndent, y, { align: "justify", maxWidth: bulletTextWidth });
          } else {
            doc.text(lines[i], margin + bulletIndent, y);
          }
          y += 5;
        }
        y += 1;
      };

      const addSubsectionTitle = (title: string) => {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(10);
        doc.setFont("times", "bold");
        doc.text(removeDiacritics(title), margin, y);
        y += 6;
        doc.setFont("times", "normal");
      };

      const moneda = contract.property_currency || 'EUR';
      const garantieVal = contract.property_price?.toString() || '';
      const durataLuni = contract.duration_months?.toString() || '12';

      // TITLU
      doc.setFontSize(14);
      doc.setFont("times", "bold");
      doc.text("CONTRACT DE INCHIRIERE", pageWidth / 2, y, { align: "center" });
      y += 8;
      doc.setFontSize(10);
      doc.setFont("times", "italic");
      doc.text("(Semnat electronic)", pageWidth / 2, y, { align: "center" });
      y += 12;

      doc.setFont("times", "normal");
      doc.text(removeDiacritics(`Incheiat astazi, ${formatDateRomanian(contract.contract_date)} intre:`), margin, y);
      y += 10;

      // PARTI CONTRACTANTE
      doc.setFont("times", "bold");
      doc.text("1. PROPRIETAR:", margin, y);
      y += 6;
      doc.setFont("times", "normal");
      const proprietarText = removeDiacritics(`${contract.proprietar_prenume || ''} ${contract.proprietar_name || 'N/A'}${contract.proprietar_cnp ? `, CNP ${contract.proprietar_cnp}` : ''}${contract.proprietar_seria_ci ? `, C.I seria ${contract.proprietar_seria_ci}` : ''}${contract.proprietar_numar_ci ? ` nr. ${contract.proprietar_numar_ci}` : ''}${contract.proprietar_adresa ? `, cu domiciliul in ${contract.proprietar_adresa}` : ''}, in calitate de proprietar al imobilului situat in ${contract.property_address}.`);
      const propLines = doc.splitTextToSize(proprietarText, textWidth);
      for (let i = 0; i < propLines.length; i++) {
        doc.text(propLines[i], margin, y, i < propLines.length - 1 ? { align: "justify", maxWidth: textWidth } : undefined);
        y += 5;
      }
      y += 4;

      doc.setFont("times", "bold");
      doc.text("2. CHIRIAS:", margin, y);
      y += 6;
      doc.setFont("times", "normal");
      const chiriasText = removeDiacritics(`${contract.client_prenume || ''} ${contract.client_name}${contract.client_cnp ? `, CNP ${contract.client_cnp}` : ''}${contract.client_seria_ci ? `, C.I seria ${contract.client_seria_ci}` : ''}${contract.client_numar_ci ? ` nr. ${contract.client_numar_ci}` : ''}${contract.client_adresa ? `, cu domiciliul in ${contract.client_adresa}` : ''}, in calitate de chirias al imobilului situat in ${contract.property_address}.`);
      const chirLines = doc.splitTextToSize(chiriasText, textWidth);
      for (let i = 0; i < chirLines.length; i++) {
        doc.text(chirLines[i], margin, y, i < chirLines.length - 1 ? { align: "justify", maxWidth: textWidth } : undefined);
        y += 5;
      }
      y += 8;

      // I. OBIECTUL CONTRACTULUI
      addSection("I. OBIECTUL CONTRACTULUI");
      addParagraph(`Proprietarul inchiriaza chiriasului imobilul situat in ${contract.property_address}`);
      y += 3;

      // II. DESTINATIA
      addSection("II. DESTINATIA");
      addParagraph("Imobilul va fi folosit de chirias cu destinatia LOCUINTA. Destinatia spatiului inchiriat nu poate fi schimbata.");
      y += 3;

      // III. DURATA
      addSection("III. DURATA");
      addParagraph(`Acest contract este incheiat pentru o perioada de ${durataLuni} luni. Cu 30 de zile inaintea expirarii contractului, chiriasul va putea prelungi acest contract pentru aceeasi perioada sau pentru o perioada mai mica, numai cu acordul scris al proprietarului.`);
      y += 3;

      // IV. CHIRIA SI MODALITATI DE PLATA
      addSection("IV. CHIRIA SI MODALITATI DE PLATA");
      addParagraph(`Chiria lunara convenita de comun acord este de ${contract.property_price || 'N/A'} ${moneda}/luna. Suma va fi achitata in numerar sau transfer bancar.`);
      addParagraph(`Garantia in valoare de ${garantieVal} ${moneda} se va plati in termen de 10 zile lucratoare de la data semnarii contractului de inchiriere.`);
      addParagraph("Garantia se va restitui in termen de 30 de zile de la incetarea prezentului contract de inchiriere, retinandu-se cheltuielile curente care cad in sarcina chiriasului potrivit prezentului contract.");
      addParagraph("Neplata chiriei in termen de 5 zile constituie o incalcare a contractului, proprietarul avand dreptul in acest caz sa rezilieze contractul de inchiriere fara nici o alta formalitate.");
      y += 3;

      // V. OBLIGATIILE SI DREPTURILE PROPRIETARULUI
      addSection("V. OBLIGATIILE SI DREPTURILE PROPRIETARULUI");
      addSubsectionTitle("1. OBLIGATIILE PROPRIETARULUI:");
      addBullet("proprietarul isi asuma raspunderea ca spatiul este liber si va ramane astfel pe toata perioada contractului;");
      addBullet("pune la dispozitia chiriasului imobilul in stare buna, pentru a fi folosit conform destinatiei avute in vedere in prezentul contract, impreuna cu un inventar (realizat de catre proprietar inainte de intrarea chiriasului in imobil) detaliat, intocmit in 2 (doua) exemplare semnate de ambele parti;");
      addBullet("achita toate taxele legale ale imobilului (impozit pe cladiri, venituri);");
      addBullet("sa suporte cheltuielile de reparatii pentru partile comune ale imobilului.");
      y += 2;

      addSubsectionTitle("2. DREPTURILE PROPRIETARULUI:");
      addBullet("sa viziteze imobilul cand doreste, cu anuntarea in prealabil a chiriasului si in prezenta acestuia;");
      addBullet("sa accepte sau sa respinga propunerile avansate de chirias de modificare a imobilului inchiriat in prezentul contract, in prealabil, sau ori de cate ori este necesar. Atat propunerile chiriasului cat si raspunsurile proprietarului se vor face in scris;");
      addBullet("sa verifice achitarea obligatiilor de plata curente ale chiriasului.");
      y += 3;

      // VI. OBLIGATIILE SI DREPTURILE CHIRIASULUI
      addSection("VI. OBLIGATIILE SI DREPTURILE CHIRIASULUI");
      addSubsectionTitle("1. OBLIGATIILE CHIRIASULUI:");
      addBullet("sa asigure exploatarea imobilului doar in conformitate cu destinatia avuta in vedere;");
      addBullet("sa nu subinchirieze imobilul, decat cu acordul scris al proprietarului;");
      addBullet("sa achite in termen legal platile curente: electricitate, gaze, gunoi, apa, intretinere;");
      addBullet("sa mentina in buna stare imobilul si bunurile din inventar;");
      addBullet("sa respecte normele de convietuire in conformitate cu regulamentul asociatiei de locatari;");
      addBullet("sa permita accesul proprietarului in imobilul inchiriat cel putin o data pe luna;");
      addBullet("sa predea spatiul in starea in care era la inceperea contractului.");
      y += 2;

      addSubsectionTitle("2. DREPTURILE CHIRIASULUI:");
      addBullet("sa utilizeze imobilul in exclusivitate pe perioada derularii contractului;");
      addBullet("sa faca imbunatatirile necesare fara sa modifice structura de rezistenta si doar cu acordul proprietarului.");
      y += 3;

      // VII. PREDAREA IMOBILULUI
      addSection("VII. PREDAREA IMOBILULUI");
      addParagraph("Dupa expirarea contractului chiriasul va preda imobilul proprietarului sau unui reprezentant autorizat al proprietarului, in starea in care l-a primit.");
      y += 3;

      // VIII. FORTA MAJORA
      addSection("VIII. FORTA MAJORA");
      addParagraph("Orice cauza neprevazuta si imposibil de evitat, independenta de vointa partilor, aparuta dupa semnarea prezentului si care impiedica executarea contractului, va fi considerata cauza de forta majora si va exonera de raspundere partea care o invoca.");
      addParagraph("Partea care invoca cauza de forta majora trebuie sa notifice acest lucru celeilalte parti in maxim 5 zile de la aparitie.");
      y += 3;

      // IX. CONDITIILE DE INCETARE A CONTRACTULUI
      addSection("IX. CONDITIILE DE INCETARE A CONTRACTULUI");
      addParagraph("1. la expirarea duratei pentru care a fost incheiat;");
      addParagraph("2. in situatia nerespectarii clauzelor contractuale de catre una din parti;");
      addParagraph("3. clauza fortei majore;");
      addParagraph("4. prin denuntare unilaterala de catre oricare dintre parti, cu o notificare prealabila de 30 de zile, cu pierderea garantiei in cazul in care denuntarea nu a fost facuta de catre chirias in termen de 30 de zile sau fara un motiv intemeiat.");
      y += 3;

      addParagraph("Incetarea prezentului contract nu va avea efect asupra obligatiilor deja scadente intre partile contractante.");

      // Signature dimensions - declared here for use in both contract and Anexa 1
      const signatureHeight = 25;
      const signatureWidth = 50;

      // INVENTAR - Add inventory section if items exist
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
          
          doc.text(removeDiacritics((item.item_name || '').substring(0, 25)), startX + 2, y);
          doc.text((item.quantity || 1).toString(), startX + 55, y);
          doc.text(removeDiacritics(conditionLabels[item.condition] || item.condition || ''), startX + 70, y);
          doc.text(removeDiacritics((item.location || '-').substring(0, 12)), startX + 105, y);
          doc.text(removeDiacritics((item.notes || '-').substring(0, 20)), startX + 130, y);
          y += 6;
        });
        
        y += 10;
        addParagraph(`Total articole inventariate: ${contractInventory.length}`);
        y += 10;
        
        addParagraph("Prezentul inventar a fost intocmit in 2 (doua) exemplare, cate unul pentru fiecare parte, si face parte integranta din contractul de inchiriere.");
        y += 15;
        
        // SEMNATURI ANEXA 1
        if (y > 200) {
          doc.addPage();
          y = 30;
        }
        doc.setFont("times", "bold");
        doc.text("PROPRIETAR", margin, y);
        doc.text("CHIRIAS", pageWidth - margin - 30, y);
        y += 8;
        doc.setFont("times", "normal");
        doc.text(removeDiacritics(`${contract.proprietar_prenume || ''} ${contract.proprietar_name || ''}`), margin, y);
        doc.text(removeDiacritics(`${contract.client_prenume || ''} ${contract.client_name}`), pageWidth - margin - 50, y);
        y += 8;
        
        // Add electronic signatures on Anexa 1
        if (proprietarSignature) {
          try {
            doc.addImage(proprietarSignature, 'PNG', margin, y, signatureWidth, signatureHeight);
          } catch (e) {
            console.error('Error adding proprietar signature to Anexa 1:', e);
          }
        } else {
          doc.text("(nesemnat)", margin, y + 10);
        }
        
        if (chiriasSignature) {
          try {
            doc.addImage(chiriasSignature, 'PNG', pageWidth - margin - signatureWidth, y, signatureWidth, signatureHeight);
          } catch (e) {
            console.error('Error adding chirias signature to Anexa 1:', e);
          }
        } else {
          doc.text("(nesemnat)", pageWidth - margin - 40, y + 10);
        }
        
        y += signatureHeight + 10;
      }

      // SEMNATURI
      if (y > 200) {
        doc.addPage();
        y = 30;
      }
      doc.setFont("times", "bold");
      doc.text("PROPRIETAR", margin, y);
      doc.text("CHIRIAS", pageWidth - margin - 30, y);
      y += 8;
      doc.setFont("times", "normal");
      doc.text(removeDiacritics(`${contract.proprietar_prenume || ''} ${contract.proprietar_name || ''}`), margin, y);
      doc.text(removeDiacritics(`${contract.client_prenume || ''} ${contract.client_name}`), pageWidth - margin - 50, y);
      y += 8;
      
      // Add electronic signatures
      
      if (proprietarSignature) {
        try {
          doc.addImage(proprietarSignature, 'PNG', margin, y, signatureWidth, signatureHeight);
        } catch (e) {
          console.error('Error adding proprietar signature:', e);
        }
      } else {
        doc.text("(nesemnat)", margin, y + 10);
      }
      
      if (chiriasSignature) {
        try {
          doc.addImage(chiriasSignature, 'PNG', pageWidth - margin - signatureWidth, y, signatureWidth, signatureHeight);
        } catch (e) {
          console.error('Error adding chirias signature:', e);
        }
      } else {
        doc.text("(nesemnat)", pageWidth - margin - 40, y + 10);
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

      // Download the signed PDF
      doc.save(fileName);
      
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
    // If we have a pdf_url, use it directly
    if (contract.pdf_url) {
      setPreviewContractName(`${contract.client_prenume || ''} ${contract.client_name}`.trim());
      setPreviewPdfUrl(null);
      setPreviewDialogOpen(true);
      
      try {
        const { data } = await supabase.storage
          .from('contracts')
          .createSignedUrl(contract.pdf_url, 3600); // 1 hour expiry
        
        if (data?.signedUrl) {
          setPreviewPdfUrl(data.signedUrl);
        } else {
          toast.error('Nu s-a putut genera URL-ul de previzualizare');
          setPreviewDialogOpen(false);
        }
      } catch (error) {
        console.error('Error generating preview URL:', error);
        toast.error('Eroare la generarea previzualizării');
        setPreviewDialogOpen(false);
      }
      return;
    }

    // If no pdf_url but contract has signatures, generate PDF in memory for preview
    if (contract.proprietar_signed || contract.chirias_signed) {
      setPreviewingContractId(contract.id);
      setPreviewContractName(`${contract.client_prenume || ''} ${contract.client_name}`.trim());
      setPreviewPdfUrl(null);
      setPreviewDialogOpen(true);

      try {
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

        // Generate PDF in memory (reuse logic from regeneratePdfWithSignatures)
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        const textWidth = pageWidth - 2 * margin;
        let y = 25;

        const addSection = (title: string) => {
          if (y > 260) {
            doc.addPage();
            y = 20;
          }
          doc.setFontSize(11);
          doc.setFont("times", "bolditalic");
          doc.text(title, margin, y);
          const titleWidth = doc.getTextWidth(title);
          doc.setLineWidth(0.3);
          doc.line(margin, y + 1, margin + titleWidth, y + 1);
          y += 8;
          doc.setFontSize(10);
          doc.setFont("times", "normal");
        };

        const removeDiacritics = (text: string): string => {
          return text
            .replace(/ă/g, 'a').replace(/Ă/g, 'A')
            .replace(/â/g, 'a').replace(/Â/g, 'A')
            .replace(/î/g, 'i').replace(/Î/g, 'I')
            .replace(/ș/g, 's').replace(/Ș/g, 'S')
            .replace(/ț/g, 't').replace(/Ț/g, 'T')
            .replace(/ş/g, 's').replace(/Ş/g, 'S')
            .replace(/ţ/g, 't').replace(/Ţ/g, 'T');
        };

        const addParagraph = (text: string) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.setFont("times", "normal");
          const lines = doc.splitTextToSize(removeDiacritics(text), textWidth);
          for (let i = 0; i < lines.length; i++) {
            if (i < lines.length - 1) {
              doc.text(lines[i], margin, y, { align: "justify", maxWidth: textWidth });
            } else {
              doc.text(lines[i], margin, y);
            }
            y += 5;
          }
          y += 2;
        };

        const addBullet = (text: string) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.setFont("times", "normal");
          const bulletIndent = 8;
          const bulletTextWidth = textWidth - bulletIndent;
          doc.text("-", margin + 3, y);
          const lines = doc.splitTextToSize(removeDiacritics(text), bulletTextWidth);
          for (let i = 0; i < lines.length; i++) {
            if (i < lines.length - 1) {
              doc.text(lines[i], margin + bulletIndent, y, { align: "justify", maxWidth: bulletTextWidth });
            } else {
              doc.text(lines[i], margin + bulletIndent, y);
            }
            y += 5;
          }
          y += 1;
        };

        const addSubsectionTitle = (title: string) => {
          if (y > 260) {
            doc.addPage();
            y = 20;
          }
          doc.setFontSize(10);
          doc.setFont("times", "bold");
          doc.text(removeDiacritics(title), margin, y);
          y += 6;
          doc.setFont("times", "normal");
        };

        const moneda = contract.property_currency || 'EUR';
        const garantieVal = contract.property_price?.toString() || '';
        const durataLuni = contract.duration_months?.toString() || '12';

        // Signature dimensions
        const signatureHeight = 25;
        const signatureWidth = 50;

        // TITLU
        doc.setFontSize(14);
        doc.setFont("times", "bold");
        doc.text("CONTRACT DE INCHIRIERE", pageWidth / 2, y, { align: "center" });
        y += 8;
        doc.setFontSize(10);
        doc.setFont("times", "italic");
        doc.text("(Semnat electronic)", pageWidth / 2, y, { align: "center" });
        y += 12;

        doc.setFont("times", "normal");
        doc.text(removeDiacritics(`Incheiat astazi, ${formatDateRomanian(contract.contract_date)} intre:`), margin, y);
        y += 10;

        // PARTI CONTRACTANTE
        doc.setFont("times", "bold");
        doc.text("1. PROPRIETAR:", margin, y);
        y += 6;
        doc.setFont("times", "normal");
        const proprietarText = removeDiacritics(`${contract.proprietar_prenume || ''} ${contract.proprietar_name || 'N/A'}${contract.proprietar_cnp ? `, CNP ${contract.proprietar_cnp}` : ''}${contract.proprietar_seria_ci ? `, C.I seria ${contract.proprietar_seria_ci}` : ''}${contract.proprietar_numar_ci ? ` nr. ${contract.proprietar_numar_ci}` : ''}${contract.proprietar_adresa ? `, cu domiciliul in ${contract.proprietar_adresa}` : ''}, in calitate de proprietar al imobilului situat in ${contract.property_address}.`);
        const propLines = doc.splitTextToSize(proprietarText, textWidth);
        for (let i = 0; i < propLines.length; i++) {
          doc.text(propLines[i], margin, y, i < propLines.length - 1 ? { align: "justify", maxWidth: textWidth } : undefined);
          y += 5;
        }
        y += 4;

        doc.setFont("times", "bold");
        doc.text("2. CHIRIAS:", margin, y);
        y += 6;
        doc.setFont("times", "normal");
        const chiriasText = removeDiacritics(`${contract.client_prenume || ''} ${contract.client_name}${contract.client_cnp ? `, CNP ${contract.client_cnp}` : ''}${contract.client_seria_ci ? `, C.I seria ${contract.client_seria_ci}` : ''}${contract.client_numar_ci ? ` nr. ${contract.client_numar_ci}` : ''}${contract.client_adresa ? `, cu domiciliul in ${contract.client_adresa}` : ''}, in calitate de chirias al imobilului situat in ${contract.property_address}.`);
        const chirLines = doc.splitTextToSize(chiriasText, textWidth);
        for (let i = 0; i < chirLines.length; i++) {
          doc.text(chirLines[i], margin, y, i < chirLines.length - 1 ? { align: "justify", maxWidth: textWidth } : undefined);
          y += 5;
        }
        y += 8;

        // Sections
        addSection("I. OBIECTUL CONTRACTULUI");
        addParagraph(`Proprietarul inchiriaza chiriasului imobilul situat in ${contract.property_address}`);
        y += 3;

        addSection("II. DESTINATIA");
        addParagraph("Imobilul va fi folosit de chirias cu destinatia LOCUINTA. Destinatia spatiului inchiriat nu poate fi schimbata.");
        y += 3;

        addSection("III. DURATA");
        addParagraph(`Acest contract este incheiat pentru o perioada de ${durataLuni} luni. Cu 30 de zile inaintea expirarii contractului, chiriasul va putea prelungi acest contract pentru aceeasi perioada sau pentru o perioada mai mica, numai cu acordul scris al proprietarului.`);
        y += 3;

        addSection("IV. CHIRIA SI MODALITATI DE PLATA");
        addParagraph(`Chiria lunara convenita de comun acord este de ${contract.property_price || 'N/A'} ${moneda}/luna. Suma va fi achitata in numerar sau transfer bancar.`);
        addParagraph(`Garantia in valoare de ${garantieVal} ${moneda} se va plati in termen de 10 zile lucratoare de la data semnarii contractului de inchiriere.`);
        addParagraph("Garantia se va restitui in termen de 30 de zile de la incetarea prezentului contract de inchiriere, retinandu-se cheltuielile curente care cad in sarcina chiriasului potrivit prezentului contract.");
        addParagraph("Neplata chiriei in termen de 5 zile constituie o incalcare a contractului, proprietarul avand dreptul in acest caz sa rezilieze contractul de inchiriere fara nici o alta formalitate.");
        y += 3;

        addSection("V. OBLIGATIILE SI DREPTURILE PROPRIETARULUI");
        addSubsectionTitle("1. OBLIGATIILE PROPRIETARULUI:");
        addBullet("proprietarul isi asuma raspunderea ca spatiul este liber si va ramane astfel pe toata perioada contractului;");
        addBullet("pune la dispozitia chiriasului imobilul in stare buna, pentru a fi folosit conform destinatiei avute in vedere in prezentul contract, impreuna cu un inventar (realizat de catre proprietar inainte de intrarea chiriasului in imobil) detaliat, intocmit in 2 (doua) exemplare semnate de ambele parti;");
        addBullet("achita toate taxele legale ale imobilului (impozit pe cladiri, venituri);");
        addBullet("sa suporte cheltuielile de reparatii pentru partile comune ale imobilului.");
        y += 2;

        addSubsectionTitle("2. DREPTURILE PROPRIETARULUI:");
        addBullet("sa viziteze imobilul cand doreste, cu anuntarea in prealabil a chiriasului si in prezenta acestuia;");
        addBullet("sa accepte sau sa respinga propunerile avansate de chirias de modificare a imobilului inchiriat in prezentul contract, in prealabil, sau ori de cate ori este necesar. Atat propunerile chiriasului cat si raspunsurile proprietarului se vor face in scris;");
        addBullet("sa verifice achitarea obligatiilor de plata curente ale chiriasului.");
        y += 3;

        addSection("VI. OBLIGATIILE SI DREPTURILE CHIRIASULUI");
        addSubsectionTitle("1. OBLIGATIILE CHIRIASULUI:");
        addBullet("sa asigure exploatarea imobilului doar in conformitate cu destinatia avuta in vedere;");
        addBullet("sa nu subinchirieze imobilul, decat cu acordul scris al proprietarului;");
        addBullet("sa achite in termen legal platile curente: electricitate, gaze, gunoi, apa, intretinere;");
        addBullet("sa mentina in buna stare imobilul si bunurile din inventar;");
        addBullet("sa respecte normele de convietuire in conformitate cu regulamentul asociatiei de locatari;");
        addBullet("sa permita accesul proprietarului in imobilul inchiriat cel putin o data pe luna;");
        addBullet("sa predea spatiul in starea in care era la inceperea contractului.");
        y += 2;

        addSubsectionTitle("2. DREPTURILE CHIRIASULUI:");
        addBullet("sa utilizeze imobilul in exclusivitate pe perioada derularii contractului;");
        addBullet("sa faca imbunatatirile necesare fara sa modifice structura de rezistenta si doar cu acordul proprietarului.");
        y += 3;

        addSection("VII. PREDAREA IMOBILULUI");
        addParagraph("Dupa expirarea contractului chiriasul va preda imobilul proprietarului sau unui reprezentant autorizat al proprietarului, in starea in care l-a primit.");
        y += 3;

        addSection("VIII. FORTA MAJORA");
        addParagraph("Orice cauza neprevazuta si imposibil de evitat, independenta de vointa partilor, aparuta dupa semnarea prezentului si care impiedica executarea contractului, va fi considerata cauza de forta majora si va exonera de raspundere partea care o invoca.");
        addParagraph("Partea care invoca cauza de forta majora trebuie sa notifice acest lucru celeilalte parti in maxim 5 zile de la aparitie.");
        y += 3;

        addSection("IX. CONDITIILE DE INCETARE A CONTRACTULUI");
        addParagraph("1. la expirarea duratei pentru care a fost incheiat;");
        addParagraph("2. in situatia nerespectarii clauzelor contractuale de catre una din parti;");
        addParagraph("3. clauza fortei majore;");
        addParagraph("4. prin denuntare unilaterala de catre oricare dintre parti, cu o notificare prealabila de 30 de zile, cu pierderea garantiei in cazul in care denuntarea nu a fost facuta de catre chirias in termen de 30 de zile sau fara un motiv intemeiat.");
        y += 3;

        addParagraph("Incetarea prezentului contract nu va avea efect asupra obligatiilor deja scadente intre partile contractante.");

        // INVENTAR
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
            
            if (index % 2 === 0) {
              doc.setFillColor(250, 250, 250);
              doc.rect(startX, y - 4, textWidth, 6, 'F');
            }
            
            doc.text(removeDiacritics((item.item_name || '').substring(0, 25)), startX + 2, y);
            doc.text((item.quantity || 1).toString(), startX + 55, y);
            doc.text(removeDiacritics(conditionLabels[item.condition] || item.condition || ''), startX + 70, y);
            doc.text(removeDiacritics((item.location || '-').substring(0, 12)), startX + 105, y);
            doc.text(removeDiacritics((item.notes || '-').substring(0, 20)), startX + 130, y);
            y += 6;
          });
          
          y += 10;
          addParagraph(`Total articole inventariate: ${contractInventory.length}`);
          y += 10;
          
          addParagraph("Prezentul inventar a fost intocmit in 2 (doua) exemplare, cate unul pentru fiecare parte, si face parte integranta din contractul de inchiriere.");
          y += 15;
          
          // SEMNATURI ANEXA 1
          if (y > 200) {
            doc.addPage();
            y = 30;
          }
          doc.setFont("times", "bold");
          doc.text("PROPRIETAR", margin, y);
          doc.text("CHIRIAS", pageWidth - margin - 30, y);
          y += 8;
          doc.setFont("times", "normal");
          doc.text(removeDiacritics(`${contract.proprietar_prenume || ''} ${contract.proprietar_name || ''}`), margin, y);
          doc.text(removeDiacritics(`${contract.client_prenume || ''} ${contract.client_name}`), pageWidth - margin - 50, y);
          y += 8;
          
          if (proprietarSignature) {
            try {
              doc.addImage(proprietarSignature, 'PNG', margin, y, signatureWidth, signatureHeight);
            } catch (e) {
              console.error('Error adding proprietar signature to Anexa 1:', e);
            }
          } else {
            doc.text("(nesemnat)", margin, y + 10);
          }
          
          if (chiriasSignature) {
            try {
              doc.addImage(chiriasSignature, 'PNG', pageWidth - margin - signatureWidth, y, signatureWidth, signatureHeight);
            } catch (e) {
              console.error('Error adding chirias signature to Anexa 1:', e);
            }
          } else {
            doc.text("(nesemnat)", pageWidth - margin - 40, y + 10);
          }
          
          y += signatureHeight + 10;
        }

        // SEMNATURI CONTRACT
        if (y > 200) {
          doc.addPage();
          y = 30;
        }
        doc.setFont("times", "bold");
        doc.text("PROPRIETAR", margin, y);
        doc.text("CHIRIAS", pageWidth - margin - 30, y);
        y += 8;
        doc.setFont("times", "normal");
        doc.text(removeDiacritics(`${contract.proprietar_prenume || ''} ${contract.proprietar_name || ''}`), margin, y);
        doc.text(removeDiacritics(`${contract.client_prenume || ''} ${contract.client_name}`), pageWidth - margin - 50, y);
        y += 8;
        
        if (proprietarSignature) {
          try {
            doc.addImage(proprietarSignature, 'PNG', margin, y, signatureWidth, signatureHeight);
          } catch (e) {
            console.error('Error adding proprietar signature:', e);
          }
        } else {
          doc.text("(nesemnat)", margin, y + 10);
        }
        
        if (chiriasSignature) {
          try {
            doc.addImage(chiriasSignature, 'PNG', pageWidth - margin - signatureWidth, y, signatureWidth, signatureHeight);
          } catch (e) {
            console.error('Error adding chirias signature:', e);
          }
        } else {
          doc.text("(nesemnat)", pageWidth - margin - 40, y + 10);
        }

        // Convert to data URL for preview (avoids Chrome blocking blob URLs in iframes)
        const pdfDataUrl = doc.output('datauristring');
        setPreviewPdfUrl(pdfDataUrl);
      } catch (error) {
        console.error('Error generating preview:', error);
        toast.error('Eroare la generarea previzualizării');
        setPreviewDialogOpen(false);
      } finally {
        setPreviewingContractId(null);
      }
      return;
    }

    toast.error('Nu există PDF sau semnături pentru acest contract');
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
      const moneda = contractData.moneda;
      const garantieVal = contractData.garantie || contractData.proprietate_pret;
      const camereText = contractData.numar_camere === "1" ? "1 camera" : `${contractData.numar_camere} camere`;

      if (format === 'docx') {
        // Generate Word document
        const doc = new Document({
          sections: [{
            properties: {},
            children: [
              new Paragraph({
                text: "CONTRACT DE INCHIRIERE",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
              }),
              new Paragraph({
                text: `Incheiat astazi, ${formatDateRomanian(contractData.data_contract)} intre:`,
                spacing: { after: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "1. PROPRIETAR: ", bold: true }),
                ],
              }),
              new Paragraph({
                text: `${contractData.proprietar.prenume} ${contractData.proprietar.nume}, cetatean ${contractData.proprietar.cetatenie}, identificat prin CNP ${contractData.proprietar.cnp}, C.I seria ${contractData.proprietar.seria_ci} nr. ${contractData.proprietar.numar_ci}${contractData.proprietar.ci_emitent && contractData.proprietar.ci_data_emiterii ? `, eliberat de ${contractData.proprietar.ci_emitent} la data de ${formatDateRomanian(contractData.proprietar.ci_data_emiterii)}` : ''}, in calitate de proprietar al imobilului situat in ${contractData.proprietate_adresa}`,
                spacing: { after: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "2. CHIRIAS: ", bold: true }),
                ],
              }),
              new Paragraph({
                text: `${contractData.chirias.prenume} ${contractData.chirias.nume}, cetatean ${contractData.chirias.cetatenie}, identificat prin CNP ${contractData.chirias.cnp}, C.I seria ${contractData.chirias.seria_ci} nr. ${contractData.chirias.numar_ci}${contractData.chirias.ci_emitent && contractData.chirias.ci_data_emiterii ? `, eliberat de ${contractData.chirias.ci_emitent} la data de ${formatDateRomanian(contractData.chirias.ci_data_emiterii)}` : ''}, in calitate de chirias al imobilului situat in ${contractData.proprietate_adresa}.`,
                spacing: { after: 400 },
              }),
              
              // I. OBIECTUL CONTRACTULUI
              new Paragraph({
                text: "I. OBIECTUL CONTRACTULUI",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
              }),
              new Paragraph({
                text: `Proprietarul inchiriaza chiriasului imobilul format din ${camereText} situat in ${contractData.proprietate_adresa}`,
                spacing: { after: 200 },
              }),
              
              // II. DESTINATIA
              new Paragraph({
                text: "II. DESTINATIA",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
              }),
              new Paragraph({
                text: "Imobilul va fi folosit de chirias cu destinatia LOCUINTA. Destinatia spatiului inchiriat nu poate fi schimbata.",
                spacing: { after: 200 },
              }),
              
              // III. DURATA
              new Paragraph({
                text: "III. DURATA",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
              }),
              new Paragraph({
                text: `Acest contract este incheiat pentru o perioada de ${contractData.durata_inchiriere || "12"} luni, incepand cu data de ${formatDateRomanian(contractData.data_incepere || contractData.data_contract)}. Cu 30 de zile inaintea expirarii contractului, chiriasul va putea prelungi acest contract pentru aceeasi perioada sau pentru o perioada mai mica, numai cu acordul scris al proprietarului.`,
                spacing: { after: 200 },
              }),
              
              // IV. CHIRIA SI MODALITATI DE PLATA
              new Paragraph({
                text: "IV. CHIRIA SI MODALITATI DE PLATA",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
              }),
              new Paragraph({
                text: `Chiria lunara convenita de comun acord este de ${contractData.proprietate_pret} ${moneda}/luna. Suma va fi achitata in numerar sau transfer bancar.`,
                spacing: { after: 100 },
              }),
              new Paragraph({
                text: `Garantia in valoare de ${garantieVal} ${moneda} se va plati la data semnarii contractului de inchiriere.`,
                spacing: { after: 100 },
              }),
              new Paragraph({
                text: "Garantia se va restitui in termen de 30 de zile de la incetarea prezentului contract de inchiriere, retinandu-se cheltuielile curente care cad in sarcina chiriasului potrivit prezentului contract.",
                spacing: { after: 100 },
              }),
              new Paragraph({
                text: "Neplata chiriei in termen de 5 zile constituie o incalcare a contractului, proprietarul avand dreptul in acest caz sa rezilieze contractul de inchiriere fara nici o alta formalitate.",
                spacing: { after: 200 },
              }),
              
              // V. OBLIGATIILE SI DREPTURILE PROPRIETARULUI
              new Paragraph({
                text: "V. OBLIGATIILE SI DREPTURILE PROPRIETARULUI",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
              }),
              new Paragraph({
                children: [new TextRun({ text: "1. OBLIGATIILE PROPRIETARULUI:", bold: true })],
                spacing: { after: 100 },
              }),
              new Paragraph({ text: "- proprietarul isi asuma raspunderea ca spatiul este liber si va ramane astfel pe toata perioada contractului;" }),
              new Paragraph({ text: "- pune la dispozitia chiriasului imobilul in stare buna, pentru a fi folosit conform destinatiei avute in vedere;" }),
              new Paragraph({ text: "- achita toate taxele legale ale imobilului (impozit pe cladiri, venituri);" }),
              new Paragraph({ text: "- sa suporte cheltuielile de reparatii pentru partile comune ale imobilului.", spacing: { after: 100 } }),
              new Paragraph({
                children: [new TextRun({ text: "2. DREPTURILE PROPRIETARULUI:", bold: true })],
                spacing: { after: 100 },
              }),
              new Paragraph({ text: "- sa viziteze imobilul cand doreste, cu anuntarea in prealabil a chiriasului si in prezenta acestuia;" }),
              new Paragraph({ text: "- sa accepte sau sa respinga propunerile avansate de chirias de modificare a imobilului;" }),
              new Paragraph({ text: "- sa verifice achitarea obligatiilor de plata curente ale chiriasului.", spacing: { after: 200 } }),
              
              // VI. OBLIGATIILE SI DREPTURILE CHIRIASULUI
              new Paragraph({
                text: "VI. OBLIGATIILE SI DREPTURILE CHIRIASULUI",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
              }),
              new Paragraph({
                children: [new TextRun({ text: "1. OBLIGATIILE CHIRIASULUI:", bold: true })],
                spacing: { after: 100 },
              }),
              new Paragraph({ text: "- sa asigure exploatarea imobilului doar in conformitate cu destinatia avuta in vedere;" }),
              new Paragraph({ text: "- sa nu subinchirieze imobilul, decat cu acordul scris al proprietarului;" }),
              new Paragraph({ text: "- sa achite in termen legal platile curente: electricitate, gaze, gunoi, apa, intretinere;" }),
              new Paragraph({ text: "- sa mentina in buna stare imobilul si bunurile din inventar;" }),
              new Paragraph({ text: "- sa respecte normele de convietuire in conformitate cu regulamentul asociatiei de locatari;" }),
              new Paragraph({ text: "- sa permita accesul proprietarului in imobilul inchiriat cel putin o data pe luna;" }),
              new Paragraph({ text: "- sa predea spatiul in starea in care era la inceperea contractului.", spacing: { after: 100 } }),
              new Paragraph({
                children: [new TextRun({ text: "2. DREPTURILE CHIRIASULUI:", bold: true })],
                spacing: { after: 100 },
              }),
              new Paragraph({ text: "- sa utilizeze imobilul in exclusivitate pe perioada derularii contractului;" }),
              new Paragraph({ text: "- sa faca imbunatatirile necesare fara sa modifice structura de rezistenta si doar cu acordul proprietarului.", spacing: { after: 200 } }),
              
              // VII. PREDAREA IMOBILULUI
              new Paragraph({
                text: "VII. PREDAREA IMOBILULUI",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
              }),
              new Paragraph({
                text: "Dupa expirarea contractului chiriasul va preda imobilul proprietarului sau unui reprezentant autorizat al proprietarului, in starea in care l-a primit.",
                spacing: { after: 200 },
              }),
              
              // VIII. FORTA MAJORA
              new Paragraph({
                text: "VIII. FORTA MAJORA",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
              }),
              new Paragraph({
                text: "Orice cauza neprevazuta si imposibil de evitat, independenta de vointa partilor, aparuta dupa semnarea prezentului si care impiedica executarea contractului, va fi considerata cauza de forta majora si va exonera de raspundere partea care o invoca.",
                spacing: { after: 100 },
              }),
              new Paragraph({
                text: "Partea care invoca cauza de forta majora trebuie sa notifice acest lucru celeilalte parti in maxim 5 zile de la aparitie.",
                spacing: { after: 200 },
              }),
              
              // IX. CONDITIILE DE INCETARE A CONTRACTULUI
              new Paragraph({
                text: "IX. CONDITIILE DE INCETARE A CONTRACTULUI",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
              }),
              new Paragraph({ text: "1. la expirarea duratei pentru care a fost incheiat;" }),
              new Paragraph({ text: "2. in situatia nerespectarii clauzelor contractuale de catre una din parti;" }),
              new Paragraph({ text: "3. clauza fortei majore;" }),
              new Paragraph({ text: "4. prin denuntare unilaterala de catre oricare dintre parti, cu o notificare prealabila de 30 de zile, cu pierderea garantiei in cazul in care denuntarea nu a fost facuta de catre chirias in termen de 30 de zile sau fara un motiv intemeiat.", spacing: { after: 100 } }),
              new Paragraph({
                text: "Incetarea prezentului contract nu va avea efect asupra obligatiilor deja scadente intre partile contractante.",
                spacing: { after: 400 },
              }),
              
              // SEMNATURI
              new Paragraph({
                children: [
                  new TextRun({ text: "PROPRIETAR", bold: true }),
                  new TextRun({ text: "\t\t\t\t\t\t\t\t\t\t" }),
                  new TextRun({ text: "CHIRIAS", bold: true }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `${contractData.proprietar.prenume} ${contractData.proprietar.nume}` }),
                  new TextRun({ text: "\t\t\t\t\t\t\t\t" }),
                  new TextRun({ text: `${contractData.chirias.prenume} ${contractData.chirias.nume}` }),
                ],
                spacing: { after: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "_____________________" }),
                  new TextRun({ text: "\t\t\t\t\t\t\t" }),
                  new TextRun({ text: "_____________________" }),
                ],
              }),
            ],
          }],
        });

        const blob = await Packer.toBlob(doc);
        const fileName = `contract_inchiriere_${contractData.chirias.nume}_${contractData.chirias.prenume}_${Date.now()}.docx`;
        
        // Upload to storage
        const docxPath = await uploadContractFile(blob, fileName);
        
        // Download locally
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        // Save to database with file path
        await saveContractToDatabase(undefined, docxPath || undefined);
        
        toast.success("Contract generat si salvat cu succes!");
        return;
      } else {
        // Generate PDF document with Times font (similar to Century)
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        const textWidth = pageWidth - 2 * margin;
        let y = 25;

        // Helper function to add section title with underline (bold italic like in image)
        const addSectionTitle = (title: string) => {
          if (y > 260) {
            doc.addPage();
            y = 20;
          }
          doc.setFontSize(11);
          doc.setFont("times", "bolditalic");
          doc.text(title, margin, y);
          // Add underline
          const titleWidth = doc.getTextWidth(title);
          doc.setLineWidth(0.3);
          doc.line(margin, y + 1, margin + titleWidth, y + 1);
          y += 8;
          doc.setFontSize(10);
          doc.setFont("times", "normal");
        };

        // Helper function to add subsection title (bold, numbered)
        const addSubsectionTitle = (title: string) => {
          if (y > 260) {
            doc.addPage();
            y = 20;
          }
          doc.setFontSize(10);
          doc.setFont("times", "bold");
          doc.text(title, margin, y);
          y += 6;
          doc.setFont("times", "normal");
        };

        // Helper function to add justified paragraph
        const addParagraph = (text: string) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.setFont("times", "normal");
          const lines = doc.splitTextToSize(text, textWidth);
          // Use justify alignment for all lines except the last
          for (let i = 0; i < lines.length; i++) {
            if (i < lines.length - 1) {
              doc.text(lines[i], margin, y, { align: "justify", maxWidth: textWidth });
            } else {
              doc.text(lines[i], margin, y);
            }
            y += 5;
          }
          y += 2;
        };

        // Helper function to add bullet point with dash
        const addBullet = (text: string) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.setFont("times", "normal");
          const bulletIndent = 8;
          const bulletTextWidth = textWidth - bulletIndent;
          doc.text("-", margin + 3, y);
          const lines = doc.splitTextToSize(text, bulletTextWidth);
          for (let i = 0; i < lines.length; i++) {
            if (i < lines.length - 1) {
              doc.text(lines[i], margin + bulletIndent, y, { align: "justify", maxWidth: bulletTextWidth });
            } else {
              doc.text(lines[i], margin + bulletIndent, y);
            }
            y += 5;
          }
          y += 1;
        };

        // TITLU
        doc.setFontSize(14);
        doc.setFont("times", "bold");
        doc.text("CONTRACT DE INCHIRIERE", pageWidth / 2, y, { align: "center" });
        y += 12;

        doc.setFontSize(10);
        doc.setFont("times", "normal");
        doc.text(`Incheiat astazi, ${formatDateRomanian(contractData.data_contract)} intre:`, margin, y);
        y += 10;

        // PARTI CONTRACTANTE
        doc.setFont("times", "bold");
        doc.text("1. PROPRIETAR:", margin, y);
        y += 6;
        doc.setFont("times", "normal");
        const proprietarCiDetails = contractData.proprietar.ci_emitent && contractData.proprietar.ci_data_emiterii 
          ? `, eliberat de ${contractData.proprietar.ci_emitent} la data de ${formatDateRomanian(contractData.proprietar.ci_data_emiterii)}` 
          : '';
        const proprietarText = `${contractData.proprietar.prenume} ${contractData.proprietar.nume}, cetatean ${contractData.proprietar.cetatenie}, identificat prin CNP ${contractData.proprietar.cnp}, C.I seria ${contractData.proprietar.seria_ci} nr. ${contractData.proprietar.numar_ci}${proprietarCiDetails}, in calitate de proprietar al imobilului situat in ${contractData.proprietate_adresa}`;
        const propLines = doc.splitTextToSize(proprietarText, textWidth);
        for (let i = 0; i < propLines.length; i++) {
          doc.text(propLines[i], margin, y, i < propLines.length - 1 ? { align: "justify", maxWidth: textWidth } : undefined);
          y += 5;
        }
        y += 4;

        doc.setFont("times", "bold");
        doc.text("2. CHIRIAS:", margin, y);
        y += 6;
        doc.setFont("times", "normal");
        const chiriasCiDetails = contractData.chirias.ci_emitent && contractData.chirias.ci_data_emiterii 
          ? `, eliberat de ${contractData.chirias.ci_emitent} la data de ${formatDateRomanian(contractData.chirias.ci_data_emiterii)}` 
          : '';
        const chiriasText = `${contractData.chirias.prenume} ${contractData.chirias.nume}, cetatean ${contractData.chirias.cetatenie}, identificat prin CNP ${contractData.chirias.cnp}, C.I seria ${contractData.chirias.seria_ci} nr. ${contractData.chirias.numar_ci}${chiriasCiDetails}, in calitate de chirias al imobilului situat in ${contractData.proprietate_adresa}.`;
        const chirLines = doc.splitTextToSize(chiriasText, textWidth);
        for (let i = 0; i < chirLines.length; i++) {
          doc.text(chirLines[i], margin, y, i < chirLines.length - 1 ? { align: "justify", maxWidth: textWidth } : undefined);
          y += 5;
        }
        y += 8;

        // I. OBIECTUL CONTRACTULUI
        addSectionTitle("I. OBIECTUL CONTRACTULUI");
        addParagraph(`Proprietarul inchiriaza chiriasului imobilul format din ${camereText} situat in ${contractData.proprietate_adresa}`);
        y += 3;

        // II. DESTINATIA
        addSectionTitle("II. DESTINATIA");
        addParagraph("Imobilul va fi folosit de chirias cu destinatia LOCUINTA. Destinatia spatiului inchiriat nu poate fi schimbata.");
        y += 3;

        // III. DURATA
        addSectionTitle("III. DURATA");
        addParagraph(`Acest contract este incheiat pentru o perioada de ${contractData.durata_inchiriere || "12"} luni, incepand cu data de ${formatDateRomanian(contractData.data_incepere || contractData.data_contract)}. Cu 30 de zile inaintea expirarii contractului, chiriasul va putea prelungi acest contract pentru aceeasi perioada sau pentru o perioada mai mica, numai cu acordul scris al proprietarului.`);
        y += 3;

        // IV. CHIRIA SI MODALITATI DE PLATA
        addSectionTitle("IV. CHIRIA SI MODALITATI DE PLATA");
        addParagraph(`Chiria lunara convenita de comun acord este de ${contractData.proprietate_pret} ${moneda}/luna. Suma va fi achitata in numerar sau transfer bancar.`);
        
        addParagraph(`Garantia in valoare de ${garantieVal} ${moneda} se va plati in termen de 10 zile lucratoare de la data semnarii contractului de inchiriere.`);
        addParagraph("Garantia se va restitui in termen de 30 de zile de la incetarea prezentului contract de inchiriere, retinandu-se cheltuielile curente care cad in sarcina chiriasului potrivit prezentului contract.");
        addParagraph("Neplata chiriei in termen de 5 zile constituie o incalcare a contractului, proprietarul avand dreptul in acest caz sa rezilieze contractul de inchiriere fara nici o alta formalitate.");
        y += 3;

        // V. OBLIGATIILE SI DREPTURILE PROPRIETARULUI
        addSectionTitle("V. OBLIGATIILE SI DREPTURILE PROPRIETARULUI");
        addSubsectionTitle("1. OBLIGATIILE PROPRIETARULUI:");
        addBullet("proprietarul isi asuma raspunderea ca spatiul este liber si va ramane astfel pe toata perioada contractului;");
        addBullet("pune la dispozitia chiriasului imobilul in stare buna, pentru a fi folosit conform destinatiei avute in vedere in prezentul contract, impreuna cu un inventar (realizat de catre proprietar inainte de intrarea chiriasului in imobil) detaliat, intocmit in 2 (doua) exemplare semnate de ambele parti;");
        addBullet("achita toate taxele legale ale imobilului (impozit pe cladiri, venituri);");
        addBullet("sa suporte cheltuielile de reparatii pentru partile comune ale imobilului.");
        y += 2;

        addSubsectionTitle("2. DREPTURILE PROPRIETARULUI:");
        addBullet("sa viziteze imobilul cand doreste, cu anuntarea in prealabil a chiriasului si in prezenta acestuia;");
        addBullet("sa accepte sau sa respinga propunerile avansate de chirias de modificare a imobilului inchiriat in prezentul contract, in prealabil, sau ori de cate ori este necesar. Atat propunerile chiriasului cat si raspunsurile proprietarului se vor face in scris;");
        addBullet("sa verifice achitarea obligatiilor de plata curente ale chiriasului.");
        y += 3;

        // VI. OBLIGATIILE SI DREPTURILE CHIRIASULUI
        addSectionTitle("VI. OBLIGATIILE SI DREPTURILE CHIRIASULUI");
        addSubsectionTitle("1. OBLIGATIILE CHIRIASULUI:");
        addBullet("sa asigure exploatarea imobilului doar in conformitate cu destinatia avuta in vedere;");
        addBullet("sa nu subinchirieze imobilul, decat cu acordul scris al proprietarului;");
        addBullet("sa achite in termen legal platile curente: electricitate, gaze, gunoi, apa, intretinere;");
        addBullet("sa mentina in buna stare imobilul si bunurile din inventar;");
        addBullet("sa respecte normele de convietuire in conformitate cu regulamentul asociatiei de locatari;");
        addBullet("sa permita accesul proprietarului in imobilul inchiriat cel putin o data pe luna;");
        addBullet("sa predea spatiul in starea in care era la inceperea contractului.");
        y += 2;

        addSubsectionTitle("2. DREPTURILE CHIRIASULUI:");
        addBullet("sa utilizeze imobilul in exclusivitate pe perioada derularii contractului;");
        addBullet("sa faca imbunatatirile necesare fara sa modifice structura de rezistenta si doar cu acordul proprietarului.");
        y += 3;

        // VII. PREDAREA IMOBILULUI
        addSectionTitle("VII. PREDAREA IMOBILULUI");
        addParagraph("Dupa expirarea contractului chiriasul va preda imobilul proprietarului sau unui reprezentant autorizat al proprietarului, in starea in care l-a primit.");
        y += 3;

        // VIII. FORTA MAJORA
        addSectionTitle("VIII. FORTA MAJORA");
        addParagraph("Orice cauza neprevazuta si imposibil de evitat, independenta de vointa partilor, aparuta dupa semnarea prezentului si care impiedica executarea contractului, va fi considerata cauza de forta majora si va exonera de raspundere partea care o invoca.");
        addParagraph("Partea care invoca cauza de forta majora trebuie sa notifice acest lucru celeilalte parti in maxim 5 zile de la aparitie.");
        y += 3;

        // IX. CONDITIILE DE INCETARE A CONTRACTULUI
        addSectionTitle("IX. CONDITIILE DE INCETARE A CONTRACTULUI");
        addParagraph("1. la expirarea duratei pentru care a fost incheiat;");
        addParagraph("2. in situatia nerespectarii clauzelor contractuale de catre una din parti;");
        addParagraph("3. clauza fortei majore;");
        addParagraph("4. prin denuntare unilaterala de catre oricare dintre parti, cu o notificare prealabila de 30 de zile, cu pierderea garantiei in cazul in care denuntarea nu a fost facuta de catre chirias in termen de 30 de zile sau fara un motiv intemeiat.");
        y += 3;

        addParagraph("Incetarea prezentului contract nu va avea efect asupra obligatiilor deja scadente intre partile contractante.");
        
        // INVENTAR - Add inventory section if items exist
        if (inventoryItems.length > 0) {
          doc.addPage();
          y = 25;
          
          doc.setFontSize(14);
          doc.setFont("times", "bold");
          doc.text("ANEXA 1 - INVENTAR IMOBIL", pageWidth / 2, y, { align: "center" });
          y += 12;
          
          doc.setFontSize(10);
          doc.setFont("times", "normal");
          addParagraph(`Inventar al bunurilor aflate in imobilul situat in ${contractData.proprietate_adresa}, predate de proprietar chiriasului la data inceperii contractului de inchiriere.`);
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
          
          inventoryItems.forEach((item, index) => {
            if (y > 270) {
              doc.addPage();
              y = 20;
            }
            
            // Alternate row background
            if (index % 2 === 0) {
              doc.setFillColor(250, 250, 250);
              doc.rect(startX, y - 4, textWidth, 6, 'F');
            }
            
            doc.text(item.item_name.substring(0, 25), startX + 2, y);
            doc.text(item.quantity.toString(), startX + 55, y);
            doc.text(conditionLabels[item.condition] || item.condition, startX + 70, y);
            doc.text((item.location || '-').substring(0, 12), startX + 105, y);
            doc.text((item.notes || '-').substring(0, 20), startX + 130, y);
            y += 6;
          });
          
          y += 10;
          addParagraph(`Total articole inventariate: ${inventoryItems.length}`);
          y += 10;
          
          addParagraph("Prezentul inventar a fost intocmit in 2 (doua) exemplare, cate unul pentru fiecare parte, si face parte integranta din contractul de inchiriere.");
          y += 15;
          
          // Add inventory images section if any item has images
          const itemsWithImages = inventoryItems.filter(item => item.images && item.images.length > 0);
          
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
              doc.text(`${item.item_name}${item.location ? ` - ${item.location}` : ''}`, margin, y);
              y += 6;
              doc.setFont("times", "normal");
              
              let imageX = margin;
              const imageWidth = 50;
              const imageHeight = 40;
              const imagesPerRow = 3;
              
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
                  
                  // Try to add image
                  doc.addImage(item.images[i], 'JPEG', imageX, y, imageWidth, imageHeight);
                  imageX += imageWidth + 5;
                } catch (imgError) {
                  console.warn('Could not add image to PDF:', imgError);
                  // Add placeholder text if image fails
                  doc.setFillColor(240, 240, 240);
                  doc.rect(imageX, y, imageWidth, imageHeight, 'F');
                  doc.setFontSize(8);
                  doc.text('[Imagine]', imageX + 15, y + imageHeight / 2);
                  doc.setFontSize(10);
                  imageX += imageWidth + 5;
                }
              }
              
              y += imageHeight + 10;
            }
          }
        }

        // SEMNATURI
        if (y > 250) {
          doc.addPage();
          y = 30;
        }
        doc.setFont("times", "bold");
        doc.text("PROPRIETAR", margin, y);
        doc.text("CHIRIAS", pageWidth - margin - 30, y);
        y += 8;
        doc.setFont("times", "normal");
        doc.text(`${contractData.proprietar.prenume} ${contractData.proprietar.nume}`, margin, y);
        doc.text(`${contractData.chirias.prenume} ${contractData.chirias.nume}`, pageWidth - margin - 50, y);
        y += 8;
        
        // Add electronic signatures if available
        if (contractData.semnatura_proprietar || contractData.semnatura_chirias) {
          y += 5;
          const signatureHeight = 25;
          const signatureWidth = 50;
          
          if (contractData.semnatura_proprietar) {
            try {
              doc.addImage(contractData.semnatura_proprietar, 'PNG', margin, y, signatureWidth, signatureHeight);
            } catch (e) {
              console.error('Error adding proprietar signature:', e);
            }
          }
          
          if (contractData.semnatura_chirias) {
            try {
              doc.addImage(contractData.semnatura_chirias, 'PNG', pageWidth - margin - signatureWidth, y, signatureWidth, signatureHeight);
            } catch (e) {
              console.error('Error adding chirias signature:', e);
            }
          }
          y += signatureHeight + 5;
        } else {
          y += 15;
          doc.text("_____________________", margin, y);
          doc.text("_____________________", pageWidth - margin - 50, y);
        }

        const fileName = `contract_inchiriere_${contractData.chirias.nume}_${contractData.chirias.prenume}_${Date.now()}.pdf`;
        
        // Get PDF as blob for storage upload
        const pdfBlob = doc.output('blob');
        const pdfPath = await uploadContractFile(pdfBlob, fileName);
        
        // Download locally
        doc.save(fileName);
        
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

  const handleDeleteContract = async (id: string) => {
    try {
      const { error } = await supabase.from('contracts').delete().eq('id', id);
      if (error) throw error;
      
      setContracts(prev => prev.filter(c => c.id !== id));
      toast.success("Contract șters din istoric");
    } catch (error: any) {
      console.error('Error deleting contract:', error);
      toast.error("Eroare la ștergerea contractului");
    }
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
    const updateData = (field: keyof PersonData, value: string) => {
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
              <Label className="text-xs">Adresa</Label>
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

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex-1"
              >
                Resetează
              </Button>
              <Button
                onClick={() => generateContract('pdf')}
                disabled={isGenerating}
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
                disabled={isGenerating}
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
          </CardContent>
        </Card>

        {/* Electronic Signatures */}
        <div className="grid grid-cols-2 gap-4">
          <SignaturePad
            title="Semnătură Proprietar"
            savedSignature={contractData.semnatura_proprietar}
            onSave={(sig) => setContractData(prev => ({ ...prev, semnatura_proprietar: sig }))}
          />
          <SignaturePad
            title="Semnătură Chiriaș"
            savedSignature={contractData.semnatura_chirias}
            onSave={(sig) => setContractData(prev => ({ ...prev, semnatura_chirias: sig }))}
          />
        </div>
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
          <div className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3 bg-muted/50 rounded-lg">
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
              <Input
                placeholder="Locație"
                value={newInventoryItem.location}
                onChange={(e) => setNewInventoryItem(prev => ({ ...prev, location: e.target.value }))}
                className="h-9"
              />
            </div>
            <div>
              <Button onClick={addInventoryItem} className="w-full h-9">
                <Plus className="h-4 w-4 mr-1" />
                Adaugă
              </Button>
            </div>
          </div>

          {/* Inventory list */}
          {inventoryItems.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Denumire</TableHead>
                    <TableHead className="w-[70px]">Cant.</TableHead>
                    <TableHead>Stare</TableHead>
                    <TableHead>Locație</TableHead>
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
                            value={item.location}
                            onChange={(e) => updateInventoryItem(item.id, 'location', e.target.value)}
                            className="h-8"
                            placeholder="Ex: Living"
                          />
                        ) : (
                          item.location || '-'
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Istoric Contracte
            </CardTitle>
            <Button variant="outline" size="sm" onClick={fetchContracts} disabled={isLoadingContracts}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingContracts ? 'animate-spin' : ''}`} />
              Reîmprospătează
            </Button>
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
          ) : (
            <>
              {/* Mobile view - Swipeable cards */}
              <div className="md:hidden">
                {contracts.map((contract) => (
                  <SwipeableContractCard
                    key={contract.id}
                    contract={contract}
                    onPreview={() => openPreviewDialog(contract)}
                    onDownloadPdf={() => downloadContract(contract, 'pdf')}
                    onDownloadDocx={() => downloadContract(contract, 'docx')}
                    onRegenerate={() => regeneratePdfWithSignatures(contract)}
                    onCopySignatureLink={(partyType) => copySignatureLink(contract.id, partyType)}
                    onSendWhatsApp={(partyType) => sendSignatureLinkWhatsApp(contract.id, partyType, contract)}
                    onSendEmail={(partyType) => openEmailDialog(contract.id, partyType, contract.property_address)}
                    onDelete={() => handleDeleteContract(contract.id)}
                    isRegenerating={regeneratingContractId === contract.id}
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
                      <TableHead>Semnături</TableHead>
                      <TableHead>Linkuri Semnare</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Acțiuni</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracts.map((contract) => (
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
                              title={contract.proprietar_signed ? "Proprietar a semnat" : "Trimite/retrimite email proprietar"}
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
                              title={contract.chirias_signed ? "Chiriaș a semnat" : "Trimite/retrimite email chiriaș"}
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
                            {(contract.pdf_url || contract.proprietar_signed || contract.chirias_signed) && (
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
                            )}
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
                            {!contract.pdf_url && !contract.docx_url && !(contract.proprietar_signed || contract.chirias_signed) && (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteContract(contract.id)}
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
    </div>
  );
};

export default ContractGeneratorPage;

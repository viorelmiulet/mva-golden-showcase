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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  FileText, Download, Loader2, Camera, Sparkles, User, Home, Calendar, 
  History, Trash2, RefreshCw, Building2, PenTool, Eye, Eraser, Percent,
  Save, Edit, Plus, Settings
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import jsPDF from "jspdf";
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
}

interface BeneficiarData {
  nume: string;
  prenume: string;
  cnp: string;
  seria_ci: string;
  numar_ci: string;
  ci_emitent: string;
  ci_data_emiterii: string;
  adresa: string;
}

interface PrestatorData {
  denumire: string;
  sediu: string;
  cui: string;
  reg_comert: string;
  reprezentant: string;
  calitate_reprezentant: string;
}

interface PropertyData {
  localitate: string;
  strada: string;
  numar: string;
  bloc: string;
  scara: string;
  apartament: string;
  sector_judet: string;
  nr_camere: string;
  compartimentare: "decomandat" | "semidecomandat" | "nedecomandat";
  etaj: string;
  confort: string;
  nr_bai: string;
  nr_balcoane: string;
  suprafata_utila: string;
}

interface ContractFormData {
  numar_contract: string;
  data_contract: string;
  prestator: PrestatorData;
  beneficiar: BeneficiarData;
  proprietate: PropertyData;
  pret_vanzare: string;
  pret_negociabil: boolean;
  comision_procent: string;
  durata_luni: string;
  semnatura_prestator: string;
  semnatura_beneficiar: string;
}

const emptyBeneficiar: BeneficiarData = {
  nume: "",
  prenume: "",
  cnp: "",
  seria_ci: "",
  numar_ci: "",
  ci_emitent: "",
  ci_data_emiterii: "",
  adresa: "",
};

const defaultPrestator: PrestatorData = {
  denumire: "MVA PERFECT BUSINESS",
  sediu: "Jud. Ilfov, Sat Dudu, Comuna Chiajna, Strada TINERETULUI, Nr. 35BIS, camera 1, Bl. 2, Scara 2, Etaj 2, Ap. 26",
  cui: "50477503",
  reg_comert: "J23/6136/2024",
  reprezentant: "Miuleț Ana-Maria",
  calitate_reprezentant: "Administrator",
};

const emptyProperty: PropertyData = {
  localitate: "",
  strada: "",
  numar: "",
  bloc: "",
  scara: "",
  apartament: "",
  sector_judet: "",
  nr_camere: "",
  compartimentare: "decomandat",
  etaj: "",
  confort: "",
  nr_bai: "",
  nr_balcoane: "",
  suprafata_utila: "",
};

// Helper function to format dates as DD.MM.YYYY
const formatDateRomanian = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  try {
    if (dateString.includes('.')) return dateString;
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

// Replace diacritics with normal letters for PDF (normalize handles combining characters)
const replaceDiacritics = (text: string): string => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ă/g, 'a').replace(/Ă/g, 'A')
    .replace(/â/g, 'a').replace(/Â/g, 'A')
    .replace(/î/g, 'i').replace(/Î/g, 'I')
    .replace(/ș/g, 's').replace(/Ș/g, 'S')
    .replace(/ț/g, 't').replace(/Ț/g, 'T')
    .replace(/ş/g, 's').replace(/Ş/g, 'S')
    .replace(/ţ/g, 't').replace(/Ţ/g, 'T');
};

const ExclusiveRepresentationPage = () => {
  const [isExtractingBeneficiar, setIsExtractingBeneficiar] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedImageBeneficiar, setUploadedImageBeneficiar] = useState<string | null>(null);
  const [extractedDataBeneficiar, setExtractedDataBeneficiar] = useState<ExtractedData | null>(null);
  
  // Preview dialog
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  
  // Tabs and editing
  const [activeTab, setActiveTab] = useState("new");
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Default agent signature
  const [defaultAgentSignature, setDefaultAgentSignature] = useState<string>("");
  const [showSignatureSettings, setShowSignatureSettings] = useState(false);
  const [isSavingSignature, setIsSavingSignature] = useState(false);
  
  const isMobile = useIsMobile();
  const fileInputBeneficiarRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<ContractFormData>({
    numar_contract: "",
    data_contract: new Date().toISOString().split('T')[0],
    prestator: { ...defaultPrestator },
    beneficiar: { ...emptyBeneficiar },
    proprietate: { ...emptyProperty },
    pret_vanzare: "",
    pret_negociabil: true,
    comision_procent: "3",
    durata_luni: "6",
    semnatura_prestator: "",
    semnatura_beneficiar: "",
  });

  // Fetch default agent signature on mount
  useEffect(() => {
    const fetchDefaultSignature = async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'default_agent_signature')
        .maybeSingle();
      
      if (!error && data?.value) {
        setDefaultAgentSignature(data.value);
        setFormData(prev => ({
          ...prev,
          semnatura_prestator: data.value
        }));
      }
    };
    fetchDefaultSignature();
  }, []);

  // Save default agent signature
  const saveDefaultSignature = async (signatureData: string) => {
    setIsSavingSignature(true);
    try {
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', 'default_agent_signature')
        .maybeSingle();

      if (existing) {
        await supabase
          .from('site_settings')
          .update({ value: signatureData })
          .eq('key', 'default_agent_signature');
      } else {
        await supabase
          .from('site_settings')
          .insert({ key: 'default_agent_signature', value: signatureData });
      }

      setDefaultAgentSignature(signatureData);
      setFormData(prev => ({ ...prev, semnatura_prestator: signatureData }));
      toast.success("Semnătura standard a fost salvată!");
      setShowSignatureSettings(false);
    } catch (error) {
      console.error('Error saving default signature:', error);
      toast.error("Eroare la salvarea semnăturii");
    } finally {
      setIsSavingSignature(false);
    }
  };

  // Fetch saved contracts
  const { data: savedContracts, isLoading: isLoadingContracts } = useQuery({
    queryKey: ['exclusive-contracts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exclusive_contracts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Save contract mutation
  const saveContractMutation = useMutation({
    mutationFn: async (contractData: any) => {
      if (editingContractId) {
        const { data, error } = await supabase
          .from('exclusive_contracts')
          .update(contractData)
          .eq('id', editingContractId)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('exclusive_contracts')
          .insert(contractData)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exclusive-contracts'] });
      toast.success(editingContractId ? "Contract actualizat!" : "Contract salvat!");
      if (!editingContractId) {
        handleReset();
      }
    },
    onError: (error: any) => {
      console.error('Error saving contract:', error);
      toast.error("Eroare la salvarea contractului");
    },
  });

  // Delete contract mutation
  const deleteContractMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('exclusive_contracts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exclusive-contracts'] });
      toast.success("Contract șters!");
    },
    onError: (error: any) => {
      console.error('Error deleting contract:', error);
      toast.error("Eroare la ștergerea contractului");
    },
  });

  const handleSaveContract = async () => {
    if (!formData.beneficiar.nume || !formData.beneficiar.prenume) {
      toast.error("Vă rugăm completați numele beneficiarului");
      return;
    }

    if (!formData.proprietate.localitate || !formData.proprietate.strada) {
      toast.error("Vă rugăm completați adresa proprietății");
      return;
    }

    setIsSaving(true);
    
    const propertyAddress = [
      formData.proprietate.localitate,
      formData.proprietate.strada && `str. ${formData.proprietate.strada}`,
      formData.proprietate.numar && `nr. ${formData.proprietate.numar}`,
      formData.proprietate.bloc && `bl. ${formData.proprietate.bloc}`,
      formData.proprietate.apartament && `ap. ${formData.proprietate.apartament}`,
    ].filter(Boolean).join(', ');

    const contractData = {
      beneficiary_name: formData.beneficiar.nume,
      beneficiary_prenume: formData.beneficiar.prenume,
      beneficiary_cnp: formData.beneficiar.cnp || null,
      beneficiary_seria_ci: formData.beneficiar.seria_ci || null,
      beneficiary_numar_ci: formData.beneficiar.numar_ci || null,
      beneficiary_ci_emitent: formData.beneficiar.ci_emitent || null,
      beneficiary_ci_data_emiterii: convertDateToISO(formData.beneficiar.ci_data_emiterii),
      beneficiary_adresa: formData.beneficiar.adresa || null,
      property_type: 'apartament',
      property_address: propertyAddress,
      property_rooms: formData.proprietate.nr_camere ? parseInt(formData.proprietate.nr_camere) : null,
      property_surface: formData.proprietate.suprafata_utila ? parseFloat(formData.proprietate.suprafata_utila) : null,
      property_features: formData.proprietate.compartimentare || null,
      sales_price: formData.pret_vanzare ? parseFloat(formData.pret_vanzare) : null,
      currency: 'EUR',
      commission_percent: formData.comision_procent ? parseFloat(formData.comision_procent) : null,
      duration_months: formData.durata_luni ? parseInt(formData.durata_luni) : 6,
      contract_date: formData.data_contract,
      beneficiary_signature: formData.semnatura_beneficiar || null,
      agent_signature: formData.semnatura_prestator || null,
      beneficiary_signed_at: formData.semnatura_beneficiar ? new Date().toISOString() : null,
      agent_signed_at: formData.semnatura_prestator ? new Date().toISOString() : null,
      status: formData.semnatura_beneficiar && formData.semnatura_prestator ? 'signed' : 'draft',
    };

    try {
      await saveContractMutation.mutateAsync(contractData);
    } finally {
      setIsSaving(false);
    }
  };

  const loadContractForEdit = (contract: any) => {
    setEditingContractId(contract.id);
    setFormData({
      numar_contract: "",
      data_contract: contract.contract_date || new Date().toISOString().split('T')[0],
      prestator: { ...defaultPrestator },
      beneficiar: {
        nume: contract.beneficiary_name || '',
        prenume: contract.beneficiary_prenume || '',
        cnp: contract.beneficiary_cnp || '',
        seria_ci: contract.beneficiary_seria_ci || '',
        numar_ci: contract.beneficiary_numar_ci || '',
        ci_emitent: contract.beneficiary_ci_emitent || '',
        ci_data_emiterii: contract.beneficiary_ci_data_emiterii || '',
        adresa: contract.beneficiary_adresa || '',
      },
      proprietate: {
        ...emptyProperty,
        nr_camere: contract.property_rooms?.toString() || '',
        suprafata_utila: contract.property_surface?.toString() || '',
        compartimentare: contract.property_features || 'decomandat',
      },
      pret_vanzare: contract.sales_price?.toString() || '',
      pret_negociabil: true,
      comision_procent: contract.commission_percent?.toString() || '3',
      durata_luni: contract.duration_months?.toString() || '6',
      semnatura_prestator: contract.agent_signature || '',
      semnatura_beneficiar: contract.beneficiary_signature || '',
    });
    setActiveTab("new");
    toast.info("Contract încărcat pentru editare");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'signed':
        return <Badge className="bg-green-500">Semnat</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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

  // Convert date from DD.MM.YYYY to YYYY-MM-DD for database
  const convertDateToISO = (dateStr: string | null): string | null => {
    if (!dateStr) return null;
    // Check if already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    // Convert from DD.MM.YYYY to YYYY-MM-DD
    const parts = dateStr.split('.');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return null;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setUploadedImageBeneficiar(base64);
      await extractDataFromImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const extractDataFromImage = async (imageBase64: string) => {
    setIsExtractingBeneficiar(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('extract-id-data', {
        body: { imageBase64 }
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      const extracted = data?.data as ExtractedData;
      if (extracted) {
        setExtractedDataBeneficiar(extracted);
        
        setFormData(prev => ({
          ...prev,
          beneficiar: {
            nume: extracted.nume || '',
            prenume: extracted.prenume || '',
            cnp: extracted.cnp || '',
            seria_ci: extracted.seria || '',
            numar_ci: extracted.numar || '',
            ci_emitent: extracted.emitent || '',
            ci_data_emiterii: extracted.data_emiterii || '',
            adresa: formatAddress(extracted.adresa),
          }
        }));
        
        toast.success("Date extrase cu succes!");
      } else {
        toast.error("Nu s-au putut extrage datele din imagine.");
      }
    } catch (error: any) {
      console.error('Error extracting data:', error);
      toast.error("Eroare la extragerea datelor. Completați manual.");
    } finally {
      setIsExtractingBeneficiar(false);
    }
  };

  const generatePDF = async (download: boolean = true): Promise<jsPDF> => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const textWidth = pageWidth - 2 * margin;
    let y = 20;

    const addSectionTitle = (title: string) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 51, 153);
      doc.text(replaceDiacritics(title), margin, y);
      y += 8;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
    };

    const addParagraph = (text: string, indent: number = 0) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(replaceDiacritics(text), textWidth - indent);
      for (let i = 0; i < lines.length; i++) {
        doc.text(lines[i], margin + indent, y);
        y += 5;
      }
      y += 2;
    };

    const addBulletPoint = (text: string) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "normal");
      const bulletText = `• ${replaceDiacritics(text)}`;
      const lines = doc.splitTextToSize(bulletText, textWidth - 8);
      for (let i = 0; i < lines.length; i++) {
        doc.text(lines[i], margin + 8, y);
        y += 5;
      }
      y += 1;
    };

    // TITLU
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("CONTRACT DE REPREZENTARE EXCLUSIVA", pageWidth / 2, y, { align: "center" });
    y += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const contractTitle = `Nr. ${formData.numar_contract || '_____'} / ${formatDateRomanian(formData.data_contract) || '_________'}`;
    doc.text(contractTitle, pageWidth / 2, y, { align: "center" });
    y += 12;

    // I. PARTILE CONTRACTANTE
    addSectionTitle("I. PARTILE CONTRACTANTE");
    
    // Prestator
    const prestatorText = `S.C. ${formData.prestator.denumire} S.R.L., cu sediul in ${formData.prestator.sediu}, inregistrata la registrul comertului sub nr. ${formData.prestator.reg_comert}, C.U.I. ${formData.prestator.cui}, reprezentata prin ${formData.prestator.reprezentant} in calitate de ${formData.prestator.calitate_reprezentant}, denumit in continuare PRESTATOR,`;
    addParagraph(prestatorText);
    y += 2;
    addParagraph("si");
    y += 2;
    
    // Beneficiar
    const beneficiarText = `Domnul(a) ${formData.beneficiar.prenume} ${formData.beneficiar.nume}, posesor al C.I. seria ${formData.beneficiar.seria_ci}, nr. ${formData.beneficiar.numar_ci}, C.N.P. ${formData.beneficiar.cnp}${formData.beneficiar.ci_emitent ? `, eliberat de ${formData.beneficiar.ci_emitent}` : ''}${formData.beneficiar.ci_data_emiterii ? ` la data de ${formatDateRomanian(formData.beneficiar.ci_data_emiterii)}` : ''}, avand domiciliul in ${formData.beneficiar.adresa}, in calitate de BENEFICIAR.`;
    addParagraph(beneficiarText);

    // II. OBIECTUL CONTRACTULUI
    y += 3;
    addSectionTitle("II. OBIECTUL CONTRACTULUI");
    
    const propAddr = `loc. ${formData.proprietate.localitate}, str. ${formData.proprietate.strada}, nr. ${formData.proprietate.numar}${formData.proprietate.bloc ? `, bl. ${formData.proprietate.bloc}` : ''}${formData.proprietate.scara ? `, sc. ${formData.proprietate.scara}` : ''}${formData.proprietate.apartament ? `, ap. ${formData.proprietate.apartament}` : ''}, sect/jud. ${formData.proprietate.sector_judet}`;
    const propDetails = `nr. camere ${formData.proprietate.nr_camere}, ${formData.proprietate.compartimentare}, etaj ${formData.proprietate.etaj}, confort ${formData.proprietate.confort}, nr. bai ${formData.proprietate.nr_bai}, nr. balcoane ${formData.proprietate.nr_balcoane}, suprafata utila de ${formData.proprietate.suprafata_utila} mp`;
    
    addParagraph(`1. Beneficiarul acorda Prestatorului dreptul de a realiza conform activitatii sale comerciale curente si pe cheltuiala sa, oricare si toate cercetarile, investigatiile si serviciile de intermediere imobiliara necesare pentru identificarea si selectionarea mai multor oferte de cumparare in favoarea, pentru si in contul Beneficiarului in vederea vanzarii de catre Beneficiar a imobilului situat in ${propAddr}, ${propDetails}.`);
    
    addParagraph("2. Beneficiarul declara pe propria raspundere ca este proprietarul imobilului de mai sus descris.");
    
    addParagraph(`3. Beneficiarul contractului se angajeaza sa transmita spre promovare, sa promoveze, respectiv sa vanda imobilul descris mai sus, cu EXCLUSIVITATE acordata Prestatorului. Beneficiarul nu poate promova si vinde proprietatea susmentionata in perioada de exclusivitate nici singur si nici prin alt intermediar, in afara de S.C. ${formData.prestator.denumire} S.R.L.`);
    
    addParagraph(`4. Pretul de vanzare propus: ${formData.pret_vanzare} EUR, negociabil ${formData.pret_negociabil ? 'DA' : 'NU'}.`);

    // III. OBLIGATIILE PRESTATORULUI
    y += 3;
    addSectionTitle("III. OBLIGATIILE PRESTATORULUI");
    addBulletPoint("sa realizeze toate demersurile legale necesare promovarii imobilului;");
    addBulletPoint("sa promoveze imobilul pe site-uri de specialitate si retele de socializare;");
    addBulletPoint("sa identifice potentiali cumparatori si sa programeze vizionari;");
    addBulletPoint("sa asiste la negocieri si la incheierea contractului de vanzare.");

    // IV. OBLIGATIILE BENEFICIARULUI
    y += 3;
    addSectionTitle("IV. OBLIGATIILE BENEFICIARULUI");
    addBulletPoint("sa puna la dispozitia Prestatorului documentatia din care rezulta situatia juridica a imobilului ce urmeaza a fi instrainat;");
    addBulletPoint("sa nu trateze direct si nici prin alt intermediar cu ofertantii prezentati de Prestator;");
    addBulletPoint("sa confirme primirea informatiilor de la Prestator, inclusiv prezentarea potentialilor cumparatori, prin semnarea in acest sens a unei scrisori de introducere;");
    addBulletPoint("sa comunice agentiei data si locul incheierii tranzactiei cu cel putin 24 de ore inainte;");
    addBulletPoint("sa achite Prestatorului comisionul conform punctului V.");

    // V. COMISIONUL
    y += 3;
    addSectionTitle("V. COMISIONUL");
    addParagraph(`1. Comisionul perceput de catre Prestator pentru activitatile realizate este de ${formData.comision_procent}% din valoarea imobilului, fiind datorat de catre Beneficiar.`);
    addParagraph("2. Comisionul va fi platit Prestatorului in baza actului aditional ce se va incheia intre Beneficiar si Prestator la data la care Beneficiarul va semna oricare din conventiile de tipul celor prevazute mai sus si avand ca obiect imobilul.");
    addParagraph("3. Prestatorul este indreptatit sa incaseze de la Beneficiar comisionul stabilit in prezentul contract inclusiv in situatia in care actul aditional prevazut la art. 2 de la pct. V nu este semnat din culpa exclusiva a Beneficiarului.");
    addParagraph("4. Beneficiarul va achita comisionul cel tarziu in ziua incheierii tranzactiei.");

    // VI. RASPUNDEREA
    y += 3;
    addSectionTitle("VI. RASPUNDEREA");
    addParagraph("1. Comisionul va fi datorat inclusiv in cazul in care Beneficiarul:");
    addBulletPoint("a) instraineaza imobilul catre un client prezentat de Prestator, in mod direct sau printr-o persoana interpusa, fara ca Prestatorul sa fie informat despre intentia Beneficiarului de instrainare a imobilului;");
    addBulletPoint("b) instraineaza imobilul catre un client prezentat de Prestator, in mod direct sau printr-o persoana interpusa prin intermediul unei alte agentii imobiliare sau pe cont propriu.");
    addParagraph("2. Prestatorul are dreptul sa considere ca prezentul contract a incetat de plin drept, in situatiile de la Punctul VI, art. 1, Beneficiarul avand si obligatia achitarii comisionului.");

    // VII. DURATA SI INCETAREA
    y += 3;
    addSectionTitle("VII. DURATA SI INCETAREA CONTRACTULUI");
    addParagraph(`1. Prezentul contract intra in vigoare la data semnarii lui de catre parti si este valabil pe o durata de ${formData.durata_luni} luni.`);
    addParagraph("2. Contractul inceteaza prin:");
    addBulletPoint("a) denuntarea unilaterala de catre oricare dintre Parti, cu notificare de 60 de zile inainte;");
    addBulletPoint("b) prin acordul Partilor;");
    addBulletPoint("c) in cazul dizolvarii, lichidarii sau falimentului uneia dintre Partile contractante.");

    // VIII. ALTE CLAUZE
    y += 3;
    addSectionTitle("VIII. ALTE CLAUZE");
    addParagraph("1. Orice intelegere separata realizata intre Beneficiar si angajati sau colaboratori ai Prestatorului, fara acordul in scris al acestuia, este nula.");
    addParagraph("2. Forta majora exonereaza de raspundere Partile in cazul neexecutarii partiale sau totale a obligatiilor asumate prin prezentul contract.");
    addParagraph("3. Prezentul contract poate fi modificat doar in scris, printr-un act aditional semnat de catre ambele Parti contractante.");

    // SEMNATURI
    if (y > 220) { doc.addPage(); y = 30; }
    y += 15;
    doc.setFont("helvetica", "bold");
    doc.text("PRESTATOR", margin, y);
    doc.text("BENEFICIAR", pageWidth - margin - 40, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.text(replaceDiacritics(formData.prestator.denumire), margin, y);
    doc.text(replaceDiacritics(`${formData.beneficiar.prenume} ${formData.beneficiar.nume}`), pageWidth - margin - 60, y);
    y += 15;

    // Add signatures if available
    if (formData.semnatura_prestator) {
      try {
        doc.addImage(formData.semnatura_prestator, 'PNG', margin, y, 50, 25);
      } catch (e) {
        console.error('Error adding prestator signature:', e);
      }
    } else {
      doc.text("_______________", margin, y + 10);
    }

    if (formData.semnatura_beneficiar) {
      try {
        doc.addImage(formData.semnatura_beneficiar, 'PNG', pageWidth - margin - 50, y, 50, 25);
      } catch (e) {
        console.error('Error adding beneficiar signature:', e);
      }
    } else {
      doc.text("_______________", pageWidth - margin - 40, y + 10);
    }

    if (download) {
      const filename = `Contract_Reprezentare_Exclusiva_${formData.beneficiar.nume}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(filename);
      toast.success("Contract generat și descărcat cu succes!");
    }

    return doc;
  };

  const handleGeneratePDF = async () => {
    if (!formData.beneficiar.nume || !formData.beneficiar.prenume) {
      toast.error("Vă rugăm completați numele beneficiarului");
      return;
    }

    if (!formData.proprietate.localitate || !formData.proprietate.strada) {
      toast.error("Vă rugăm completați adresa proprietății");
      return;
    }

    setIsGenerating(true);
    try {
      await generatePDF(true);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("Eroare la generarea PDF-ului");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreview = async () => {
    if (!formData.beneficiar.nume || !formData.beneficiar.prenume) {
      toast.error("Vă rugăm completați numele beneficiarului");
      return;
    }

    setIsPreviewing(true);
    setPreviewDialogOpen(true);
    setPreviewPdfUrl(null);

    try {
      const doc = await generatePDF(false);
      const pdfDataUrl = doc.output('datauristring');
      setPreviewPdfUrl(pdfDataUrl);
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error("Eroare la previzualizare");
      setPreviewDialogOpen(false);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleReset = () => {
    setUploadedImageBeneficiar(null);
    setExtractedDataBeneficiar(null);
    setEditingContractId(null);
    setFormData({
      numar_contract: "",
      data_contract: new Date().toISOString().split('T')[0],
      prestator: { ...defaultPrestator },
      beneficiar: { ...emptyBeneficiar },
      proprietate: { ...emptyProperty },
      pret_vanzare: "",
      pret_negociabil: true,
      comision_procent: "3",
      durata_luni: "6",
      semnatura_prestator: "",
      semnatura_beneficiar: "",
    });
    if (fileInputBeneficiarRef.current) fileInputBeneficiarRef.current.value = "";
    toast.success("Formular resetat");
  };

  const handleNewContract = () => {
    handleReset();
    setActiveTab("new");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Contract Reprezentare Exclusivă
          </h1>
          <p className="text-muted-foreground">
            Generați și gestionați contracte de reprezentare exclusivă
          </p>
        </div>
        {activeTab === "history" && (
          <Button onClick={handleNewContract}>
            <Plus className="h-4 w-4 mr-2" />
            Contract Nou
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="new" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {editingContractId ? "Editare" : "Contract Nou"}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Istoric ({savedContracts?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="space-y-6 mt-6">
          {/* Contract Number & Date */}
          <Card>
            <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Date Contract
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Număr Contract</Label>
              <Input
                value={formData.numar_contract}
                onChange={(e) => setFormData(prev => ({ ...prev, numar_contract: e.target.value }))}
                placeholder="Ex: 001"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Data Contract</Label>
              <Input
                type="date"
                value={formData.data_contract}
                onChange={(e) => setFormData(prev => ({ ...prev, data_contract: e.target.value }))}
                className="h-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload CI Beneficiar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            CI Beneficiar (Proprietar Imobil)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              uploadedImageBeneficiar ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            }`}
            onClick={() => fileInputBeneficiarRef.current?.click()}
          >
            <input
              ref={fileInputBeneficiarRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            
            {isExtractingBeneficiar ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground text-sm">Se extrag datele cu AI...</p>
              </div>
            ) : uploadedImageBeneficiar ? (
              <div className="space-y-3">
                <img 
                  src={uploadedImageBeneficiar} 
                  alt="CI" 
                  className="max-h-32 mx-auto rounded-lg shadow-md"
                />
                <p className="text-xs text-muted-foreground">Click pentru a schimba</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Camera className="h-10 w-10 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Încărcați CI</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG - Max 10MB</p>
                </div>
              </div>
            )}
          </div>

          {extractedDataBeneficiar && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <Sparkles className="h-3 w-3" />
                <span className="font-medium text-xs">Date extrase</span>
              </div>
              <div className="text-xs space-y-0.5 text-muted-foreground">
                <p><strong>Nume:</strong> {extractedDataBeneficiar.prenume} {extractedDataBeneficiar.nume}</p>
                <p><strong>CNP:</strong> {extractedDataBeneficiar.cnp}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Beneficiar Data Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Date Beneficiar (Proprietar Imobil)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Prenume</Label>
              <Input
                value={formData.beneficiar.prenume}
                onChange={(e) => setFormData(prev => ({ ...prev, beneficiar: { ...prev.beneficiar, prenume: e.target.value } }))}
                placeholder="Prenume"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nume</Label>
              <Input
                value={formData.beneficiar.nume}
                onChange={(e) => setFormData(prev => ({ ...prev, beneficiar: { ...prev.beneficiar, nume: e.target.value } }))}
                placeholder="Nume"
                className="h-9"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">CNP</Label>
            <Input
              value={formData.beneficiar.cnp}
              onChange={(e) => setFormData(prev => ({ ...prev, beneficiar: { ...prev.beneficiar, cnp: e.target.value } }))}
              placeholder="Cod Numeric Personal"
              className="h-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Seria CI</Label>
              <Input
                value={formData.beneficiar.seria_ci}
                onChange={(e) => setFormData(prev => ({ ...prev, beneficiar: { ...prev.beneficiar, seria_ci: e.target.value } }))}
                placeholder="XX"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Număr CI</Label>
              <Input
                value={formData.beneficiar.numar_ci}
                onChange={(e) => setFormData(prev => ({ ...prev, beneficiar: { ...prev.beneficiar, numar_ci: e.target.value } }))}
                placeholder="123456"
                className="h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Emitent CI</Label>
              <Input
                value={formData.beneficiar.ci_emitent}
                onChange={(e) => setFormData(prev => ({ ...prev, beneficiar: { ...prev.beneficiar, ci_emitent: e.target.value } }))}
                placeholder="SPCLEP Sector 1"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Data emiterii CI</Label>
              <Input
                type="date"
                value={formData.beneficiar.ci_data_emiterii}
                onChange={(e) => setFormData(prev => ({ ...prev, beneficiar: { ...prev.beneficiar, ci_data_emiterii: e.target.value } }))}
                className="h-9"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Adresa Domiciliu</Label>
            <Textarea
              value={formData.beneficiar.adresa}
              onChange={(e) => setFormData(prev => ({ ...prev, beneficiar: { ...prev.beneficiar, adresa: e.target.value } }))}
              placeholder="Adresa completă"
              rows={2}
              className="text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Property Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Date Proprietate
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Localitate</Label>
              <Input
                value={formData.proprietate.localitate}
                onChange={(e) => setFormData(prev => ({ ...prev, proprietate: { ...prev.proprietate, localitate: e.target.value } }))}
                placeholder="București"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Strada</Label>
              <Input
                value={formData.proprietate.strada}
                onChange={(e) => setFormData(prev => ({ ...prev, proprietate: { ...prev.proprietate, strada: e.target.value } }))}
                placeholder="Str. Exemplu"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Număr</Label>
              <Input
                value={formData.proprietate.numar}
                onChange={(e) => setFormData(prev => ({ ...prev, proprietate: { ...prev.proprietate, numar: e.target.value } }))}
                placeholder="10"
                className="h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Bloc</Label>
              <Input
                value={formData.proprietate.bloc}
                onChange={(e) => setFormData(prev => ({ ...prev, proprietate: { ...prev.proprietate, bloc: e.target.value } }))}
                placeholder="A1"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Scară</Label>
              <Input
                value={formData.proprietate.scara}
                onChange={(e) => setFormData(prev => ({ ...prev, proprietate: { ...prev.proprietate, scara: e.target.value } }))}
                placeholder="1"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Apartament</Label>
              <Input
                value={formData.proprietate.apartament}
                onChange={(e) => setFormData(prev => ({ ...prev, proprietate: { ...prev.proprietate, apartament: e.target.value } }))}
                placeholder="12"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Sector/Județ</Label>
              <Input
                value={formData.proprietate.sector_judet}
                onChange={(e) => setFormData(prev => ({ ...prev, proprietate: { ...prev.proprietate, sector_judet: e.target.value } }))}
                placeholder="Sector 1"
                className="h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Nr. Camere</Label>
              <Input
                value={formData.proprietate.nr_camere}
                onChange={(e) => setFormData(prev => ({ ...prev, proprietate: { ...prev.proprietate, nr_camere: e.target.value } }))}
                placeholder="3"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Compartimentare</Label>
              <Select
                value={formData.proprietate.compartimentare}
                onValueChange={(value: "decomandat" | "semidecomandat" | "nedecomandat") => 
                  setFormData(prev => ({ ...prev, proprietate: { ...prev.proprietate, compartimentare: value } }))
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="decomandat">Decomandat</SelectItem>
                  <SelectItem value="semidecomandat">Semidecomandat</SelectItem>
                  <SelectItem value="nedecomandat">Nedecomandat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Etaj</Label>
              <Input
                value={formData.proprietate.etaj}
                onChange={(e) => setFormData(prev => ({ ...prev, proprietate: { ...prev.proprietate, etaj: e.target.value } }))}
                placeholder="2"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Confort</Label>
              <Input
                value={formData.proprietate.confort}
                onChange={(e) => setFormData(prev => ({ ...prev, proprietate: { ...prev.proprietate, confort: e.target.value } }))}
                placeholder="1"
                className="h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Nr. Băi</Label>
              <Input
                value={formData.proprietate.nr_bai}
                onChange={(e) => setFormData(prev => ({ ...prev, proprietate: { ...prev.proprietate, nr_bai: e.target.value } }))}
                placeholder="1"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nr. Balcoane</Label>
              <Input
                value={formData.proprietate.nr_balcoane}
                onChange={(e) => setFormData(prev => ({ ...prev, proprietate: { ...prev.proprietate, nr_balcoane: e.target.value } }))}
                placeholder="2"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Suprafață Utilă (mp)</Label>
              <Input
                value={formData.proprietate.suprafata_utila}
                onChange={(e) => setFormData(prev => ({ ...prev, proprietate: { ...prev.proprietate, suprafata_utila: e.target.value } }))}
                placeholder="75"
                className="h-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price & Commission */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Preț și Comision
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Preț Vânzare (EUR)</Label>
              <Input
                type="number"
                value={formData.pret_vanzare}
                onChange={(e) => setFormData(prev => ({ ...prev, pret_vanzare: e.target.value }))}
                placeholder="100000"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Negociabil</Label>
              <Select
                value={formData.pret_negociabil ? "da" : "nu"}
                onValueChange={(value) => setFormData(prev => ({ ...prev, pret_negociabil: value === "da" }))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="da">Da</SelectItem>
                  <SelectItem value="nu">Nu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Comision (%)</Label>
              <Input
                type="number"
                value={formData.comision_procent}
                onChange={(e) => setFormData(prev => ({ ...prev, comision_procent: e.target.value }))}
                placeholder="3"
                className="h-9"
                step="0.5"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Durată Contract (luni)</Label>
              <Input
                type="number"
                value={formData.durata_luni}
                onChange={(e) => setFormData(prev => ({ ...prev, durata_luni: e.target.value }))}
                placeholder="6"
                className="h-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signatures */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-primary">
              <PenTool className="h-5 w-5" />
              Semnături Digitale
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSignatureSettings(!showSignatureSettings)}
            >
              <Settings className="h-4 w-4 mr-1" />
              {showSignatureSettings ? "Închide" : "Setări Semnătură"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Signature Settings Panel */}
          {showSignatureSettings && (
            <div className="border-2 border-dashed border-primary/30 rounded-lg p-4 bg-primary/5 mb-4">
              <h4 className="font-medium mb-3 text-sm">Configurare Semnătură Standard Prestator</h4>
              <p className="text-xs text-muted-foreground mb-4">
                Desenați semnătura care va fi aplicată automat pe toate contractele de reprezentare exclusivă.
              </p>
              {defaultAgentSignature ? (
                <div className="space-y-3">
                  <div className="border rounded-lg p-3 bg-white">
                    <img 
                      src={defaultAgentSignature} 
                      alt="Semnătură Standard" 
                      className="max-h-32 mx-auto"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDefaultAgentSignature("")}
                      className="flex-1"
                    >
                      <Eraser className="h-4 w-4 mr-1" />
                      Schimbă Semnătura
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <SignaturePad
                    title=""
                    savedSignature=""
                    onSave={(sig) => saveDefaultSignature(sig)}
                  />
                  {isSavingSignature && (
                    <div className="flex items-center justify-center text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Se salvează...
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Prestator Signature - Auto-applied */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-primary">Semnătură Prestator</span>
                {formData.semnatura_prestator && (
                  <Badge variant="secondary" className="text-xs">
                    Aplicată automat
                  </Badge>
                )}
              </div>
              {formData.semnatura_prestator ? (
                <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4 min-h-[200px] flex items-center justify-center">
                  <img 
                    src={formData.semnatura_prestator} 
                    alt="Semnătură Prestator" 
                    className="max-h-40"
                  />
                </div>
              ) : (
                <div className="border-2 border-dashed border-amber-300 bg-amber-50 rounded-lg p-4 min-h-[200px] flex flex-col items-center justify-center text-amber-700">
                  <PenTool className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm text-center">Nu există semnătură standard configurată</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSignatureSettings(true)}
                    className="mt-3"
                  >
                    Configurează Semnătura
                  </Button>
                </div>
              )}
            </div>

            {/* Beneficiar Signature */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-primary">Semnătură Beneficiar</span>
                {formData.semnatura_beneficiar && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, semnatura_beneficiar: "" }))}
                    className="h-7 text-xs"
                  >
                    <Eraser className="h-3 w-3 mr-1" />
                    Șterge
                  </Button>
                )}
              </div>
              {formData.semnatura_beneficiar ? (
                <div className="border-2 border-dashed rounded-lg p-4 bg-white min-h-[200px] flex items-center justify-center">
                  <img 
                    src={formData.semnatura_beneficiar} 
                    alt="Semnătură Beneficiar" 
                    className="max-h-40"
                  />
                </div>
              ) : (
                <SignaturePad
                  title=""
                  savedSignature=""
                  onSave={(sig) => setFormData(prev => ({ ...prev, semnatura_beneficiar: sig }))}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleSaveContract}
              disabled={isSaving || isGenerating || isPreviewing}
              variant="default"
              className="flex-1 min-w-[140px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Se salvează...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {editingContractId ? "Actualizează" : "Salvează"}
                </>
              )}
            </Button>
            <Button
              onClick={handlePreview}
              disabled={isGenerating || isPreviewing}
              variant="secondary"
              className="flex-1 min-w-[140px]"
            >
              {isPreviewing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Se încarcă...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Previzualizare
                </>
              )}
            </Button>
            <Button
              onClick={handleGeneratePDF}
              disabled={isGenerating || isPreviewing}
              variant="outline"
              className="flex-1 min-w-[140px]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Se generează...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Descarcă PDF
                </>
              )}
            </Button>
            <Button
              onClick={handleReset}
              variant="ghost"
              className="min-w-[100px]"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
          </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Istoric Contracte Reprezentare Exclusivă
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingContracts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : savedContracts && savedContracts.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Beneficiar</TableHead>
                        <TableHead>Adresă Imobil</TableHead>
                        <TableHead>Preț</TableHead>
                        <TableHead>Comision</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Acțiuni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {savedContracts.map((contract) => (
                        <TableRow key={contract.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(contract.contract_date), 'dd.MM.yyyy')}
                          </TableCell>
                          <TableCell>
                            {contract.beneficiary_prenume} {contract.beneficiary_name}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {contract.property_address}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {contract.sales_price?.toLocaleString()} {contract.currency}
                          </TableCell>
                          <TableCell>
                            {contract.commission_percent}%
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(contract.status || 'draft')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => loadContractForEdit(contract)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm('Sigur doriți să ștergeți acest contract?')) {
                                    deleteContractMutation.mutate(contract.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nu există contracte salvate</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={handleNewContract}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Creează primul contract
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Previzualizare Contract Reprezentare Exclusivă</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {isPreviewing ? (
              <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : previewPdfUrl ? (
              <iframe
                src={previewPdfUrl}
                className="w-full h-[70vh] border rounded-lg"
                title="PDF Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-96 text-muted-foreground">
                Eroare la încărcarea previzualizării
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExclusiveRepresentationPage;

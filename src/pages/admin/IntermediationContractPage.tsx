import { useState, useRef, useEffect } from "react";
import SignaturePad from "@/components/SignaturePad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  FileText, Download, Loader2, Camera, Sparkles, User, Home, Calendar, 
  History, Trash2, RefreshCw, Building2, PenTool, Eye, Eraser, Percent,
  Save, Edit, Plus, Settings, Mail, Search
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { replaceDiacritics } from "@/lib/utils";
import jsPDF from "jspdf";
import { format } from "date-fns";
import SendSignatureLinkDialog from "@/components/admin/SendSignatureLinkDialog";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

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

interface ClientData {
  nume: string;
  prenume: string;
  cnp: string;
  seria_ci: string;
  numar_ci: string;
  ci_emitent: string;
  ci_data_emiterii: string;
  adresa: string;
  telefon: string;
  email: string;
}

interface PrestatorData {
  denumire: string;
  sediu: string;
  cui: string;
  reg_comert: string;
  reprezentant: string;
  calitate_reprezentant: string;
}

interface SearchCriteria {
  tip_imobil: "apartament" | "casa" | "teren" | "comercial";
  zona: string;
  suprafata_min: string;
  suprafata_max: string;
  camere_min: string;
  camere_max: string;
  buget_min: string;
  buget_max: string;
  alte_cerinte: string;
}

interface ContractFormData {
  numar_contract: string;
  data_contract: string;
  prestator: PrestatorData;
  client: ClientData;
  criterii: SearchCriteria;
  comision_procent: string;
  durata_luni: string;
  semnatura_prestator: string;
  semnatura_client: string;
}

const emptyClient: ClientData = {
  nume: "",
  prenume: "",
  cnp: "",
  seria_ci: "",
  numar_ci: "",
  ci_emitent: "",
  ci_data_emiterii: "",
  adresa: "",
  telefon: "",
  email: "",
};

const defaultPrestator: PrestatorData = {
  denumire: "MVA PERFECT BUSINESS",
  sediu: "Jud. Ilfov, Sat Dudu, Comuna Chiajna, Strada TINERETULUI, Nr. 35BIS, camera 1, Bl. 2, Scara 2, Etaj 2, Ap. 26",
  cui: "50477503",
  reg_comert: "J23/6136/2024",
  reprezentant: "Miuleț Ana-Maria",
  calitate_reprezentant: "Administrator",
};

const emptySearchCriteria: SearchCriteria = {
  tip_imobil: "apartament",
  zona: "",
  suprafata_min: "",
  suprafata_max: "",
  camere_min: "",
  camere_max: "",
  buget_min: "",
  buget_max: "",
  alte_cerinte: "",
};

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

const IntermediationContractPage = () => {
  const [isExtractingClient, setIsExtractingClient] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedImageClient, setUploadedImageClient] = useState<string | null>(null);
  const [extractedDataClient, setExtractedDataClient] = useState<ExtractedData | null>(null);
  
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  
  const [activeTab, setActiveTab] = useState("new");
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [defaultAgentSignature, setDefaultAgentSignature] = useState<string>("");
  
  // Email dialog
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailDialogData, setEmailDialogData] = useState<{
    contractId: string;
    propertyAddress: string;
    clientEmail: string;
    clientName: string;
  } | null>(null);
  const isMobile = useIsMobile();
  const fileInputClientRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<ContractFormData>({
    numar_contract: "",
    data_contract: new Date().toISOString().split('T')[0],
    prestator: { ...defaultPrestator },
    client: { ...emptyClient },
    criterii: { ...emptySearchCriteria },
    comision_procent: "2",
    durata_luni: "3",
    semnatura_prestator: "",
    semnatura_client: "",
  });

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

  const { data: savedContracts, isLoading: isLoadingContracts } = useQuery({
    queryKey: ['intermediation-contracts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('contract_type', 'intermediere')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const saveContractMutation = useMutation({
    mutationFn: async (contractData: any) => {
      if (editingContractId) {
        const { data, error } = await supabase
          .from('contracts')
          .update(contractData)
          .eq('id', editingContractId)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('contracts')
          .insert(contractData)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intermediation-contracts'] });
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

  const deleteContractMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intermediation-contracts'] });
      toast.success("Contract șters!");
    },
    onError: (error: any) => {
      console.error('Error deleting contract:', error);
      toast.error("Eroare la ștergerea contractului");
    },
  });

  const convertDateToISO = (dateStr: string | null): string | null => {
    if (!dateStr) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const parts = dateStr.split('.');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return null;
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
      setUploadedImageClient(base64);
      await extractDataFromImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const extractDataFromImage = async (imageBase64: string) => {
    setIsExtractingClient(true);
    
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
        setExtractedDataClient(extracted);
        
        setFormData(prev => ({
          ...prev,
          client: {
            ...prev.client,
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
      setIsExtractingClient(false);
    }
  };

  const handleSaveContract = async () => {
    if (!formData.client.nume || !formData.client.prenume) {
      toast.error("Vă rugăm completați numele clientului");
      return;
    }

    setIsSaving(true);
    
    const searchDescription = [
      `Tip: ${formData.criterii.tip_imobil}`,
      formData.criterii.zona && `Zona: ${formData.criterii.zona}`,
      formData.criterii.suprafata_min && `Suprafață min: ${formData.criterii.suprafata_min} mp`,
      formData.criterii.suprafata_max && `Suprafață max: ${formData.criterii.suprafata_max} mp`,
      formData.criterii.camere_min && `Camere min: ${formData.criterii.camere_min}`,
      formData.criterii.camere_max && `Camere max: ${formData.criterii.camere_max}`,
      formData.criterii.buget_min && `Buget min: ${formData.criterii.buget_min} EUR`,
      formData.criterii.buget_max && `Buget max: ${formData.criterii.buget_max} EUR`,
      formData.criterii.alte_cerinte && `Alte cerințe: ${formData.criterii.alte_cerinte}`,
    ].filter(Boolean).join('; ');

    const contractData = {
      client_name: formData.client.nume,
      client_prenume: formData.client.prenume,
      client_cnp: formData.client.cnp || null,
      client_seria_ci: formData.client.seria_ci || null,
      client_numar_ci: formData.client.numar_ci || null,
      client_ci_emitent: formData.client.ci_emitent || null,
      client_ci_data_emiterii: convertDateToISO(formData.client.ci_data_emiterii),
      client_adresa: formData.client.adresa || null,
      property_address: searchDescription,
      property_price: formData.criterii.buget_max ? parseFloat(formData.criterii.buget_max) : null,
      property_currency: 'EUR',
      advance_percent: formData.comision_procent || '2',
      duration_months: formData.durata_luni ? parseInt(formData.durata_luni) : 3,
      contract_date: formData.data_contract,
      contract_type: 'intermediere',
      notes: `Telefon: ${formData.client.telefon || '-'}, Email: ${formData.client.email || '-'}`,
      chirias_signed: !!formData.semnatura_client,
      proprietar_signed: !!formData.semnatura_prestator,
    };

    try {
      await saveContractMutation.mutateAsync(contractData);
    } finally {
      setIsSaving(false);
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
    doc.text("CONTRACT DE INTERMEDIERE IMOBILIARA", pageWidth / 2, y, { align: "center" });
    y += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const contractTitle = `Nr. ${formData.numar_contract || '_____'} / ${formatDateRomanian(formData.data_contract) || '_________'}`;
    doc.text(contractTitle, pageWidth / 2, y, { align: "center" });
    y += 12;

    // I. PARTILE CONTRACTANTE
    addSectionTitle("I. PARTILE CONTRACTANTE");
    
    const prestatorText = `S.C. ${formData.prestator.denumire} S.R.L., cu sediul in ${formData.prestator.sediu}, inregistrata la registrul comertului sub nr. ${formData.prestator.reg_comert}, C.U.I. ${formData.prestator.cui}, reprezentata prin ${formData.prestator.reprezentant} in calitate de ${formData.prestator.calitate_reprezentant}, denumit in continuare INTERMEDIAR,`;
    addParagraph(prestatorText);
    y += 2;
    addParagraph("si");
    y += 2;
    
    const clientText = `Domnul(a) ${formData.client.prenume} ${formData.client.nume}, posesor al C.I. seria ${formData.client.seria_ci}, nr. ${formData.client.numar_ci}, C.N.P. ${formData.client.cnp}${formData.client.ci_emitent ? `, eliberat de ${formData.client.ci_emitent}` : ''}${formData.client.ci_data_emiterii ? ` la data de ${formatDateRomanian(formData.client.ci_data_emiterii)}` : ''}, avand domiciliul in ${formData.client.adresa}${formData.client.telefon ? `, tel: ${formData.client.telefon}` : ''}${formData.client.email ? `, email: ${formData.client.email}` : ''}, in calitate de CLIENT.`;
    addParagraph(clientText);

    // II. OBIECTUL CONTRACTULUI
    y += 3;
    addSectionTitle("II. OBIECTUL CONTRACTULUI");
    
    addParagraph("1. Intermediarul se angajeaza sa presteze servicii de intermediere imobiliara in vederea identificarii si prezentarii de oferte conforme cu criteriile de cautare stabilite de Client.");
    
    const criteriiText = `2. Criteriile de cautare: tip imobil - ${formData.criterii.tip_imobil}${formData.criterii.zona ? `, zona - ${formData.criterii.zona}` : ''}${formData.criterii.suprafata_min ? `, suprafata minima - ${formData.criterii.suprafata_min} mp` : ''}${formData.criterii.suprafata_max ? `, suprafata maxima - ${formData.criterii.suprafata_max} mp` : ''}${formData.criterii.camere_min ? `, numar minim camere - ${formData.criterii.camere_min}` : ''}${formData.criterii.camere_max ? `, numar maxim camere - ${formData.criterii.camere_max}` : ''}${formData.criterii.buget_min ? `, buget minim - ${formData.criterii.buget_min} EUR` : ''}${formData.criterii.buget_max ? `, buget maxim - ${formData.criterii.buget_max} EUR` : ''}${formData.criterii.alte_cerinte ? `. Alte cerinte: ${formData.criterii.alte_cerinte}` : ''}.`;
    addParagraph(criteriiText);

    // III. OBLIGATIILE INTERMEDIARULUI
    y += 3;
    addSectionTitle("III. OBLIGATIILE INTERMEDIARULUI");
    addBulletPoint("sa identifice imobilele care corespund criteriilor de cautare ale Clientului;");
    addBulletPoint("sa prezinte Clientului ofertele identificate si sa programeze vizionari;");
    addBulletPoint("sa asiste Clientul in procesul de negociere;");
    addBulletPoint("sa puna la dispozitie informatii relevante despre imobilele prezentate;");
    addBulletPoint("sa asiste la incheierea actelor juridice (antecontract, contract vanzare-cumparare).");

    // IV. OBLIGATIILE CLIENTULUI
    y += 3;
    addSectionTitle("IV. OBLIGATIILE CLIENTULUI");
    addBulletPoint("sa comunice Intermediarului criteriile exacte de cautare;");
    addBulletPoint("sa nu trateze direct cu proprietarii imobilelor prezentate de Intermediar;");
    addBulletPoint("sa confirme primirea informatiilor de la Intermediar prin semnarea unei scrisori de introducere;");
    addBulletPoint("sa comunice Intermediarului decizia de achizitie cu cel putin 24 de ore inainte;");
    addBulletPoint("sa achite Intermediarului comisionul conform punctului V.");

    // V. COMISIONUL
    y += 3;
    addSectionTitle("V. COMISIONUL");
    addParagraph(`1. Comisionul perceput de catre Intermediar este de ${formData.comision_procent}% din valoarea tranzactiei, fiind datorat de catre Client.`);
    addParagraph("2. Comisionul devine exigibil la momentul semnarii antecontractului sau contractului de vanzare-cumparare pentru un imobil prezentat de Intermediar.");
    addParagraph("3. Clientul va achita comisionul cel tarziu in ziua semnarii actului juridic.");

    // VI. DURATA
    y += 3;
    addSectionTitle("VI. DURATA CONTRACTULUI");
    addParagraph(`1. Prezentul contract intra in vigoare la data semnarii si este valabil pe o durata de ${formData.durata_luni} luni.`);
    addParagraph("2. Contractul poate fi prelungit prin acordul scris al partilor.");

    // VII. CLAUZE FINALE
    y += 3;
    addSectionTitle("VII. CLAUZE FINALE");
    addParagraph("1. Orice modificare a prezentului contract se face doar in scris, cu acordul ambelor parti.");
    addParagraph("2. Litigiile decurgand din prezentul contract vor fi solutionate pe cale amiabila, iar in caz de nereusita, de catre instantele judecatoresti competente.");
    addParagraph("3. Prezentul contract a fost incheiat in 2 exemplare originale, cate unul pentru fiecare parte.");

    // SEMNATURI
    if (y > 220) { doc.addPage(); y = 30; }
    y += 15;
    doc.setFont("helvetica", "bold");
    doc.text("INTERMEDIAR", margin, y);
    doc.text("CLIENT", pageWidth - margin - 30, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.text(replaceDiacritics(formData.prestator.denumire), margin, y);
    doc.text(replaceDiacritics(`${formData.client.prenume} ${formData.client.nume}`), pageWidth - margin - 60, y);
    y += 15;

    if (formData.semnatura_prestator) {
      try {
        doc.addImage(formData.semnatura_prestator, 'PNG', margin, y, 50, 25);
      } catch (e) {
        console.error('Error adding prestator signature:', e);
      }
    } else {
      doc.text("_______________", margin, y + 10);
    }

    if (formData.semnatura_client) {
      try {
        doc.addImage(formData.semnatura_client, 'PNG', pageWidth - margin - 50, y, 50, 25);
      } catch (e) {
        console.error('Error adding client signature:', e);
      }
    } else {
      doc.text("_______________", pageWidth - margin - 40, y + 10);
    }

    if (download) {
      const filename = `Contract_Intermediere_${formData.client.nume}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(filename);
      toast.success("Contract generat și descărcat cu succes!");
    }

    return doc;
  };

  const handleGeneratePDF = async () => {
    if (!formData.client.nume || !formData.client.prenume) {
      toast.error("Vă rugăm completați numele clientului");
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
    if (!formData.client.nume || !formData.client.prenume) {
      toast.error("Vă rugăm completați numele clientului");
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
    setUploadedImageClient(null);
    setExtractedDataClient(null);
    setEditingContractId(null);
    setFormData({
      numar_contract: "",
      data_contract: new Date().toISOString().split('T')[0],
      prestator: { ...defaultPrestator },
      client: { ...emptyClient },
      criterii: { ...emptySearchCriteria },
      comision_procent: "2",
      durata_luni: "3",
      semnatura_prestator: defaultAgentSignature,
      semnatura_client: "",
    });
    if (fileInputClientRef.current) fileInputClientRef.current.value = "";
    toast.success("Formular resetat");
  };

  const handleNewContract = () => {
    handleReset();
    setActiveTab("new");
  };

  const loadContractForEdit = (contract: any) => {
    setEditingContractId(contract.id);
    setFormData({
      numar_contract: "",
      data_contract: contract.contract_date || new Date().toISOString().split('T')[0],
      prestator: { ...defaultPrestator },
      client: {
        nume: contract.client_name || '',
        prenume: contract.client_prenume || '',
        cnp: contract.client_cnp || '',
        seria_ci: contract.client_seria_ci || '',
        numar_ci: contract.client_numar_ci || '',
        ci_emitent: contract.client_ci_emitent || '',
        ci_data_emiterii: contract.client_ci_data_emiterii || '',
        adresa: contract.client_adresa || '',
        telefon: '',
        email: '',
      },
      criterii: { ...emptySearchCriteria },
      comision_procent: contract.advance_percent || '2',
      durata_luni: contract.duration_months?.toString() || '3',
      semnatura_prestator: '',
      semnatura_client: '',
    });
    setActiveTab("new");
    toast.info("Contract încărcat pentru editare");
  };

  const getStatusBadge = (contract: any) => {
    if (contract.chirias_signed && contract.proprietar_signed) {
      return <Badge className="bg-green-500">Semnat</Badge>;
    }
    return <Badge variant="secondary">Draft</Badge>;
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Modern Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/10 shadow-lg shadow-orange-500/10">
            <Search className="h-6 w-6 text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Contract Intermediere
            </h1>
            <p className="text-sm text-muted-foreground">
              Generați contracte de intermediere pentru clienți căutători
            </p>
          </div>
        </div>
        {activeTab === "history" && (
          <Button onClick={handleNewContract} className="bg-gradient-to-r from-gold to-gold-light text-black hover:from-gold-light hover:to-gold">
            <Plus className="h-4 w-4 mr-2" />
            Contract Nou
          </Button>
        )}
      </motion.div>

      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-background/50 backdrop-blur-sm border border-border/50">
            <TabsTrigger value="new" className="flex items-center gap-2 data-[state=active]:bg-gold/20 data-[state=active]:text-gold">
              <FileText className="h-4 w-4" />
              {editingContractId ? "Editare" : "Contract Nou"}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2 data-[state=active]:bg-gold/20 data-[state=active]:text-gold">
              <History className="h-4 w-4" />
              Istoric ({savedContracts?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-6 mt-6">
            {/* Contract Number & Date */}
            <Card className="admin-glass-card border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4 text-gold" />
                  Date Contract
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <div className="space-y-1">
                  <Label className="text-xs">Durată (luni)</Label>
                  <Input
                    type="number"
                    value={formData.durata_luni}
                    onChange={(e) => setFormData(prev => ({ ...prev, durata_luni: e.target.value }))}
                    className="h-9"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload CI Client */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                CI Client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  uploadedImageClient ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
                onClick={() => fileInputClientRef.current?.click()}
              >
                <input
                  ref={fileInputClientRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                
                {isExtractingClient ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground text-sm">Se extrag datele cu AI...</p>
                  </div>
                ) : uploadedImageClient ? (
                  <div className="space-y-3">
                    <img 
                      src={uploadedImageClient} 
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

              {extractedDataClient && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-600 mb-1">
                    <Sparkles className="h-3 w-3" />
                    <span className="font-medium text-xs">Date extrase</span>
                  </div>
                  <div className="text-xs space-y-0.5 text-muted-foreground">
                    <p><strong>Nume:</strong> {extractedDataClient.prenume} {extractedDataClient.nume}</p>
                    <p><strong>CNP:</strong> {extractedDataClient.cnp}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client Data Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Date Client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nume *</Label>
                  <Input
                    value={formData.client.nume}
                    onChange={(e) => setFormData(prev => ({ ...prev, client: { ...prev.client, nume: e.target.value } }))}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Prenume *</Label>
                  <Input
                    value={formData.client.prenume}
                    onChange={(e) => setFormData(prev => ({ ...prev, client: { ...prev.client, prenume: e.target.value } }))}
                    className="h-9"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">CNP</Label>
                  <Input
                    value={formData.client.cnp}
                    onChange={(e) => setFormData(prev => ({ ...prev, client: { ...prev.client, cnp: e.target.value } }))}
                    className="h-9"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Seria CI</Label>
                    <Input
                      value={formData.client.seria_ci}
                      onChange={(e) => setFormData(prev => ({ ...prev, client: { ...prev.client, seria_ci: e.target.value } }))}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Număr CI</Label>
                    <Input
                      value={formData.client.numar_ci}
                      onChange={(e) => setFormData(prev => ({ ...prev, client: { ...prev.client, numar_ci: e.target.value } }))}
                      className="h-9"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Emitent CI</Label>
                  <Input
                    value={formData.client.ci_emitent}
                    onChange={(e) => setFormData(prev => ({ ...prev, client: { ...prev.client, ci_emitent: e.target.value } }))}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Data Emiterii CI</Label>
                  <Input
                    type="date"
                    value={formData.client.ci_data_emiterii}
                    onChange={(e) => setFormData(prev => ({ ...prev, client: { ...prev.client, ci_data_emiterii: e.target.value } }))}
                    className="h-9"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Adresa</Label>
                <Input
                  value={formData.client.adresa}
                  onChange={(e) => setFormData(prev => ({ ...prev, client: { ...prev.client, adresa: e.target.value } }))}
                  className="h-9"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Telefon</Label>
                  <Input
                    value={formData.client.telefon}
                    onChange={(e) => setFormData(prev => ({ ...prev, client: { ...prev.client, telefon: e.target.value } }))}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email</Label>
                  <Input
                    type="email"
                    value={formData.client.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, client: { ...prev.client, email: e.target.value } }))}
                    className="h-9"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Criteria */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Criterii Căutare
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Tip Imobil</Label>
                  <Select
                    value={formData.criterii.tip_imobil}
                    onValueChange={(value: SearchCriteria['tip_imobil']) => setFormData(prev => ({ ...prev, criterii: { ...prev.criterii, tip_imobil: value } }))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartament">Apartament</SelectItem>
                      <SelectItem value="casa">Casă</SelectItem>
                      <SelectItem value="teren">Teren</SelectItem>
                      <SelectItem value="comercial">Spațiu Comercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Zonă</Label>
                  <Input
                    value={formData.criterii.zona}
                    onChange={(e) => setFormData(prev => ({ ...prev, criterii: { ...prev.criterii, zona: e.target.value } }))}
                    placeholder="Ex: Sector 3, Titan"
                    className="h-9"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Suprafață Min (mp)</Label>
                  <Input
                    type="number"
                    value={formData.criterii.suprafata_min}
                    onChange={(e) => setFormData(prev => ({ ...prev, criterii: { ...prev.criterii, suprafata_min: e.target.value } }))}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Suprafață Max (mp)</Label>
                  <Input
                    type="number"
                    value={formData.criterii.suprafata_max}
                    onChange={(e) => setFormData(prev => ({ ...prev, criterii: { ...prev.criterii, suprafata_max: e.target.value } }))}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Camere Min</Label>
                  <Input
                    type="number"
                    value={formData.criterii.camere_min}
                    onChange={(e) => setFormData(prev => ({ ...prev, criterii: { ...prev.criterii, camere_min: e.target.value } }))}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Camere Max</Label>
                  <Input
                    type="number"
                    value={formData.criterii.camere_max}
                    onChange={(e) => setFormData(prev => ({ ...prev, criterii: { ...prev.criterii, camere_max: e.target.value } }))}
                    className="h-9"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Buget Min (EUR)</Label>
                  <Input
                    type="number"
                    value={formData.criterii.buget_min}
                    onChange={(e) => setFormData(prev => ({ ...prev, criterii: { ...prev.criterii, buget_min: e.target.value } }))}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Buget Max (EUR)</Label>
                  <Input
                    type="number"
                    value={formData.criterii.buget_max}
                    onChange={(e) => setFormData(prev => ({ ...prev, criterii: { ...prev.criterii, buget_max: e.target.value } }))}
                    className="h-9"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Alte cerințe</Label>
                <Input
                  value={formData.criterii.alte_cerinte}
                  onChange={(e) => setFormData(prev => ({ ...prev, criterii: { ...prev.criterii, alte_cerinte: e.target.value } }))}
                  placeholder="Ex: parcare, balcon, vedere panoramică"
                  className="h-9"
                />
              </div>
            </CardContent>
          </Card>

          {/* Commission */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Comision
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <Label className="text-xs">Comision (%)</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.comision_procent}
                  onChange={(e) => setFormData(prev => ({ ...prev, comision_procent: e.target.value }))}
                  className="h-9 w-32"
                />
              </div>
            </CardContent>
          </Card>

          {/* Signatures */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PenTool className="h-5 w-5" />
                  Semnătură Intermediar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SignaturePad
                  title="Semnătură Intermediar"
                  onSave={(signature) => setFormData(prev => ({ ...prev, semnatura_prestator: signature }))}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PenTool className="h-5 w-5" />
                  Semnătură Client
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SignaturePad
                  title="Semnătură Client"
                  onSave={(signature) => setFormData(prev => ({ ...prev, semnatura_client: signature }))}
                />
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handlePreview} variant="outline" disabled={isPreviewing}>
              {isPreviewing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
              Previzualizare
            </Button>
            <Button onClick={handleGeneratePDF} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              Descarcă PDF
            </Button>
            <Button onClick={handleSaveContract} variant="secondary" disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {editingContractId ? "Actualizează" : "Salvează"}
            </Button>
            <Button onClick={handleReset} variant="ghost">
              <Eraser className="h-4 w-4 mr-2" />
              Resetare
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Contracte Salvate</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingContracts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !savedContracts?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nu există contracte salvate</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Criterii</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Acțiuni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {savedContracts.map((contract) => (
                        <TableRow key={contract.id}>
                          <TableCell className="font-medium">
                            {contract.client_prenume} {contract.client_name}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {contract.property_address}
                          </TableCell>
                          <TableCell>
                            {contract.contract_date ? formatDateRomanian(contract.contract_date) : '-'}
                          </TableCell>
                          <TableCell>{getStatusBadge(contract)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEmailDialogData({
                                    contractId: contract.id,
                                    propertyAddress: contract.property_address || '',
                                    clientEmail: '',
                                    clientName: `${contract.client_prenume || ''} ${contract.client_name || ''}`.trim(),
                                  });
                                  setEmailDialogOpen(true);
                                }}
                                title="Trimite link semnare"
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => loadContractForEdit(contract)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => deleteContractMutation.mutate(contract.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </motion.div>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>Previzualizare Contract</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0">
            {isPreviewing ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : previewPdfUrl ? (
              <iframe
                src={previewPdfUrl}
                className="w-full h-full rounded-lg border"
                title="Preview PDF"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Signature Link Dialog */}
      {emailDialogData && (
        <SendSignatureLinkDialog
          open={emailDialogOpen}
          onOpenChange={setEmailDialogOpen}
          contractId={emailDialogData.contractId}
          contractType="intermediere"
          propertyAddress={emailDialogData.propertyAddress}
          parties={[
            { value: "client", label: "Client" },
            { value: "intermediar", label: "Intermediar" },
          ]}
          defaultEmail={emailDialogData.clientEmail}
          defaultName={emailDialogData.clientName}
        />
      )}
    </motion.div>
  );
};

export default IntermediationContractPage;

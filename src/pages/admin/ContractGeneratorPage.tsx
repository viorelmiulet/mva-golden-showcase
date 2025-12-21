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
import { Upload, FileText, Download, Loader2, Camera, Sparkles, User, Home, Calendar, History, Trash2, RefreshCw, Users, FileType, PenTool, FilePlus2, Mail, Send } from "lucide-react";
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
  
  const [uploadedImageProprietar, setUploadedImageProprietar] = useState<string | null>(null);
  const [uploadedImageChirias, setUploadedImageChirias] = useState<string | null>(null);
  const [extractedDataProprietar, setExtractedDataProprietar] = useState<ExtractedData | null>(null);
  const [extractedDataChirias, setExtractedDataChirias] = useState<ExtractedData | null>(null);
  
  const [contracts, setContracts] = useState<SavedContract[]>([]);
  const [isLoadingContracts, setIsLoadingContracts] = useState(true);
  
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

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    setIsLoadingContracts(true);
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('id, created_at, client_name, client_prenume, client_cnp, client_seria_ci, client_numar_ci, client_adresa, property_address, property_price, property_currency, contract_type, contract_date, duration_months, pdf_url, docx_url, proprietar_signed, chirias_signed')
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
        client_name: contractData.chirias.nume,
        client_prenume: contractData.chirias.prenume || null,
        client_cnp: contractData.chirias.cnp || null,
        client_seria_ci: contractData.chirias.seria_ci || null,
        client_numar_ci: contractData.chirias.numar_ci || null,
        client_adresa: contractData.chirias.adresa || null,
        property_address: contractData.proprietate_adresa,
        property_price: contractData.proprietate_pret ? parseFloat(contractData.proprietate_pret) : null,
        property_surface: contractData.garantie ? parseFloat(contractData.garantie) : null,
        property_currency: 'EUR',
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
      }

      await fetchContracts();
    } catch (error: any) {
      console.error('Error saving contract:', error);
      throw error;
    }
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

  const copySignatureLink = async (contractId: string, partyType: 'proprietar' | 'chirias') => {
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
          toast.error('Eroare la crearea linkului de semnătură');
          return;
        }
        data = newSig;
      }

      if (error || !data) {
        toast.error('Link-ul nu a fost găsit');
        return;
      }

      const signatureUrl = `${window.location.origin}/sign/${data.signature_token}`;
      await navigator.clipboard.writeText(signatureUrl);
      toast.success(`Link de semnătură ${partyType === 'proprietar' ? 'proprietar' : 'chiriaș'} copiat!`);
    } catch (error: any) {
      console.error('Error copying signature link:', error);
      toast.error('Eroare la copierea linkului');
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
      // Fetch signatures from database
      const { data: signatures, error: sigError } = await supabase
        .from('contract_signatures')
        .select('party_type, signature_data, signer_name')
        .eq('contract_id', contract.id);

      if (sigError) throw sigError;

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
      let y = 25;

      const addSection = (title: string) => {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(title, margin, y);
        y += 8;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
      };

      const addParagraph = (text: string) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
        doc.text(lines, margin, y);
        y += lines.length * 5 + 3;
      };

      const addBullet = (text: string) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        const lines = doc.splitTextToSize("- " + text, pageWidth - 2 * margin - 5);
        doc.text(lines, margin + 3, y);
        y += lines.length * 5 + 2;
      };

      const moneda = contract.property_currency || 'EUR';
      const garantieVal = contract.property_price?.toString() || '';
      const durataLuni = contract.duration_months?.toString() || '12';

      // TITLU
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("CONTRACT DE INCHIRIERE", pageWidth / 2, y, { align: "center" });
      y += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text("(Semnat electronic)", pageWidth / 2, y, { align: "center" });
      y += 12;

      doc.setFont("helvetica", "normal");
      doc.text(`Incheiat astazi, ${contract.contract_date} intre:`, margin, y);
      y += 10;

      // PARTI CONTRACTANTE
      doc.setFont("helvetica", "bold");
      doc.text("1. PROPRIETAR:", margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.text(`In calitate de proprietar al imobilului situat in ${contract.property_address}`, margin, y);
      y += 10;

      doc.setFont("helvetica", "bold");
      doc.text("2. CHIRIAS:", margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      const chiriasText = `${contract.client_prenume || ''} ${contract.client_name}${contract.client_cnp ? `, CNP ${contract.client_cnp}` : ''}${contract.client_seria_ci ? `, C.I seria ${contract.client_seria_ci}` : ''}${contract.client_numar_ci ? ` nr. ${contract.client_numar_ci}` : ''}, in calitate de chirias al imobilului situat in ${contract.property_address}.`;
      const chirLines = doc.splitTextToSize(chiriasText, pageWidth - 2 * margin);
      doc.text(chirLines, margin, y);
      y += chirLines.length * 5 + 10;

      // I. OBIECTUL CONTRACTULUI
      addSection("I. OBIECTUL CONTRACTULUI");
      addParagraph(`Proprietarul inchiriaza chiriasului imobilul situat in ${contract.property_address}`);
      y += 5;

      // II. DESTINATIA
      addSection("II. DESTINATIA");
      addParagraph("Imobilul va fi folosit de chirias cu destinatia LOCUINTA.");
      y += 5;

      // III. DURATA
      addSection("III. DURATA");
      addParagraph(`Acest contract este incheiat pentru o perioada de ${durataLuni} luni.`);
      y += 5;

      // IV. CHIRIA SI MODALITATI DE PLATA
      addSection("IV. CHIRIA SI MODALITATI DE PLATA");
      addParagraph(`Chiria lunara convenita este de ${contract.property_price || 'N/A'} ${moneda}/luna.`);
      addParagraph(`Garantia in valoare de ${garantieVal} ${moneda} se va plati la semnare.`);
      y += 5;

      // V. OBLIGATIILE SI DREPTURILE PROPRIETARULUI
      addSection("V. OBLIGATIILE SI DREPTURILE PROPRIETARULUI");
      doc.setFont("helvetica", "bold");
      doc.text("OBLIGATIILE PROPRIETARULUI:", margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      addBullet("proprietarul isi asuma raspunderea ca spatiul este liber;");
      addBullet("pune la dispozitia chiriasului imobilul in stare buna;");
      addBullet("achita toate taxele legale ale imobilului.");
      y += 5;

      // VI. OBLIGATIILE SI DREPTURILE CHIRIASULUI
      addSection("VI. OBLIGATIILE SI DREPTURILE CHIRIASULUI");
      doc.setFont("helvetica", "bold");
      doc.text("OBLIGATIILE CHIRIASULUI:", margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      addBullet("sa asigure exploatarea imobilului conform destinatiei;");
      addBullet("sa nu subinchirieze imobilul fara acordul scris al proprietarului;");
      addBullet("sa achite platile curente: electricitate, gaze, apa, intretinere.");
      y += 5;

      // VII. PREDAREA IMOBILULUI
      addSection("VII. PREDAREA IMOBILULUI");
      addParagraph("Dupa expirarea contractului chiriasul va preda imobilul proprietarului in starea in care l-a primit.");
      y += 5;

      // VIII. FORTA MAJORA
      addSection("VIII. FORTA MAJORA");
      addParagraph("Orice cauza neprevazuta si imposibil de evitat va fi considerata forta majora.");
      y += 5;

      // IX. CONDITIILE DE INCETARE A CONTRACTULUI
      addSection("IX. CONDITIILE DE INCETARE A CONTRACTULUI");
      addParagraph("1. la expirarea duratei pentru care a fost incheiat;");
      addParagraph("2. in situatia nerespectarii clauzelor contractuale;");
      addParagraph("3. prin denuntare unilaterala cu notificare prealabila de 30 de zile.");
      y += 15;

      // SEMNATURI
      if (y > 200) {
        doc.addPage();
        y = 30;
      }
      doc.setFont("helvetica", "bold");
      doc.text("PROPRIETAR", margin, y);
      doc.text("CHIRIAS", pageWidth - margin - 30, y);
      y += 8;
      doc.setFont("helvetica", "normal");
      doc.text("", margin, y);
      doc.text(`${contract.client_prenume || ''} ${contract.client_name}`, pageWidth - margin - 50, y);
      y += 8;
      
      // Add electronic signatures
      const signatureHeight = 25;
      const signatureWidth = 50;
      
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
                text: `Incheiat astazi, ${contractData.data_contract} intre:`,
                spacing: { after: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "1. PROPRIETAR: ", bold: true }),
                ],
              }),
              new Paragraph({
                text: `${contractData.proprietar.prenume} ${contractData.proprietar.nume}, cetatean ${contractData.proprietar.cetatenie}, identificat prin CNP ${contractData.proprietar.cnp}, C.I seria ${contractData.proprietar.seria_ci} nr. ${contractData.proprietar.numar_ci}${contractData.proprietar.ci_emitent && contractData.proprietar.ci_data_emiterii ? `, eliberat de ${contractData.proprietar.ci_emitent} la data de ${contractData.proprietar.ci_data_emiterii}` : ''}, in calitate de proprietar al imobilului situat in ${contractData.proprietate_adresa}`,
                spacing: { after: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "2. CHIRIAS: ", bold: true }),
                ],
              }),
              new Paragraph({
                text: `${contractData.chirias.prenume} ${contractData.chirias.nume}, cetatean ${contractData.chirias.cetatenie}, identificat prin CNP ${contractData.chirias.cnp}, C.I seria ${contractData.chirias.seria_ci} nr. ${contractData.chirias.numar_ci}${contractData.chirias.ci_emitent && contractData.chirias.ci_data_emiterii ? `, eliberat de ${contractData.chirias.ci_emitent} la data de ${contractData.chirias.ci_data_emiterii}` : ''}, in calitate de chirias al imobilului situat in ${contractData.proprietate_adresa}.`,
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
                text: `Acest contract este incheiat pentru o perioada de ${contractData.durata_inchiriere || "12"} luni, incepand cu data de ${contractData.data_incepere || contractData.data_contract}. Cu 30 de zile inaintea expirarii contractului, chiriasul va putea prelungi acest contract pentru aceeasi perioada sau pentru o perioada mai mica, numai cu acordul scris al proprietarului.`,
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
        // Generate PDF document
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        let y = 25;

        const addSection = (title: string) => {
          if (y > 260) {
            doc.addPage();
            y = 20;
          }
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text(title, margin, y);
          y += 8;
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
        };

        const addParagraph = (text: string) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
          doc.text(lines, margin, y);
          y += lines.length * 5 + 3;
        };

        const addBullet = (text: string) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          const lines = doc.splitTextToSize("- " + text, pageWidth - 2 * margin - 5);
          doc.text(lines, margin + 3, y);
          y += lines.length * 5 + 2;
        };

        // TITLU
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("CONTRACT DE INCHIRIERE", pageWidth / 2, y, { align: "center" });
        y += 12;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Incheiat astazi, ${contractData.data_contract} intre:`, margin, y);
        y += 10;

        // PARTI CONTRACTANTE
        doc.setFont("helvetica", "bold");
        doc.text("1. PROPRIETAR:", margin, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        const proprietarCiDetails = contractData.proprietar.ci_emitent && contractData.proprietar.ci_data_emiterii 
          ? `, eliberat de ${contractData.proprietar.ci_emitent} la data de ${contractData.proprietar.ci_data_emiterii}` 
          : '';
        const proprietarText = `${contractData.proprietar.prenume} ${contractData.proprietar.nume}, cetatean ${contractData.proprietar.cetatenie}, identificat prin CNP ${contractData.proprietar.cnp}, C.I seria ${contractData.proprietar.seria_ci} nr. ${contractData.proprietar.numar_ci}${proprietarCiDetails}, in calitate de proprietar al imobilului situat in ${contractData.proprietate_adresa}`;
        const propLines = doc.splitTextToSize(proprietarText, pageWidth - 2 * margin);
        doc.text(propLines, margin, y);
        y += propLines.length * 5 + 6;

        doc.setFont("helvetica", "bold");
        doc.text("2. CHIRIAS:", margin, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        const chiriasCiDetails = contractData.chirias.ci_emitent && contractData.chirias.ci_data_emiterii 
          ? `, eliberat de ${contractData.chirias.ci_emitent} la data de ${contractData.chirias.ci_data_emiterii}` 
          : '';
        const chiriasText = `${contractData.chirias.prenume} ${contractData.chirias.nume}, cetatean ${contractData.chirias.cetatenie}, identificat prin CNP ${contractData.chirias.cnp}, C.I seria ${contractData.chirias.seria_ci} nr. ${contractData.chirias.numar_ci}${chiriasCiDetails}, in calitate de chirias al imobilului situat in ${contractData.proprietate_adresa}.`;
        const chirLines = doc.splitTextToSize(chiriasText, pageWidth - 2 * margin);
        doc.text(chirLines, margin, y);
        y += chirLines.length * 5 + 10;

        // I. OBIECTUL CONTRACTULUI
        addSection("I. OBIECTUL CONTRACTULUI");
        addParagraph(`Proprietarul inchiriaza chiriasului imobilul format din ${camereText} situat in ${contractData.proprietate_adresa}`);
        y += 5;

        // II. DESTINATIA
        addSection("II. DESTINATIA");
        addParagraph("Imobilul va fi folosit de chirias cu destinatia LOCUINTA. Destinatia spatiului inchiriat nu poate fi schimbata.");
        y += 5;

        // III. DURATA
        addSection("III. DURATA");
        addParagraph(`Acest contract este incheiat pentru o perioada de ${contractData.durata_inchiriere || "12"} luni, incepand cu data de ${contractData.data_incepere || contractData.data_contract}. Cu 30 de zile inaintea expirarii contractului, chiriasul va putea prelungi acest contract pentru aceeasi perioada sau pentru o perioada mai mica, numai cu acordul scris al proprietarului.`);
        y += 5;

        // IV. CHIRIA SI MODALITATI DE PLATA
        addSection("IV. CHIRIA SI MODALITATI DE PLATA");
        addParagraph(`Chiria lunara convenita de comun acord este de ${contractData.proprietate_pret} ${moneda}/luna. Suma va fi achitata in numerar sau transfer bancar.`);
        
        addParagraph(`Garantia in valoare de ${garantieVal} ${moneda} se va plati la data semnarii contractului de inchiriere.`);
        addParagraph("Garantia se va restitui in termen de 30 de zile de la incetarea prezentului contract de inchiriere, retinandu-se cheltuielile curente care cad in sarcina chiriasului potrivit prezentului contract.");
        addParagraph("Neplata chiriei in termen de 5 zile constituie o incalcare a contractului, proprietarul avand dreptul in acest caz sa rezilieze contractul de inchiriere fara nici o alta formalitate.");
        y += 5;

        // V. OBLIGATIILE SI DREPTURILE PROPRIETARULUI
        addSection("V. OBLIGATIILE SI DREPTURILE PROPRIETARULUI");
        doc.setFont("helvetica", "bold");
        doc.text("1. OBLIGATIILE PROPRIETARULUI:", margin, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        addBullet("proprietarul isi asuma raspunderea ca spatiul este liber si va ramane astfel pe toata perioada contractului;");
        addBullet("pune la dispozitia chiriasului imobilul in stare buna, pentru a fi folosit conform destinatiei avute in vedere;");
        addBullet("achita toate taxele legale ale imobilului (impozit pe cladiri, venituri);");
        addBullet("sa suporte cheltuielile de reparatii pentru partile comune ale imobilului.");
        y += 3;

        doc.setFont("helvetica", "bold");
        doc.text("2. DREPTURILE PROPRIETARULUI:", margin, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        addBullet("sa viziteze imobilul cand doreste, cu anuntarea in prealabil a chiriasului si in prezenta acestuia;");
        addBullet("sa accepte sau sa respinga propunerile avansate de chirias de modificare a imobilului;");
        addBullet("sa verifice achitarea obligatiilor de plata curente ale chiriasului.");
        y += 5;

        // VI. OBLIGATIILE SI DREPTURILE CHIRIASULUI
        addSection("VI. OBLIGATIILE SI DREPTURILE CHIRIASULUI");
        doc.setFont("helvetica", "bold");
        doc.text("1. OBLIGATIILE CHIRIASULUI:", margin, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        addBullet("sa asigure exploatarea imobilului doar in conformitate cu destinatia avuta in vedere;");
        addBullet("sa nu subinchirieze imobilul, decat cu acordul scris al proprietarului;");
        addBullet("sa achite in termen legal platile curente: electricitate, gaze, gunoi, apa, intretinere;");
        addBullet("sa mentina in buna stare imobilul si bunurile din inventar;");
        addBullet("sa respecte normele de convietuire in conformitate cu regulamentul asociatiei de locatari;");
        addBullet("sa permita accesul proprietarului in imobilul inchiriat cel putin o data pe luna;");
        addBullet("sa predea spatiul in starea in care era la inceperea contractului.");
        y += 3;

        doc.setFont("helvetica", "bold");
        doc.text("2. DREPTURILE CHIRIASULUI:", margin, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        addBullet("sa utilizeze imobilul in exclusivitate pe perioada derularii contractului;");
        addBullet("sa faca imbunatatirile necesare fara sa modifice structura de rezistenta si doar cu acordul proprietarului.");
        y += 5;

        // VII. PREDAREA IMOBILULUI
        addSection("VII. PREDAREA IMOBILULUI");
        addParagraph("Dupa expirarea contractului chiriasul va preda imobilul proprietarului sau unui reprezentant autorizat al proprietarului, in starea in care l-a primit.");
        y += 5;

        // VIII. FORTA MAJORA
        addSection("VIII. FORTA MAJORA");
        addParagraph("Orice cauza neprevazuta si imposibil de evitat, independenta de vointa partilor, aparuta dupa semnarea prezentului si care impiedica executarea contractului, va fi considerata cauza de forta majora si va exonera de raspundere partea care o invoca.");
        addParagraph("Partea care invoca cauza de forta majora trebuie sa notifice acest lucru celeilalte parti in maxim 5 zile de la aparitie.");
        y += 5;

        // IX. CONDITIILE DE INCETARE A CONTRACTULUI
        addSection("IX. CONDITIILE DE INCETARE A CONTRACTULUI");
        addParagraph("1. la expirarea duratei pentru care a fost incheiat;");
        addParagraph("2. in situatia nerespectarii clauzelor contractuale de catre una din parti;");
        addParagraph("3. clauza fortei majore;");
        addParagraph("4. prin denuntare unilaterala de catre oricare dintre parti, cu o notificare prealabila de 30 de zile, cu pierderea garantiei in cazul in care denuntarea nu a fost facuta de catre chirias in termen de 30 de zile sau fara un motiv intemeiat.");
        y += 5;

        addParagraph("Incetarea prezentului contract nu va avea efect asupra obligatiilor deja scadente intre partile contractante.");
        y += 15;

        // SEMNATURI
        if (y > 250) {
          doc.addPage();
          y = 30;
        }
        doc.setFont("helvetica", "bold");
        doc.text("PROPRIETAR", margin, y);
        doc.text("CHIRIAS", pageWidth - margin - 30, y);
        y += 8;
        doc.setFont("helvetica", "normal");
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

      {/* Contract History */}
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
            <div className="overflow-x-auto">
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
                    <TableHead>Descarcă</TableHead>
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
                        <div className="flex gap-1">
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
                            className="h-7 text-xs"
                            onClick={() => copySignatureLink(contract.id, 'chirias')}
                            title="Copiază link semnare chiriaș"
                          >
                            <PenTool className="h-3 w-3 mr-1" />
                            Chir.
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {!contract.proprietar_signed && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-blue-500 hover:text-blue-600"
                              onClick={() => openEmailDialog(contract.id, 'proprietar', contract.property_address)}
                              title="Trimite email proprietar"
                            >
                              <Mail className="h-3 w-3" />
                            </Button>
                          )}
                          {!contract.chirias_signed && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-blue-500 hover:text-blue-600"
                              onClick={() => openEmailDialog(contract.id, 'chirias', contract.property_address)}
                              title="Trimite email chiriaș"
                            >
                              <Mail className="h-3 w-3" />
                            </Button>
                          )}
                          {contract.proprietar_signed && contract.chirias_signed && (
                            <span className="text-green-500 text-xs">✓</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
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
                              <FileText className="h-4 w-4" />
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
    </div>
  );
};

export default ContractGeneratorPage;

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { Upload, FileText, Download, Loader2, User, Home, Calendar, Sparkles, Mail, Handshake } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { adminApi } from "@/lib/adminApi";
import { replaceDiacritics } from "@/lib/utils";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
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

interface PersonData {
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

interface ComodatData {
  comodant: PersonData;
  comodatar: PersonData;
  proprietate_adresa: string;
  proprietate_tip: string;
  proprietate_suprafata: string;
  proprietate_camere: string;
  proprietate_caracteristici: string;
  data_contract: string;
  data_incepere: string;
  durata_luni: string;
  scop_folosinta: string;
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
  telefon: "",
  email: "",
};

const ComodatContractPage = () => {
  const [isExtractingComodant, setIsExtractingComodant] = useState(false);
  const [isExtractingComodatar, setIsExtractingComodatar] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [lastSavedContractId, setLastSavedContractId] = useState<string | null>(null);
  
  const [contractData, setContractData] = useState<ComodatData>({
    comodant: { ...emptyPerson },
    comodatar: { ...emptyPerson },
    proprietate_adresa: "",
    proprietate_tip: "apartament",
    proprietate_suprafata: "",
    proprietate_camere: "2",
    proprietate_caracteristici: "",
    data_contract: new Date().toISOString().split('T')[0],
    data_incepere: new Date().toISOString().split('T')[0],
    durata_luni: "12",
    scop_folosinta: "locuinta",
  });
  
  const fileInputComodantRef = useRef<HTMLInputElement>(null);
  const fileInputComodatarRef = useRef<HTMLInputElement>(null);

  const formatDateRomanian = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'd MMMM yyyy', { locale: ro });
    } catch {
      return dateStr;
    }
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'comodant' | 'comodatar'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Vă rugăm selectați o imagine");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      await extractDataFromImage(base64, type);
    };
    reader.readAsDataURL(file);
  };

  const extractDataFromImage = async (imageBase64: string, type: 'comodant' | 'comodatar') => {
    if (type === 'comodant') {
      setIsExtractingComodant(true);
    } else {
      setIsExtractingComodatar(true);
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

      const extracted = data.data;
      
      // Format address
      const formatAddress = (adresa: any) => {
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

      // Convert date format
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
        adresa: formatAddress(extracted.adresa),
        telefon: "",
        email: "",
      };

      setContractData(prev => ({
        ...prev,
        [type]: personData,
      }));

      toast.success(`Date ${type === 'comodant' ? 'comodant' : 'comodatar'} extrase cu succes!`);
    } catch (error: any) {
      console.error('Error extracting data:', error);
      toast.error(error.message || "Eroare la extragerea datelor");
    } finally {
      if (type === 'comodant') {
        setIsExtractingComodant(false);
      } else {
        setIsExtractingComodatar(false);
      }
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

      const { data: urlData } = supabase.storage
        .from('contracts')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading contract:', error);
      return null;
    }
  };

  const generateContract = async () => {
    if (!contractData.comodant.nume || !contractData.comodatar.nume) {
      toast.error("Vă rugăm completați datele comodantului și comodatarului");
      return;
    }

    if (!contractData.proprietate_adresa) {
      toast.error("Vă rugăm completați adresa proprietății");
      return;
    }

    setIsGenerating(true);
    
    try {
      const timestamp = Date.now();
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const textWidth = pageWidth - 2 * margin;
      let y = 25;

      // Helper functions
      const addSectionTitle = (title: string) => {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 51, 153);
        doc.text(title, margin, y);
        y += 8;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
      };

      const addParagraph = (text: string, indent: number = 8) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(replaceDiacritics(text), textWidth - indent);
        for (let i = 0; i < lines.length; i++) {
          doc.text(lines[i], margin + indent, y);
          y += 5;
        }
        y += 2;
      };

      const drawPartyBox = (title: string, data: PersonData) => {
        if (y > 200) { doc.addPage(); y = 20; }
        const boxStartY = y;
        const lineHeight = 6;
        const boxPadding = 5;
        const contentWidth = textWidth - 2 * boxPadding;
        
        const eliberatText = `Eliberat de: ${replaceDiacritics(data.ci_emitent)} la data de ${formatDateRomanian(data.ci_data_emiterii)}`;
        const eliberatLines = doc.splitTextToSize(eliberatText, contentWidth);
        const domiciliuText = `Domiciliu: ${replaceDiacritics(data.adresa)}`;
        const domiciliuLines = doc.splitTextToSize(domiciliuText, contentWidth);
        
        const boxHeight = boxPadding + (lineHeight + 2) +
          lineHeight * 3 +
          eliberatLines.length * 5 +
          domiciliuLines.length * 5 +
          lineHeight +
          boxPadding;
        
        doc.setLineWidth(0.5);
        doc.setDrawColor(0, 0, 0);
        doc.rect(margin, boxStartY, textWidth, boxHeight);
        
        y = boxStartY + boxPadding + 4;
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(replaceDiacritics(title), margin + boxPadding, y);
        y += lineHeight + 2;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        
        doc.text(`Nume: ${replaceDiacritics(data.prenume)} ${replaceDiacritics(data.nume)}`, margin + boxPadding, y);
        y += lineHeight;
        doc.text(`CNP: ${data.cnp}`, margin + boxPadding, y);
        y += lineHeight;
        doc.text(`C.I.: seria ${data.seria_ci} nr. ${data.numar_ci}`, margin + boxPadding, y);
        y += lineHeight;
        
        for (let i = 0; i < eliberatLines.length; i++) {
          doc.text(eliberatLines[i], margin + boxPadding, y);
          y += 5;
        }
        
        for (let i = 0; i < domiciliuLines.length; i++) {
          doc.text(domiciliuLines[i], margin + boxPadding, y);
          y += 5;
        }
        
        doc.text(`Cetatenie: Romana`, margin + boxPadding, y);
        
        y = boxStartY + boxHeight + 8;
      };

      // Title
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("CONTRACT DE COMODAT", pageWidth / 2, y, { align: "center" });
      y += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Incheiat astazi, ${formatDateRomanian(contractData.data_contract)} intre:`, pageWidth / 2, y, { align: "center" });
      y += 12;

      // Parties
      drawPartyBox("1. COMODANT (Proprietar):", contractData.comodant);
      drawPartyBox("2. COMODATAR (Beneficiar):", contractData.comodatar);

      // Object
      addSectionTitle("Art. 1. OBIECTUL CONTRACTULUI");
      const tipProp = contractData.proprietate_tip === 'apartament' ? 'apartamentul' : 
                      contractData.proprietate_tip === 'casa' ? 'casa' : 'imobilul';
      addParagraph(`Comodantul da in folosinta gratuita comodatarului ${tipProp} situat la adresa: ${contractData.proprietate_adresa}.`);
      
      if (contractData.proprietate_suprafata) {
        addParagraph(`Suprafata utila: ${contractData.proprietate_suprafata} mp.`);
      }
      if (contractData.proprietate_camere) {
        addParagraph(`Numar camere: ${contractData.proprietate_camere}.`);
      }
      if (contractData.proprietate_caracteristici) {
        addParagraph(`Caracteristici: ${contractData.proprietate_caracteristici}.`);
      }

      // Purpose
      addSectionTitle("Art. 2. SCOPUL FOLOSINTEI");
      const scopText = contractData.scop_folosinta === 'locuinta' ? 'locuinta' :
                       contractData.scop_folosinta === 'sediu_social' ? 'sediu social al unei societati comerciale' :
                       contractData.scop_folosinta === 'birou' ? 'spatiu de birou' : contractData.scop_folosinta;
      addParagraph(`Imobilul va fi folosit exclusiv ca ${scopText}.`);
      addParagraph(`Comodatarul nu poate schimba destinatia imobilului fara acordul scris al comodantului.`);

      // Duration
      addSectionTitle("Art. 3. DURATA CONTRACTULUI");
      addParagraph(`Prezentul contract se incheie pe o perioada de ${contractData.durata_luni} luni, incepand cu data de ${formatDateRomanian(contractData.data_incepere)}.`);
      addParagraph(`La expirarea termenului, contractul poate fi prelungit prin acordul scris al partilor.`);

      // Comodant obligations
      addSectionTitle("Art. 4. OBLIGATIILE COMODANTULUI");
      addParagraph(`a) Sa predea imobilul in stare corespunzatoare folosintei pentru care a fost imprumutat.`);
      addParagraph(`b) Sa nu impiedice folosinta imobilului pe durata contractului.`);
      addParagraph(`c) Sa garanteze comodatarului ca imobilul nu prezinta vicii care ar putea periclita folosinta.`);

      // Comodatar obligations
      addSectionTitle("Art. 5. OBLIGATIILE COMODATARULUI");
      addParagraph(`a) Sa foloseasca imobilul cu prudenta si diligenta, conform destinatiei stabilite.`);
      addParagraph(`b) Sa suporte cheltuielile de intretinere curenta si utilitatile consumate.`);
      addParagraph(`c) Sa nu cedeze folosinta imobilului unei terte persoane fara acordul comodantului.`);
      addParagraph(`d) Sa restituie imobilul la expirarea contractului in starea in care l-a primit.`);
      addParagraph(`e) Sa permita comodantului verificarea starii imobilului cu preaviz de 24 ore.`);

      // Termination
      addSectionTitle("Art. 6. INCETAREA CONTRACTULUI");
      addParagraph(`Contractul inceteaza in urmatoarele situatii:`);
      addParagraph(`a) La expirarea termenului prevazut.`);
      addParagraph(`b) Prin acordul scris al partilor.`);
      addParagraph(`c) Prin denuntare unilaterala cu preaviz de 30 de zile.`);
      addParagraph(`d) In caz de nerespectare a obligatiilor contractuale.`);

      // Final provisions
      addSectionTitle("Art. 7. DISPOZITII FINALE");
      addParagraph(`Prezentul contract reprezinta vointa partilor si se completeaza cu dispozitiile Codului Civil privind contractul de comodat (art. 2146-2157).`);
      addParagraph(`Orice modificare se face prin act aditional semnat de ambele parti.`);
      addParagraph(`Prezentul contract a fost incheiat in 2 exemplare originale, cate unul pentru fiecare parte.`);

      // Signatures
      y += 15;
      if (y > 240) { doc.addPage(); y = 30; }
      
      doc.setFont("helvetica", "bold");
      doc.text("COMODANT", margin + 20, y);
      doc.text("COMODATAR", pageWidth - margin - 50, y);
      y += 8;
      
      doc.setFont("helvetica", "normal");
      doc.text(replaceDiacritics(`${contractData.comodant.prenume} ${contractData.comodant.nume}`), margin + 20, y);
      doc.text(replaceDiacritics(`${contractData.comodatar.prenume} ${contractData.comodatar.nume}`), pageWidth - margin - 50, y);
      y += 20;
      
      doc.text("_____________________", margin + 5, y);
      doc.text("_____________________", pageWidth - margin - 65, y);

      // Save PDF
      const pdfFileName = `contract_comodat_${contractData.comodatar.nume}_${timestamp}.pdf`;
      const pdfBlob = doc.output('blob');
      const pdfUrl = await uploadContractFile(pdfBlob, pdfFileName);
      
      // Save to database using admin API
      const result = await adminApi.insert('comodat_contracts', {
        comodant_name: contractData.comodant.nume,
        comodant_prenume: contractData.comodant.prenume,
        comodant_cnp: contractData.comodant.cnp,
        comodant_seria_ci: contractData.comodant.seria_ci,
        comodant_numar_ci: contractData.comodant.numar_ci,
        comodant_ci_emitent: contractData.comodant.ci_emitent,
        comodant_ci_data_emiterii: contractData.comodant.ci_data_emiterii || null,
        comodant_adresa: contractData.comodant.adresa,
        comodant_phone: contractData.comodant.telefon,
        comodant_email: contractData.comodant.email,
        comodatar_name: contractData.comodatar.nume,
        comodatar_prenume: contractData.comodatar.prenume,
        comodatar_cnp: contractData.comodatar.cnp,
        comodatar_seria_ci: contractData.comodatar.seria_ci,
        comodatar_numar_ci: contractData.comodatar.numar_ci,
        comodatar_ci_emitent: contractData.comodatar.ci_emitent,
        comodatar_ci_data_emiterii: contractData.comodatar.ci_data_emiterii || null,
        comodatar_adresa: contractData.comodatar.adresa,
        comodatar_phone: contractData.comodatar.telefon,
        comodatar_email: contractData.comodatar.email,
        property_address: contractData.proprietate_adresa,
        property_type: contractData.proprietate_tip,
        property_surface: contractData.proprietate_suprafata ? parseFloat(contractData.proprietate_suprafata) : null,
        property_rooms: contractData.proprietate_camere ? parseInt(contractData.proprietate_camere) : null,
        property_features: contractData.proprietate_caracteristici,
        contract_date: contractData.data_contract,
        start_date: contractData.data_incepere,
        duration_months: parseInt(contractData.durata_luni),
        purpose: contractData.scop_folosinta,
        pdf_url: pdfUrl,
        status: 'generated',
      });

      if (!result.success) throw new Error(result.error);
      const insertedContract = result.data?.[0] as any;

      // Save the contract ID for email sending
      if (insertedContract) {
        setLastSavedContractId(insertedContract.id);
      }

      // Download PDF
      doc.save(pdfFileName);
      
      toast.success("Contract de comodat generat cu succes!");
    } catch (error: any) {
      console.error('Error generating contract:', error);
      toast.error("Eroare la generarea contractului");
    } finally {
      setIsGenerating(false);
    }
  };

  const PersonForm = ({ 
    title, 
    data, 
    onChange, 
    onUpload, 
    isExtracting,
    fileInputRef,
    icon: Icon
  }: { 
    title: string;
    data: PersonData;
    onChange: (field: keyof PersonData, value: string) => void;
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isExtracting: boolean;
    fileInputRef: React.RefObject<HTMLInputElement>;
    icon: typeof User;
  }) => (
    <Card className="border-border/50 bg-card/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className="h-4 w-4 text-gold" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={onUpload}
          />
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => fileInputRef.current?.click()}
            disabled={isExtracting}
          >
            {isExtracting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Scanează CI
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isExtracting}
          >
            <Sparkles className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Nume</Label>
            <Input
              value={data.nume}
              onChange={(e) => onChange('nume', e.target.value)}
              placeholder="Nume"
            />
          </div>
          <div>
            <Label className="text-xs">Prenume</Label>
            <Input
              value={data.prenume}
              onChange={(e) => onChange('prenume', e.target.value)}
              placeholder="Prenume"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs">CNP</Label>
          <Input
            value={data.cnp}
            onChange={(e) => onChange('cnp', e.target.value)}
            placeholder="CNP"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Seria CI</Label>
            <Input
              value={data.seria_ci}
              onChange={(e) => onChange('seria_ci', e.target.value)}
              placeholder="Seria"
            />
          </div>
          <div>
            <Label className="text-xs">Număr CI</Label>
            <Input
              value={data.numar_ci}
              onChange={(e) => onChange('numar_ci', e.target.value)}
              placeholder="Număr"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Emitent</Label>
            <Input
              value={data.ci_emitent}
              onChange={(e) => onChange('ci_emitent', e.target.value)}
              placeholder="SPCLEP"
            />
          </div>
          <div>
            <Label className="text-xs">Data emiterii</Label>
            <Input
              type="date"
              value={data.ci_data_emiterii}
              onChange={(e) => onChange('ci_data_emiterii', e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label className="text-xs">Adresa</Label>
          <Textarea
            value={data.adresa}
            onChange={(e) => onChange('adresa', e.target.value)}
            placeholder="Adresa completă"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Telefon</Label>
            <Input
              value={data.telefon}
              onChange={(e) => onChange('telefon', e.target.value)}
              placeholder="+40..."
            />
          </div>
          <div>
            <Label className="text-xs">Email</Label>
            <Input
              type="email"
              value={data.email}
              onChange={(e) => onChange('email', e.target.value)}
              placeholder="email@..."
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Modern Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/10 shadow-lg shadow-emerald-500/10">
          <Handshake className="h-6 w-6 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Contract de Comodat
          </h1>
          <p className="text-sm text-muted-foreground">
            Generează un contract de comodat (împrumut de folosință gratuită)
          </p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PersonForm
          title="Comodant (Proprietar)"
          data={contractData.comodant}
          onChange={(field, value) => setContractData(prev => ({
            ...prev,
            comodant: { ...prev.comodant, [field]: value }
          }))}
          onUpload={(e) => handleImageUpload(e, 'comodant')}
          isExtracting={isExtractingComodant}
          fileInputRef={fileInputComodantRef}
          icon={User}
        />

        <PersonForm
          title="Comodatar (Beneficiar)"
          data={contractData.comodatar}
          onChange={(field, value) => setContractData(prev => ({
            ...prev,
            comodatar: { ...prev.comodatar, [field]: value }
          }))}
          onUpload={(e) => handleImageUpload(e, 'comodatar')}
          isExtracting={isExtractingComodatar}
          fileInputRef={fileInputComodatarRef}
          icon={User}
        />
      </motion.div>

      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Home className="h-4 w-4 text-gold" />
            Detalii Proprietate
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Adresa proprietății *</Label>
            <Textarea
              value={contractData.proprietate_adresa}
              onChange={(e) => setContractData(prev => ({ ...prev, proprietate_adresa: e.target.value }))}
              placeholder="Adresa completă a imobilului"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Tip proprietate</Label>
              <Select
                value={contractData.proprietate_tip}
                onValueChange={(value) => setContractData(prev => ({ ...prev, proprietate_tip: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartament">Apartament</SelectItem>
                  <SelectItem value="casa">Casă</SelectItem>
                  <SelectItem value="spatiu_comercial">Spațiu comercial</SelectItem>
                  <SelectItem value="teren">Teren</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Suprafață (mp)</Label>
              <Input
                type="number"
                value={contractData.proprietate_suprafata}
                onChange={(e) => setContractData(prev => ({ ...prev, proprietate_suprafata: e.target.value }))}
                placeholder="50"
              />
            </div>

            <div>
              <Label>Camere</Label>
              <Input
                type="number"
                value={contractData.proprietate_camere}
                onChange={(e) => setContractData(prev => ({ ...prev, proprietate_camere: e.target.value }))}
                placeholder="2"
              />
            </div>

            <div>
              <Label>Scop folosință</Label>
              <Select
                value={contractData.scop_folosinta}
                onValueChange={(value) => setContractData(prev => ({ ...prev, scop_folosinta: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="locuinta">Locuință</SelectItem>
                  <SelectItem value="sediu_social">Sediu social</SelectItem>
                  <SelectItem value="birou">Birou</SelectItem>
                  <SelectItem value="depozitare">Depozitare</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Caracteristici suplimentare</Label>
            <Textarea
              value={contractData.proprietate_caracteristici}
              onChange={(e) => setContractData(prev => ({ ...prev, proprietate_caracteristici: e.target.value }))}
              placeholder="Mobilat, utilat, parcare, etc."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gold" />
            Detalii Contract
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Data contract</Label>
              <Input
                type="date"
                value={contractData.data_contract}
                onChange={(e) => setContractData(prev => ({ ...prev, data_contract: e.target.value }))}
              />
            </div>

            <div>
              <Label>Data începere</Label>
              <Input
                type="date"
                value={contractData.data_incepere}
                onChange={(e) => setContractData(prev => ({ ...prev, data_incepere: e.target.value }))}
              />
            </div>

            <div>
              <Label>Durată (luni)</Label>
              <Select
                value={contractData.durata_luni}
                onValueChange={(value) => setContractData(prev => ({ ...prev, durata_luni: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 luni</SelectItem>
                  <SelectItem value="12">12 luni</SelectItem>
                  <SelectItem value="24">24 luni</SelectItem>
                  <SelectItem value="36">36 luni</SelectItem>
                  <SelectItem value="60">60 luni</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          onClick={generateContract}
          disabled={isGenerating}
          className="flex-1"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Se generează...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Generează Contract Comodat
            </>
          )}
        </Button>
        
        {lastSavedContractId && (
          <Button
            variant="outline"
            size="lg"
            onClick={() => setEmailDialogOpen(true)}
          >
            <Mail className="h-4 w-4 mr-2" />
            Trimite Link Semnare
          </Button>
        )}
      </div>

      {/* Send Signature Link Dialog */}
      {lastSavedContractId && (
        <SendSignatureLinkDialog
          open={emailDialogOpen}
          onOpenChange={setEmailDialogOpen}
          contractId={lastSavedContractId}
          contractType="comodat"
          propertyAddress={contractData.proprietate_adresa}
          parties={[
            { value: "comodant", label: "Comodant" },
            { value: "comodatar", label: "Comodatar" },
          ]}
          defaultEmail={contractData.comodatar.email}
          defaultName={`${contractData.comodatar.prenume} ${contractData.comodatar.nume}`.trim()}
        />
      )}
    </motion.div>
  );
};

export default ComodatContractPage;

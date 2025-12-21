import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, FileText, Download, Loader2, Camera, Sparkles, User, Home, Calendar, History, Trash2, RefreshCw, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

interface ExtractedData {
  nume: string;
  prenume: string;
  cnp: string;
  seria: string;
  numar: string;
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
  adresa: string;
}

interface ContractData {
  proprietar: PersonData;
  chirias: PersonData;
  proprietate_adresa: string;
  proprietate_pret: string;
  garantie: string;
  data_contract: string;
  durata_inchiriere: string;
}

interface SavedContract {
  id: string;
  created_at: string;
  client_name: string;
  client_prenume: string | null;
  property_address: string;
  property_price: number | null;
  contract_type: string;
  contract_date: string;
}

const emptyPerson: PersonData = {
  nume: "",
  prenume: "",
  cnp: "",
  seria_ci: "",
  numar_ci: "",
  adresa: "",
};

const ContractGeneratorPage = () => {
  const [isExtractingProprietar, setIsExtractingProprietar] = useState(false);
  const [isExtractingChirias, setIsExtractingChirias] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
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
    data_contract: new Date().toISOString().split('T')[0],
    durata_inchiriere: "12",
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
        .select('id, created_at, client_name, client_prenume, property_address, property_price, contract_type, contract_date')
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

      const personData: PersonData = {
        nume: extracted.nume || "",
        prenume: extracted.prenume || "",
        cnp: extracted.cnp || "",
        seria_ci: extracted.seria || "",
        numar_ci: extracted.numar || "",
        adresa: fullAddress,
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

  const saveContractToDatabase = async () => {
    try {
      const { error } = await supabase.from('contracts').insert({
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
      });

      if (error) throw error;
      await fetchContracts();
    } catch (error: any) {
      console.error('Error saving contract:', error);
      throw error;
    }
  };

  const generateContract = async () => {
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
      const proprietarText = `${contractData.proprietar.prenume} ${contractData.proprietar.nume}, identificat prin CNP ${contractData.proprietar.cnp}, C.I seria ${contractData.proprietar.seria_ci} nr. ${contractData.proprietar.numar_ci}, in calitate de proprietar al imobilului situat in ${contractData.proprietate_adresa}`;
      const propLines = doc.splitTextToSize(proprietarText, pageWidth - 2 * margin);
      doc.text(propLines, margin, y);
      y += propLines.length * 5 + 6;

      doc.setFont("helvetica", "bold");
      doc.text("2. CHIRIAS:", margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      const chiriasText = `${contractData.chirias.prenume} ${contractData.chirias.nume}, identificat prin CNP ${contractData.chirias.cnp}, C.I seria ${contractData.chirias.seria_ci} nr. ${contractData.chirias.numar_ci}, in calitate de chirias al imobilului situat in ${contractData.proprietate_adresa}.`;
      const chirLines = doc.splitTextToSize(chiriasText, pageWidth - 2 * margin);
      doc.text(chirLines, margin, y);
      y += chirLines.length * 5 + 10;

      // I. OBIECTUL CONTRACTULUI
      addSection("I. OBIECTUL CONTRACTULUI");
      addParagraph(`Proprietarul inchiriaza chiriasului imobilul situat in ${contractData.proprietate_adresa}`);
      y += 5;

      // II. DESTINATIA
      addSection("II. DESTINATIA");
      addParagraph("Imobilul va fi folosit de chirias cu destinatia LOCUINTA. Destinatia spatiului inchiriat nu poate fi schimbata.");
      y += 5;

      // III. DURATA
      addSection("III. DURATA");
      addParagraph(`Acest contract este incheiat pentru o perioada de ${contractData.durata_inchiriere || "12"} luni, incepand cu data de ${contractData.data_contract}. Cu 30 de zile inaintea expirarii contractului, chiriasul va putea prelungi acest contract pentru aceeasi perioada sau pentru o perioada mai mica, numai cu acordul scris al proprietarului.`);
      y += 5;

      // IV. CHIRIA SI MODALITATI DE PLATA
      addSection("IV. CHIRIA SI MODALITATI DE PLATA");
      addParagraph(`Chiria lunara convenita de comun acord este de ${contractData.proprietate_pret} EUR/luna. Suma va fi achitata in numerar sau transfer bancar.`);
      
      const garantieVal = contractData.garantie || contractData.proprietate_pret;
      addParagraph(`Garantia in valoare de ${garantieVal} EUR se va plati in termen de 10 zile lucratoare de la data semnarii contractului de inchiriere.`);
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
      y += 15;
      doc.text("_____________________", margin, y);
      doc.text("_____________________", pageWidth - margin - 50, y);

      const fileName = `contract_inchiriere_${contractData.chirias.nume}_${contractData.chirias.prenume}_${Date.now()}.pdf`;
      doc.save(fileName);
      
      await saveContractToDatabase();
      
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
      data_contract: new Date().toISOString().split('T')[0],
      durata_inchiriere: "12",
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Chirie lunară (EUR)</Label>
                <Input
                  type="number"
                  value={contractData.proprietate_pret}
                  onChange={(e) => setContractData(prev => ({ ...prev, proprietate_pret: e.target.value }))}
                  placeholder="500"
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Garanție (EUR)</Label>
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
            <div className="space-y-1">
              <Label className="text-xs">Data Contract</Label>
              <Input
                type="date"
                value={contractData.data_contract}
                onChange={(e) => setContractData(prev => ({ ...prev, data_contract: e.target.value }))}
                className="h-9"
              />
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
                onClick={generateContract}
                disabled={isGenerating}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isSaving ? "Salvare..." : "Generare..."}
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Generează PDF
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
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
                    <TableHead>Tip</TableHead>
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
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Închiriere</Badge>
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
    </div>
  );
};

export default ContractGeneratorPage;

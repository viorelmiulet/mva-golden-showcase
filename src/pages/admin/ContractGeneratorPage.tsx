import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, FileText, Download, Loader2, Camera, Sparkles, User, Home, Calendar, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";

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

interface ContractData {
  // Date client
  nume: string;
  prenume: string;
  cnp: string;
  seria_ci: string;
  numar_ci: string;
  adresa: string;
  
  // Date proprietate
  proprietate_adresa: string;
  proprietate_pret: string;
  proprietate_suprafata: string;
  
  // Date contract
  tip_contract: "vanzare-cumparare" | "inchiriere" | "precontract";
  data_contract: string;
  durata_inchiriere?: string;
  avans?: string;
}

const ContractGeneratorPage = () => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [contractData, setContractData] = useState<ContractData>({
    nume: "",
    prenume: "",
    cnp: "",
    seria_ci: "",
    numar_ci: "",
    adresa: "",
    proprietate_adresa: "",
    proprietate_pret: "",
    proprietate_suprafata: "",
    tip_contract: "vanzare-cumparare",
    data_contract: new Date().toISOString().split('T')[0],
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setUploadedImage(base64);
      await extractDataFromImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const extractDataFromImage = async (imageBase64: string) => {
    setIsExtracting(true);
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
      setExtractedData(extracted);
      
      // Populate contract data
      const fullAddress = [
        extracted.adresa?.strada ? `Str. ${extracted.adresa.strada}` : '',
        extracted.adresa?.numar ? `Nr. ${extracted.adresa.numar}` : '',
        extracted.adresa?.bloc ? `Bl. ${extracted.adresa.bloc}` : '',
        extracted.adresa?.scara ? `Sc. ${extracted.adresa.scara}` : '',
        extracted.adresa?.etaj ? `Et. ${extracted.adresa.etaj}` : '',
        extracted.adresa?.apartament ? `Ap. ${extracted.adresa.apartament}` : '',
        extracted.adresa?.localitate,
        extracted.adresa?.judet ? `Jud. ${extracted.adresa.judet}` : '',
      ].filter(Boolean).join(', ');

      setContractData(prev => ({
        ...prev,
        nume: extracted.nume || "",
        prenume: extracted.prenume || "",
        cnp: extracted.cnp || "",
        seria_ci: extracted.seria || "",
        numar_ci: extracted.numar || "",
        adresa: fullAddress,
      }));

      toast.success("Date extrase cu succes!");
    } catch (error: any) {
      console.error('Error extracting data:', error);
      toast.error(error.message || "Eroare la extragerea datelor");
    } finally {
      setIsExtracting(false);
    }
  };

  const generateContract = () => {
    setIsGenerating(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let y = 20;

      // Title
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      
      let title = "";
      switch (contractData.tip_contract) {
        case "vanzare-cumparare":
          title = "CONTRACT DE VÂNZARE-CUMPĂRARE";
          break;
        case "inchiriere":
          title = "CONTRACT DE ÎNCHIRIERE";
          break;
        case "precontract":
          title = "PRECONTRACT DE VÂNZARE-CUMPĂRARE";
          break;
      }
      
      doc.text(title, pageWidth / 2, y, { align: "center" });
      y += 15;

      // Contract number and date
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Nr. _______ din ${contractData.data_contract}`, pageWidth / 2, y, { align: "center" });
      y += 20;

      // Parties section
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("I. PĂRȚILE CONTRACTANTE", margin, y);
      y += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      const buyerText = `1. ${contractData.prenume} ${contractData.nume}, CNP ${contractData.cnp}, ` +
        `legitimat/ă cu C.I. seria ${contractData.seria_ci} nr. ${contractData.numar_ci}, ` +
        `domiciliat/ă în ${contractData.adresa}, ` +
        `în calitate de ${contractData.tip_contract === "inchiriere" ? "CHIRIAȘ" : "CUMPĂRĂTOR"}`;
      
      const lines = doc.splitTextToSize(buyerText, pageWidth - 2 * margin);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 10;

      doc.text("2. _________________________________, în calitate de " + 
        (contractData.tip_contract === "inchiriere" ? "PROPRIETAR" : "VÂNZĂTOR"), margin, y);
      y += 15;

      // Object section
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("II. OBIECTUL CONTRACTULUI", margin, y);
      y += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      let objectText = "";
      if (contractData.tip_contract === "inchiriere") {
        objectText = `Proprietarul închiriază, iar chiriașul ia în chirie imobilul situat în ${contractData.proprietate_adresa}, ` +
          `cu o suprafață de ${contractData.proprietate_suprafata} mp.`;
      } else {
        objectText = `Vânzătorul vinde, iar cumpărătorul cumpără imobilul situat în ${contractData.proprietate_adresa}, ` +
          `cu o suprafață de ${contractData.proprietate_suprafata} mp.`;
      }
      
      const objectLines = doc.splitTextToSize(objectText, pageWidth - 2 * margin);
      doc.text(objectLines, margin, y);
      y += objectLines.length * 5 + 15;

      // Price section
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("III. PREȚUL ȘI MODALITATEA DE PLATĂ", margin, y);
      y += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      let priceText = "";
      if (contractData.tip_contract === "inchiriere") {
        priceText = `Chiria lunară este de ${contractData.proprietate_pret} EUR, plătibilă până în data de 5 a fiecărei luni. ` +
          `Durata contractului este de ${contractData.durata_inchiriere || "12"} luni.`;
      } else if (contractData.tip_contract === "precontract") {
        priceText = `Prețul total al imobilului este de ${contractData.proprietate_pret} EUR. ` +
          `La semnarea prezentului precontract, cumpărătorul achită un avans de ${contractData.avans || "10%"} din prețul total.`;
      } else {
        priceText = `Prețul total al imobilului este de ${contractData.proprietate_pret} EUR, ` +
          `achitat integral la data semnării contractului în formă autentică.`;
      }
      
      const priceLines = doc.splitTextToSize(priceText, pageWidth - 2 * margin);
      doc.text(priceLines, margin, y);
      y += priceLines.length * 5 + 15;

      // Obligations section
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("IV. OBLIGAȚIILE PĂRȚILOR", margin, y);
      y += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      if (contractData.tip_contract === "inchiriere") {
        doc.text("Proprietarul se obligă să predea imobilul în stare corespunzătoare de folosință.", margin, y);
        y += 7;
        doc.text("Chiriașul se obligă să folosească imobilul ca un bun proprietar și să plătească chiria la termen.", margin, y);
      } else {
        doc.text("Vânzătorul garantează că imobilul este liber de orice sarcini.", margin, y);
        y += 7;
        doc.text("Cumpărătorul se obligă să achite integral prețul stabilit.", margin, y);
      }
      y += 20;

      // Final provisions
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("V. DISPOZIȚII FINALE", margin, y);
      y += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Prezentul contract s-a încheiat în 2 (două) exemplare, câte unul pentru fiecare parte.", margin, y);
      y += 30;

      // Signatures
      doc.text("VÂNZĂTOR/PROPRIETAR", margin, y);
      doc.text("CUMPĂRĂTOR/CHIRIAȘ", pageWidth - margin - 50, y);
      y += 15;
      doc.text("_____________________", margin, y);
      doc.text("_____________________", pageWidth - margin - 50, y);

      // Save PDF
      const fileName = `contract_${contractData.tip_contract}_${contractData.nume}_${contractData.prenume}_${Date.now()}.pdf`;
      doc.save(fileName);
      
      toast.success("Contract generat cu succes!");
    } catch (error: any) {
      console.error('Error generating contract:', error);
      toast.error("Eroare la generarea contractului");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setUploadedImage(null);
    setExtractedData(null);
    setContractData({
      nume: "",
      prenume: "",
      cnp: "",
      seria_ci: "",
      numar_ci: "",
      adresa: "",
      proprietate_adresa: "",
      proprietate_pret: "",
      proprietate_suprafata: "",
      tip_contract: "vanzare-cumparare",
      data_contract: new Date().toISOString().split('T')[0],
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Generator Contracte
        </h1>
        <p className="text-muted-foreground">
          Generați contracte automat pe baza fotografiei actului de identitate
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Scanare Act de Identitate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                uploadedImage ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              {isExtracting ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-muted-foreground">Se extrag datele cu AI...</p>
                </div>
              ) : uploadedImage ? (
                <div className="space-y-4">
                  <img 
                    src={uploadedImage} 
                    alt="CI Uploaded" 
                    className="max-h-48 mx-auto rounded-lg shadow-md"
                  />
                  <p className="text-sm text-muted-foreground">Click pentru a schimba imaginea</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Încărcați fotografia CI</p>
                    <p className="text-sm text-muted-foreground">JPG, PNG, WEBP - Max 10MB</p>
                  </div>
                </div>
              )}
            </div>

            {extractedData && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <Sparkles className="h-4 w-4" />
                  <span className="font-medium">Date extrase cu succes</span>
                </div>
                <div className="text-sm space-y-1 text-muted-foreground">
                  <p><strong>Nume:</strong> {extractedData.prenume} {extractedData.nume}</p>
                  <p><strong>CNP:</strong> {extractedData.cnp}</p>
                  <p><strong>CI:</strong> {extractedData.seria} {extractedData.numar}</p>
                </div>
              </div>
            )}

            <Button 
              variant="outline" 
              onClick={handleReset} 
              className="w-full"
              disabled={!uploadedImage}
            >
              Resetează
            </Button>
          </CardContent>
        </Card>

        {/* Contract Data Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Date Client
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prenume</Label>
                <Input
                  value={contractData.prenume}
                  onChange={(e) => setContractData(prev => ({ ...prev, prenume: e.target.value }))}
                  placeholder="Prenume"
                />
              </div>
              <div className="space-y-2">
                <Label>Nume</Label>
                <Input
                  value={contractData.nume}
                  onChange={(e) => setContractData(prev => ({ ...prev, nume: e.target.value }))}
                  placeholder="Nume"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>CNP</Label>
              <Input
                value={contractData.cnp}
                onChange={(e) => setContractData(prev => ({ ...prev, cnp: e.target.value }))}
                placeholder="Cod Numeric Personal"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Seria CI</Label>
                <Input
                  value={contractData.seria_ci}
                  onChange={(e) => setContractData(prev => ({ ...prev, seria_ci: e.target.value }))}
                  placeholder="XX"
                />
              </div>
              <div className="space-y-2">
                <Label>Număr CI</Label>
                <Input
                  value={contractData.numar_ci}
                  onChange={(e) => setContractData(prev => ({ ...prev, numar_ci: e.target.value }))}
                  placeholder="123456"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Adresa Domiciliu</Label>
              <Textarea
                value={contractData.adresa}
                onChange={(e) => setContractData(prev => ({ ...prev, adresa: e.target.value }))}
                placeholder="Adresa completă"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Property Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Date Proprietate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Adresa Proprietate</Label>
              <Textarea
                value={contractData.proprietate_adresa}
                onChange={(e) => setContractData(prev => ({ ...prev, proprietate_adresa: e.target.value }))}
                placeholder="Adresa completă a proprietății"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preț (EUR)</Label>
                <Input
                  type="number"
                  value={contractData.proprietate_pret}
                  onChange={(e) => setContractData(prev => ({ ...prev, proprietate_pret: e.target.value }))}
                  placeholder="100000"
                />
              </div>
              <div className="space-y-2">
                <Label>Suprafață (mp)</Label>
                <Input
                  type="number"
                  value={contractData.proprietate_suprafata}
                  onChange={(e) => setContractData(prev => ({ ...prev, proprietate_suprafata: e.target.value }))}
                  placeholder="75"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contract Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Setări Contract
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tip Contract</Label>
              <Select
                value={contractData.tip_contract}
                onValueChange={(value: "vanzare-cumparare" | "inchiriere" | "precontract") => 
                  setContractData(prev => ({ ...prev, tip_contract: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vanzare-cumparare">Contract Vânzare-Cumpărare</SelectItem>
                  <SelectItem value="inchiriere">Contract Închiriere</SelectItem>
                  <SelectItem value="precontract">Precontract</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data Contract</Label>
              <Input
                type="date"
                value={contractData.data_contract}
                onChange={(e) => setContractData(prev => ({ ...prev, data_contract: e.target.value }))}
              />
            </div>

            {contractData.tip_contract === "inchiriere" && (
              <div className="space-y-2">
                <Label>Durată Închiriere (luni)</Label>
                <Input
                  type="number"
                  value={contractData.durata_inchiriere || ""}
                  onChange={(e) => setContractData(prev => ({ ...prev, durata_inchiriere: e.target.value }))}
                  placeholder="12"
                />
              </div>
            )}

            {contractData.tip_contract === "precontract" && (
              <div className="space-y-2">
                <Label>Avans (%)</Label>
                <Input
                  value={contractData.avans || ""}
                  onChange={(e) => setContractData(prev => ({ ...prev, avans: e.target.value }))}
                  placeholder="10%"
                />
              </div>
            )}

            <Button
              className="w-full"
              onClick={generateContract}
              disabled={isGenerating || !contractData.nume || !contractData.proprietate_adresa}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Se generează...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generează Contract PDF
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContractGeneratorPage;

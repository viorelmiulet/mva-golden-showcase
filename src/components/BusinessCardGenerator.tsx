import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Eye, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import QRCode from "qrcode";

interface BusinessCardData {
  name: string;
  function: string;
  phone: string;
  email: string;
}

const BusinessCardGenerator = () => {
  const [cardData, setCardData] = useState<BusinessCardData>({
    name: "",
    function: "",
    phone: "",
    email: ""
  });
  
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [frontSvg, setFrontSvg] = useState<string>("");
  const [backSvg, setBackSvg] = useState<string>("");

  const generateQRCode = async (phone: string) => {
    if (!phone) return "";
    const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, "")}`;
    try {
      return await QRCode.toDataURL(whatsappUrl, {
        width: 70,
        margin: 0,
        color: { dark: "#000000", light: "#ffffff" }
      });
    } catch (error) {
      console.error("Error generating QR code:", error);
      return "";
    }
  };

  const generateFrontSvg = (data: BusinessCardData, qrDataUrl: string) => {
    const qrImage = qrDataUrl ? `<image href="${qrDataUrl}" x="305" y="140" width="70" height="70"/>` : "";
    
    return `<svg width="350" height="200" viewBox="0 0 350 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a1a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2a2a2a;stop-opacity:1" />
    </linearGradient>
    
    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#DAA520;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#FFD700;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#B8860B;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <rect width="350" height="200" fill="url(#cardGradient)" rx="10"/>
  
  <!-- Logo MVA mai mic -->
  <g transform="translate(25, 25) scale(0.8)">
    <circle cx="20" cy="20" r="18" fill="url(#logoGradient)"/>
    <path d="M12 12 L16 12 L20 20 L24 12 L28 12 L28 28 L25 28 L25 17 L22 23 L18 23 L15 17 L15 28 L12 28 Z" fill="white"/>
    <polygon points="35,8 45,8 50,18 45,28 35,28 30,18" fill="url(#logoGradient)"/>
    <text x="37.5" y="23" font-family="Arial Black" font-size="8" fill="white" text-anchor="middle" font-weight="bold">M</text>
  </g>

  <!-- Nume și funcție -->
  <text x="25" y="90" font-family="Arial" font-size="16" font-weight="bold" fill="white">${data.name}</text>
  <text x="25" y="110" font-family="Arial" font-size="12" fill="#DAA520">${data.function}</text>
  
  <!-- Informații contact -->
  <text x="25" y="135" font-family="Arial" font-size="10" fill="white">📞 ${data.phone}</text>
  <text x="25" y="150" font-family="Arial" font-size="10" fill="white">✉️ ${data.email}</text>
  
  <!-- Text vânzări -->
  <text x="25" y="170" font-family="Arial" font-size="9" fill="#DAA520">Vânzări apartamente direct de la dezvoltator</text>
  
  <!-- Program de lucru -->
  <text x="25" y="185" font-family="Arial" font-size="8" fill="white">Luni-Vineri: 09:00-18:00 | Sâmbătă: 10:00-16:00</text>
  
  <!-- QR Code -->
  ${qrImage}
  <text x="340" y="225" font-family="Arial" font-size="8" fill="white" text-anchor="end">WhatsApp</text>
</svg>`;
  };

  const generateBackSvg = () => {
    return `<svg width="350" height="200" viewBox="0 0 350 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cardGradientVerso" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a1a;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#2a2a2a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1a1a1a;stop-opacity:1" />
    </linearGradient>
    
    <linearGradient id="logoGradientVerso" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#DAA520;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#FFD700;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#B8860B;stop-opacity:1" />
    </linearGradient>
    
    <radialGradient id="centerGlow" cx="50%" cy="50%" r="40%">
      <stop offset="0%" style="stop-color:#DAA520;stop-opacity:0.3" />
      <stop offset="100%" style="stop-color:#DAA520;stop-opacity:0" />
    </radialGradient>
  </defs>
  
  <rect width="350" height="200" fill="url(#cardGradientVerso)" rx="10"/>
  <rect width="350" height="200" fill="url(#centerGlow)" rx="10"/>
  
  <!-- Elemente decorative -->
  <circle cx="50" cy="50" r="30" fill="none" stroke="#DAA520" stroke-width="0.5" opacity="0.3"/>
  <circle cx="300" cy="150" r="25" fill="none" stroke="#DAA520" stroke-width="0.5" opacity="0.3"/>
  
  <!-- Logo central mai mic -->
  <g transform="translate(175, 100) scale(0.6)">
    <circle cx="0" cy="0" r="25" fill="url(#logoGradientVerso)" opacity="0.8"/>
    <path d="M-7 -2 L-4 -2 L0 4 L4 -2 L7 -2 L7 9 L4 9 L4 1 L1 5 L-1 5 L-4 1 L-4 9 L-7 9 Z" fill="white"/>
    
    <polygon points="25,-15 40,-15 47.5,0 40,15 25,15 17.5,0" fill="url(#logoGradientVerso)" opacity="0.8"/>
    <text x="32.5" y="5" font-family="Arial Black" font-size="12" fill="white" text-anchor="middle" font-weight="bold">M</text>
  </g>
  
  <!-- Linii decorative -->
  <line x1="50" y1="180" x2="300" y2="180" stroke="#DAA520" stroke-width="1" opacity="0.5"/>
  <line x1="50" y1="20" x2="300" y2="20" stroke="#DAA520" stroke-width="1" opacity="0.5"/>
</svg>`;
  };

  const handleGenerate = async () => {
    if (!cardData.name || !cardData.function || !cardData.phone || !cardData.email) {
      alert("Vă rugăm completați toate câmpurile!");
      return;
    }

    const qrDataUrl = await generateQRCode(cardData.phone);
    setQrCodeDataUrl(qrDataUrl);
    
    const front = generateFrontSvg(cardData, qrDataUrl);
    const back = generateBackSvg();
    
    setFrontSvg(front);
    setBackSvg(back);
  };

  const downloadSvg = (svgContent: string, filename: string) => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadBoth = () => {
    downloadSvg(frontSvg, 'carte-vizita-fata.svg');
    setTimeout(() => downloadSvg(backSvg, 'carte-vizita-verso.svg'), 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Înapoi la site
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Generator Cărți de Vizită</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Formular */}
          <Card>
            <CardHeader>
              <CardTitle>Completează Datele</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nume Complet</Label>
                <Input
                  id="name"
                  value={cardData.name}
                  onChange={(e) => setCardData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="ex: Viorel Miulet"
                />
              </div>
              
              <div>
                <Label htmlFor="function">Funcția</Label>
                <Input
                  id="function"
                  value={cardData.function}
                  onChange={(e) => setCardData(prev => ({ ...prev, function: e.target.value }))}
                  placeholder="ex: Agent Imobiliar"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Număr de Telefon</Label>
                <Input
                  id="phone"
                  value={cardData.phone}
                  onChange={(e) => setCardData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="ex: +40 721 234 567"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Adresă Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={cardData.email}
                  onChange={(e) => setCardData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="ex: viorel@mvaimobiliare.ro"
                />
              </div>
              
              <Button onClick={handleGenerate} className="w-full">
                <Eye className="w-4 h-4 mr-2" />
                Generează Previzualizare
              </Button>
            </CardContent>
          </Card>

          {/* Previzualizare */}
          <Card>
            <CardHeader>
              <CardTitle>Previzualizare</CardTitle>
            </CardHeader>
            <CardContent>
              {frontSvg && backSvg ? (
                <div className="space-y-6">
                  <div className="grid gap-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Fața</h3>
                      <div 
                        className="bg-white p-4 rounded-lg shadow-md"
                        dangerouslySetInnerHTML={{ __html: frontSvg }}
                      />
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Verso</h3>
                      <div 
                        className="bg-white p-4 rounded-lg shadow-md"
                        dangerouslySetInnerHTML={{ __html: backSvg }}
                      />
                    </div>
                  </div>
                  
                  <Button onClick={downloadBoth} className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Descarcă Ambele Părți
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Completează toate câmpurile și apasă "Generează Previzualizare"
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BusinessCardGenerator;
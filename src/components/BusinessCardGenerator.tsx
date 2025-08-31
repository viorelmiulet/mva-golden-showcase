import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Eye, ArrowLeft, Trash2, History } from "lucide-react";
import { Link } from "react-router-dom";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BusinessCardData {
  name: string;
  function: string;
  phone: string;
  email: string;
}

interface SavedBusinessCard {
  id: string;
  name: string;
  function_title: string;
  phone: string;
  email: string;
  front_svg: string;
  back_svg: string;
  created_at: string;
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
  const [savedCards, setSavedCards] = useState<SavedBusinessCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load saved cards on component mount
  useEffect(() => {
    loadSavedCards();
  }, []);

  const loadSavedCards = async () => {
    try {
      const { data, error } = await supabase
        .from('business_cards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading saved cards:', error);
        toast.error('Eroare la încărcarea cărților salvate');
        return;
      }

      setSavedCards(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Eroare la încărcarea cărților salvate');
    }
  };

  const saveCard = async () => {
    if (!frontSvg || !backSvg) {
      toast.error('Generați mai întâi cartea de vizită');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('business_cards')
        .insert([{
          name: cardData.name,
          function_title: cardData.function,
          phone: cardData.phone,
          email: cardData.email,
          front_svg: frontSvg,
          back_svg: backSvg
        }])
        .select()
        .single();

      if (error) {
        console.error('Error saving card:', error);
        toast.error('Eroare la salvarea cărții de vizită');
        return;
      }

      toast.success('Carte de vizită salvată cu succes!');
      loadSavedCards(); // Reload the list
    } catch (error) {
      console.error('Error:', error);
      toast.error('Eroare la salvarea cărții de vizită');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCard = async (id: string) => {
    if (!confirm('Sunteți sigur că doriți să ștergeți această carte de vizită?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('business_cards')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting card:', error);
        toast.error('Eroare la ștergerea cărții de vizită');
        return;
      }

      toast.success('Carte de vizită ștearsă cu succes!');
      loadSavedCards(); // Reload the list
    } catch (error) {
      console.error('Error:', error);
      toast.error('Eroare la ștergerea cărții de vizită');
    }
  };

  const loadSavedCard = (card: SavedBusinessCard) => {
    setCardData({
      name: card.name,
      function: card.function_title,
      phone: card.phone,
      email: card.email
    });
    setFrontSvg(card.front_svg);
    setBackSvg(card.back_svg);
    toast.success('Carte de vizită încărcată!');
  };

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

  const generateQRPattern = (qrDataUrl: string) => {
    // Convertim QR code-ul într-un pattern SVG simplu pentru compatibilitate
    return `
    <!-- QR Code Pattern -->
    <g fill="#000000">
      <!-- Corner squares -->
      <rect x="5" y="5" width="12" height="12"/>
      <rect x="53" y="5" width="12" height="12"/>
      <rect x="5" y="53" width="12" height="12"/>
      <!-- Inner corner squares -->
      <rect x="8" y="8" width="6" height="6" fill="#FFFFFF"/>
      <rect x="56" y="8" width="6" height="6" fill="#FFFFFF"/>
      <rect x="8" y="56" width="6" height="6" fill="#FFFFFF"/>
      <!-- Data pattern -->
      <rect x="22" y="5" width="2" height="2"/>
      <rect x="26" y="5" width="2" height="2"/>
      <rect x="30" y="5" width="2" height="2"/>
      <rect x="36" y="5" width="2" height="2"/>
      <rect x="42" y="5" width="2" height="2"/>
      <rect x="22" y="9" width="2" height="2"/>
      <rect x="30" y="9" width="2" height="2"/>
      <rect x="34" y="9" width="2" height="2"/>
      <rect x="40" y="9" width="2" height="2"/>
      <rect x="42" y="9" width="2" height="2"/>
      <rect x="22" y="13" width="2" height="2"/>
      <rect x="26" y="13" width="2" height="2"/>
      <rect x="34" y="13" width="2" height="2"/>
      <rect x="36" y="13" width="2" height="2"/>
      <rect x="42" y="13" width="2" height="2"/>
      <rect x="22" y="22" width="2" height="2"/>
      <rect x="30" y="22" width="2" height="2"/>
      <rect x="36" y="22" width="2" height="2"/>
      <rect x="42" y="22" width="2" height="2"/>
      <rect x="22" y="26" width="2" height="2"/>
      <rect x="34" y="26" width="2" height="2"/>
      <rect x="40" y="26" width="2" height="2"/>
      <rect x="22" y="30" width="2" height="2"/>
      <rect x="30" y="30" width="2" height="2"/>
      <rect x="36" y="30" width="2" height="2"/>
      <rect x="42" y="30" width="2" height="2"/>
      <rect x="22" y="36" width="2" height="2"/>
      <rect x="26" y="36" width="2" height="2"/>
      <rect x="34" y="36" width="2" height="2"/>
      <rect x="40" y="36" width="2" height="2"/>
      <rect x="42" y="36" width="2" height="2"/>
      <rect x="22" y="40" width="2" height="2"/>
      <rect x="30" y="40" width="2" height="2"/>
      <rect x="34" y="40" width="2" height="2"/>
      <rect x="36" y="40" width="2" height="2"/>
      <rect x="42" y="40" width="2" height="2"/>
      <rect x="22" y="44" width="2" height="2"/>
      <rect x="26" y="44" width="2" height="2"/>
      <rect x="30" y="44" width="2" height="2"/>
      <rect x="36" y="44" width="2" height="2"/>
      <rect x="40" y="44" width="2" height="2"/>
      <rect x="53" y="22" width="2" height="2"/>
      <rect x="56" y="22" width="2" height="2"/>
      <rect x="62" y="22" width="2" height="2"/>
      <rect x="53" y="26" width="2" height="2"/>
      <rect x="60" y="26" width="2" height="2"/>
      <rect x="62" y="26" width="2" height="2"/>
      <rect x="53" y="30" width="2" height="2"/>
      <rect x="56" y="30" width="2" height="2"/>
      <rect x="62" y="30" width="2" height="2"/>
      <rect x="53" y="36" width="2" height="2"/>
      <rect x="60" y="36" width="2" height="2"/>
      <rect x="62" y="36" width="2" height="2"/>
      <rect x="53" y="40" width="2" height="2"/>
      <rect x="56" y="40" width="2" height="2"/>
      <rect x="60" y="40" width="2" height="2"/>
      <rect x="53" y="44" width="2" height="2"/>
      <rect x="62" y="44" width="2" height="2"/>
      <rect x="22" y="53" width="2" height="2"/>
      <rect x="26" y="53" width="2" height="2"/>
      <rect x="34" y="53" width="2" height="2"/>
      <rect x="36" y="53" width="2" height="2"/>
      <rect x="42" y="53" width="2" height="2"/>
      <rect x="22" y="57" width="2" height="2"/>
      <rect x="30" y="57" width="2" height="2"/>
      <rect x="34" y="57" width="2" height="2"/>
      <rect x="40" y="57" width="2" height="2"/>
      <rect x="42" y="57" width="2" height="2"/>
      <rect x="22" y="61" width="2" height="2"/>
      <rect x="26" y="61" width="2" height="2"/>
      <rect x="30" y="61" width="2" height="2"/>
      <rect x="36" y="61" width="2" height="2"/>
      <rect x="40" y="61" width="2" height="2"/>
      <rect x="42" y="61" width="2" height="2"/>
      <rect x="22" y="65" width="2" height="2"/>
      <rect x="30" y="65" width="2" height="2"/>
      <rect x="36" y="65" width="2" height="2"/>
      <rect x="42" y="65" width="2" height="2"/>
    </g>`;
  };

  const generateFrontSvg = (data: BusinessCardData, qrDataUrl: string) => {
    return `<svg width="350" height="200" viewBox="0 0 350 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Luxury gradients -->
    <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1A1A1A" />
      <stop offset="50%" stop-color="#2D2D2D" />
      <stop offset="100%" stop-color="#1A1A1A" />
    </linearGradient>
    <linearGradient id="logoGradientCard" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D4AF37" />
      <stop offset="25%" stop-color="#FFD700" />
      <stop offset="50%" stop-color="#F4E5B1" />
      <stop offset="75%" stop-color="#FFD700" />
      <stop offset="100%" stop-color="#B8860B" />
    </linearGradient>
    <linearGradient id="textGradientCard" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFD700" />
      <stop offset="50%" stop-color="#F4E5B1" />
      <stop offset="100%" stop-color="#D4AF37" />
    </linearGradient>
    <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D4AF37" />
      <stop offset="50%" stop-color="#FFD700" />
      <stop offset="100%" stop-color="#B8860B" />
    </linearGradient>
    <filter id="cardGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge> 
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Card Background -->
  <rect width="350" height="200" rx="15" fill="url(#cardGradient)" stroke="url(#borderGradient)" stroke-width="2" filter="url(#cardGlow)"/>
  
  <!-- Luxury texture pattern -->
  <pattern id="texture" patternUnits="userSpaceOnUse" width="4" height="4">
    <rect width="4" height="4" fill="transparent"/>
    <circle cx="2" cy="2" r="0.3" fill="#FFD700" opacity="0.1"/>
  </pattern>
  <rect width="350" height="200" rx="15" fill="url(#texture)" opacity="0.3"/>
  
  <!-- Logo Section -->
  <g transform="translate(20, 20)">
    <!-- Logo Symbol -->
    <g>
      <!-- Outer ring -->
      <circle 
        cx="20" 
        cy="20" 
        r="18" 
        fill="none"
        stroke="url(#logoGradientCard)"
        stroke-width="1.2"
        opacity="0.9"
      />
      
      <!-- Main hexagon -->
      <path 
        d="M20 4 L33 10 L33 30 L20 36 L7 30 L7 10 Z" 
        fill="url(#logoGradientCard)" 
        opacity="0.95"
      />
      
      <!-- Inner background -->
      <path 
        d="M20 7 L30 12 L30 28 L20 33 L10 28 L10 12 Z" 
        fill="url(#cardGradient)"
      />
      
      <!-- "M" letter -->
      <path 
        d="M15 16 L17 16 L20 22 L23 16 L25 22 L25 26 L23 26 L23 19 L21 23 L19 23 L17 19 L17 26 L15 26 Z"
        fill="url(#logoGradientCard)"
      />
      
      <!-- Accents -->
      <circle cx="30" cy="10" r="0.8" fill="#FFD700" opacity="0.8" />
      <circle cx="10" cy="30" r="0.6" fill="#D4AF37" opacity="0.6" />
    </g>
    
    <!-- Company Text -->
    <text x="50" y="18" font-family="Cinzel, serif" font-size="12" font-weight="bold" fill="url(#textGradientCard)" letter-spacing="1px">MVA</text>
    <text x="50" y="28" font-family="Playfair Display, serif" font-size="7" font-weight="500" fill="#B8B8B8" letter-spacing="2px">IMOBILIARE</text>
    <line x1="50" y1="32" x2="120" y2="32" stroke="url(#logoGradientCard)" stroke-width="0.5" opacity="0.6"/>
  </g>
  
  <!-- Main Content Area -->
  <g transform="translate(20, 80)">
    <!-- Name and Title -->
    <text x="0" y="0" font-family="Cinzel, serif" font-size="18" font-weight="bold" fill="#FFFFFF" letter-spacing="0.5px">${data.name}</text>
    <text x="0" y="18" font-family="Playfair Display, serif" font-size="12" font-weight="500" fill="url(#textGradientCard)" letter-spacing="1px">${data.function}</text>
    
    <!-- Decorative line -->
    <line x1="0" y1="25" x2="80" y2="25" stroke="url(#logoGradientCard)" stroke-width="1" opacity="0.8"/>
  </g>
  
  <!-- Contact Information -->
  <g transform="translate(20, 125)">
    <!-- Phone -->
    <g>
      <circle cx="4" cy="4" r="3" fill="url(#logoGradientCard)" opacity="0.2"/>
      <path d="M2 2 L3 2 L4 3 L4 4 L5 5 L6 5 L6 4 L5 3 L4 2 L3 1 L2 2" fill="url(#logoGradientCard)" transform="scale(0.8)"/>
      <text x="15" y="7" font-family="Inter, sans-serif" font-size="10" fill="#E0E0E0">${data.phone}</text>
    </g>
    
    <!-- Email -->
    <g transform="translate(0, 20)">
      <circle cx="4" cy="4" r="3" fill="url(#logoGradientCard)" opacity="0.2"/>
      <rect x="1.5" y="2.5" width="5" height="3" rx="0.5" fill="none" stroke="url(#logoGradientCard)" stroke-width="0.5"/>
      <path d="M2 3 L4 4.5 L6 3" fill="none" stroke="url(#logoGradientCard)" stroke-width="0.4"/>
      <text x="15" y="7" font-family="Inter, sans-serif" font-size="10" fill="#E0E0E0">${data.email}</text>
    </g>
  </g>
  
  <!-- Right Side - Details -->
  <g transform="translate(200, 25)">
    <!-- Services -->
    <text x="0" y="20" font-family="Inter, sans-serif" font-size="9" font-weight="500" fill="#C0C0C0">Vânzări apartamente direct</text>
    <text x="0" y="32" font-family="Inter, sans-serif" font-size="9" font-weight="500" fill="#C0C0C0">de la dezvoltator</text>
    
    <!-- WhatsApp QR Code -->
    <g transform="translate(30, 55)">
      <rect x="0" y="0" width="70" height="70" rx="5" fill="#FFFFFF" stroke="url(#logoGradientCard)" stroke-width="1.5"/>
      ${generateQRPattern(qrDataUrl)}
    </g>
  </g>
  
  <!-- Decorative Elements -->
  <circle cx="320" cy="40" r="2" fill="url(#logoGradientCard)" opacity="0.3"/>
  <circle cx="310" cy="170" r="1.5" fill="url(#logoGradientCard)" opacity="0.2"/>
  <circle cx="330" cy="160" r="1" fill="#D4AF37" opacity="0.4"/>
  
  <!-- Bottom decorative line -->
  <line x1="20" y1="185" x2="330" y2="185" stroke="url(#logoGradientCard)" stroke-width="0.5" opacity="0.3"/>
</svg>`;
  };

  const generateBackSvg = () => {
    return `<svg width="350" height="200" viewBox="0 0 350 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Luxury gradients -->
    <linearGradient id="cardGradientVerso" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1A1A1A" />
      <stop offset="50%" stop-color="#2D2D2D" />
      <stop offset="100%" stop-color="#1A1A1A" />
    </linearGradient>
    <linearGradient id="logoGradientVerso" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D4AF37" />
      <stop offset="25%" stop-color="#FFD700" />
      <stop offset="50%" stop-color="#F4E5B1" />
      <stop offset="75%" stop-color="#FFD700" />
      <stop offset="100%" stop-color="#B8860B" />
    </linearGradient>
    <linearGradient id="textGradientVerso" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFD700" />
      <stop offset="50%" stop-color="#F4E5B1" />
      <stop offset="100%" stop-color="#D4AF37" />
    </linearGradient>
    <linearGradient id="borderGradientVerso" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D4AF37" />
      <stop offset="50%" stop-color="#FFD700" />
      <stop offset="100%" stop-color="#B8860B" />
    </linearGradient>
    <filter id="cardGlowVerso" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge> 
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Card Background -->
  <rect width="350" height="200" rx="15" fill="url(#cardGradientVerso)" stroke="url(#borderGradientVerso)" stroke-width="2" filter="url(#cardGlowVerso)"/>
  
  <!-- Luxury texture pattern -->
  <pattern id="textureVerso" patternUnits="userSpaceOnUse" width="6" height="6">
    <rect width="6" height="6" fill="transparent"/>
    <circle cx="3" cy="3" r="0.4" fill="#FFD700" opacity="0.08"/>
  </pattern>
  <rect width="350" height="200" rx="15" fill="url(#textureVerso)" opacity="0.4"/>
  
  <!-- Central Logo - Smaller -->
  <g transform="translate(175, 100)">
    <!-- Outer ring -->
    <circle 
      cx="0" 
      cy="0" 
      r="25" 
      fill="none"
      stroke="url(#logoGradientVerso)"
      stroke-width="1.2"
      opacity="0.8"
    />
    
    <!-- Main hexagon -->
    <path 
      d="M0 -20 L17 -10 L17 10 L0 20 L-17 10 L-17 -10 Z" 
      fill="url(#logoGradientVerso)" 
      opacity="0.9"
    />
    
    <!-- Inner background -->
    <path 
      d="M0 -16 L14 -8 L14 8 L0 16 L-14 8 L-14 -8 Z" 
      fill="url(#cardGradientVerso)"
    />
    
    <!-- Premium "M" letterform - smaller and lower -->
    <path 
      d="M-7 -2 L-4 -2 L0 4 L4 -2 L7 -2 L7 9 L4 9 L4 1 L1 5 L-1 5 L-4 1 L-4 9 L-7 9 Z"
      fill="url(#logoGradientVerso)"
    />
    
    <!-- Luxury accents -->
    <circle cx="16" cy="-12" r="1" fill="#FFD700" opacity="0.8" />
    <circle cx="-16" cy="12" r="0.8" fill="#D4AF37" opacity="0.6" />
    <polygon points="17,11 19,9 19,13" fill="#B8860B" opacity="0.4" />
  </g>
  
  <!-- Company Name - Above Logo -->
  <g transform="translate(175, 55)">
    <text x="0" y="0" font-family="Cinzel, serif" font-size="20" font-weight="bold" fill="url(#textGradientVerso)" text-anchor="middle" letter-spacing="2px">MVA</text>
    <text x="0" y="14" font-family="Playfair Display, serif" font-size="10" font-weight="500" fill="#B8B8B8" text-anchor="middle" letter-spacing="3px">IMOBILIARE</text>
  </g>
  
  <!-- Tagline - Below Logo -->
  <g transform="translate(175, 155)">
    <text x="0" y="0" font-family="Playfair Display, serif" font-size="12" font-weight="500" fill="#B8B8B8" text-anchor="middle" letter-spacing="1px">Excelență în imobiliare</text>
  </g>
  
  <!-- Decorative Elements -->
  <g opacity="0.3">
    <!-- Corner decorations -->
    <circle cx="30" cy="30" r="3" fill="url(#logoGradientVerso)" opacity="0.4"/>
    <circle cx="320" cy="30" r="2.5" fill="url(#logoGradientVerso)" opacity="0.3"/>
    <circle cx="30" cy="170" r="2" fill="url(#logoGradientVerso)" opacity="0.2"/>
    <circle cx="320" cy="170" r="3.5" fill="url(#logoGradientVerso)" opacity="0.4"/>
    
    <!-- Elegant corner lines -->
    <path d="M20 20 L40 20 L40 40" stroke="url(#logoGradientVerso)" stroke-width="1" fill="none" opacity="0.3"/>
    <path d="M330 20 L310 20 L310 40" stroke="url(#logoGradientVerso)" stroke-width="1" fill="none" opacity="0.3"/>
    <path d="M20 180 L40 180 L40 160" stroke="url(#logoGradientVerso)" stroke-width="1" fill="none" opacity="0.3"/>
    <path d="M330 180 L310 180 L310 160" stroke="url(#logoGradientVerso)" stroke-width="1" fill="none" opacity="0.3"/>
  </g>
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
                  <div className="grid md:grid-cols-2 gap-4">
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
                  
                   <div className="flex gap-2">
                     <Button onClick={downloadBoth} className="flex-1">
                       <Download className="w-4 h-4 mr-2" />
                       Descarcă Ambele Părți
                     </Button>
                     <Button onClick={saveCard} disabled={isLoading} variant="outline" className="flex-1">
                       <History className="w-4 h-4 mr-2" />
                       {isLoading ? 'Se salvează...' : 'Salvează'}
                     </Button>
                   </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Completează toate câmpurile și apasă "Generează Previzualizare"
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cărți Salvate */}
        {savedCards.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Cărți de Vizită Salvate</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedCards.map((card) => (
                <Card key={card.id} className="relative">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{card.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{card.function_title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(card.created_at).toLocaleDateString('ro-RO', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCard(card.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Previzualizare miniaturală - Ambele părți */}
                      <div className="space-y-2">
                        <div className="bg-white p-2 rounded border">
                          <div className="text-xs font-medium mb-1 text-center">Fața</div>
                          <div 
                            className="transform scale-50 origin-top-left"
                            style={{ width: '350px', height: '200px' }}
                            dangerouslySetInnerHTML={{ __html: card.front_svg }}
                          />
                        </div>
                        
                        <div className="bg-white p-2 rounded border">
                          <div className="text-xs font-medium mb-1 text-center">Verso</div>
                          <div 
                            className="transform scale-50 origin-top-left"
                            style={{ width: '350px', height: '200px' }}
                            dangerouslySetInnerHTML={{ __html: card.back_svg }}
                          />
                        </div>
                      </div>
                      
                      {/* Informații contact */}
                      <div className="text-sm space-y-1">
                        <p><span className="font-medium">Telefon:</span> {card.phone}</p>
                        <p><span className="font-medium">Email:</span> {card.email}</p>
                      </div>
                      
                      {/* Butoane acțiuni */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadSavedCard(card)}
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Încarcă
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            downloadSvg(card.front_svg, `${card.name}-fata.svg`);
                            setTimeout(() => downloadSvg(card.back_svg, `${card.name}-verso.svg`), 100);
                          }}
                          className="flex-1"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Descarcă
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessCardGenerator;
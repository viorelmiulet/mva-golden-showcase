import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Eye, ArrowLeft, Trash2, History, Smartphone, Camera } from "lucide-react";
import { Link } from "react-router-dom";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import wallpaperMobile from "@/assets/mva-wallpaper-mobile.jpg";
import watermarkLogo from "@/assets/mva-watermark.png";

interface BusinessCardData {
  name: string;
  function: string;
  phone: string;
  email: string;
  qrLink: string;
}

interface SavedBusinessCard {
  id: string;
  name: string;
  function_title: string;
  phone: string;
  email: string;
  qr_link: string;
  front_svg: string;
  back_svg: string;
  created_at: string;
}

const BusinessCardGenerator = () => {
  const [cardData, setCardData] = useState<BusinessCardData>({
    name: "",
    function: "",
    phone: "",
    email: "",
    qrLink: ""
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
          qr_link: cardData.qrLink || `https://wa.me/${cardData.phone.replace(/[^0-9]/g, "")}`,
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
      email: card.email,
      qrLink: card.qr_link || ""
    });
    setFrontSvg(card.front_svg);
    setBackSvg(card.back_svg);
    toast.success('Carte de vizită încărcată!');
  };

  const generateQRCode = async (data: BusinessCardData) => {
    // Use custom qrLink if provided, otherwise generate WhatsApp link from phone
    const qrUrl = data.qrLink || `https://wa.me/${data.phone.replace(/[^0-9]/g, "")}`;
    
    if (!qrUrl) return "";
    
    try {
      return await QRCode.toDataURL(qrUrl, {
        width: 600, // Increased for high resolution
        margin: 2,
        color: { dark: "#D4AF37", light: "#ffffff" }, // Gold color instead of black
        errorCorrectionLevel: 'M'
      });
    } catch (error) {
      console.error("Error generating QR code:", error);
      return "";
    }
  };

  const generateQRPattern = (qrDataUrl: string) => {
    // QR code pattern scalat pentru rezoluția înaltă (3x mai mare)
    return `
    <!-- QR Code Pattern - High Resolution -->
    <g fill="#000000">
      <!-- Corner squares (3x scaled) -->
      <rect x="15" y="15" width="36" height="36"/>
      <rect x="159" y="15" width="36" height="36"/>
      <rect x="15" y="159" width="36" height="36"/>
      <!-- Inner corner squares (3x scaled) -->
      <rect x="24" y="24" width="18" height="18" fill="#FFFFFF"/>
      <rect x="168" y="24" width="18" height="18" fill="#FFFFFF"/>
      <rect x="24" y="168" width="18" height="18" fill="#FFFFFF"/>
      <!-- Data pattern (3x scaled) -->
      <rect x="66" y="15" width="6" height="6"/>
      <rect x="78" y="15" width="6" height="6"/>
      <rect x="90" y="15" width="6" height="6"/>
      <rect x="108" y="15" width="6" height="6"/>
      <rect x="126" y="15" width="6" height="6"/>
      <rect x="66" y="27" width="6" height="6"/>
      <rect x="90" y="27" width="6" height="6"/>
      <rect x="102" y="27" width="6" height="6"/>
      <rect x="120" y="27" width="6" height="6"/>
      <rect x="126" y="27" width="6" height="6"/>
      <rect x="66" y="39" width="6" height="6"/>
      <rect x="78" y="39" width="6" height="6"/>
      <rect x="102" y="39" width="6" height="6"/>
      <rect x="108" y="39" width="6" height="6"/>
      <rect x="126" y="39" width="6" height="6"/>
      <rect x="66" y="66" width="6" height="6"/>
      <rect x="90" y="66" width="6" height="6"/>
      <rect x="108" y="66" width="6" height="6"/>
      <rect x="126" y="66" width="6" height="6"/>
      <rect x="66" y="78" width="6" height="6"/>
      <rect x="102" y="78" width="6" height="6"/>
      <rect x="120" y="78" width="6" height="6"/>
      <rect x="66" y="90" width="6" height="6"/>
      <rect x="90" y="90" width="6" height="6"/>
      <rect x="108" y="90" width="6" height="6"/>
      <rect x="126" y="90" width="6" height="6"/>
      <rect x="66" y="108" width="6" height="6"/>
      <rect x="78" y="108" width="6" height="6"/>
      <rect x="102" y="108" width="6" height="6"/>
      <rect x="120" y="108" width="6" height="6"/>
      <rect x="126" y="108" width="6" height="6"/>
      <rect x="66" y="120" width="6" height="6"/>
      <rect x="90" y="120" width="6" height="6"/>
      <rect x="102" y="120" width="6" height="6"/>
      <rect x="108" y="120" width="6" height="6"/>
      <rect x="126" y="120" width="6" height="6"/>
      <rect x="66" y="132" width="6" height="6"/>
      <rect x="78" y="132" width="6" height="6"/>
      <rect x="90" y="132" width="6" height="6"/>
      <rect x="108" y="132" width="6" height="6"/>
      <rect x="120" y="132" width="6" height="6"/>
      <rect x="159" y="66" width="6" height="6"/>
      <rect x="168" y="66" width="6" height="6"/>
      <rect x="186" y="66" width="6" height="6"/>
      <rect x="159" y="78" width="6" height="6"/>
      <rect x="180" y="78" width="6" height="6"/>
      <rect x="186" y="78" width="6" height="6"/>
      <rect x="159" y="90" width="6" height="6"/>
      <rect x="168" y="90" width="6" height="6"/>
      <rect x="186" y="90" width="6" height="6"/>
      <rect x="159" y="108" width="6" height="6"/>
      <rect x="180" y="108" width="6" height="6"/>
      <rect x="186" y="108" width="6" height="6"/>
      <rect x="159" y="120" width="6" height="6"/>
      <rect x="168" y="120" width="6" height="6"/>
      <rect x="180" y="120" width="6" height="6"/>
      <rect x="159" y="132" width="6" height="6"/>
      <rect x="186" y="132" width="6" height="6"/>
      <rect x="66" y="159" width="6" height="6"/>
      <rect x="78" y="159" width="6" height="6"/>
      <rect x="102" y="159" width="6" height="6"/>
      <rect x="108" y="159" width="6" height="6"/>
      <rect x="126" y="159" width="6" height="6"/>
      <rect x="66" y="171" width="6" height="6"/>
      <rect x="90" y="171" width="6" height="6"/>
      <rect x="102" y="171" width="6" height="6"/>
      <rect x="120" y="171" width="6" height="6"/>
      <rect x="126" y="171" width="6" height="6"/>
      <rect x="66" y="183" width="6" height="6"/>
      <rect x="78" y="183" width="6" height="6"/>
      <rect x="90" y="183" width="6" height="6"/>
      <rect x="108" y="183" width="6" height="6"/>
      <rect x="120" y="183" width="6" height="6"/>
      <rect x="126" y="183" width="6" height="6"/>
      <rect x="66" y="195" width="6" height="6"/>
      <rect x="90" y="195" width="6" height="6"/>
      <rect x="108" y="195" width="6" height="6"/>
      <rect x="126" y="195" width="6" height="6"/>
    </g>`;
  };

  const generateFrontSvg = (data: BusinessCardData, qrDataUrl: string) => {
    return `<svg width="1050" height="600" viewBox="0 0 1050 600" xmlns="http://www.w3.org/2000/svg">
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
      <feGaussianBlur stdDeviation="9" result="coloredBlur"/>
      <feMerge> 
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Card Background -->
  <rect width="1050" height="600" rx="45" fill="url(#cardGradient)" stroke="url(#borderGradient)" stroke-width="9" filter="url(#cardGlow)"/>
  
  <!-- Luxury texture pattern -->
  <pattern id="texture" patternUnits="userSpaceOnUse" width="12" height="12">
    <rect width="12" height="12" fill="transparent"/>
    <circle cx="6" cy="6" r="0.9" fill="#FFD700" opacity="0.1"/>
  </pattern>
  <rect width="1050" height="600" rx="45" fill="url(#texture)" opacity="0.3"/>
  
  <!-- Logo Section -->
  <g transform="translate(60, 60)">
    <!-- Logo Symbol -->
    <g>
      <!-- Outer ring -->
      <circle 
        cx="60" 
        cy="60" 
        r="54" 
        fill="none"
        stroke="url(#logoGradientCard)"
        stroke-width="3.6"
        opacity="0.9"
      />
      
      <!-- Main hexagon -->
      <path 
        d="M60 12 L99 30 L99 90 L60 108 L21 90 L21 30 Z" 
        fill="url(#logoGradientCard)" 
        opacity="0.95"
      />
      
      <!-- Inner background -->
      <path 
        d="M60 21 L90 36 L90 84 L60 99 L30 84 L30 36 Z" 
        fill="url(#cardGradient)"
      />
      
      <!-- "M" letter -->
      <path 
        d="M45 48 L51 48 L60 66 L69 48 L75 66 L75 78 L69 78 L69 57 L63 69 L57 69 L51 57 L51 78 L45 78 Z"
        fill="url(#logoGradientCard)"
      />
      
      <!-- Accents -->
      <circle cx="90" cy="30" r="2.4" fill="#FFD700" opacity="0.8" />
      <circle cx="30" cy="90" r="1.8" fill="#D4AF37" opacity="0.6" />
    </g>
    
    <!-- Company Text -->
    <text x="150" y="54" font-family="Cinzel, serif" font-size="36" font-weight="bold" fill="url(#textGradientCard)" letter-spacing="3px">MVA</text>
    <text x="150" y="84" font-family="Playfair Display, serif" font-size="21" font-weight="500" fill="#B8B8B8" letter-spacing="6px">IMOBILIARE</text>
    <line x1="150" y1="96" x2="360" y2="96" stroke="url(#logoGradientCard)" stroke-width="1.5" opacity="0.6"/>
  </g>
  
  <!-- Main Content Area -->
  <g transform="translate(60, 220)">
    <!-- Name and Title -->
    <text x="0" y="0" font-family="Cinzel, serif" font-size="48" font-weight="bold" fill="#FFFFFF" letter-spacing="1px">${data.name}</text>
    <text x="0" y="45" font-family="Playfair Display, serif" font-size="32" font-weight="500" fill="url(#textGradientCard)" letter-spacing="2px">${data.function}</text>
    
    <!-- Decorative line -->
    <line x1="0" y1="60" x2="200" y2="60" stroke="url(#logoGradientCard)" stroke-width="2" opacity="0.8"/>
  </g>
  
  <!-- Contact Information -->
  <g transform="translate(60, 330)">
    <!-- Phone -->
    <g>
      <circle cx="12" cy="12" r="9" fill="url(#logoGradientCard)" opacity="0.2"/>
      <!-- Modern phone icon -->
      <rect x="6" y="4" width="12" height="16" rx="2" fill="none" stroke="url(#logoGradientCard)" stroke-width="1.5"/>
      <line x1="10" y1="17" x2="14" y2="17" stroke="url(#logoGradientCard)" stroke-width="1.5"/>
      <text x="45" y="21" font-family="Inter, sans-serif" font-size="26" fill="#E0E0E0">${data.phone}</text>
    </g>
    
    <!-- Email -->
    <g transform="translate(0, 50)">
      <circle cx="12" cy="12" r="9" fill="url(#logoGradientCard)" opacity="0.2"/>
      <!-- Modern email icon -->
      <rect x="3" y="7" width="18" height="12" rx="2" fill="none" stroke="url(#logoGradientCard)" stroke-width="1.5"/>
      <path d="M3 9 L12 15 L21 9" fill="none" stroke="url(#logoGradientCard)" stroke-width="1.5"/>
      <text x="45" y="21" font-family="Inter, sans-serif" font-size="24" fill="#E0E0E0">${data.email}</text>
    </g>
    
    <!-- Website -->
    <g transform="translate(0, 100)">
      <circle cx="12" cy="12" r="9" fill="url(#logoGradientCard)" opacity="0.2"/>
      <!-- Modern website/globe icon -->
      <circle cx="12" cy="12" r="8" fill="none" stroke="url(#logoGradientCard)" stroke-width="1.5"/>
      <path d="M4 12h16M12 4c3.5 2.5 3.5 13.5 0 16M12 4c-3.5 2.5-3.5 13.5 0 16" fill="none" stroke="url(#logoGradientCard)" stroke-width="1.2"/>
      <text x="45" y="21" font-family="Inter, sans-serif" font-size="26" fill="#E0E0E0">mvaimobiliare.ro</text>
    </g>
    
    <!-- Address -->
    <g transform="translate(0, 150)">
      <circle cx="12" cy="12" r="9" fill="url(#logoGradientCard)" opacity="0.2"/>
      <!-- Modern location pin icon -->
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="none" stroke="url(#logoGradientCard)" stroke-width="1.5"/>
      <circle cx="12" cy="9" r="3" fill="none" stroke="url(#logoGradientCard)" stroke-width="1.5"/>
      <text x="45" y="12" font-family="Inter, sans-serif" font-size="22" fill="#E0E0E0">Chiajna, str. Tineretului nr. 17</text>
      <text x="45" y="35" font-family="Inter, sans-serif" font-size="22" fill="#E0E0E0">bl. 2 parter ap 24</text>
    </g>
  </g>
  
  <!-- Right Side - Details -->
  <g transform="translate(580, 75)">
    <!-- Services -->
    <text x="0" y="50" font-family="Inter, sans-serif" font-size="24" font-weight="500" fill="#C0C0C0">Vânzări apartamente direct</text>
    <text x="0" y="80" font-family="Inter, sans-serif" font-size="24" font-weight="500" fill="#C0C0C0">de la dezvoltator</text>
    
    <!-- WhatsApp QR Code -->
    <g transform="translate(60, 140)">
      <rect x="0" y="0" width="180" height="180" rx="12" fill="#FFFFFF" stroke="url(#logoGradientCard)" stroke-width="3"/>
      ${qrDataUrl ? `<image href="${qrDataUrl}" x="12" y="12" width="156" height="156"/>` : generateQRPattern(qrDataUrl)}
      <!-- QR Code text -->
      <text x="90" y="210" font-family="Inter, sans-serif" font-size="20" font-weight="500" fill="#C0C0C0" text-anchor="middle">Contact WhatsApp</text>
    </g>
  </g>
  
  <!-- Decorative Elements -->
  <circle cx="960" cy="120" r="6" fill="url(#logoGradientCard)" opacity="0.3"/>
  <circle cx="930" cy="510" r="4.5" fill="url(#logoGradientCard)" opacity="0.2"/>
  <circle cx="990" cy="480" r="3" fill="#D4AF37" opacity="0.4"/>
  
  <!-- Bottom decorative line -->
  <line x1="60" y1="555" x2="990" y2="555" stroke="url(#logoGradientCard)" stroke-width="1.5" opacity="0.3"/>
</svg>`;
  };

  const generateBackSvg = () => {
    return `<svg width="1050" height="600" viewBox="0 0 1050 600" xmlns="http://www.w3.org/2000/svg">
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
      <feGaussianBlur stdDeviation="9" result="coloredBlur"/>
      <feMerge> 
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Card Background -->
  <rect width="1050" height="600" rx="45" fill="url(#cardGradientVerso)" stroke="url(#borderGradientVerso)" stroke-width="9" filter="url(#cardGlowVerso)"/>
  
  <!-- Luxury texture pattern -->
  <pattern id="textureVerso" patternUnits="userSpaceOnUse" width="18" height="18">
    <rect width="18" height="18" fill="transparent"/>
    <circle cx="9" cy="9" r="1.2" fill="#FFD700" opacity="0.08"/>
  </pattern>
  <rect width="1050" height="600" rx="45" fill="url(#textureVerso)" opacity="0.4"/>
  
  <!-- Central Logo - Scaled up -->
  <g transform="translate(525, 300)">
    <!-- Outer ring -->
    <circle 
      cx="0" 
      cy="0" 
      r="75" 
      fill="none"
      stroke="url(#logoGradientVerso)"
      stroke-width="3.6"
      opacity="0.8"
    />
    
    <!-- Main hexagon -->
    <path 
      d="M0 -60 L51 -30 L51 30 L0 60 L-51 30 L-51 -30 Z" 
      fill="url(#logoGradientVerso)" 
      opacity="0.9"
    />
    
    <!-- Inner background -->
    <path 
      d="M0 -48 L42 -24 L42 24 L0 48 L-42 24 L-42 -24 Z" 
      fill="url(#cardGradientVerso)"
    />
    
    <!-- Premium "M" letterform - scaled up -->
    <path 
      d="M-21 -6 L-12 -6 L0 12 L12 -6 L21 -6 L21 27 L12 27 L12 3 L3 15 L-3 15 L-12 3 L-12 27 L-21 27 Z"
      fill="url(#logoGradientVerso)"
    />
    
    <!-- Luxury accents -->
    <circle cx="48" cy="-36" r="3" fill="#FFD700" opacity="0.8" />
    <circle cx="-48" cy="36" r="2.4" fill="#D4AF37" opacity="0.6" />
    <polygon points="51,33 57,27 57,39" fill="#B8860B" opacity="0.4" />
  </g>
  
  <!-- Company Name - Above Logo -->
  <g transform="translate(525, 165)">
    <text x="0" y="0" font-family="Cinzel, serif" font-size="60" font-weight="bold" fill="url(#textGradientVerso)" text-anchor="middle" letter-spacing="6px">MVA</text>
    <text x="0" y="42" font-family="Playfair Display, serif" font-size="30" font-weight="500" fill="#B8B8B8" text-anchor="middle" letter-spacing="9px">IMOBILIARE</text>
  </g>
  
  <!-- Tagline - Below Logo -->
  <g transform="translate(525, 465)">
    <text x="0" y="0" font-family="Playfair Display, serif" font-size="36" font-weight="500" fill="#B8B8B8" text-anchor="middle" letter-spacing="3px">Excelență în imobiliare</text>
  </g>
</svg>`;
  };

  const handleGenerate = async () => {
    console.log('Generating card with data:', cardData);
    
    if (!cardData.name || !cardData.function || !cardData.phone || !cardData.email) {
      console.log('Missing fields:', {
        name: !cardData.name,
        function: !cardData.function,
        phone: !cardData.phone,
        email: !cardData.email
      });
      toast.error("Vă rugăm completați toate câmpurile!");
      return;
    }

    console.log('Starting QR generation...');
    const qrDataUrl = await generateQRCode(cardData);
    console.log('QR generated:', qrDataUrl ? 'Success' : 'Failed');
    setQrCodeDataUrl(qrDataUrl);
    
    console.log('Generating SVGs...');
    const front = generateFrontSvg(cardData, qrDataUrl);
    const back = generateBackSvg();
    
    console.log('Front SVG length:', front.length);
    console.log('Back SVG length:', back.length);
    
    setFrontSvg(front);
    setBackSvg(back);
    
    toast.success('Carte de vizită generată cu succes!');
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
              
              <div>
                <Label htmlFor="qrLink">Link QR Code (opțional)</Label>
                <Input
                  id="qrLink"
                  value={cardData.qrLink}
                  onChange={(e) => setCardData(prev => ({ ...prev, qrLink: e.target.value }))}
                  placeholder="ex: https://wa.me/40721234567 sau alt link personalizat"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Dacă nu completezi, se va genera automat link WhatsApp din numărul de telefon
                </p>
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
                  <div className="space-y-6">
                     <div>
                       <h3 className="text-lg font-medium mb-2">Fața</h3>
                       <div 
                         className="flex justify-center items-center rounded-lg shadow-md"
                         style={{ height: '500px', width: '100%' }}
                       >
                         <div 
                           className="transform scale-[0.5]"
                           style={{ width: '1050px', height: '600px' }}
                           dangerouslySetInnerHTML={{ __html: frontSvg }}
                         />
                       </div>
                     </div>
                     
                     <div>
                       <h3 className="text-lg font-medium mb-2">Verso</h3>
                       <div 
                         className="flex justify-center items-center rounded-lg shadow-md"
                         style={{ height: '500px', width: '100%' }}
                       >
                         <div 
                           className="transform scale-[0.5]"
                           style={{ width: '1050px', height: '600px' }}
                           dangerouslySetInnerHTML={{ __html: backSvg }}
                         />
                       </div>
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

        {/* Logo-uri Descărcabile */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Logo-uri Descărcabile</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Wallpaper Mobile */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  Wallpaper Mobil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted rounded-lg p-4 flex justify-center">
                  <img 
                    src={wallpaperMobile} 
                    alt="MVA Wallpaper Mobile" 
                    className="max-w-full h-48 object-contain rounded-lg shadow-md"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Wallpaper optimizat pentru telefon (1080x1920px) cu logo-ul MVA pe fundal elegant.
                </p>
                <Button 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = wallpaperMobile;
                    link.download = 'mva-wallpaper-mobile.jpg';
                    link.click();
                  }}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descarcă Wallpaper
                </Button>
              </CardContent>
            </Card>

            {/* Watermark */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Watermark pentru Fotografii
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted rounded-lg p-4 flex justify-center">
                  <img 
                    src={watermarkLogo} 
                    alt="MVA Watermark" 
                    className="max-w-full h-48 object-contain rounded-lg shadow-md"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Logo semi-transparent (512x512px) perfect pentru watermark pe fotografii fără a fi intruziv.
                </p>
                <Button 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = watermarkLogo;
                    link.download = 'mva-watermark.png';
                    link.click();
                  }}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descarcă Watermark
                </Button>
              </CardContent>
            </Card>
          </div>
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
                            className="transform scale-[0.17] origin-top-left"
                            style={{ width: '1050px', height: '600px' }}
                            dangerouslySetInnerHTML={{ __html: card.front_svg }}
                          />
                        </div>
                        
                        <div className="bg-white p-2 rounded border">
                          <div className="text-xs font-medium mb-1 text-center">Verso</div>
                          <div 
                            className="transform scale-[0.17] origin-top-left"
                            style={{ width: '1050px', height: '600px' }}
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
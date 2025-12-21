import { useState, useRef, TouchEvent } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  Download, 
  PenTool, 
  Mail, 
  Trash2, 
  FilePlus2,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Home,
  Euro,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ContractData {
  id: string;
  created_at: string;
  client_name: string;
  client_prenume: string | null;
  property_address: string;
  property_price: number | null;
  property_currency: string | null;
  pdf_url: string | null;
  docx_url: string | null;
  proprietar_signed: boolean;
  chirias_signed: boolean;
  proprietar_name: string | null;
  proprietar_prenume: string | null;
}

interface SwipeableContractCardProps {
  contract: ContractData;
  onPreview: () => void;
  onDownloadPdf: () => void;
  onDownloadDocx: () => void;
  onRegenerate: () => void;
  onCopySignatureLink: (partyType: 'proprietar' | 'chirias') => void;
  onSendWhatsApp: (partyType: 'proprietar' | 'chirias') => void;
  onSendEmail: (partyType: 'proprietar' | 'chirias') => void;
  onDelete: () => void;
  isRegenerating?: boolean;
  isPreviewing?: boolean;
}

export function SwipeableContractCard({
  contract,
  onPreview,
  onDownloadPdf,
  onDownloadDocx,
  onRegenerate,
  onCopySignatureLink,
  onSendWhatsApp,
  onSendEmail,
  onDelete,
  isRegenerating,
  isPreviewing
}: SwipeableContractCardProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwipingLeft, setIsSwipingLeft] = useState(false);
  const [isSwipingRight, setIsSwipingRight] = useState(false);
  const startXRef = useRef(0);
  const isDraggingRef = useRef(false);

  const SWIPE_THRESHOLD = 80;
  const MAX_SWIPE = 160;

  const handleTouchStart = (e: TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    isDraggingRef.current = true;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDraggingRef.current) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    
    // Limit the swipe distance
    const limitedDiff = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, diff));
    setSwipeOffset(limitedDiff);
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    
    if (swipeOffset > SWIPE_THRESHOLD) {
      // Swiped right - show left actions
      setIsSwipingRight(true);
      setIsSwipingLeft(false);
      setSwipeOffset(MAX_SWIPE);
    } else if (swipeOffset < -SWIPE_THRESHOLD) {
      // Swiped left - show right actions
      setIsSwipingLeft(true);
      setIsSwipingRight(false);
      setSwipeOffset(-MAX_SWIPE);
    } else {
      // Reset
      setSwipeOffset(0);
      setIsSwipingLeft(false);
      setIsSwipingRight(false);
    }
  };

  const resetSwipe = () => {
    setSwipeOffset(0);
    setIsSwipingLeft(false);
    setIsSwipingRight(false);
  };

  const bothSigned = contract.proprietar_signed && contract.chirias_signed;
  const anySigned = contract.proprietar_signed || contract.chirias_signed;

  return (
    <div className="relative overflow-hidden rounded-lg mb-3">
      {/* Left actions (visible when swiping right) */}
      <div 
        className={cn(
          "absolute inset-y-0 left-0 flex items-center gap-1 px-2 bg-gradient-to-r from-blue-600 to-blue-500 transition-opacity",
          isSwipingRight ? "opacity-100" : "opacity-0"
        )}
        style={{ width: MAX_SWIPE }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-white hover:bg-white/20"
          onClick={() => { onPreview(); resetSwipe(); }}
          disabled={isPreviewing}
        >
          {isPreviewing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </Button>
        {contract.pdf_url && (
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-white hover:bg-white/20"
            onClick={() => { onDownloadPdf(); resetSwipe(); }}
          >
            <Download className="h-5 w-5" />
          </Button>
        )}
        {anySigned && (
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-white hover:bg-white/20"
            onClick={() => { onRegenerate(); resetSwipe(); }}
            disabled={isRegenerating}
          >
            {isRegenerating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <FilePlus2 className="h-5 w-5" />
            )}
          </Button>
        )}
      </div>

      {/* Right actions (visible when swiping left) */}
      <div 
        className={cn(
          "absolute inset-y-0 right-0 flex items-center gap-1 px-2 bg-gradient-to-l from-red-600 to-orange-500 transition-opacity",
          isSwipingLeft ? "opacity-100" : "opacity-0"
        )}
        style={{ width: MAX_SWIPE }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-white hover:bg-white/20"
          onClick={() => { onCopySignatureLink('proprietar'); resetSwipe(); }}
          title="Link semnare proprietar"
        >
          <PenTool className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-white hover:bg-white/20"
          onClick={() => { onSendWhatsApp('chirias'); resetSwipe(); }}
          title="WhatsApp chiriaș"
        >
          <MessageCircle className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-white hover:bg-white/20"
          onClick={() => { onDelete(); resetSwipe(); }}
          title="Șterge"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Main card content */}
      <Card
        className={cn(
          "transition-transform duration-200 ease-out touch-pan-y",
          (isSwipingLeft || isSwipingRight) && "shadow-lg"
        )}
        style={{ 
          transform: `translateX(${swipeOffset}px)`,
          transition: isDraggingRef.current ? 'none' : 'transform 0.2s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <CardContent className="p-4">
          {/* Header with name and signatures */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground truncate">
                {contract.client_prenume} {contract.client_name}
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Calendar className="h-3 w-3" />
                {format(new Date(contract.created_at), 'dd MMM yyyy', { locale: ro })}
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Badge 
                variant="outline"
                className={cn(
                  "text-xs px-1.5",
                  contract.proprietar_signed 
                    ? "bg-green-500/20 text-green-600 border-green-500/30" 
                    : "bg-yellow-500/20 text-yellow-600 border-yellow-500/30"
                )}
              >
                P {contract.proprietar_signed ? '✓' : '○'}
              </Badge>
              <Badge 
                variant="outline"
                className={cn(
                  "text-xs px-1.5",
                  contract.chirias_signed 
                    ? "bg-green-500/20 text-green-600 border-green-500/30" 
                    : "bg-yellow-500/20 text-yellow-600 border-yellow-500/30"
                )}
              >
                C {contract.chirias_signed ? '✓' : '○'}
              </Badge>
            </div>
          </div>

          {/* Property address */}
          <div className="flex items-start gap-2 text-sm mb-2">
            <Home className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <span className="text-muted-foreground line-clamp-2">{contract.property_address}</span>
          </div>

          {/* Price */}
          {contract.property_price && (
            <div className="flex items-center gap-2 text-sm">
              <Euro className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-foreground">
                {contract.property_price.toLocaleString()} {contract.property_currency || 'EUR'}/lună
              </span>
            </div>
          )}

          {/* Swipe hints */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ChevronLeft className="h-3 w-3" />
              <span>Acțiuni</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>Vizualizare</span>
              <ChevronRight className="h-3 w-3" />
            </div>
          </div>

          {/* Quick action buttons (always visible) */}
          <div className="flex items-center justify-center gap-2 mt-3">
            {(contract.pdf_url || anySigned) && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={onPreview}
                disabled={isPreviewing}
              >
                {isPreviewing ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4 mr-1" />
                )}
                Previzualizare
              </Button>
            )}
            {!contract.proprietar_signed && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onSendEmail('proprietar')}
              >
                <Mail className="h-4 w-4 mr-1" />
                Email P
              </Button>
            )}
            {!contract.chirias_signed && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onSendEmail('chirias')}
              >
                <Mail className="h-4 w-4 mr-1" />
                Email C
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

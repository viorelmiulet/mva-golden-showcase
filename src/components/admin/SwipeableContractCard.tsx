import { useState, useRef, TouchEvent } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Loader2,
  FileText,
  FileType
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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
          onClick={() => { setDeleteDialogOpen(true); resetSwipe(); }}
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
        <CardContent className="p-4 space-y-3">
          {/* Header with name and signatures */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground text-base leading-tight">
                {contract.client_prenume} {contract.client_name}
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                {format(new Date(contract.created_at), 'dd MMM yyyy', { locale: ro })}
              </p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <Badge 
                variant="outline"
                className={cn(
                  "text-xs px-2 py-0.5",
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
                  "text-xs px-2 py-0.5",
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
          <div className="flex items-start gap-2 text-sm">
            <Home className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <span className="text-muted-foreground line-clamp-2 leading-relaxed">{contract.property_address}</span>
          </div>

          {/* Price */}
          {contract.property_price && (
            <div className="flex items-center gap-2 text-sm">
              <Euro className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium text-foreground">
                {contract.property_price.toLocaleString()} {contract.property_currency || 'EUR'}/lună
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-3 border-t border-border/50 space-y-2.5">
            {/* Preview row */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="col-span-2 h-10"
                onClick={onPreview}
                disabled={isPreviewing}
              >
                {isPreviewing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                Previzualizare
              </Button>
              {anySigned ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10"
                  onClick={onRegenerate}
                  disabled={isRegenerating}
                  title="Regenerează PDF"
                >
                  {isRegenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FilePlus2 className="h-4 w-4" />
                  )}
                </Button>
              ) : (
                <div className="h-10" />
              )}
            </div>
            
            {/* Download row */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-10"
                onClick={onDownloadPdf}
                disabled={!contract.pdf_url}
              >
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-10"
                onClick={onDownloadDocx}
                disabled={!contract.docx_url}
              >
                <FileType className="h-4 w-4 mr-2" />
                Word
              </Button>
            </div>
            
            {/* Signature links row */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-10"
                onClick={() => onCopySignatureLink('proprietar')}
                disabled={contract.proprietar_signed}
              >
                <PenTool className="h-4 w-4 mr-2" />
                <span className="truncate">{contract.proprietar_signed ? 'P semnat ✓' : 'Link semnare P'}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-10"
                onClick={() => onCopySignatureLink('chirias')}
                disabled={contract.chirias_signed}
              >
                <PenTool className="h-4 w-4 mr-2" />
                <span className="truncate">{contract.chirias_signed ? 'C semnat ✓' : 'Link semnare C'}</span>
              </Button>
            </div>
            
            {/* Email & WhatsApp for Proprietar */}
            {!contract.proprietar_signed && (
              <div className="grid grid-cols-4 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="col-span-3 h-10"
                  onClick={() => onSendEmail('proprietar')}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email Proprietar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10"
                  onClick={() => onSendWhatsApp('proprietar')}
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {/* Email & WhatsApp for Chirias */}
            {!contract.chirias_signed && (
              <div className="grid grid-cols-4 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="col-span-3 h-10"
                  onClick={() => onSendEmail('chirias')}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email Chiriaș
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10"
                  onClick={() => onSendWhatsApp('chirias')}
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {/* Delete button */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-10 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Șterge contract
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmați ștergerea?</AlertDialogTitle>
            <AlertDialogDescription>
              Sunteți sigur că doriți să ștergeți contractul pentru{" "}
              <span className="font-medium text-foreground">
                {contract.client_prenume} {contract.client_name}
              </span>
              ? Această acțiune nu poate fi anulată.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

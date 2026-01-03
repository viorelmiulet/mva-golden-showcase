import { useNavigate } from "react-router-dom";
import { ChevronLeft, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileHeaderProps {
  title?: string;
  showBack?: boolean;
  showShare?: boolean;
  onShare?: () => void;
  rightAction?: React.ReactNode;
}

const MobileHeader = ({ 
  title, 
  showBack = false, 
  showShare = false,
  onShare,
  rightAction 
}: MobileHeaderProps) => {
  const navigate = useNavigate();

  const handleShare = async () => {
    if (onShare) {
      onShare();
    } else if (navigator.share) {
      try {
        await navigator.share({
          title: title || 'MVA Imobiliare',
          url: window.location.href
        });
      } catch (err) {
        // Share cancelled
      }
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border h-14">
      <div className="flex items-center justify-between h-full px-3 max-w-lg mx-auto">
        <div className="flex items-center gap-2 min-w-[40px]">
          {showBack ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-9 w-9 -ml-2"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          ) : (
            <img 
              src="/mva-logo-luxury.svg" 
              alt="MVA" 
              className="h-8 w-8"
            />
          )}
        </div>

        {title && (
          <h1 className="text-base font-semibold text-center flex-1 truncate px-2">
            {title}
          </h1>
        )}

        <div className="flex items-center gap-1 min-w-[40px] justify-end">
          {showShare && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="h-9 w-9 -mr-2"
            >
              <Share2 className="w-5 h-5" />
            </Button>
          )}
          {rightAction}
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;

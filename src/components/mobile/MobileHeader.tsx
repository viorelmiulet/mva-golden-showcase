import { useNavigate } from "react-router-dom";
import { ChevronLeft, Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileHeaderProps {
  title?: string;
  showBack?: boolean;
  showNotifications?: boolean;
  showSettings?: boolean;
  rightAction?: React.ReactNode;
}

const MobileHeader = ({ 
  title, 
  showBack = false, 
  showNotifications = false,
  showSettings = false,
  rightAction 
}: MobileHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border/50 pt-safe">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2 min-w-[48px]">
          {showBack ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-9 w-9"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          ) : (
            <img 
              src="/mva-logo-luxury-horizontal.svg" 
              alt="MVA" 
              className="h-6"
            />
          )}
        </div>

        {title && (
          <h1 className="text-base font-semibold text-center flex-1 truncate px-2">
            {title}
          </h1>
        )}

        <div className="flex items-center gap-1 min-w-[48px] justify-end">
          {showNotifications && (
            <Button variant="ghost" size="icon" className="h-9 w-9 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gold rounded-full" />
            </Button>
          )}
          {showSettings && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              onClick={() => navigate("/app/setari")}
            >
              <Settings className="w-5 h-5" />
            </Button>
          )}
          {rightAction}
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;

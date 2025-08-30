import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Cookie } from "lucide-react";

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookieConsent", "accepted");
    setIsVisible(false);
  };

  const rejectCookies = () => {
    localStorage.setItem("cookieConsent", "rejected");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:max-w-md">
      <Card className="p-4 bg-background/95 backdrop-blur-sm border shadow-lg">
        <div className="flex items-start gap-3">
          <Cookie className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-2">Consimțământ Cookie-uri</h3>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
              Folosim cookie-uri pentru a îmbunătăți experiența dvs. pe site, 
              pentru analiză trafic și pentru funcționalități personalizate. 
              Acceptând, sunteți de acord cu politica noastră de cookie-uri.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={acceptCookies} 
                size="sm"
                className="text-xs"
              >
                Accept toate
              </Button>
              <Button 
                onClick={rejectCookies} 
                variant="outline" 
                size="sm"
                className="text-xs"
              >
                Doar necesare
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={rejectCookies}
            className="h-auto p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default CookieConsent;
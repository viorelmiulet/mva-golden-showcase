import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import MobileHeader from "@/components/mobile/MobileHeader";
import { GoogleTranslate } from "@/components/GoogleTranslate";
import { 
  Phone, 
  Mail,
  Globe,
  Info,
  FileText
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const MobileAccount = () => {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader title={language === 'ro' ? 'Setări' : 'Settings'} showBack />
      <div className="pt-14 px-4 pb-4">
        {/* Settings */}
        <div className="mt-4 space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground px-1">
            {language === 'ro' ? 'Setări' : 'Settings'}
          </h3>
          <Card>
            <CardContent className="p-0 divide-y divide-border/50">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm">
                    {language === 'ro' ? 'Limbă' : 'Language'}
                  </span>
                </div>
                <GoogleTranslate />
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <h3 className="text-sm font-medium text-muted-foreground px-1 pt-4">
            {language === 'ro' ? 'Contact' : 'Contact'}
          </h3>
          <Card>
            <CardContent className="p-0 divide-y divide-border/50">
              <a href="tel:0767941512" className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm">0767 941 512</span>
                </div>
              </a>
              <a href="mailto:contact@mvaimobiliare.ro" className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm">contact@mvaimobiliare.ro</span>
                </div>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MobileAccount;
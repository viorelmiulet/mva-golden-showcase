import { useState, useEffect } from 'react';
import { Globe, ChevronDown, Check, ExternalLink } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const languages = [
  { code: 'ro', name: 'Română', flag: '🇷🇴' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'hu', name: 'Magyar', flag: '🇭🇺' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'uk', name: 'Українська', flag: '🇺🇦' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
];

export const GoogleTranslate = ({ className }: { className?: string }) => {
  const [currentLanguage, setCurrentLanguage] = useState('ro');

  useEffect(() => {
    // Check for saved language preference
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang) {
      setCurrentLanguage(savedLang);
    }
  }, []);

  const translatePage = (langCode: string) => {
    // Save preference
    localStorage.setItem('preferredLanguage', langCode);
    setCurrentLanguage(langCode);
    
    // Get current URL
    const currentUrl = window.location.href;
    
    // If selecting Romanian (original language), just reload without translation
    if (langCode === 'ro') {
      // Remove any existing translation by going to original URL
      if (window.location.hostname.includes('translate.goog')) {
        // Extract original URL from translated URL
        const url = new URL(currentUrl);
        const originalHost = url.searchParams.get('_x_tr_pto') || url.hostname.replace('.translate.goog', '');
        window.location.href = `https://${originalHost}${url.pathname}`;
      }
      return;
    }
    
    // Use Google Translate's website translation feature
    const translateUrl = `https://translate.google.com/translate?sl=ro&tl=${langCode}&u=${encodeURIComponent(currentUrl)}`;
    window.open(translateUrl, '_blank');
  };

  const currentLang = languages.find(l => l.code === currentLanguage) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn(
            "h-9 px-2.5 gap-1.5 text-xs font-medium hover:bg-gold/10 hover:text-gold transition-all duration-300",
            className
          )}
        >
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline">{currentLang.flag}</span>
          <span className="hidden md:inline">{currentLang.name}</span>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-52 max-h-80 overflow-y-auto bg-background/95 backdrop-blur-xl border-gold/20"
      >
        <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">
          Traducere automată Google
        </div>
        <DropdownMenuSeparator />
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => translatePage(lang.code)}
            className={cn(
              "flex items-center gap-3 cursor-pointer transition-colors",
              currentLanguage === lang.code && "bg-gold/10 text-gold"
            )}
          >
            <span className="text-lg">{lang.flag}</span>
            <span className="flex-1">{lang.name}</span>
            {lang.code !== 'ro' && (
              <ExternalLink className="w-3 h-3 opacity-40" />
            )}
            {currentLanguage === lang.code && (
              <Check className="w-4 h-4 text-gold" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default GoogleTranslate;

import { useEffect, useState, useRef } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: () => void;
  }
}

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
  const [isLoaded, setIsLoaded] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Add Google Translate script
    const addScript = () => {
      const script = document.createElement('script');
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    };

    // Initialize Google Translate
    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'ro',
          includedLanguages: languages.map(l => l.code).join(','),
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
        },
        'google_translate_element'
      );
      setIsLoaded(true);
    };

    addScript();

    // Check for saved language preference
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang) {
      setCurrentLanguage(savedLang);
    }

    // Add CSS to hide default Google Translate widget
    const style = document.createElement('style');
    style.innerHTML = `
      #google_translate_element {
        position: absolute;
        visibility: hidden;
        height: 0;
        width: 0;
        overflow: hidden;
      }
      .goog-te-banner-frame,
      .goog-te-balloon-frame,
      #goog-gt-tt,
      .goog-te-spinner-pos,
      .goog-tooltip,
      .goog-tooltip:hover {
        display: none !important;
      }
      body {
        top: 0 !important;
      }
      .skiptranslate {
        display: none !important;
      }
      .goog-te-gadget {
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      // Cleanup
    };
  }, []);

  const changeLanguage = (langCode: string) => {
    const googleTranslateSelect = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    
    if (googleTranslateSelect) {
      googleTranslateSelect.value = langCode;
      googleTranslateSelect.dispatchEvent(new Event('change'));
      setCurrentLanguage(langCode);
      localStorage.setItem('preferredLanguage', langCode);
    } else {
      // Fallback: Try again after a short delay
      setTimeout(() => {
        const retrySelect = document.querySelector('.goog-te-combo') as HTMLSelectElement;
        if (retrySelect) {
          retrySelect.value = langCode;
          retrySelect.dispatchEvent(new Event('change'));
          setCurrentLanguage(langCode);
          localStorage.setItem('preferredLanguage', langCode);
        }
      }, 500);
    }
  };

  const currentLang = languages.find(l => l.code === currentLanguage) || languages[0];

  return (
    <>
      {/* Hidden Google Translate element */}
      <div id="google_translate_element" />
      
      {/* Custom language selector */}
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
          className="w-48 max-h-80 overflow-y-auto bg-background/95 backdrop-blur-xl border-gold/20"
        >
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={cn(
                "flex items-center gap-3 cursor-pointer transition-colors",
                currentLanguage === lang.code && "bg-gold/10 text-gold"
              )}
            >
              <span className="text-lg">{lang.flag}</span>
              <span className="flex-1">{lang.name}</span>
              {currentLanguage === lang.code && (
                <Check className="w-4 h-4 text-gold" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default GoogleTranslate;

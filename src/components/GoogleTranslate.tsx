import { useState, useEffect, useCallback } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  const [isReady, setIsReady] = useState(false);

  // Initialize Google Translate
  useEffect(() => {
    // Check if already loaded
    if (document.getElementById('google-translate-script')) {
      setIsReady(true);
      return;
    }

    // Create the hidden container for Google Translate
    if (!document.getElementById('google_translate_element')) {
      const container = document.createElement('div');
      container.id = 'google_translate_element';
      container.style.cssText = 'position: absolute; top: -9999px; left: -9999px; visibility: hidden;';
      document.body.appendChild(container);
    }

    // Define the callback function
    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'ro',
            includedLanguages: languages.map(l => l.code).join(','),
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          'google_translate_element'
        );
        setIsReady(true);
      }
    };

    // Load the script
    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.body.appendChild(script);

    // Add styles to hide Google Translate UI elements
    const style = document.createElement('style');
    style.id = 'google-translate-styles';
    style.textContent = `
      .goog-te-banner-frame, 
      .goog-te-balloon-frame,
      #goog-gt-tt, 
      .goog-te-spinner-pos,
      .goog-tooltip,
      .goog-tooltip:hover,
      .goog-text-highlight {
        display: none !important;
      }
      body {
        top: 0 !important;
        position: static !important;
      }
      .skiptranslate {
        display: none !important;
        height: 0 !important;
      }
      .goog-te-gadget {
        display: none !important;
      }
      iframe.goog-te-banner-frame {
        display: none !important;
      }
      body > .skiptranslate {
        display: none !important;
      }
      body {
        top: 0 !important;
      }
    `;
    document.head.appendChild(style);

    // Check saved preference
    const savedLang = localStorage.getItem('googleTranslateLang');
    if (savedLang && savedLang !== 'ro') {
      setCurrentLanguage(savedLang);
    }

    return () => {
      // Cleanup is optional since we want to keep translation active
    };
  }, []);

  const changeLanguage = useCallback((langCode: string) => {
    setCurrentLanguage(langCode);
    localStorage.setItem('googleTranslateLang', langCode);

    // Find the Google Translate select element
    const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    
    if (selectElement) {
      if (langCode === 'ro') {
        // Reset to original language
        selectElement.value = '';
        selectElement.dispatchEvent(new Event('change'));
        
        // Also try to restore original content
        const frame = document.querySelector('.goog-te-banner-frame') as HTMLIFrameElement;
        if (frame) {
          const closeButton = frame.contentDocument?.querySelector('.goog-close-link') as HTMLElement;
          if (closeButton) {
            closeButton.click();
          }
        }
        
        // Force page refresh to original if translation persists
        setTimeout(() => {
          const cookie = document.cookie;
          if (cookie.includes('googtrans')) {
            document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname;
            window.location.reload();
          }
        }, 100);
      } else {
        selectElement.value = langCode;
        selectElement.dispatchEvent(new Event('change'));
      }
    } else {
      // If select not found, try again after a delay
      setTimeout(() => {
        const retrySelect = document.querySelector('.goog-te-combo') as HTMLSelectElement;
        if (retrySelect) {
          if (langCode === 'ro') {
            retrySelect.value = '';
          } else {
            retrySelect.value = langCode;
          }
          retrySelect.dispatchEvent(new Event('change'));
        }
      }, 1000);
    }
  }, []);

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
        className="w-52 max-h-80 overflow-y-auto bg-background border border-border shadow-lg z-[9999]"
        sideOffset={5}
      >
        <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">
          Traducere Google
        </div>
        <DropdownMenuSeparator />
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
  );
};

export default GoogleTranslate;

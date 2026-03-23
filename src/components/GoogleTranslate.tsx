import { useState, useEffect } from 'react';
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

// Helper to get/set googtrans cookie
const getGoogTransCookie = (): string | null => {
  const match = document.cookie.match(/googtrans=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
};

const setGoogTransCookie = (langCode: string) => {
  const value = langCode === 'ro' ? '' : `/ro/${langCode}`;
  const domain = window.location.hostname;
  
  // Clear existing cookies first
  document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}`;
  document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain}`;
  
  if (value) {
    // Set new cookie
    document.cookie = `googtrans=${encodeURIComponent(value)}; path=/;`;
    document.cookie = `googtrans=${encodeURIComponent(value)}; path=/; domain=${domain}`;
  }
};

const getCurrentLanguageFromCookie = (): string => {
  const cookie = getGoogTransCookie();
  if (cookie) {
    const parts = cookie.split('/');
    if (parts.length >= 3) {
      return parts[2];
    }
  }
  return 'ro';
};

export const GoogleTranslate = ({ className }: { className?: string }) => {
  const [currentLanguage, setCurrentLanguage] = useState(() => getCurrentLanguageFromCookie());
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isLoadingScript, setIsLoadingScript] = useState(false);

  const ensureTranslateInfrastructure = () => {
    if (!document.getElementById('google_translate_element')) {
      const container = document.createElement('div');
      container.id = 'google_translate_element';
      container.style.cssText = 'display: none !important;';
      document.body.appendChild(container);
    }

    if (!document.getElementById('google-translate-hide-styles')) {
      const style = document.createElement('style');
      style.id = 'google-translate-hide-styles';
      style.textContent = `
        .goog-te-banner-frame,
        .goog-te-balloon-frame,
        #goog-gt-tt,
        .goog-te-spinner-pos,
        .goog-tooltip,
        .goog-tooltip:hover,
        .goog-text-highlight,
        .skiptranslate,
        .goog-te-gadget,
        iframe.goog-te-banner-frame,
        body > .skiptranslate,
        #google_translate_element {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          width: 0 !important;
          overflow: hidden !important;
        }
        body {
          top: 0 !important;
          position: static !important;
        }
        .translated-ltr, .translated-rtl {
          margin-top: 0 !important;
        }
        html.translated-ltr, html.translated-rtl {
          overflow: visible !important;
        }
      `;
      document.head.appendChild(style);
    }
  };

  const loadTranslateScript = () => {
    if (isScriptLoaded || isLoadingScript) return;

    if (document.getElementById('google-translate-script')) {
      setIsScriptLoaded(true);
      return;
    }

    setIsLoadingScript(true);
    ensureTranslateInfrastructure();

    (window as any).googleTranslateElementInit = function() {
      new (window as any).google.translate.TranslateElement({
        pageLanguage: 'ro',
        includedLanguages: languages.map(l => l.code).join(','),
        layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false,
        multilanguagePage: true,
      }, 'google_translate_element');
      setIsScriptLoaded(true);
      setIsLoadingScript(false);
    };

    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    script.onerror = () => setIsLoadingScript(false);
    document.body.appendChild(script);
  };

  useEffect(() => {
    if (document.getElementById('google-translate-script')) {
      ensureTranslateInfrastructure();
      setIsScriptLoaded(true);
      return;
    }

    if (currentLanguage !== 'ro') {
      const startLoading = () => window.setTimeout(loadTranslateScript, 0);

      if (document.readyState === 'complete') {
        startLoading();
      } else {
        window.addEventListener('load', startLoading, { once: true });
        return () => window.removeEventListener('load', startLoading);
      }
    }
  }, []);

  const changeLanguage = (langCode: string) => {
    setCurrentLanguage(langCode);
    
    // Set cookie and trigger translation
    setGoogTransCookie(langCode);
    
    // Try to use the select element if available
    const selectEl = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (selectEl) {
      if (langCode === 'ro') {
        // Reset to original
        selectEl.value = '';
        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
        // If still translated, force reload
        setTimeout(() => {
          if (document.querySelector('.translated-ltr, .translated-rtl')) {
            window.location.reload();
          }
        }, 500);
      } else {
        selectEl.value = langCode;
        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } else {
      // Fallback: reload page to apply cookie-based translation
      window.location.reload();
    }
  };

  const currentLang = languages.find(l => l.code === currentLanguage) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          onMouseEnter={loadTranslateScript}
          onFocus={loadTranslateScript}
          onClick={loadTranslateScript}
          onTouchStart={loadTranslateScript}
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
          Selectează limba
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

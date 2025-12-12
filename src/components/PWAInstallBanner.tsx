import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed or dismissed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      // Show again after 7 days
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // Show banner after 3 seconds on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setIsDismissed(true);
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
  };

  if (!showBanner || isDismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-40 animate-fade-in">
      <div className="bg-card/95 backdrop-blur-md border border-gold/30 rounded-2xl p-4 shadow-2xl shadow-gold/10">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-secondary/80 transition-colors"
          aria-label="Închide"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/20 to-gold-dark/20 flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-6 h-6 text-gold" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground text-sm mb-1">
              Instalează aplicația
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Acces rapid la apartamente direct de pe telefonul tău
            </p>

            <div className="flex gap-2">
              {deferredPrompt ? (
                <Button
                  variant="luxury"
                  size="sm"
                  onClick={handleInstall}
                  className="h-9 text-xs flex-1"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Instalează
                </Button>
              ) : (
                <Link to="/instaleaza" className="flex-1">
                  <Button
                    variant="luxury"
                    size="sm"
                    className="h-9 text-xs w-full"
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Vezi cum
                  </Button>
                </Link>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDismiss}
                className="h-9 text-xs border-gold/20 hover:bg-gold/10"
              >
                Mai târziu
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallBanner;

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, Monitor, Share, MoreVertical, Plus, CheckCircle2, ArrowDown } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallAppPage = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
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
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  if (isInstalled) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-green-500">Aplicația este instalată!</CardTitle>
            <CardDescription>
              MVA Admin este deja instalat pe dispozitivul tău. O poți găsi pe ecranul principal.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
          <img 
            src="/mva-logo-luxury.svg" 
            alt="MVA Admin" 
            className="w-12 h-12"
          />
        </div>
        <h1 className="text-3xl font-bold">Instalează MVA Admin</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Adaugă aplicația pe telefonul tău pentru acces rapid la panoul de administrare
        </p>
      </div>

      {/* Direct Install Button (Chrome/Edge) */}
      {deferredPrompt && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6">
            <Button 
              onClick={handleInstall} 
              className="w-full h-14 text-lg"
              variant="luxury"
            >
              <Download className="w-5 h-5 mr-2" />
              Instalează Acum
            </Button>
          </CardContent>
        </Card>
      )}

      {/* iOS Instructions */}
      {isIOS && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Instrucțiuni pentru iPhone/iPad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-primary">1</span>
              </div>
              <div>
                <p className="font-medium">Apasă pe butonul Share</p>
                <p className="text-sm text-muted-foreground">
                  Găsește iconița <Share className="w-4 h-4 inline mx-1" /> în bara de jos a Safari
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-primary">2</span>
              </div>
              <div>
                <p className="font-medium">Derulează și selectează "Add to Home Screen"</p>
                <p className="text-sm text-muted-foreground">
                  Caută opțiunea <Plus className="w-4 h-4 inline mx-1" /> Add to Home Screen
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-primary">3</span>
              </div>
              <div>
                <p className="font-medium">Confirmă instalarea</p>
                <p className="text-sm text-muted-foreground">
                  Apasă "Add" în colțul din dreapta sus
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-sm text-amber-600 dark:text-amber-400">
                <strong>Important:</strong> Asigură-te că folosești Safari. Alte browsere nu suportă instalarea PWA pe iOS.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Android Instructions */}
      {isAndroid && !deferredPrompt && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Instrucțiuni pentru Android
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-primary">1</span>
              </div>
              <div>
                <p className="font-medium">Deschide meniul browserului</p>
                <p className="text-sm text-muted-foreground">
                  Apasă pe <MoreVertical className="w-4 h-4 inline mx-1" /> în colțul din dreapta sus
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-primary">2</span>
              </div>
              <div>
                <p className="font-medium">Selectează "Install app" sau "Add to Home screen"</p>
                <p className="text-sm text-muted-foreground">
                  Opțiunea poate varia în funcție de browser
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-primary">3</span>
              </div>
              <div>
                <p className="font-medium">Confirmă instalarea</p>
                <p className="text-sm text-muted-foreground">
                  Apasă "Install" în dialogul care apare
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Desktop Instructions */}
      {!isIOS && !isAndroid && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Instrucțiuni pentru Desktop
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {deferredPrompt ? (
              <p className="text-muted-foreground">
                Folosește butonul de mai sus pentru a instala aplicația.
              </p>
            ) : (
              <>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Caută iconița de instalare în bara de adrese</p>
                    <p className="text-sm text-muted-foreground">
                      În Chrome/Edge, vei vedea o iconiță <Download className="w-4 h-4 inline mx-1" /> în dreapta barei de adrese
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary">2</span>
                  </div>
                  <div>
                    <p className="font-medium">Click pe iconiță și confirmă instalarea</p>
                    <p className="text-sm text-muted-foreground">
                      Apasă "Install" în dialogul care apare
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>De ce să instalezi aplicația?</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
              <span>Acces rapid direct de pe ecranul principal</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
              <span>Funcționează și offline (pentru pagini vizitate anterior)</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
              <span>Experiență fullscreen fără bara browserului</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
              <span>Încărcare mai rapidă după prima vizită</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstallAppPage;

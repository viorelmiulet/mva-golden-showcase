import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Smartphone, Check, Share, MoreVertical } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

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
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <>
      <Helmet>
        <title>Instalează Aplicația | MVA Imobiliare</title>
        <meta name="description" content="Instalează aplicația MVA Imobiliare pe telefonul tău pentru acces rapid la apartamente și proprietăți." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background py-12 px-4">
        <div className="container mx-auto max-w-2xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center mb-6">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-gold/50 mr-3"></div>
              <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/30 px-4 py-1.5">
                Aplicație Mobilă
              </Badge>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-gold/50 ml-3"></div>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              <span className="text-foreground">Instalează </span>
              <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                MVA Imobiliare
              </span>
            </h1>
            
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Acces instant la apartamente și proprietăți, chiar de pe ecranul principal al telefonului tău.
            </p>
          </div>

          {/* Benefits */}
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            {[
              'Acces rapid fără browser',
              'Funcționează și offline',
              'Notificări pentru oferte noi',
              'Experiență ca o aplicație nativă'
            ].map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 p-4 rounded-xl bg-card border border-gold/10">
                <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-gold" />
                </div>
                <span className="text-foreground font-medium">{benefit}</span>
              </div>
            ))}
          </div>

          {/* Install Card */}
          <Card className="border-gold/20 bg-card/80 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-6 sm:p-8">
              {isInstalled ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Aplicația este instalată!</h2>
                  <p className="text-muted-foreground">
                    Găsește MVA Imobiliare pe ecranul principal al telefonului tău.
                  </p>
                </div>
              ) : isIOS ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <Smartphone className="w-12 h-12 text-gold mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-foreground mb-2">Instalare pe iPhone/iPad</h2>
                    <p className="text-muted-foreground text-sm">Urmează pașii de mai jos pentru a instala aplicația:</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/50">
                      <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 text-gold font-bold">1</div>
                      <div>
                        <p className="font-medium text-foreground">Apasă pe butonul Share</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Share className="w-4 h-4" /> din bara Safari
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/50">
                      <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 text-gold font-bold">2</div>
                      <div>
                        <p className="font-medium text-foreground">Selectează "Add to Home Screen"</p>
                        <p className="text-sm text-muted-foreground">sau "Adaugă pe ecranul principal"</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/50">
                      <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 text-gold font-bold">3</div>
                      <div>
                        <p className="font-medium text-foreground">Confirmă cu "Add"</p>
                        <p className="text-sm text-muted-foreground">Aplicația va apărea pe ecranul principal</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : deferredPrompt ? (
                <div className="text-center py-4">
                  <Smartphone className="w-16 h-16 text-gold mx-auto mb-6" />
                  <h2 className="text-2xl font-bold text-foreground mb-4">Gata de instalare!</h2>
                  <p className="text-muted-foreground mb-6">
                    Apasă butonul de mai jos pentru a instala aplicația.
                  </p>
                  <Button 
                    variant="luxury" 
                    size="lg" 
                    onClick={handleInstall}
                    className="w-full sm:w-auto h-14 px-8 text-lg"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Instalează Aplicația
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <Smartphone className="w-12 h-12 text-gold mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-foreground mb-2">Instalare pe Android</h2>
                    <p className="text-muted-foreground text-sm">Urmează pașii de mai jos pentru a instala aplicația:</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/50">
                      <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 text-gold font-bold">1</div>
                      <div>
                        <p className="font-medium text-foreground">Apasă pe meniul browser-ului</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MoreVertical className="w-4 h-4" /> (cele 3 puncte din dreapta sus)
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/50">
                      <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 text-gold font-bold">2</div>
                      <div>
                        <p className="font-medium text-foreground">Selectează "Install app"</p>
                        <p className="text-sm text-muted-foreground">sau "Add to Home screen"</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/50">
                      <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 text-gold font-bold">3</div>
                      <div>
                        <p className="font-medium text-foreground">Confirmă instalarea</p>
                        <p className="text-sm text-muted-foreground">Aplicația va apărea pe ecranul principal</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Back link */}
          <div className="text-center mt-8">
            <a href="/" className="text-gold hover:text-gold-light transition-colors">
              ← Înapoi la site
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default Install;

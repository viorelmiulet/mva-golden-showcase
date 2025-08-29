import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";
import { Activity, BarChart3, Eye, MessageCircle, Phone } from "lucide-react";

/**
 * Component pentru testarea și debugging Google Analytics
 * Afișează butoane pentru testarea diferitelor evenimente GA4
 */
const AnalyticsDebug = () => {
  const { 
    testGoogleAnalytics, 
    trackEvent, 
    trackContact, 
    trackChatUsage,
    trackPropertyInteraction 
  } = useGoogleAnalytics();

  const handleTestGA = () => {
    const isWorking = testGoogleAnalytics();
    if (isWorking) {
      alert('✅ Google Analytics funcționează! Verifică consola pentru detalii.');
    } else {
      alert('❌ Google Analytics nu funcționează. Verifică consola pentru erori.');
    }
  };

  const testEvents = [
    {
      title: "Test Contact WhatsApp",
      description: "Simulează click pe butonul de WhatsApp",
      icon: Phone,
      action: () => trackContact('whatsapp', 'debug_test'),
      color: "bg-green-500"
    },
    {
      title: "Test Chat Usage", 
      description: "Simulează deschiderea chat-ului",
      icon: MessageCircle,
      action: () => trackChatUsage('open'),
      color: "bg-blue-500"
    },
    {
      title: "Test Property View",
      description: "Simulează vizualizarea unei proprietăți",
      icon: Eye,
      action: () => trackPropertyInteraction('test_property_123', 'view'),
      color: "bg-purple-500"
    },
    {
      title: "Test Custom Event",
      description: "Trimite un eveniment personalizat",
      icon: Activity,
      action: () => trackEvent('custom_test', 'debug', 'manual_test', 1),
      color: "bg-orange-500"
    }
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Google Analytics 4 - Test & Debug
        </CardTitle>
        <CardDescription>
          ID: G-HLZFTKHC80 | Testează funcționalitatea Google Analytics
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Test Principal GA */}
        <div className="p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Status Google Analytics</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Verifică dacă GA4 este încărcat și funcțional
          </p>
          <Button onClick={handleTestGA} className="w-full sm:w-auto">
            <Activity className="w-4 h-4 mr-2" />
            Testează GA4 Connection
          </Button>
        </div>

        {/* Test Evenimente */}
        <div>
          <h3 className="font-semibold mb-4">Test Evenimente</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {testEvents.map((event, index) => (
              <div key={index} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded ${event.color} text-white`}>
                    <event.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">{event.title}</h4>
                    <p className="text-xs text-muted-foreground mb-2">{event.description}</p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={event.action}
                      className="w-full"
                    >
                      Testează
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instrucțiuni */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            📊 Cum să verifici în Google Analytics
          </h3>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <p>1. Mergi la <strong>Google Analytics → Reports → Realtime</strong></p>
            <p>2. După ce testezi evenimente, ar trebui să vezi activitate în timp real</p>
            <p>3. Verifică secțiunea <strong>"Events"</strong> pentru evenimentele trimise</p>
            <p>4. Poți să vezi și în <strong>Console (F12)</strong> mesajele de debug</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsDebug;
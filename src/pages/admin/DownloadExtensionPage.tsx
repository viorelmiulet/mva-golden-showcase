import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Chrome, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function DownloadExtensionPage() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  const downloadExtension = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch("/mva-chrome-extension.zip");
      if (!response.ok) throw new Error(`Download failed: ${response.status}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "mva-chrome-extension-v2.2.0.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setIsDownloaded(true);
      toast.success("Extensia v2.2.0 a fost descărcată cu succes!");
    } catch (error) {
      console.error("Error downloading extension:", error);
      toast.error("Eroare la descărcarea extensiei");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card className="border-primary/20">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center mb-4">
            <Chrome className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Extensie Chrome MVA Admin</CardTitle>
          <CardDescription>
            Descarcă extensia v2.2.0 pentru acces rapid la panoul de administrare
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Features */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Acces rapid meniu admin</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Statistici în timp real</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Notificări push email & vizionări</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Autentificare persistentă</span>
            </div>
          </div>

          {/* Download Button */}
          <Button
            onClick={downloadExtension}
            disabled={isDownloading}
            className="w-full h-12 text-lg gap-2"
            size="lg"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Se descarcă...
              </>
            ) : isDownloaded ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Descărcat! Click pentru a descărca din nou
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Descarcă Extensia v2.2.0 (.zip)
              </>
            )}
          </Button>

          {/* Version info */}
          <div className="text-xs text-center text-muted-foreground bg-muted/30 rounded-lg p-3">
            <strong>Versiune:</strong> 2.2.0 — Include autentificare, notificări email, vizionări și semnături contracte
          </div>

          {/* Installation Instructions */}
          <div className="space-y-3 pt-4 border-t">
            <h3 className="font-semibold">Instrucțiuni de instalare:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Dezarhivează fișierul ZIP descărcat</li>
              <li>Deschide Chrome și navighează la <code className="bg-muted px-1.5 py-0.5 rounded">chrome://extensions/</code></li>
              <li>Activează <strong>"Developer mode"</strong> (colțul din dreapta sus)</li>
              <li>Click pe <strong>"Load unpacked"</strong></li>
              <li>Selectează folderul dezarhivat</li>
              <li>Fixează extensia în toolbar pentru acces rapid</li>
            </ol>
          </div>

          {/* Chrome Web Store update */}
          <div className="space-y-3 pt-4 border-t">
            <h3 className="font-semibold">Actualizare Chrome Web Store:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Descarcă ZIP-ul de mai sus</li>
              <li>Mergi la <a href="https://chrome.google.com/webstore/devconsole" target="_blank" rel="noopener noreferrer" className="text-primary underline">Chrome Web Store Developer Dashboard</a></li>
              <li>Selectează extensia MVA Admin Panel</li>
              <li>Click „Package" → „Upload new package"</li>
              <li>Încarcă ZIP-ul descărcat (v2.2.0)</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

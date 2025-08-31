import { Button } from "@/components/ui/button";
import { Download, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const CarteVizita = () => {
  const downloadSVG = () => {
    const link = document.createElement('a');
    link.href = '/carte-vizita-viorel-miulet.svg';
    link.download = 'carte-vizita-viorel-miulet.svg';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Înapoi la site
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Carte de Vizită - Viorel Miulet</h1>
        </div>

        <div className="bg-card rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold mb-4">Previzualizare Carte de Vizită</h2>
            <div className="flex justify-center mb-6">
              <div className="bg-white p-4 rounded-lg shadow-md">
                <img 
                  src="/carte-vizita-viorel-miulet.svg" 
                  alt="Carte de vizită Viorel Miulet" 
                  className="max-w-full h-auto"
                  style={{ width: '350px', height: '200px' }}
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button onClick={downloadSVG} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Descarcă Cartea de Vizită (SVG)
              </Button>
              
              <div className="text-sm text-muted-foreground">
                Dimensiuni: 350x200px | Format: SVG
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-muted rounded-lg">
            <h3 className="font-semibold mb-3">Caracteristici:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Design luxury cu gradiente aurii</li>
              <li>• Logo MVA Imobiliare integrat</li>
              <li>• Informații complete de contact</li>
              <li>• Cod QR WhatsApp funcțional</li>
              <li>• Text: "Vanzari apartamente direct de la dezvoltator"</li>
              <li>• Format SVG pentru imprimare de calitate</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarteVizita;
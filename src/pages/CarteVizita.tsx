import { Button } from "@/components/ui/button";
import { Download, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const CarteVizita = () => {
  const downloadFata = () => {
    const link = document.createElement('a');
    link.href = '/carte-vizita-viorel-miulet.svg';
    link.download = 'carte-vizita-viorel-miulet-fata.svg';
    link.click();
  };

  const downloadVerso = () => {
    const link = document.createElement('a');
    link.href = '/carte-vizita-viorel-miulet-verso.svg';
    link.download = 'carte-vizita-viorel-miulet-verso.svg';
    link.click();
  };

  const downloadBoth = () => {
    downloadFata();
    setTimeout(() => downloadVerso(), 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-8">
      <div className="max-w-6xl mx-auto">
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
            <h2 className="text-xl font-semibold mb-6">Previzualizare Completă Carte de Vizită</h2>
            
            {/* Ambele părți ale cartei */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Fața */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Fața (Front)</h3>
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <img 
                    src={`/carte-vizita-viorel-miulet.svg?v=${Date.now()}`}
                    alt="Carte de vizită Viorel Miulet - Fața" 
                    className="w-full h-auto max-w-[350px] mx-auto"
                  />
                </div>
                <Button onClick={downloadFata} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Descarcă Fața
                </Button>
              </div>

              {/* Verso */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Verso (Back)</h3>
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <img 
                    src={`/carte-vizita-viorel-miulet-verso.svg?v=${Date.now()}`}
                    alt="Carte de vizită Viorel Miulet - Verso" 
                    className="w-full h-auto max-w-[350px] mx-auto"
                  />
                </div>
                <Button onClick={downloadVerso} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Descarcă Verso
                </Button>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button onClick={downloadBoth} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Descarcă Ambele Părți
              </Button>
              
              <div className="text-sm text-muted-foreground">
                Dimensiuni: 350x200px | Format: SVG
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <div className="p-6 bg-muted rounded-lg">
              <h3 className="font-semibold mb-3">Fața - Caracteristici Actualizate:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Logo MVA Imobiliare mai mic și reechilibrat</li>
                <li>• Numele: Viorel Miulet, Agent Imobiliar</li>
                <li>• Informații complete de contact</li>
                <li>• Cod QR WhatsApp curat (fără text lângă QR)</li>
                <li>• Text: "Vanzari apartamente direct de la dezvoltator"</li>
                <li>• Program de lucru detaliat</li>
              </ul>
            </div>

            <div className="p-6 bg-muted rounded-lg">
              <h3 className="font-semibold mb-3">Verso - Caracteristici Actualizate:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Design elegant și minimalist</li>
                <li>• Logo central MVA Imobiliare mai mic</li>
                <li>• Gradiente luxury aurii</li>
                <li>• Design curat (fără "Premium Real Estate")</li>
                <li>• Elemente decorative sofisticate</li>
                <li>• Perfect pentru imprimare profesională</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarteVizita;
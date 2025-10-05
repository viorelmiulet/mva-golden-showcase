import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, ArrowRight } from "lucide-react";

const CarteVizita = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to admin after a short delay
    const timer = setTimeout(() => {
      navigate("/admin");
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mb-4">
            <Upload className="w-8 h-8 text-gold" />
          </div>
          <CardTitle className="text-2xl">Generator Cărți de Vizită</CardTitle>
          <p className="text-muted-foreground mt-2">
            Această funcționalitate a fost mutată în panoul de administrare
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Vei fi redirecționat automat în 3 secunde...
          </p>
          <Button 
            onClick={() => navigate("/admin")} 
            className="w-full"
          >
            Mergi la Admin
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CarteVizita;
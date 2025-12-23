import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eraser, Check, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignaturePadProps {
  title: string;
  onSave: (signatureData: string) => void;
  savedSignature?: string;
}

const SignaturePad = ({ title, onSave, savedSignature }: SignaturePadProps) => {
  const signatureRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleClear = () => {
    signatureRef.current?.clear();
    setIsEmpty(true);
    onSave("");
  };

  const handleSave = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      const dataUrl = signatureRef.current.toDataURL("image/png");
      
      // Show confirmation animation
      setShowConfirmation(true);
      
      // Hide after animation completes
      setTimeout(() => {
        setShowConfirmation(false);
        onSave(dataUrl);
        setIsEmpty(false);
      }, 800);
    }
  };

  const handleEnd = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      setIsEmpty(false);
    }
  };

  return (
    <Card>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn("space-y-3", !title && "pt-4")}>
        {savedSignature ? (
          <div className="space-y-2">
            <div className="border rounded-lg p-2 bg-white">
              <img 
                src={savedSignature} 
                alt="Semnătură" 
                className="max-h-24 mx-auto"
              />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClear}
              className="w-full"
            >
              <Eraser className="h-4 w-4 mr-2" />
              Șterge semnătura
            </Button>
          </div>
        ) : (
          <>
            <div className="relative border-2 border-dashed rounded-lg bg-white overflow-hidden">
              <SignatureCanvas
                ref={signatureRef}
                canvasProps={{
                  className: "w-full h-40 rounded-lg",
                  style: { width: "100%", height: "160px" }
                }}
                backgroundColor="white"
                penColor="black"
                onEnd={handleEnd}
              />
              
              {/* Confirmation Overlay */}
              {showConfirmation && (
                <div className="absolute inset-0 bg-green-500/90 flex flex-col items-center justify-center animate-scale-in">
                  <CheckCircle className="h-16 w-16 text-white animate-[bounce_0.5s_ease-in-out]" />
                  <p className="text-white font-semibold mt-2 text-lg">Salvat!</p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClear}
                className="flex-1"
                disabled={showConfirmation}
              >
                <Eraser className="h-4 w-4 mr-2" />
                Șterge
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave}
                disabled={isEmpty || showConfirmation}
                className={cn(
                  "flex-1 transition-all duration-200",
                  !isEmpty && !showConfirmation && "bg-green-600 hover:bg-green-700"
                )}
              >
                <Check className="h-4 w-4 mr-2" />
                Salvează
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SignaturePad;

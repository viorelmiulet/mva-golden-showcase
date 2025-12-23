import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eraser, Check } from "lucide-react";

interface SignaturePadProps {
  title: string;
  onSave: (signatureData: string) => void;
  savedSignature?: string;
}

const SignaturePad = ({ title, onSave, savedSignature }: SignaturePadProps) => {
  const signatureRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const handleClear = () => {
    signatureRef.current?.clear();
    setIsEmpty(true);
    onSave("");
  };

  const handleSave = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      const dataUrl = signatureRef.current.toDataURL("image/png");
      onSave(dataUrl);
      setIsEmpty(false);
    }
  };

  const handleEnd = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      setIsEmpty(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
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
            <div className="border-2 border-dashed rounded-lg bg-white">
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
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClear}
                className="flex-1"
              >
                <Eraser className="h-4 w-4 mr-2" />
                Șterge
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave}
                disabled={isEmpty}
                className="flex-1"
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

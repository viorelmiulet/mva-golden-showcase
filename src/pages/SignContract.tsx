import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Check, Eraser, FileText, AlertCircle } from "lucide-react";

interface ContractInfo {
  id: string;
  client_name: string;
  client_prenume: string | null;
  property_address: string;
  property_price: number | null;
  contract_date: string;
}

interface SignatureInfo {
  id: string;
  contract_id: string;
  party_type: string;
  signature_data: string | null;
  signed_at: string | null;
  signer_name: string | null;
  contract?: ContractInfo;
}

const SignContract = () => {
  const { token } = useParams<{ token: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSigning, setIsSigning] = useState(false);
  const [signatureInfo, setSignatureInfo] = useState<SignatureInfo | null>(null);
  const [contractInfo, setContractInfo] = useState<ContractInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const signatureRef = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 200 });

  // Resize canvas to fit container
  const updateCanvasSize = useCallback(() => {
    if (containerRef.current) {
      const width = containerRef.current.offsetWidth - 4; // account for border
      setCanvasSize({ width: Math.max(300, width), height: 200 });
    }
  }, []);

  useEffect(() => {
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    // Also update on orientation change for mobile
    window.addEventListener('orientationchange', () => {
      setTimeout(updateCanvasSize, 100);
    });
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      window.removeEventListener('orientationchange', updateCanvasSize);
    };
  }, [updateCanvasSize]);

  useEffect(() => {
    if (token) {
      fetchSignatureInfo();
    }
  }, [token]);

  const fetchSignatureInfo = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch signature info by token
      const { data: sigData, error: sigError } = await supabase
        .from('contract_signatures')
        .select('*')
        .eq('signature_token', token)
        .single();

      if (sigError || !sigData) {
        console.error('Signature fetch error:', sigError);
        setError("Link-ul de semnătură nu este valid sau a expirat.");
        return;
      }

      setSignatureInfo(sigData);

      // Fetch contract info
      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .select('id, client_name, client_prenume, property_address, property_price, contract_date')
        .eq('id', sigData.contract_id)
        .single();

      if (contractError || !contractData) {
        console.error('Contract fetch error:', contractError);
        setError("Contractul nu a fost găsit.");
        return;
      }

      setContractInfo(contractData);
    } catch (err) {
      console.error('Error fetching signature info:', err);
      setError("A apărut o eroare la încărcarea informațiilor.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    signatureRef.current?.clear();
    setIsEmpty(true);
  };

  const handleEnd = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      setIsEmpty(false);
    }
  };

  const handleSign = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast.error("Vă rugăm să desenați semnătura");
      return;
    }

    if (!signatureInfo) return;

    setIsSigning(true);
    try {
      const signatureData = signatureRef.current.toDataURL("image/png");

      const { error: updateError } = await supabase
        .from('contract_signatures')
        .update({
          signature_data: signatureData,
          signed_at: new Date().toISOString(),
          signer_name: signatureInfo.party_type === 'proprietar' 
            ? 'Proprietar' 
            : `${contractInfo?.client_prenume || ''} ${contractInfo?.client_name || ''}`.trim()
        })
        .eq('signature_token', token);

      if (updateError) throw updateError;

      // Update contract signed status
      const updateField = signatureInfo.party_type === 'proprietar' 
        ? { proprietar_signed: true } 
        : { chirias_signed: true };

      await supabase
        .from('contracts')
        .update(updateField)
        .eq('id', signatureInfo.contract_id);

      // Trigger auto-generation of signed PDF if both parties have signed
      try {
        const { data: autoGenResult, error: autoGenError } = await supabase.functions.invoke(
          'auto-generate-signed-contract',
          { body: { contractId: signatureInfo.contract_id } }
        );
        
        if (autoGenError) {
          console.error('Error triggering auto-generate:', autoGenError);
        } else if (autoGenResult?.bothSigned) {
          console.log('Both parties signed, PDF ready for generation');
          toast.success("Ambele părți au semnat! Contractul final este gata.");
        }
      } catch (autoGenErr) {
        console.error('Error calling auto-generate function:', autoGenErr);
      }

      toast.success("Contractul a fost semnat cu succes!");
      
      // Refresh to show signed state
      await fetchSignatureInfo();
    } catch (err) {
      console.error('Error signing contract:', err);
      toast.error("Eroare la semnarea contractului");
    } finally {
      setIsSigning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Se încarcă...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Link Invalid</h2>
              <p className="text-muted-foreground">{error}</p>
              <p className="text-xs text-muted-foreground mt-4">
                Token: {token?.substring(0, 8)}...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (signatureInfo?.signature_data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>Contract Semnat</CardTitle>
            <CardDescription>
              Acest contract a fost deja semnat la data de{" "}
              {new Date(signatureInfo.signed_at!).toLocaleDateString('ro-RO', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-white">
              <p className="text-sm text-muted-foreground mb-2 text-center">Semnătura dvs.:</p>
              <img 
                src={signatureInfo.signature_data} 
                alt="Semnătură" 
                className="max-h-24 mx-auto"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-6">
          <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Semnare Contract de Închiriere</h1>
          <p className="text-muted-foreground mt-2">
            {signatureInfo?.party_type === 'proprietar' ? 'Semnătură Proprietar' : 'Semnătură Chiriaș'}
          </p>
        </div>

        {/* Contract Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detalii Contract</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Chiriaș</p>
                <p className="font-medium">
                  {contractInfo?.client_prenume} {contractInfo?.client_name}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Data Contract</p>
                <p className="font-medium">{contractInfo?.contract_date}</p>
              </div>
              <div className="col-span-1 sm:col-span-2">
                <p className="text-muted-foreground">Adresa Proprietății</p>
                <p className="font-medium">{contractInfo?.property_address}</p>
              </div>
              {contractInfo?.property_price && (
                <div>
                  <p className="text-muted-foreground">Chirie Lunară</p>
                  <p className="font-medium">{contractInfo.property_price.toLocaleString()} €</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Signature Pad */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Semnătura Dvs.</CardTitle>
            <CardDescription>
              Desenați semnătura în câmpul de mai jos folosind degetul sau stylus-ul
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div 
              ref={containerRef}
              className="border-2 border-dashed rounded-lg bg-white overflow-hidden touch-none"
            >
              <SignatureCanvas
                ref={signatureRef}
                canvasProps={{
                  width: canvasSize.width,
                  height: canvasSize.height,
                  className: "touch-none",
                  style: { 
                    touchAction: 'none',
                    width: '100%', 
                    height: '200px',
                    display: 'block'
                  }
                }}
                backgroundColor="white"
                penColor="black"
                minWidth={1.5}
                maxWidth={3}
                onEnd={handleEnd}
              />
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleClear}
                className="flex-1"
                type="button"
              >
                <Eraser className="h-4 w-4 mr-2" />
                Șterge
              </Button>
              <Button 
                onClick={handleSign}
                disabled={isEmpty || isSigning}
                className="flex-1"
                type="button"
              >
                {isSigning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Se semnează...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Semnează Contract
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Prin semnarea acestui contract, confirmați că ați citit și sunteți de acord cu toate clauzele contractuale.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignContract;

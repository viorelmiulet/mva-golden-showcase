import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Check, Eraser, FileText, AlertCircle, Eye, Download, Package, Home, Handshake, Building2, Users, ScrollText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { generateSignedRentalContractPdf } from "@/lib/pdf/rentalContractPdf";
import { getSignedContractUrl } from "@/lib/storageUrl";

interface InventoryItem {
  id: string;
  item_name: string;
  quantity: number;
  condition: string | null;
  location: string | null;
  notes: string | null;
  images: string[];
}

interface ContractClause {
  id: string;
  section_key: string;
  section_title: string;
  content: string;
  sort_order: number | null;
  is_active: boolean | null;
}

type ContractType = "inchiriere" | "comodat" | "exclusiv" | "intermediere";

interface BaseContractInfo {
  id: string;
  contract_date: string;
  property_address: string;
}

interface RentalContractInfo extends BaseContractInfo {
  client_name: string;
  client_prenume: string | null;
  proprietar_name: string | null;
  proprietar_prenume: string | null;
  property_price: number | null;
  property_currency: string | null;
  duration_months: number | null;
  garantie_amount: number | null;
  contract_type: string;
}

interface ComodatContractInfo extends BaseContractInfo {
  comodant_name: string;
  comodant_prenume: string | null;
  comodatar_name: string;
  comodatar_prenume: string | null;
  duration_months: number | null;
  property_type: string | null;
  purpose: string | null;
}

interface ExclusiveContractInfo extends BaseContractInfo {
  beneficiary_name: string;
  beneficiary_prenume: string | null;
  sales_price: number | null;
  currency: string | null;
  commission_percent: number | null;
  duration_months: number | null;
  property_type: string | null;
}

interface SignatureInfo {
  id: string;
  contract_id: string;
  party_type: string;
  signature_data: string | null;
  signed_at: string | null;
  signer_name: string | null;
}

const SignContract = () => {
  const { token } = useParams<{ token: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const signatureRef = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 200 });

  // Contract type and data states
  const [contractType, setContractType] = useState<ContractType | null>(null);
  const [partyType, setPartyType] = useState<string | null>(null);
  const [contractId, setContractId] = useState<string | null>(null);
  const [signatureInfo, setSignatureInfo] = useState<SignatureInfo | null>(null);
  const [contractInfo, setContractInfo] = useState<any>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [alreadySigned, setAlreadySigned] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signedAt, setSignedAt] = useState<string | null>(null);
  const [contractClauses, setContractClauses] = useState<ContractClause[]>([]);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const updateCanvasSize = useCallback(() => {
    if (containerRef.current) {
      const width = containerRef.current.offsetWidth - 4;
      setCanvasSize({ width: Math.max(300, width), height: 200 });
    }
  }, []);

  useEffect(() => {
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    window.addEventListener('orientationchange', () => {
      setTimeout(updateCanvasSize, 100);
    });
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      window.removeEventListener('orientationchange', updateCanvasSize);
    };
  }, [updateCanvasSize]);

  const generatePdfPreview = useCallback(async () => {
    if (pdfBlobUrl || isGeneratingPdf) return;

    // Always generate PDF in memory for reliable preview (storage signed URLs may fail for anonymous users)

    // Only generate for rental/intermediere contracts from the contracts table
    if (!contractInfo || !contractType || (contractType !== 'inchiriere' && contractType !== 'intermediere')) return;

    setIsGeneratingPdf(true);
    try {
      // Fetch all signatures for this contract to include in PDF
      let proprietarSig: string | null = null;
      let chiriasSig: string | null = null;

      if (contractId) {
        const { data: allSigs } = await supabase
          .from('contract_signatures')
          .select('party_type, signature_data')
          .eq('contract_id', contractId);

        if (allSigs) {
          for (const sig of allSigs) {
            if (sig.party_type === 'proprietar' && sig.signature_data) {
              proprietarSig = sig.signature_data;
            } else if ((sig.party_type === 'chirias' || sig.party_type === 'client') && sig.signature_data) {
              chiriasSig = sig.signature_data;
            }
          }
        }
      }

      const pdf = await generateSignedRentalContractPdf({
        contract: contractInfo,
        contractClauses,
        inventoryItems,
        proprietarSignature: proprietarSig,
        chiriasSignature: chiriasSig,
      });
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Nu s-a putut genera previzualizarea PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [contractInfo, contractClauses, inventoryItems, contractType, contractId, pdfBlobUrl, isGeneratingPdf]);

  const handlePreviewPdf = useCallback(async () => {
    await generatePdfPreview();
    setPdfPreviewOpen(true);
  }, [generatePdfPreview]);

  const handleDownloadPdf = useCallback(async () => {
    if (pdfBlobUrl) {
      const a = document.createElement('a');
      a.href = pdfBlobUrl;
      a.download = `contract-${contractInfo?.id || 'document'}.pdf`;
      a.click();
      return;
    }

    // Generate PDF directly and download immediately (avoid race condition with state)
    if (!contractInfo || !contractType || (contractType !== 'inchiriere' && contractType !== 'intermediere')) return;
    setIsGeneratingPdf(true);
    try {
      let proprietarSig: string | null = null;
      let chiriasSig: string | null = null;

      if (contractId) {
        const { data: allSigs } = await supabase
          .from('contract_signatures')
          .select('party_type, signature_data')
          .eq('contract_id', contractId);

        if (allSigs) {
          for (const sig of allSigs) {
            if (sig.party_type === 'proprietar' && sig.signature_data) {
              proprietarSig = sig.signature_data;
            } else if ((sig.party_type === 'chirias' || sig.party_type === 'client') && sig.signature_data) {
              chiriasSig = sig.signature_data;
            }
          }
        }
      }

      const pdf = await generateSignedRentalContractPdf({
        contract: contractInfo,
        contractClauses,
        inventoryItems,
        proprietarSignature: proprietarSig,
        chiriasSignature: chiriasSig,
      });
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);

      // Download immediately
      const a = document.createElement('a');
      a.href = url;
      a.download = `contract-${contractInfo?.id || 'document'}.pdf`;
      a.click();
    } catch (err) {
      console.error('PDF download error:', err);
      toast.error('Nu s-a putut genera PDF-ul pentru descărcare');
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [pdfBlobUrl, contractInfo, contractType, contractId, contractClauses, inventoryItems]);

  useEffect(() => {
    if (token) {
      parseTokenAndFetchContract();
    }
  }, [token]);


  const parseTokenAndFetchContract = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if token is a composite token (type_id_party format) or a UUID
      const isCompositeToken = token?.includes('_');
      
      if (isCompositeToken) {
        // Parse composite token: type_contractId_partyType
        const parts = token!.split('_');
        if (parts.length < 3) {
          setError("Link-ul de semnătură nu este valid.");
          return;
        }
        
        const type = parts[0] as ContractType;
        const id = parts.slice(1, -1).join('_'); // Handle UUIDs with dashes
        const party = parts[parts.length - 1];
        
        setContractType(type);
        setContractId(id);
        setPartyType(party);
        
        await fetchContractByType(type, id, party);
      } else {
        // UUID token - fetch from contract_signatures table (rental contracts)
        await fetchRentalContractByToken(token!);
      }
    } catch (err) {
      console.error('Error parsing token:', err);
      setError("A apărut o eroare la încărcarea contractului.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRentalContractByToken = async (signatureToken: string) => {
    const { data: sigData, error: sigError } = await supabase
      .from('contract_signatures')
      .select('*')
      .eq('signature_token', signatureToken)
      .single();

    if (sigError || !sigData) {
      console.error('Signature fetch error:', sigError);
      setError("Link-ul de semnătură nu este valid sau a expirat.");
      return;
    }

    setSignatureInfo(sigData);
    setContractId(sigData.contract_id);
    setPartyType(sigData.party_type);
    
    if (sigData.signature_data) {
      setAlreadySigned(true);
      setSignatureData(sigData.signature_data);
      setSignedAt(sigData.signed_at);
    }

    // Fetch contract info
    const { data: contractData, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', sigData.contract_id)
      .single();

    if (contractError || !contractData) {
      console.error('Contract fetch error:', contractError);
      setError("Contractul nu a fost găsit.");
      return;
    }

    // Determine if it's intermediere or regular rental
    if (contractData.contract_type === 'intermediere') {
      setContractType('intermediere');
    } else {
      setContractType('inchiriere');
    }
    
    setContractInfo(contractData);

    // Fetch inventory for rental contracts
    if (contractData.contract_type !== 'intermediere') {
      const { data: invData } = await supabase
        .from('contract_inventory')
        .select('*')
        .eq('contract_id', sigData.contract_id);
      
      if (invData) {
        setInventoryItems(invData);
      }
    }

    // Fetch contract clauses
    await fetchContractClauses();
  };

  const fetchContractClauses = async () => {
    const { data: clauses } = await supabase
      .from('contract_clauses')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    
    if (clauses) {
      setContractClauses(clauses);
    }
  };

  const fetchContractByType = async (type: ContractType, id: string, party: string) => {
    switch (type) {
      case 'comodat': {
        const { data: comodatData, error: comodatError } = await supabase
          .from('comodat_contracts')
          .select('*')
          .eq('id', id)
          .single();

        if (comodatError || !comodatData) {
          console.error('Contract fetch error:', comodatError);
          setError("Contractul nu a fost găsit.");
          return;
        }

        setContractInfo(comodatData);
        const signedAtField = party === 'comodant' ? 'comodant_signed_at' : 'comodatar_signed_at';
        const sigField = party === 'comodant' ? 'comodant_signature' : 'comodatar_signature';
        if (comodatData[signedAtField]) {
          setAlreadySigned(true);
          setSignedAt(comodatData[signedAtField] as string);
          setSignatureData(comodatData[sigField] as string | null);
        }
        return;
      }
      case 'exclusiv': {
        const { data: exclusivData, error: exclusivError } = await supabase
          .from('exclusive_contracts')
          .select('*')
          .eq('id', id)
          .single();

        if (exclusivError || !exclusivData) {
          console.error('Contract fetch error:', exclusivError);
          setError("Contractul nu a fost găsit.");
          return;
        }

        setContractInfo(exclusivData);
        const signedAtFieldEx = party === 'beneficiary' ? 'beneficiary_signed_at' : 'agent_signed_at';
        const sigFieldEx = party === 'beneficiary' ? 'beneficiary_signature' : 'agent_signature';
        if (exclusivData[signedAtFieldEx]) {
          setAlreadySigned(true);
          setSignedAt(exclusivData[signedAtFieldEx] as string);
          setSignatureData(exclusivData[sigFieldEx] as string | null);
        }
        return;
      }
      case 'intermediere': {
        const { data: interData, error: interError } = await supabase
          .from('contracts')
          .select('*')
          .eq('id', id)
          .single();

        if (interError || !interData) {
          console.error('Contract fetch error:', interError);
          setError("Contractul nu a fost găsit.");
          return;
        }

        setContractInfo(interData);
        const signedFieldInt = party === 'client' ? 'chirias_signed' : 'proprietar_signed';
        if (interData[signedFieldInt]) {
          setAlreadySigned(true);
          const { data: sigData } = await supabase
            .from('contract_signatures')
            .select('*')
            .eq('contract_id', id)
            .eq('party_type', party === 'client' ? 'chirias' : 'proprietar')
            .maybeSingle();
          
          if (sigData) {
            setSignatureData(sigData.signature_data);
            setSignedAt(sigData.signed_at);
          }
        }
        return;
      }
      default:
        setError("Tip de contract necunoscut.");
        return;
    }

    // Fetch clauses for all contract types
    await fetchContractClauses();
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

  const sendSignatureNotification = async (type: ContractType, id: string, party: string) => {
    try {
      await supabase.functions.invoke('notify-contract-signed', {
        body: { 
          contractId: id, 
          contractType: type,
          signerPartyType: party 
        }
      });
      console.log('Signature notification sent successfully');
    } catch (e) {
      console.error('Error sending signature notification:', e);
    }
  };

  const handleSign = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast.error("Vă rugăm să desenați semnătura");
      return;
    }

    if (!contractId || !partyType || !contractType) return;

    setIsSigning(true);
    try {
      const signatureDataUrl = signatureRef.current.toDataURL("image/png");
      const now = new Date().toISOString();

      if (contractType === 'inchiriere' && signatureInfo) {
        // Update contract_signatures table
        await supabase
          .from('contract_signatures')
          .update({
            signature_data: signatureDataUrl,
            signed_at: now,
            signer_name: partyType === 'proprietar' 
              ? 'Proprietar' 
              : `${contractInfo?.client_prenume || ''} ${contractInfo?.client_name || ''}`.trim()
          })
          .eq('signature_token', token);

        // Update contract signed status
        const updateField = partyType === 'proprietar' 
          ? { proprietar_signed: true } 
          : { chirias_signed: true };

        await supabase
          .from('contracts')
          .update(updateField)
          .eq('id', contractId);

        // Trigger auto-generation
        try {
          await supabase.functions.invoke('auto-generate-signed-contract', {
            body: { contractId }
          });
        } catch (e) {
          console.error('Auto-generate error:', e);
        }

        // Send notification
        await sendSignatureNotification('inchiriere', contractId, partyType);
      } else if (contractType === 'comodat') {
        const signatureField = partyType === 'comodant' ? 'comodant_signature' : 'comodatar_signature';
        const signedAtField = partyType === 'comodant' ? 'comodant_signed_at' : 'comodatar_signed_at';
        
        await supabase
          .from('comodat_contracts')
          .update({
            [signatureField]: signatureDataUrl,
            [signedAtField]: now,
            status: 'signed'
          } as any)
          .eq('id', contractId);

        // Send notification
        await sendSignatureNotification('comodat', contractId, partyType);
      } else if (contractType === 'exclusiv') {
        const signatureField = partyType === 'beneficiary' ? 'beneficiary_signature' : 'agent_signature';
        const signedAtField = partyType === 'beneficiary' ? 'beneficiary_signed_at' : 'agent_signed_at';
        
        await supabase
          .from('exclusive_contracts')
          .update({
            [signatureField]: signatureDataUrl,
            [signedAtField]: now,
            status: 'signed'
          } as any)
          .eq('id', contractId);

        // Send notification
        await sendSignatureNotification('exclusiv', contractId, partyType);
      } else if (contractType === 'intermediere') {
        const signedField = partyType === 'client' ? 'chirias_signed' : 'proprietar_signed';
        
        await supabase
          .from('contracts')
          .update({ [signedField]: true } as any)
          .eq('id', contractId);

        // Also create/update signature entry
        const { data: existingSig } = await supabase
          .from('contract_signatures')
          .select('id')
          .eq('contract_id', contractId)
          .eq('party_type', partyType === 'client' ? 'chirias' : 'proprietar')
          .maybeSingle();

        if (existingSig) {
          await supabase
            .from('contract_signatures')
            .update({
              signature_data: signatureDataUrl,
              signed_at: now
            })
            .eq('id', existingSig.id);
        } else {
          await supabase
            .from('contract_signatures')
            .insert({
              contract_id: contractId,
              party_type: partyType === 'client' ? 'chirias' : 'proprietar',
              signature_data: signatureDataUrl,
              signed_at: now,
              signer_name: contractInfo?.client_name || ''
            });
        }

        // Send notification
        await sendSignatureNotification('intermediere', contractId, partyType === 'client' ? 'chirias' : 'proprietar');
      }

      toast.success("Contractul a fost semnat cu succes!");
      setAlreadySigned(true);
      setSignatureData(signatureDataUrl);
      setSignedAt(now);
      // Reset PDF so it regenerates with the new signature included
      setPdfBlobUrl(null);
    } catch (err) {
      console.error('Error signing contract:', err);
      toast.error("Eroare la semnarea contractului");
    } finally {
      setIsSigning(false);
    }
  };

  const getContractTypeLabel = () => {
    switch (contractType) {
      case 'inchiriere': return 'Închiriere';
      case 'comodat': return 'Comodat';
      case 'exclusiv': return 'Reprezentare Exclusivă';
      case 'intermediere': return 'Intermediere';
      default: return 'Contract';
    }
  };

  const getPartyLabel = () => {
    switch (contractType) {
      case 'inchiriere':
        return partyType === 'proprietar' ? 'Proprietar' : 'Chiriaș';
      case 'comodat':
        return partyType === 'comodant' ? 'Comodant' : 'Comodatar';
      case 'exclusiv':
        return partyType === 'beneficiary' ? 'Beneficiar' : 'Prestator/Agent';
      case 'intermediere':
        return partyType === 'client' ? 'Client' : 'Intermediar';
      default:
        return partyType || '';
    }
  };

  const getContractIcon = () => {
    switch (contractType) {
      case 'inchiriere': return <Home className="h-12 w-12 text-cyan-500 mx-auto mb-4" />;
      case 'comodat': return <Handshake className="h-12 w-12 text-emerald-500 mx-auto mb-4" />;
      case 'exclusiv': return <Building2 className="h-12 w-12 text-purple-500 mx-auto mb-4" />;
      case 'intermediere': return <Users className="h-12 w-12 text-orange-500 mx-auto mb-4" />;
      default: return <FileText className="h-12 w-12 text-primary mx-auto mb-4" />;
    }
  };

  const renderContractDetails = () => {
    if (!contractInfo) return null;

    switch (contractType) {
      case 'inchiriere':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Chiriaș</p>
              <p className="font-medium">{contractInfo.client_prenume} {contractInfo.client_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Data Contract</p>
              <p className="font-medium">{contractInfo.contract_date}</p>
            </div>
            <div className="col-span-1 sm:col-span-2">
              <p className="text-muted-foreground">Adresa Proprietății</p>
              <p className="font-medium">{contractInfo.property_address}</p>
            </div>
            {contractInfo.property_price && (
              <div>
                <p className="text-muted-foreground">Chirie Lunară</p>
                <p className="font-medium">{contractInfo.property_price.toLocaleString()} {contractInfo.property_currency || 'EUR'}</p>
              </div>
            )}
            {contractInfo.duration_months && (
              <div>
                <p className="text-muted-foreground">Durată</p>
                <p className="font-medium">{contractInfo.duration_months} luni</p>
              </div>
            )}
          </div>
        );
      
      case 'comodat':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Comodant</p>
              <p className="font-medium">{contractInfo.comodant_prenume} {contractInfo.comodant_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Comodatar</p>
              <p className="font-medium">{contractInfo.comodatar_prenume} {contractInfo.comodatar_name}</p>
            </div>
            <div className="col-span-1 sm:col-span-2">
              <p className="text-muted-foreground">Adresa Proprietății</p>
              <p className="font-medium">{contractInfo.property_address}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Data Contract</p>
              <p className="font-medium">{contractInfo.contract_date}</p>
            </div>
            {contractInfo.duration_months && (
              <div>
                <p className="text-muted-foreground">Durată</p>
                <p className="font-medium">{contractInfo.duration_months} luni</p>
              </div>
            )}
            {contractInfo.purpose && (
              <div className="col-span-1 sm:col-span-2">
                <p className="text-muted-foreground">Scop</p>
                <p className="font-medium">{contractInfo.purpose}</p>
              </div>
            )}
          </div>
        );
      
      case 'exclusiv':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Beneficiar</p>
              <p className="font-medium">{contractInfo.beneficiary_prenume} {contractInfo.beneficiary_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Data Contract</p>
              <p className="font-medium">{contractInfo.contract_date}</p>
            </div>
            <div className="col-span-1 sm:col-span-2">
              <p className="text-muted-foreground">Adresa Proprietății</p>
              <p className="font-medium">{contractInfo.property_address}</p>
            </div>
            {contractInfo.sales_price && (
              <div>
                <p className="text-muted-foreground">Preț Vânzare</p>
                <p className="font-medium">{contractInfo.sales_price.toLocaleString()} {contractInfo.currency || 'EUR'}</p>
              </div>
            )}
            {contractInfo.commission_percent && (
              <div>
                <p className="text-muted-foreground">Comision</p>
                <p className="font-medium">{contractInfo.commission_percent}%</p>
              </div>
            )}
          </div>
        );
      
      case 'intermediere':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Client</p>
              <p className="font-medium">{contractInfo.client_prenume} {contractInfo.client_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Data Contract</p>
              <p className="font-medium">{contractInfo.contract_date}</p>
            </div>
            <div className="col-span-1 sm:col-span-2">
              <p className="text-muted-foreground">Criterii Căutare</p>
              <p className="font-medium">{contractInfo.property_address}</p>
            </div>
            {contractInfo.duration_months && (
              <div>
                <p className="text-muted-foreground">Durată</p>
                <p className="font-medium">{contractInfo.duration_months} luni</p>
              </div>
            )}
          </div>
        );
      
      default:
        return null;
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

  if (alreadySigned) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>Contract Semnat</CardTitle>
            <CardDescription>
              Acest contract a fost deja semnat
              {signedAt && (
                <> la data de{" "}
                {new Date(signedAt).toLocaleDateString('ro-RO', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {signatureData && (
              <div className="border rounded-lg p-4 bg-white">
                <p className="text-sm text-muted-foreground mb-2 text-center">Semnătura dvs.:</p>
                <img 
                  src={signatureData} 
                  alt="Semnătură" 
                  className="max-h-24 mx-auto"
                />
              </div>
            )}
            
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Tip Contract</p>
              <p className="font-medium">{getContractTypeLabel()}</p>
              <p className="text-sm text-muted-foreground mt-2 mb-1">Semnatar</p>
              <p className="font-medium">{getPartyLabel()}</p>
            </div>

            {(contractType === 'inchiriere' || contractType === 'intermediere') && (
              <div className="flex flex-col gap-2">
                <Button variant="outline" className="w-full" onClick={handlePreviewPdf} disabled={isGeneratingPdf}>
                  {isGeneratingPdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
                  Previzualizează Contractul
                </Button>
                <Button variant="outline" className="w-full" onClick={handleDownloadPdf} disabled={isGeneratingPdf}>
                  {isGeneratingPdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                  Descarcă Contract PDF
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* PDF Preview Dialog for already-signed view */}
        <Dialog open={pdfPreviewOpen} onOpenChange={setPdfPreviewOpen}>
          <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
            <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
              <DialogTitle>Previzualizare Contract</DialogTitle>
            </DialogHeader>
            <div className="flex-1 min-h-0">
              {isGeneratingPdf ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : pdfBlobUrl ? (
                <iframe 
                  src={pdfBlobUrl} 
                  className="w-full h-full border-0"
                  title="Contract PDF"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Nu s-a putut genera previzualizarea.
                </div>
              )}
            </div>
            {pdfBlobUrl && (
              <div className="px-6 py-3 border-t border-border flex-shrink-0 flex justify-end">
                <Button onClick={handleDownloadPdf}>
                  <Download className="h-4 w-4 mr-2" />
                  Descarcă PDF
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-6">
          {getContractIcon()}
          <h1 className="text-2xl font-bold">Semnare Contract de {getContractTypeLabel()}</h1>
          <p className="text-muted-foreground mt-2">
            Semnătură {getPartyLabel()}
          </p>
        </div>

        {/* Contract Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detalii Contract</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {renderContractDetails()}
          </CardContent>
        </Card>

        {/* PDF Preview Button */}
        {(contractType === 'inchiriere' || contractType === 'intermediere') && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handlePreviewPdf}
                  disabled={isGeneratingPdf}
                >
                  {isGeneratingPdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
                  Previzualizează Contractul PDF
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                >
                  {isGeneratingPdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                  Descarcă PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        )}




        {contractType === 'inchiriere' && inventoryItems.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Inventar Imobil</CardTitle>
              </div>
              <CardDescription>
                Lista obiectelor incluse în contract ({inventoryItems.length} articole)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Denumire</TableHead>
                      <TableHead className="font-semibold text-center w-20">Cantitate</TableHead>
                      <TableHead className="font-semibold w-24">Stare</TableHead>
                      <TableHead className="font-semibold">Observații</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryItems.map((item, index) => (
                      <TableRow key={item.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                        <TableCell className="font-medium">{item.item_name}</TableCell>
                        <TableCell className="text-center">{item.quantity || 1}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {item.condition || 'Bună'}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {item.notes || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Signature Card */}
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

      {/* PDF Preview Dialog */}
      <Dialog open={pdfPreviewOpen} onOpenChange={setPdfPreviewOpen}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
            <DialogTitle>Previzualizare Contract</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0">
              {isGeneratingPdf ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : pdfBlobUrl ? (
                <iframe 
                  src={pdfBlobUrl} 
                  className="w-full h-full border-0"
                  title="Contract PDF"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Nu s-a putut genera previzualizarea.
                </div>
              )}
            </div>
            {pdfBlobUrl && (
              <div className="px-6 py-3 border-t border-border flex-shrink-0 flex justify-end">
                <Button onClick={handleDownloadPdf}>
                  <Download className="h-4 w-4 mr-2" />
                  Descarcă PDF
                </Button>
              </div>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SignContract;

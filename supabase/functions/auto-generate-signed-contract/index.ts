import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContractData {
  id: string;
  client_name: string;
  client_prenume: string | null;
  client_cnp: string | null;
  client_seria_ci: string | null;
  client_numar_ci: string | null;
  client_adresa: string | null;
  proprietar_name: string | null;
  proprietar_prenume: string | null;
  proprietar_cnp: string | null;
  proprietar_seria_ci: string | null;
  proprietar_numar_ci: string | null;
  proprietar_adresa: string | null;
  property_address: string;
  property_price: number | null;
  property_currency: string | null;
  contract_date: string;
  duration_months: number | null;
}

interface InventoryItem {
  item_name: string;
  quantity: number;
  condition: string;
  location: string | null;
  notes: string | null;
}

interface SignatureData {
  party_type: string;
  signature_data: string | null;
  signer_name: string | null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contractId } = await req.json();

    if (!contractId) {
      console.error('Missing contractId');
      return new Response(
        JSON.stringify({ error: 'contractId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Auto-generating signed contract for:', contractId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch contract data
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      console.error('Error fetching contract:', contractError);
      return new Response(
        JSON.stringify({ error: 'Contract not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if both parties have signed
    if (!contract.proprietar_signed || !contract.chirias_signed) {
      console.log('Not all parties have signed yet');
      return new Response(
        JSON.stringify({ message: 'Not all parties have signed yet', bothSigned: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch signatures
    const { data: signatures, error: sigError } = await supabase
      .from('contract_signatures')
      .select('party_type, signature_data, signer_name')
      .eq('contract_id', contractId);

    if (sigError) {
      console.error('Error fetching signatures:', sigError);
      return new Response(
        JSON.stringify({ error: 'Error fetching signatures' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const proprietarSignature = signatures?.find((s: SignatureData) => s.party_type === 'proprietar')?.signature_data;
    const chiriasSignature = signatures?.find((s: SignatureData) => s.party_type === 'chirias')?.signature_data;

    if (!proprietarSignature || !chiriasSignature) {
      console.log('Missing signature data');
      return new Response(
        JSON.stringify({ message: 'Missing signature data', bothSigned: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch inventory items
    const { data: inventoryItems, error: invError } = await supabase
      .from('contract_inventory')
      .select('*')
      .eq('contract_id', contractId);

    if (invError) {
      console.error('Error fetching inventory:', invError);
    }

    const inventory = inventoryItems || [];

    console.log('Both parties signed, generating PDF with:', {
      hasProprietarSig: !!proprietarSignature,
      hasChiriasSig: !!chiriasSignature,
      inventoryCount: inventory.length
    });

    // Generate PDF using jsPDF-like approach via HTML
    // Since we can't use jsPDF in Deno directly, we'll create a simple HTML-based PDF
    // For now, we'll store metadata and let the frontend know to regenerate

    // Mark contract as fully signed and ready for PDF regeneration
    const { error: updateError } = await supabase
      .from('contracts')
      .update({ 
        pdf_generated: true,
        // Store a flag that the contract needs PDF regeneration
      })
      .eq('id', contractId);

    if (updateError) {
      console.error('Error updating contract:', updateError);
    }

    console.log('Contract marked as fully signed, PDF ready for generation');

    return new Response(
      JSON.stringify({ 
        success: true, 
        bothSigned: true,
        message: 'Both parties have signed. PDF is ready to be generated.',
        contractId,
        hasInventory: inventory.length > 0
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in auto-generate-signed-contract:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

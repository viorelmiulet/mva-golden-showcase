const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  console.log('=== Simple Test Function Started ===');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing request...');
    const body = await req.json();
    console.log('Request body:', body);

    const result = {
      success: true,
      message: 'Simple test function works!',
      timestamp: new Date().toISOString(),
      received_data: body
    };

    console.log('Returning result:', result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error: any) {
    console.error('Error in simple test function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error?.message || 'Unknown error occurred',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }, 
        status: 500 
      }
    );
  }
});
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const projectId = '538e4329-594f-447f-9d89-c63475178cad' // RENEW RESIDENCE

    const apartments = [
      { title: 'Ap. 1 - Garsonieră Parter', description: 'Garsonieră modernă la parter, Complex Renew Residence', surface: 31, priceMin: 47500, priceMax: 49700, rooms: 1, floor: 'Parter' },
      { title: 'Ap. 2 - Garsonieră Parter', description: 'Garsonieră spațioasă la parter, Complex Renew Residence', surface: 35, priceMin: 52000, priceMax: 54500, rooms: 1, floor: 'Parter' },
      { title: 'Ap. 3 - Garsonieră Parter', description: 'Garsonieră spațioasă la parter, Complex Renew Residence', surface: 35, priceMin: 52000, priceMax: 54500, rooms: 1, floor: 'Parter' },
      { title: 'Ap. 4 - Garsonieră Parter', description: 'Garsonieră compactă la parter, Complex Renew Residence', surface: 31, priceMin: 47500, priceMax: 49700, rooms: 1, floor: 'Parter' },
      { title: 'Ap. 5 - Garsonieră Parter', description: 'Garsonieră compactă la parter, Complex Renew Residence', surface: 31, priceMin: 47500, priceMax: 49700, rooms: 1, floor: 'Parter' },
      { title: 'Ap. 6 - Studio Parter', description: 'Studio spațios la parter, Complex Renew Residence', surface: 43, priceMin: 65000, priceMax: 67500, rooms: 1, floor: 'Parter' },
      { title: 'Ap. 7 - Studio Parter', description: 'Studio spațios la parter, Complex Renew Residence', surface: 43, priceMin: 65000, priceMax: 67500, rooms: 1, floor: 'Parter' },
      { title: 'Ap. 8 - Garsonieră Parter', description: 'Garsonieră compactă la parter, Complex Renew Residence', surface: 31, priceMin: 47500, priceMax: 49700, rooms: 1, floor: 'Parter' },
      { title: 'Ap. 10 - Apartament 2 camere Etaj 1', description: 'Apartament decomandat 2 camere la etajul 1, Complex Renew Residence', surface: 52, priceMin: 73500, priceMax: 76000, rooms: 2, floor: 'Etaj 1' },
      { title: 'Ap. 11 - Apartament 2 camere Etaj 1', description: 'Apartament decomandat 2 camere la etajul 1, Complex Renew Residence', surface: 52, priceMin: 73500, priceMax: 76000, rooms: 2, floor: 'Etaj 1' },
      { title: 'Ap. 13 - Apartament 2 camere Etaj 1', description: 'Apartament decomandat 2 camere spațios la etajul 1, Complex Renew Residence', surface: 54, priceMin: 74500, priceMax: 77000, rooms: 2, floor: 'Etaj 1' },
      { title: 'Ap. 18 - Apartament 2 camere Etaj 2', description: 'Apartament decomandat 2 camere la etajul 2, Complex Renew Residence', surface: 52, priceMin: 73500, priceMax: 76000, rooms: 2, floor: 'Etaj 2' },
      { title: 'Ap. 19 - Apartament 2 camere Etaj 2', description: 'Apartament decomandat 2 camere la etajul 2, Complex Renew Residence', surface: 52, priceMin: 73500, priceMax: 76000, rooms: 2, floor: 'Etaj 2' },
      { title: 'Ap. 22 - Garsonieră Etaj 2', description: 'Garsonieră spațioasă la etajul 2, Complex Renew Residence', surface: 35, priceMin: 54000, priceMax: 56500, rooms: 1, floor: 'Etaj 2' },
      { title: 'Ap. 26 - Apartament 2 camere Etaj 3', description: 'Apartament decomandat 2 camere la etajul 3, Complex Renew Residence', surface: 52, priceMin: 73500, priceMax: 76000, rooms: 2, floor: 'Etaj 3' },
      { title: 'Ap. 30 - Garsonieră Etaj 3', description: 'Garsonieră spațioasă la etajul 3, Complex Renew Residence', surface: 35, priceMin: 54000, priceMax: 56500, rooms: 1, floor: 'Etaj 3' },
      { title: 'Ap. 33 - Garsonieră Etaj 4', description: 'Garsonieră modernă la etajul 4, Complex Renew Residence', surface: 32, priceMin: 49000, priceMax: 51000, rooms: 1, floor: 'Etaj 4' },
      { title: 'Ap. 34 - Apartament 2 camere Etaj 4', description: 'Apartament decomandat 2 camere la etajul 4, Complex Renew Residence', surface: 52, priceMin: 73500, priceMax: 76000, rooms: 2, floor: 'Etaj 4' },
      { title: 'Ap. 35 - Apartament 2 camere Etaj 4', description: 'Apartament decomandat 2 camere la etajul 4, Complex Renew Residence', surface: 52, priceMin: 73500, priceMax: 76000, rooms: 2, floor: 'Etaj 4' },
      { title: 'Ap. 36 - Garsonieră Etaj 4', description: 'Garsonieră modernă la etajul 4, Complex Renew Residence', surface: 32, priceMin: 49000, priceMax: 51000, rooms: 1, floor: 'Etaj 4' },
      { title: 'Ap. 38 - Garsonieră Etaj 4', description: 'Garsonieră spațioasă la etajul 4, Complex Renew Residence', surface: 35, priceMin: 54000, priceMax: 56500, rooms: 1, floor: 'Etaj 4' },
      { title: 'Ap. 39 - Garsonieră Etaj 4', description: 'Garsonieră spațioasă la etajul 4, Complex Renew Residence', surface: 35, priceMin: 54000, priceMax: 56500, rooms: 1, floor: 'Etaj 4' },
      { title: 'Ap. 40 - Garsonieră Etaj 4', description: 'Garsonieră modernă la etajul 4, Complex Renew Residence', surface: 32, priceMin: 49000, priceMax: 51000, rooms: 1, floor: 'Etaj 4' },
      { title: 'Ap. 41 - Garsonieră Etaj 5', description: 'Garsonieră compactă la etajul 5, Complex Renew Residence', surface: 32, priceMin: 47500, priceMax: 48500, rooms: 1, floor: 'Etaj 5' },
      { title: 'Ap. 42 - Apartament 2 camere Etaj 5', description: 'Apartament decomandat 2 camere la etajul 5, Complex Renew Residence', surface: 52, priceMin: 70000, priceMax: 72000, rooms: 2, floor: 'Etaj 5' },
      { title: 'Ap. 43 - Apartament 2 camere Etaj 5', description: 'Apartament decomandat 2 camere la etajul 5, Complex Renew Residence', surface: 52, priceMin: 70000, priceMax: 72000, rooms: 2, floor: 'Etaj 5' },
      { title: 'Ap. 44 - Garsonieră Etaj 5', description: 'Garsonieră compactă la etajul 5, Complex Renew Residence', surface: 32, priceMin: 47500, priceMax: 48500, rooms: 1, floor: 'Etaj 5' },
      { title: 'Ap. 45 - Apartament 2 camere Etaj 5', description: 'Apartament decomandat 2 camere spațios la etajul 5, Complex Renew Residence', surface: 54, priceMin: 70500, priceMax: 73000, rooms: 2, floor: 'Etaj 5' },
      { title: 'Ap. 46 - Garsonieră Etaj 5', description: 'Garsonieră spațioasă la etajul 5, Complex Renew Residence', surface: 35, priceMin: 51000, priceMax: 53500, rooms: 1, floor: 'Etaj 5' },
      { title: 'Ap. 47 - Garsonieră Etaj 5', description: 'Garsonieră spațioasă la etajul 5, Complex Renew Residence', surface: 35, priceMin: 51000, priceMax: 53500, rooms: 1, floor: 'Etaj 5' },
      { title: 'Ap. 48 - Garsonieră Etaj 5', description: 'Garsonieră compactă la etajul 5, Complex Renew Residence', surface: 32, priceMin: 47500, priceMax: 48500, rooms: 1, floor: 'Etaj 5' }
    ]

    const insertData = apartments.map(apt => ({
      title: apt.title,
      description: apt.description,
      location: 'Militari, București',
      price_min: apt.priceMin,
      price_max: apt.priceMax,
      surface_min: apt.surface,
      surface_max: apt.surface,
      rooms: apt.rooms,
      project_id: projectId,
      project_name: 'RENEW RESIDENCE',
      transaction_type: 'sale',
      availability_status: 'available',
      source: 'manual',
      currency: 'EUR',
      features: [apt.floor, 'Bloc nou', 'Finisaje premium'],
      amenities: ['Parcare', 'Lift', 'Spații verzi']
    }))

    console.log(`Inserting ${insertData.length} apartments for Renew Residence`)

    const { data, error } = await supabaseClient
      .from('catalog_offers')
      .insert(insertData)
      .select('id, title')

    if (error) {
      console.error('Error inserting apartments:', error)
      throw error
    }

    console.log(`Successfully inserted ${data.length} apartments`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully imported ${data.length} apartments`,
        apartments: data 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

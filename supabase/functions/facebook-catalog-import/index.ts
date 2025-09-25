import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FacebookProduct {
  id: string
  name: string
  description: string
  url: string
  image_url: string
  availability: string
  condition: string
  price: string
  currency: string
  brand: string
  retailer_id: string
  custom_data?: {
    [key: string]: any
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action = 'sync' } = await req.json().catch(() => ({}))

    if (action === 'sync') {
      console.log('Starting Facebook catalog sync...')

      const facebookAppId = Deno.env.get('FACEBOOK_APP_ID')
      const facebookCatalogId = Deno.env.get('FACEBOOK_CATALOG_ID')
      const facebookAccessToken = Deno.env.get('FACEBOOK_ACCESS_TOKEN')

      if (!facebookAppId || !facebookCatalogId) {
        throw new Error('Facebook App ID and Catalog ID are required')
      }

      if (!facebookAccessToken) {
        throw new Error('Facebook Access Token is required. App ID cannot be used as access token.')
      }
      
      try {
        // Facebook Graph API endpoint to fetch catalog products
        const graphApiUrl = `https://graph.facebook.com/v18.0/${facebookCatalogId}/products?fields=id,name,description,url,image_url,availability,condition,price,currency,brand,retailer_id,custom_data&access_token=${facebookAccessToken}`
        
        console.log('Fetching from Facebook Graph API...')
        const response = await fetch(graphApiUrl)
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('Facebook API Error:', errorText)
          throw new Error(`Facebook API error: ${response.status} ${response.statusText}`)
        }

        const facebookData = await response.json()
        console.log('Facebook API Response:', JSON.stringify(facebookData, null, 2))

        if (!facebookData.data || !Array.isArray(facebookData.data)) {
          throw new Error('Invalid response format from Facebook API')
        }

        const products: FacebookProduct[] = facebookData.data

        console.log(`Found ${products.length} products from Facebook catalog`)

        // Clear existing Facebook catalog entries
        const { error: deleteError } = await supabaseClient
          .from('catalog_offers')
          .delete()
          .like('project_name', '%Facebook Catalog%')

        if (deleteError) {
          console.error('Error clearing Facebook catalog entries:', deleteError)
        }

        // Transform Facebook products to catalog_offers format
        const catalogOffers = products.map((product: FacebookProduct) => {
          // Parse price - Facebook returns price as string like "120000" (price in cents)
          const priceInCents = parseInt(product.price) || 0
          const price = Math.round(priceInCents / 100) // Convert to main currency unit

          // Extract custom data for property-specific fields
          const customData = product.custom_data || {}
          
          return {
            title: product.name,
            description: product.description || '',
            location: customData.location || 'Locație nedefinită',
            images: product.image_url ? [product.image_url] : [],
            price_min: price,
            price_max: price,
            surface_min: customData.surface_min ? parseInt(customData.surface_min) : null,
            surface_max: customData.surface_max ? parseInt(customData.surface_max) : null,
            rooms: customData.rooms ? parseInt(customData.rooms) : 1,
            features: customData.features ? (Array.isArray(customData.features) ? customData.features : [customData.features]) : [],
            amenities: customData.amenities ? (Array.isArray(customData.amenities) ? customData.amenities : [customData.amenities]) : [],
            availability_status: product.availability === 'in stock' ? 'available' : 'sold',
            project_name: 'Facebook Catalog Import',
            currency: product.currency || 'EUR',
            contact_info: {
              source: 'facebook',
              retailer_id: product.retailer_id
            }
          }
        })

        // Insert new catalog offers
        if (catalogOffers.length > 0) {
          const { data: insertedData, error: insertError } = await supabaseClient
            .from('catalog_offers')
            .insert(catalogOffers)
            .select()

          if (insertError) {
            console.error('Error inserting catalog offers:', insertError)
            throw insertError
          }

          console.log(`Successfully imported ${insertedData?.length || 0} properties from Facebook catalog`)

          return new Response(
            JSON.stringify({
              success: true,
              message: `Successfully imported ${insertedData?.length || 0} properties from Facebook catalog`,
              imported_count: insertedData?.length || 0
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          )
        } else {
          return new Response(
            JSON.stringify({
              success: true,
              message: 'No products found in Facebook catalog',
              imported_count: 0
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          )
        }

      } catch (error: any) {
        console.error('Facebook catalog sync error:', error)
        return new Response(
          JSON.stringify({
            success: false,
            error: error?.message || 'Failed to sync Facebook catalog'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        )
      }

    } else if (action === 'test') {
      // Test Facebook API connection
      const facebookAppId = Deno.env.get('FACEBOOK_APP_ID')
      const facebookCatalogId = Deno.env.get('FACEBOOK_CATALOG_ID')
      const facebookAccessToken = Deno.env.get('FACEBOOK_ACCESS_TOKEN')

      if (!facebookAccessToken) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Facebook Access Token nu este configurat. Ai nevoie de un Access Token valid, nu doar App ID.'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Facebook integration configured',
          config: {
            app_id_configured: !!facebookAppId,
            catalog_id_configured: !!facebookCatalogId,
            access_token_configured: !!facebookAccessToken
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )

  } catch (error: any) {
    console.error('Facebook catalog import error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || 'Internal server error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
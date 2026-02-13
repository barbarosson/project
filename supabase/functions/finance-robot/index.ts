import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  return new Response(
    JSON.stringify({ message: 'Finance Robot reference endpoint. Use /finance-robot-ai for AI features.' }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  )
})

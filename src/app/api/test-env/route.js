export async function GET() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    return Response.json({
      success: true,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      supabaseUrlLength: supabaseUrl ? supabaseUrl.length : 0,
      serviceKeyLength: supabaseServiceKey ? supabaseServiceKey.length : 0,
      serviceKeyPrefix: supabaseServiceKey ? supabaseServiceKey.substring(0, 10) : 'none'
    })
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

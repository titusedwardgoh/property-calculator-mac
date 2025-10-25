import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return Response.json({
        success: false,
        error: 'Missing environment variables',
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceKey
      }, { status: 500 })
    }

    // Try to create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Try a simple query to test the connection
    const { data, error } = await supabase
      .from('properties')
      .select('count')
      .limit(1)

    if (error) {
      return Response.json({
        success: false,
        error: 'Supabase query failed',
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    return Response.json({
      success: true,
      message: 'Supabase connection successful',
      data: data
    })

  } catch (error) {
    return Response.json({
      success: false,
      error: 'Exception occurred',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

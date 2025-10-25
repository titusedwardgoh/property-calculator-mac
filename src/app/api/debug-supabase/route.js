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

    // Test the URL format
    let urlTest = "URL format check: ";
    try {
      new URL(supabaseUrl);
      urlTest += "Valid URL format";
    } catch (urlError) {
      urlTest += `Invalid URL format: ${urlError.message}`;
    }
    
    // Test if we can reach the Supabase API directly
    let apiTest = "API reachability test: ";
    try {
      const testUrl = `${supabaseUrl}/rest/v1/`;
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        apiTest += "API is reachable";
      } else {
        apiTest += `API returned ${response.status}: ${response.statusText}`;
      }
    } catch (fetchError) {
      apiTest += `API unreachable: ${fetchError.message}`;
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
        code: error.code,
        tests: {
          urlTest,
          apiTest
        }
      }, { status: 500 })
    }

    return Response.json({
      success: true,
      message: 'Supabase connection successful',
      data: data,
      tests: {
        urlTest,
        apiTest
      }
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
// Force redeploy Sat Oct 25 16:08:08 AEDT 2025

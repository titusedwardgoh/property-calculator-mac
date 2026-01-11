import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Server-side Supabase client with service role key (for admin operations)
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createServiceClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function POST(request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if email exists in auth.users using admin API
    // We need to use the admin API to check auth.users
    const { data: { users }, error } = await supabase.auth.admin.listUsers()

    if (error) {
      console.error('Error checking email:', error)
      return NextResponse.json(
        { error: 'Failed to check email', details: error.message },
        { status: 500 }
      )
    }

    // Find user with matching email (case-insensitive)
    const matchingUser = users.find(
      user => user.email?.toLowerCase() === email.toLowerCase()
    )

    if (matchingUser) {
      return NextResponse.json({
        exists: true,
        userId: matchingUser.id
      })
    }

    return NextResponse.json({
      exists: false
    })
  } catch (error) {
    console.error('Error in check-email route:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}


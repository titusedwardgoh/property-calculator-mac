import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { mergeGuestSurveys } from '@/lib/mergeGuestSurveys'

// Service role client for admin operations
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const serviceClient = supabaseUrl && supabaseServiceKey
  ? createServiceClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null

export async function POST(request) {
  try {
    const { email, password, next } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    // Merge any guest surveys from survey_leads
    let linkedSurveysCount = 0
    if (data.user && data.user.id) {
      const mergeResult = await mergeGuestSurveys(email, data.user.id)
      if (mergeResult.success && mergeResult.linkedCount > 0) {
        linkedSurveysCount = mergeResult.linkedCount
        console.log(`Linked ${linkedSurveysCount} guest survey(s) to logged-in user account`)
      }

      // Also ensure any properties already linked to this user are marked as saved
      // This handles cases where survey was linked when email was sent but user_saved wasn't set
      if (serviceClient) {
        try {
          // Find properties linked to user that need to be marked as saved/active
          // Check for properties where user_saved is false/null OR is_active is false/null
          const { data: properties, error: fetchError } = await serviceClient
            .from('properties')
            .select('id, user_saved, is_active')
            .eq('user_id', data.user.id)
            .or('user_saved.is.null,user_saved.eq.false,is_active.is.null,is_active.eq.false')

          if (!fetchError && properties && properties.length > 0) {
            const propertyIds = properties.map(p => p.id)
            const { error: updateError } = await serviceClient
              .from('properties')
              .update({
                user_saved: true,
                is_active: true
              })
              .in('id', propertyIds)

            if (updateError) {
              console.error('Error updating properties on login:', updateError)
            } else {
              console.log(`Updated ${propertyIds.length} property/properties to be saved and active`)
            }
          }
        } catch (updateErr) {
          console.error('Error ensuring properties are saved on login:', updateErr)
          // Don't fail login if this update fails
        }
      }
    }

    // Return success response - cookies are set by Supabase server client
    return NextResponse.json({
      success: true,
      user: data.user,
      message: 'Login successful',
      linkedSurveys: linkedSurveysCount
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


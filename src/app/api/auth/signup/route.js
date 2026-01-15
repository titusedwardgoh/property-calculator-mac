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
    const { email, password, propertyId } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get the origin from the request to construct the redirect URL
    const requestUrl = new URL(request.url)
    const origin = requestUrl.origin
    // Redirect to login page after email confirmation with explicit type parameter and email
    // Include email in URL so we can check confirmation status if code expires
    const redirectTo = `${origin}/api/auth/callback?next=/login&type=signup&email=${encodeURIComponent(email)}`

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
      },
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // If propertyId was provided (from "Log in to save" flow), save to survey_leads
    // This ensures the survey will be linked when the user logs in after email confirmation
    if (propertyId && email && serviceClient) {
      try {
        const { error: insertError } = await serviceClient
          .from('survey_leads')
          .insert({
            email: email.toLowerCase(),
            property_id: propertyId,
            converted: false,
          });

        if (insertError) {
          // Check if error is about table not existing or duplicate entry
          const isTableMissing = insertError.code === '42P01' || insertError.message?.includes('does not exist') || insertError.message?.includes('relation');
          const isDuplicate = insertError.code === '23505' || insertError.message?.includes('duplicate');
          
          if (isTableMissing) {
            console.warn('survey_leads table does not exist yet. Please run the SQL script to create it.');
          } else if (isDuplicate) {
            console.log('Survey lead already exists for this email and property');
          } else {
            console.error('Error saving to survey_leads:', insertError.message || insertError);
          }
        } else {
          console.log('Saved property to survey_leads for future linking');
        }
      } catch (leadErr) {
        console.error('Exception saving to survey_leads:', leadErr.message || leadErr);
        // Don't fail signup if this fails
      }
    }

    // Merge any guest surveys from survey_leads
    let linkedSurveysCount = 0
    if (data.user && data.user.id) {
      const mergeResult = await mergeGuestSurveys(email, data.user.id)
      if (mergeResult.success && mergeResult.linkedCount > 0) {
        linkedSurveysCount = mergeResult.linkedCount
        console.log(`Linked ${linkedSurveysCount} guest survey(s) to new user account`)
      }
    }

    return NextResponse.json({
      success: true,
      user: data.user,
      message: 'Signup successful',
      linkedSurveys: linkedSurveysCount
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { mergeGuestSurveys } from '@/lib/mergeGuestSurveys'
import { findAuthUserByEmail } from '@/lib/auth/findAuthUserByEmail'

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

    const normalizedEmail = email.trim().toLowerCase()
    const supabase = await createClient()

    if (serviceClient) {
      try {
        const existingUser = await findAuthUserByEmail(serviceClient, normalizedEmail)
        if (!existingUser) {
          return NextResponse.json(
            {
              error:
                'Account not found. Please check your email or sign up for a new account.',
              code: 'account_not_found',
            },
            { status: 401 }
          )
        }
      } catch (lookupError) {
        console.error('Error checking if account exists:', lookupError)
        // Continue to sign-in attempt if lookup fails
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    if (error) {
      const message = error.message?.toLowerCase() ?? ''

      if (
        message.includes('invalid login credentials') ||
        message.includes('invalid credentials')
      ) {
        return NextResponse.json(
          {
            error:
              'Incorrect password. Please try again or use "Trouble logging in?" to reset your password.',
            code: 'invalid_password',
          },
          { status: 401 }
        )
      }

      if (message.includes('email not confirmed')) {
        return NextResponse.json(
          {
            error:
              'Please confirm your email before logging in. Check your inbox for the confirmation link.',
            code: 'email_not_confirmed',
          },
          { status: 401 }
        )
      }

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


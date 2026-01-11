import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { mergeGuestSurveys } from '@/lib/mergeGuestSurveys'

export async function POST(request) {
  try {
    const { email, password } = await request.json()

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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
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

